use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    routing::{delete, get, patch, post},
    Json, Router,
};
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    models::{CreateEmailRequest, Email, EmailListResponse, EmailQuery, UpdateEmailRequest},
    services, AppState,
};

pub fn routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(list_emails).post(create_email))
        .route("/:id", get(get_email).patch(update_email).delete(delete_email))
}

async fn list_emails(
    State(state): State<Arc<AppState>>,
    Query(query): Query<EmailQuery>,
) -> Result<Json<EmailListResponse>, (StatusCode, String)> {
    services::emails::list_emails(&state.db, query)
        .await
        .map(Json)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
}

async fn get_email(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<Email>, (StatusCode, String)> {
    services::emails::get_email(&state.db, id)
        .await
        .map(Json)
        .map_err(|e| match e.to_string().as_str() {
            "Email not found" => (StatusCode::NOT_FOUND, e.to_string()),
            _ => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
        })
}

async fn create_email(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateEmailRequest>,
) -> Result<(StatusCode, Json<Email>), (StatusCode, String)> {
    services::emails::create_email(&state.db, req)
        .await
        .map(|e| (StatusCode::CREATED, Json(e)))
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
}

async fn update_email(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateEmailRequest>,
) -> Result<Json<Email>, (StatusCode, String)> {
    services::emails::update_email(&state.db, id, req)
        .await
        .map(Json)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
}

async fn delete_email(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    services::emails::delete_email(&state.db, id)
        .await
        .map(|_| StatusCode::NO_CONTENT)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
}
