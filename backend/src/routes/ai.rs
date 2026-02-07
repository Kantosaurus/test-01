use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::post,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

use crate::{services, AppState};

pub fn routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/summarize", post(summarize))
        .route("/compose", post(smart_compose))
        .route("/search", post(semantic_search))
        .route("/categorize", post(categorize))
        .route("/index", post(index_emails))
        .route("/index/:id", post(index_single_email))
}

#[derive(Debug, Deserialize)]
pub struct SummarizeRequest {
    pub email_id: Option<Uuid>,
    pub thread_id: Option<Uuid>,
    pub text: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct SummarizeResponse {
    pub summary: String,
}

async fn summarize(
    State(state): State<Arc<AppState>>,
    Json(req): Json<SummarizeRequest>,
) -> Result<Json<SummarizeResponse>, (StatusCode, String)> {
    services::ai::summarize(&state.db, req)
        .await
        .map(|summary| Json(SummarizeResponse { summary }))
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
}

#[derive(Debug, Deserialize)]
pub struct ComposeRequest {
    pub context: Option<String>,
    pub reply_to: Option<Uuid>,
    pub prompt: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ComposeResponse {
    pub suggestions: Vec<String>,
}

async fn smart_compose(
    State(state): State<Arc<AppState>>,
    Json(req): Json<ComposeRequest>,
) -> Result<Json<ComposeResponse>, (StatusCode, String)> {
    services::ai::smart_compose(&state.db, req)
        .await
        .map(|suggestions| Json(ComposeResponse { suggestions }))
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
}

#[derive(Debug, Deserialize)]
pub struct SearchRequest {
    pub query: String,
    #[serde(default = "default_limit")]
    pub limit: usize,
}

fn default_limit() -> usize { 20 }

#[derive(Debug, Serialize)]
pub struct SearchResult {
    pub email_id: Uuid,
    pub subject: String,
    pub snippet: String,
    pub score: f32,
}

#[derive(Debug, Serialize)]
pub struct SearchResponse {
    pub results: Vec<SearchResult>,
}

async fn semantic_search(
    State(state): State<Arc<AppState>>,
    Json(req): Json<SearchRequest>,
) -> Result<Json<SearchResponse>, (StatusCode, String)> {
    services::ai::semantic_search(&state.db, req)
        .await
        .map(|results| Json(SearchResponse { results }))
        .map_err(|e: anyhow::Error| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
}

#[derive(Debug, Deserialize)]
pub struct CategorizeRequest {
    pub email_id: Uuid,
}

#[derive(Debug, Serialize)]
pub struct CategorizeResponse {
    pub suggested_labels: Vec<String>,
    pub priority: String,
}

async fn categorize(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CategorizeRequest>,
) -> Result<Json<CategorizeResponse>, (StatusCode, String)> {
    services::ai::categorize(&state.db, req)
        .await
        .map(|(labels, priority)| Json(CategorizeResponse { suggested_labels: labels, priority }))
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
}

#[derive(Debug, Serialize)]
pub struct IndexResponse {
    pub indexed_count: usize,
}

async fn index_emails(
    State(state): State<Arc<AppState>>,
) -> Result<Json<IndexResponse>, (StatusCode, String)> {
    services::ai::batch_index_emails(&state.db)
        .await
        .map(|count| Json(IndexResponse { indexed_count: count }))
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
}

async fn index_single_email(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    services::ai::index_email(&state.db, id)
        .await
        .map(|_| StatusCode::OK)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
}
