use neo4rs::Graph;
use anyhow::Result;

pub async fn init_schema(graph: &Graph) -> Result<()> {
    // Create constraints and indexes
    let queries = vec![
        "CREATE CONSTRAINT email_id IF NOT EXISTS FOR (e:Email) REQUIRE e.id IS UNIQUE",
        "CREATE CONSTRAINT contact_email IF NOT EXISTS FOR (c:Contact) REQUIRE c.email IS UNIQUE",
        "CREATE CONSTRAINT label_name IF NOT EXISTS FOR (l:Label) REQUIRE l.name IS UNIQUE",
        "CREATE CONSTRAINT thread_id IF NOT EXISTS FOR (t:Thread) REQUIRE t.id IS UNIQUE",
        "CREATE INDEX email_date IF NOT EXISTS FOR (e:Email) ON (e.date)",
        "CREATE INDEX email_read IF NOT EXISTS FOR (e:Email) ON (e.is_read)",
        "CREATE INDEX email_starred IF NOT EXISTS FOR (e:Email) ON (e.is_starred)",
    ];

    for query in queries {
        if let Err(e) = graph.run(neo4rs::query(query)).await {
            tracing::warn!("Schema query failed (may already exist): {}", e);
        }
    }

    // Create default labels
    let default_labels = vec![
        ("INBOX", "#4285f4"),
        ("SENT", "#34a853"),
        ("DRAFTS", "#9aa0a6"),
        ("SPAM", "#ea4335"),
        ("TRASH", "#5f6368"),
        ("STARRED", "#fbbc04"),
        ("IMPORTANT", "#fbbc04"),
    ];

    for (name, color) in default_labels {
        let q = neo4rs::query("MERGE (l:Label {name: $name}) SET l.color = $color")
            .param("name", name)
            .param("color", color);
        graph.run(q).await?;
    }

    tracing::info!("Database schema initialized");
    Ok(())
}
