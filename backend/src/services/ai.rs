use anyhow::Result;
use neo4rs::{query, Graph};
use uuid::Uuid;
use async_openai::{
    Client,
    config::OpenAIConfig,
    types::{
        ChatCompletionRequestUserMessageArgs, CreateChatCompletionRequestArgs,
        CreateEmbeddingRequestArgs, EmbeddingInput,
    },
};

use crate::routes::ai::{CategorizeRequest, ComposeRequest, SearchRequest, SearchResult, SummarizeRequest};
use crate::services::emails::get_email;

fn get_openai_client() -> Option<Client<OpenAIConfig>> {
    if std::env::var("OPENAI_API_KEY").is_ok() {
        Some(Client::new())
    } else {
        None
    }
}

/// Generate embeddings for text using OpenAI
pub async fn generate_embedding(text: &str) -> Result<Vec<f32>> {
    if let Some(client) = get_openai_client() {
        let request = CreateEmbeddingRequestArgs::default()
            .model("text-embedding-3-small")
            .input(EmbeddingInput::String(text.to_string()))
            .build()?;
        
        let response = client.embeddings().create(request).await?;
        let embedding: Vec<f32> = response.data[0].embedding.iter().map(|&x| x as f32).collect();
        Ok(embedding)
    } else {
        // Fallback: return a zero vector (for testing without API key)
        Ok(vec![0.0; 1536])
    }
}

/// Store embedding for an email in Neo4j
pub async fn store_email_embedding(graph: &Graph, email_id: Uuid, embedding: &[f32]) -> Result<()> {
    let embedding_json = serde_json::to_string(embedding)?;
    
    graph.run(
        query("MATCH (e:Email {id: $id}) SET e.embedding = $embedding")
            .param("id", email_id.to_string())
            .param("embedding", embedding_json)
    ).await?;
    
    Ok(())
}

/// Index an email by generating and storing its embedding
pub async fn index_email(graph: &Graph, email_id: Uuid) -> Result<()> {
    let email = get_email(graph, email_id).await?;
    let text = format!("{}\n\n{}", email.subject, email.body);
    let embedding = generate_embedding(&text).await?;
    store_email_embedding(graph, email_id, &embedding).await?;
    Ok(())
}

pub async fn summarize(graph: &Graph, req: SummarizeRequest) -> Result<String> {
    let text = if let Some(text) = req.text {
        text
    } else if let Some(email_id) = req.email_id {
        let email = get_email(graph, email_id).await?;
        format!("Subject: {}\n\n{}", email.subject, email.body)
    } else if let Some(thread_id) = req.thread_id {
        let thread = crate::services::threads::get_thread(graph, thread_id).await?;
        thread.emails
            .iter()
            .map(|e| format!("From: {}\nSubject: {}\n{}\n---", e.from.email, e.subject, e.body))
            .collect::<Vec<_>>()
            .join("\n")
    } else {
        return Err(anyhow::anyhow!("No content to summarize"));
    };

    if let Some(client) = get_openai_client() {
        let request = CreateChatCompletionRequestArgs::default()
            .model("gpt-4o-mini")
            .messages([
                ChatCompletionRequestUserMessageArgs::default()
                    .content(format!(
                        "Summarize this email in 2-3 concise sentences. Focus on the key points and any action items:\n\n{}",
                        text
                    ))
                    .build()?
                    .into(),
            ])
            .build()?;

        let response = client.chat().create(request).await?;
        let summary = response.choices[0]
            .message
            .content
            .clone()
            .unwrap_or_else(|| "Unable to generate summary.".to_string());
        
        Ok(summary)
    } else {
        // Fallback without API key
        let summary = if text.len() > 200 {
            format!("Summary: {}...", &text[..200])
        } else {
            format!("Summary: {}", text)
        };
        Ok(summary)
    }
}

