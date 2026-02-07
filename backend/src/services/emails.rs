use anyhow::{anyhow, Result};
use chrono::Utc;
use neo4rs::{query, Graph};
use uuid::Uuid;

use crate::models::{Contact, CreateEmailRequest, Email, EmailListResponse, EmailQuery, UpdateEmailRequest};

pub async fn list_emails(graph: &Graph, query_params: EmailQuery) -> Result<EmailListResponse> {
    let skip = ((query_params.page - 1) * query_params.limit) as i64;
    let limit = query_params.limit as i64;

    let mut conditions = vec!["1=1".to_string()];
    
    if let Some(label) = &query_params.label {
        conditions.push(format!("EXISTS((e)-[:HAS_LABEL]->(:Label {{name: '{}'}})", label));
    }
    if let Some(is_read) = query_params.is_read {
        conditions.push(format!("e.is_read = {}", is_read));
    }
    if let Some(is_starred) = query_params.is_starred {
        conditions.push(format!("e.is_starred = {}", is_starred));
    }

    let where_clause = conditions.join(" AND ");
    
    let cypher = format!(
        r#"
        MATCH (e:Email)
        WHERE {}
        OPTIONAL MATCH (e)-[:SENT_BY]->(from:Contact)
        OPTIONAL MATCH (e)-[:SENT_TO]->(to:Contact)
        OPTIONAL MATCH (e)-[:HAS_LABEL]->(l:Label)
        WITH e, from, collect(DISTINCT to) as tos, collect(DISTINCT l.name) as labels
        ORDER BY e.date DESC
        SKIP $skip LIMIT $limit
        RETURN e, from, tos, labels
        "#,
        where_clause
    );

    let mut result = graph
        .execute(query(&cypher).param("skip", skip).param("limit", limit))
        .await?;

    let mut emails = Vec::new();
    
    while let Some(row) = result.next().await? {
        let e: neo4rs::Node = row.get("e")?;
        let from_node: Option<neo4rs::Node> = row.get("from").ok();
        let to_nodes: Vec<neo4rs::Node> = row.get("tos").unwrap_or_default();
        let labels: Vec<String> = row.get("labels").unwrap_or_default();

        let from = from_node.map(|n| Contact {
            email: n.get("email").unwrap_or_default(),
            name: n.get("name").ok(),
        }).unwrap_or(Contact { email: "unknown@example.com".into(), name: None });

        let to: Vec<Contact> = to_nodes.into_iter().map(|n| Contact {
            email: n.get("email").unwrap_or_default(),
            name: n.get("name").ok(),
        }).collect();

        emails.push(Email {
            id: Uuid::parse_str(&e.get::<String>("id")?).unwrap_or_default(),
            subject: e.get("subject").unwrap_or_default(),
            body: e.get("body").unwrap_or_default(),
            snippet: e.get("snippet").unwrap_or_default(),
            date: e.get::<String>("date")
                .map(|d| chrono::DateTime::parse_from_rfc3339(&d).ok())
                .ok()
                .flatten()
                .map(|d| d.with_timezone(&Utc))
                .unwrap_or_else(Utc::now),
            is_read: e.get("is_read").unwrap_or(false),
            is_starred: e.get("is_starred").unwrap_or(false),
            thread_id: e.get::<String>("thread_id").ok().and_then(|s| Uuid::parse_str(&s).ok()),
            from,
            to,
            cc: vec![],
            labels,
            embedding: None,
        });
    }

    // Get total count
    let count_cypher = format!("MATCH (e:Email) WHERE {} RETURN count(e) as total", where_clause);
    let mut count_result = graph.execute(query(&count_cypher)).await?;
    let total: u64 = if let Some(row) = count_result.next().await? {
        row.get::<i64>("total").unwrap_or(0) as u64
    } else {
        0
    };

    Ok(EmailListResponse {
        emails,
        total,
        page: query_params.page,
        limit: query_params.limit,
    })
}

