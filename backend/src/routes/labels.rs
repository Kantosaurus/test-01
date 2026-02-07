use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{delete, get, post},
    Json, Router,
};
use std::sync::Arc;

use crate::{
    models::{CreateLabelRequest, Label},
    services, AppState,
};

pub fn routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(list_labels).post(create_label))
        .route("/:name", delete(delete_label))
}

async fn list_labels(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<Label>>, (StatusCode, String)> {
    services::labels::list_labels(&state.db)
        .await
        .map(Json)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
}

async fn create_label(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateLabelRequest>,
) -> Result<(StatusCode, Json<Label>), (StatusCode, String)> {
    services::labels::create_label(&state.db, req)
        .await
        .map(|l| (StatusCode::CREATED, Json(l)))
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
}

async fn delete_label(
    State(state): State<Arc<AppState>>,
    Path(name): Path<String>,
) -> Result<StatusCode, (StatusCode, String)> {
    services::labels::delete_label(&state.db, &name)
        .await
        .map(|_| StatusCode::NO_CONTENT)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
}
