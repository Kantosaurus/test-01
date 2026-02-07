use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Email {
    pub id: Uuid,
    pub subject: String,
    pub body: String,
    pub snippet: String,
    pub date: DateTime<Utc>,
    pub is_read: bool,
    pub is_starred: bool,
    pub thread_id: Option<Uuid>,
    pub from: Contact,
    pub to: Vec<Contact>,
    pub cc: Vec<Contact>,
    pub labels: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub embedding: Option<Vec<f32>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Contact {
    pub email: String,
    pub name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailThread {
    pub id: Uuid,
    pub emails: Vec<Email>,
    pub subject: String,
    pub last_message_date: DateTime<Utc>,
    pub participant_count: usize,
}

#[derive(Debug, Deserialize)]
pub struct CreateEmailRequest {
    pub subject: String,
    pub body: String,
    pub to: Vec<String>,
    #[serde(default)]
    pub cc: Vec<String>,
    pub reply_to: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateEmailRequest {
    pub is_read: Option<bool>,
    pub is_starred: Option<bool>,
    pub labels: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct EmailQuery {
    #[serde(default = "default_page")]
    pub page: u32,
    #[serde(default = "default_limit")]
    pub limit: u32,
    pub label: Option<String>,
    pub is_read: Option<bool>,
    pub is_starred: Option<bool>,
    pub search: Option<String>,
}

fn default_page() -> u32 { 1 }
fn default_limit() -> u32 { 50 }

#[derive(Debug, Serialize)]
pub struct EmailListResponse {
    pub emails: Vec<Email>,
    pub total: u64,
    pub page: u32,
    pub limit: u32,
}