pub async fn get_email(graph: &Graph, id: Uuid) -> Result<Email> {
    let cypher = r#"
        MATCH (e:Email {id: $id})
        OPTIONAL MATCH (e)-[:SENT_BY]->(from:Contact)
        OPTIONAL MATCH (e)-[:SENT_TO]->(to:Contact)
        OPTIONAL MATCH (e)-[:CC]->(cc:Contact)
        OPTIONAL MATCH (e)-[:HAS_LABEL]->(l:Label)
        RETURN e, from, collect(DISTINCT to) as tos, collect(DISTINCT cc) as ccs, collect(DISTINCT l.name) as labels
    "#;

    let mut result = graph.execute(query(cypher).param("id", id.to_string())).await?;
    
    if let Some(row) = result.next().await? {
        let e: neo4rs::Node = row.get("e")?;
        let from_node: Option<neo4rs::Node> = row.get("from").ok();
        let to_nodes: Vec<neo4rs::Node> = row.get("tos").unwrap_or_default();
        let cc_nodes: Vec<neo4rs::Node> = row.get("ccs").unwrap_or_default();
        let labels: Vec<String> = row.get("labels").unwrap_or_default();

        let from = from_node.map(|n| Contact {
            email: n.get("email").unwrap_or_default(),
            name: n.get("name").ok(),
        }).unwrap_or(Contact { email: "unknown@example.com".into(), name: None });

        let to: Vec<Contact> = to_nodes.into_iter().map(|n| Contact {
            email: n.get("email").unwrap_or_default(),
            name: n.get("name").ok(),
        }).collect();

        let cc: Vec<Contact> = cc_nodes.into_iter().map(|n| Contact {
            email: n.get("email").unwrap_or_default(),
            name: n.get("name").ok(),
        }).collect();

        return Ok(Email {
            id: Uuid::parse_str(&e.get::<String>("id")?).unwrap_or_default(),
            subject: e.get("subject").unwrap_or_default(),
            body: e.get("body").unwrap_or_default(),
            snippet: e.get("snippet").unwrap_or_default(),
            date: e.get::<String>("date")
                .map(|d| chrono::DateTime::parse_from_rfc3339(&d).ok())
                .ok()
                .flatten()
                .map(|d| d.with_timezone(&Utc))
                .unwrap_or_else(Utc::now),
            is_read: e.get("is_read").unwrap_or(false),
            is_starred: e.get("is_starred").unwrap_or(false),
            thread_id: e.get::<String>("thread_id").ok().and_then(|s| Uuid::parse_str(&s).ok()),
            from,
            to,
            cc,
            labels,
            embedding: None,
        });
    }

    Err(anyhow!("Email not found"))
}

pub async fn create_email(graph: &Graph, req: CreateEmailRequest) -> Result<Email> {
    let id = Uuid::new_v4();
    let date = Utc::now();
    let snippet = req.body.chars().take(100).collect::<String>();
    let thread_id = req.reply_to.map(|_| Uuid::new_v4()).unwrap_or_else(Uuid::new_v4);

    // Create email node
    let cypher = r#"
        CREATE (e:Email {
            id: $id,
            subject: $subject,
            body: $body,
            snippet: $snippet,
            date: $date,
            is_read: false,
            is_starred: false,
            thread_id: $thread_id
        })
        WITH e
        MERGE (from:Contact {email: 'me@example.com'})
        CREATE (e)-[:SENT_BY]->(from)
        WITH e
        MATCH (l:Label {name: 'SENT'})
        CREATE (e)-[:HAS_LABEL]->(l)
        RETURN e
    "#;

    graph.run(
        query(cypher)
            .param("id", id.to_string())
            .param("subject", req.subject.clone())
            .param("body", req.body.clone())
            .param("snippet", snippet.clone())
            .param("date", date.to_rfc3339())
            .param("thread_id", thread_id.to_string())
    ).await?;

    // Create recipient contacts and relationships
    for to_email in &req.to {
        let to_cypher = r#"
            MATCH (e:Email {id: $email_id})
            MERGE (c:Contact {email: $to_email})
            CREATE (e)-[:SENT_TO]->(c)
        "#;
        graph.run(
            query(to_cypher)
                .param("email_id", id.to_string())
                .param("to_email", to_email.clone())
        ).await?;
    }

    get_email(graph, id).await
}

pub async fn update_email(graph: &Graph, id: Uuid, req: UpdateEmailRequest) -> Result<Email> {
    let mut sets = vec![];
    
    if req.is_read.is_some() {
        sets.push("e.is_read = $is_read");
    }
    if req.is_starred.is_some() {
        sets.push("e.is_starred = $is_starred");
    }

    if !sets.is_empty() {
        let cypher = format!("MATCH (e:Email {{id: $id}}) SET {}", sets.join(", "));
        let mut q = query(&cypher).param("id", id.to_string());
        
        if let Some(is_read) = req.is_read {
            q = q.param("is_read", is_read);
        }
        if let Some(is_starred) = req.is_starred {
            q = q.param("is_starred", is_starred);
        }
        
        graph.run(q).await?;
    }

    // Handle labels update
    if let Some(labels) = req.labels {
        // Remove existing labels
        graph.run(
            query("MATCH (e:Email {id: $id})-[r:HAS_LABEL]->() DELETE r")
                .param("id", id.to_string())
        ).await?;
        
        // Add new labels
        for label in labels {
            graph.run(
                query(r#"
                    MATCH (e:Email {id: $id})
                    MERGE (l:Label {name: $label})
                    CREATE (e)-[:HAS_LABEL]->(l)
                "#)
                .param("id", id.to_string())
                .param("label", label)
            ).await?;
        }
    }

    get_email(graph, id).await
}

pub async fn delete_email(graph: &Graph, id: Uuid) -> Result<()> {
    let cypher = "MATCH (e:Email {id: $id}) DETACH DELETE e";
    graph.run(query(cypher).param("id", id.to_string())).await?;
    Ok(())
}