pub async fn smart_compose(_graph: &Graph, req: ComposeRequest) -> Result<Vec<String>> {
    if let Some(client) = get_openai_client() {
        let context = req.context.unwrap_or_default();
        let prompt = req.prompt.unwrap_or_else(|| "general business email".to_string());
        
        let request = CreateChatCompletionRequestArgs::default()
            .model("gpt-4o-mini")
            .messages([
                ChatCompletionRequestUserMessageArgs::default()
                    .content(format!(
                        "Generate 3 different professional email reply suggestions for the following context. Each suggestion should be a complete, ready-to-send response.\n\nContext/Topic: {}\n\nPrevious message (if any): {}\n\nProvide exactly 3 suggestions, separated by '---'",
                        prompt, context
                    ))
                    .build()?
                    .into(),
            ])
            .build()?;

        let response = client.chat().create(request).await?;
        let content = response.choices[0]
            .message
            .content
            .clone()
            .unwrap_or_default();
        
        let suggestions: Vec<String> = content
            .split("---")
            .map(|s: &str| s.trim().to_string())
            .filter(|s: &String| !s.is_empty())
            .take(3)
            .collect();
        
        if suggestions.is_empty() {
            Ok(vec![content])
        } else {
            Ok(suggestions)
        }
    } else {
        // Fallback without API key
        let suggestions = if let Some(prompt) = req.prompt {
            vec![
                format!("Thank you for your message about {}. I'll review and get back to you shortly.", prompt),
                format!("I appreciate you reaching out regarding {}. Let me look into this.", prompt),
                format!("Thanks for the update on {}. I'll follow up with more details soon.", prompt),
            ]
        } else {
            vec![
                "Thank you for your email. I'll get back to you as soon as possible.".into(),
                "I appreciate you reaching out. Let me review this and follow up.".into(),
                "Thanks for the message. I'll look into this and respond shortly.".into(),
            ]
        };
        Ok(suggestions)
    }
}

/// Cosine similarity between two vectors
fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    let dot: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
    let norm_a: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
    let norm_b: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();
    if norm_a == 0.0 || norm_b == 0.0 {
        0.0
    } else {
        dot / (norm_a * norm_b)
    }
}

pub async fn semantic_search(graph: &Graph, req: SearchRequest) -> Result<Vec<SearchResult>> {
    // Generate embedding for query
    let query_embedding = generate_embedding(&req.query).await?;
    
    // If we have a real embedding, do vector search
    if query_embedding.iter().any(|&x| x != 0.0) {
        // Fetch all emails with embeddings
        let cypher = r#"
            MATCH (e:Email)
            WHERE e.embedding IS NOT NULL
            RETURN e.id as id, e.subject as subject, e.snippet as snippet, e.embedding as embedding
        "#;
        
        let mut result = graph.execute(query(cypher)).await?;
        let mut results_with_scores: Vec<(SearchResult, f32)> = Vec::new();
        
        while let Some(row) = result.next().await? {
            let id_str: String = row.get("id")?;
            let embedding_json: String = row.get("embedding").unwrap_or_default();
            
            if let Ok(email_embedding) = serde_json::from_str::<Vec<f32>>(&embedding_json) {
                let score = cosine_similarity(&query_embedding, &email_embedding);
                
                results_with_scores.push((
                    SearchResult {
                        email_id: Uuid::parse_str(&id_str).unwrap_or_default(),
                        subject: row.get("subject").unwrap_or_default(),
                        snippet: row.get("snippet").unwrap_or_default(),
                        score,
                    },
                    score,
                ));
            }
        }
        
        // Sort by score descending
        results_with_scores.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        
        // Take top N results
        let results: Vec<SearchResult> = results_with_scores
            .into_iter()
            .take(req.limit)
            .map(|(r, _)| r)
            .collect();
        
        return Ok(results);
    }
    
    // Fallback: basic text search
    let cypher = r#"
        MATCH (e:Email)
        WHERE toLower(e.subject) CONTAINS toLower($query) 
           OR toLower(e.body) CONTAINS toLower($query)
        RETURN e.id as id, e.subject as subject, e.snippet as snippet
        LIMIT $limit
    "#;

    let mut result = graph.execute(
        query(cypher)
            .param("query", req.query)
            .param("limit", req.limit as i64)
    ).await?;

    let mut results = Vec::new();
    while let Some(row) = result.next().await? {
        let id_str: String = row.get("id")?;
        results.push(SearchResult {
            email_id: Uuid::parse_str(&id_str).unwrap_or_default(),
            subject: row.get("subject").unwrap_or_default(),
            snippet: row.get("snippet").unwrap_or_default(),
            score: 1.0,
        });
    }

    Ok(results)
}

