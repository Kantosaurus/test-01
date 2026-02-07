use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContactInfo {
    pub email: String,
    pub name: Option<String>,
    pub email_count: u64,
    pub last_contacted: Option<String>,
}
