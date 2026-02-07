use anyhow::Result;
use neo4rs::{query, Graph};

use crate::models::{CreateLabelRequest, Label};

pub async fn list_labels(graph: &Graph) -> Result<Vec<Label>> {
    let cypher = r#"
        MATCH (l:Label)
        OPTIONAL MATCH (e:Email)-[:HAS_LABEL]->(l)
        RETURN l.name as name, l.color as color, count(e) as email_count
        ORDER BY l.name
    "#;

    let mut result = graph.execute(query(cypher)).await?;
    let mut labels = Vec::new();

    while let Some(row) = result.next().await? {
        labels.push(Label {
            name: row.get("name")?,
            color: row.get("color").ok(),
            email_count: row.get::<i64>("email_count").unwrap_or(0) as u64,
        });
    }

    Ok(labels)
}

pub async fn create_label(graph: &Graph, req: CreateLabelRequest) -> Result<Label> {
    let cypher = r#"
        CREATE (l:Label {name: $name, color: $color})
        RETURN l.name as name, l.color as color, 0 as email_count
    "#;

    let mut result = graph.execute(
        query(cypher)
            .param("name", req.name.clone())
            .param("color", req.color.clone().unwrap_or_else(|| "#9e9e9e".into()))
    ).await?;

    if let Some(row) = result.next().await? {
        return Ok(Label {
            name: row.get("name")?,
            color: row.get("color").ok(),
            email_count: 0,
        });
    }

    Ok(Label {
        name: req.name,
        color: req.color,
        email_count: 0,
    })
}

pub async fn delete_label(graph: &Graph, name: &str) -> Result<()> {
    // Don't allow deleting system labels
    let system_labels = ["INBOX", "SENT", "DRAFTS", "SPAM", "TRASH", "STARRED", "IMPORTANT"];
    if system_labels.contains(&name) {
        return Err(anyhow::anyhow!("Cannot delete system label"));
    }

    let cypher = "MATCH (l:Label {name: $name}) DETACH DELETE l";
    graph.run(query(cypher).param("name", name)).await?;
    Ok(())
}
