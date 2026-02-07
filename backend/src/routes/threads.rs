use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::get,
    Json, Router,
};
use std::sync::Arc;
use uuid::Uuid;

use crate::{models::EmailThread, services, AppState};

pub fn routes() -> Router<Arc<AppState>> {
    Router::new().route("/:id", get(get_thread))
}

async fn get_thread(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<EmailThread>, (StatusCode, String)> {
    services::threads::get_thread(&state.db, id)
        .await
        .map(Json)
        .map_err(|e| match e.to_string().as_str() {
            "Thread not found" => (StatusCode::NOT_FOUND, e.to_string()),
            _ => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
        })
}