pub async fn categorize(graph: &Graph, req: CategorizeRequest) -> Result<(Vec<String>, String)> {
    let email = get_email(graph, req.email_id).await?;
    
    if let Some(client) = get_openai_client() {
        let request = CreateChatCompletionRequestArgs::default()
            .model("gpt-4o-mini")
            .messages([
                ChatCompletionRequestUserMessageArgs::default()
                    .content(format!(
                        r#"Analyze this email and suggest:
1. Appropriate labels (comma-separated list from: Work, Personal, Finance, Travel, Shopping, Social, Newsletters, Promotions, Updates, Important)
2. Priority level (high, medium, or low)

Email Subject: {}
Email Body: {}

Respond in this exact format:
LABELS: label1, label2
PRIORITY: level"#,
                        email.subject, email.body
                    ))
                    .build()?
                    .into(),
            ])
            .build()?;

        let response = client.chat().create(request).await?;
        let content = response.choices[0]
            .message
            .content
            .clone()
            .unwrap_or_default();
        
        // Parse response
        let mut labels = vec!["INBOX".to_string()];
        let mut priority = "medium".to_string();
        
        for line in content.lines() {
            let line_str: &str = line;
            if line_str.starts_with("LABELS:") {
                let label_str = line_str.trim_start_matches("LABELS:").trim();
                labels.extend(
                    label_str
                        .split(',')
                        .map(|s: &str| s.trim().to_string())
                        .filter(|s: &String| !s.is_empty())
                );
            } else if line_str.starts_with("PRIORITY:") {
                priority = line_str.trim_start_matches("PRIORITY:").trim().to_lowercase();
            }
        }
        
        Ok((labels, priority))
    } else {
        // Fallback: simple heuristics
        let mut labels = vec!["INBOX".to_string()];
        let priority;

        let subject_lower = email.subject.to_lowercase();
        let body_lower = email.body.to_lowercase();

        if subject_lower.contains("urgent") || subject_lower.contains("asap") || subject_lower.contains("important") {
            labels.push("IMPORTANT".to_string());
            priority = "high".to_string();
        } else if subject_lower.contains("newsletter") || body_lower.contains("unsubscribe") {
            labels.push("Newsletters".to_string());
            priority = "low".to_string();
        } else if subject_lower.contains("meeting") || subject_lower.contains("calendar") || subject_lower.contains("invite") {
            labels.push("Work".to_string());
            priority = "medium".to_string();
        } else if subject_lower.contains("order") || subject_lower.contains("shipping") || subject_lower.contains("delivery") {
            labels.push("Shopping".to_string());
            priority = "low".to_string();
        } else {
            priority = "medium".to_string();
        }

        Ok((labels, priority))
    }
}

/// Batch index all unindexed emails
pub async fn batch_index_emails(graph: &Graph) -> Result<usize> {
    let cypher = r#"
        MATCH (e:Email)
        WHERE e.embedding IS NULL
        RETURN e.id as id
        LIMIT 100
    "#;
    
    let mut result = graph.execute(query(cypher)).await?;
    let mut count = 0;
    
    while let Some(row) = result.next().await? {
        let id_str: String = row.get("id")?;
        if let Ok(id) = Uuid::parse_str(&id_str) {
            if index_email(graph, id).await.is_ok() {
                count += 1;
            }
        }
    }
    
    tracing::info!("Indexed {} emails", count);
    Ok(count)
}
