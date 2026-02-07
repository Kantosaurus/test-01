use anyhow::{anyhow, Result};
use chrono::Utc;
use neo4rs::{query, Graph};
use uuid::Uuid;

use crate::models::{Contact, Email, EmailThread};

pub async fn get_thread(graph: &Graph, id: Uuid) -> Result<EmailThread> {
    let cypher = r#"
        MATCH (e:Email {thread_id: $thread_id})
        OPTIONAL MATCH (e)-[:SENT_BY]->(from:Contact)
        OPTIONAL MATCH (e)-[:SENT_TO]->(to:Contact)
        OPTIONAL MATCH (e)-[:HAS_LABEL]->(l:Label)
        WITH e, from, collect(DISTINCT to) as tos, collect(DISTINCT l.name) as labels
        ORDER BY e.date ASC
        RETURN e, from, tos, labels
    "#;

    let mut result = graph.execute(query(cypher).param("thread_id", id.to_string())).await?;
    let mut emails = Vec::new();
    let mut subject = String::new();
    let mut last_date = Utc::now();

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

        let email_subject: String = e.get("subject").unwrap_or_default();
        let email_date = e.get::<String>("date")
            .map(|d| chrono::DateTime::parse_from_rfc3339(&d).ok())
            .ok()
            .flatten()
            .map(|d| d.with_timezone(&Utc))
            .unwrap_or_else(Utc::now);

        if subject.is_empty() {
            subject = email_subject.clone();
        }
        last_date = email_date;

        emails.push(Email {
            id: Uuid::parse_str(&e.get::<String>("id")?).unwrap_or_default(),
            subject: email_subject,
            body: e.get("body").unwrap_or_default(),
            snippet: e.get("snippet").unwrap_or_default(),
            date: email_date,
            is_read: e.get("is_read").unwrap_or(false),
            is_starred: e.get("is_starred").unwrap_or(false),
            thread_id: Some(id),
            from,
            to,
            cc: vec![],
            labels,
            embedding: None,
        });
    }

    if emails.is_empty() {
        return Err(anyhow!("Thread not found"));
    }

    let participant_count = emails
        .iter()
        .flat_map(|e| std::iter::once(&e.from).chain(e.to.iter()))
        .map(|c| &c.email)
        .collect::<std::collections::HashSet<_>>()
        .len();

    Ok(EmailThread {
        id,
        emails,
        subject,
        last_message_date: last_date,
        participant_count,
    })
}
