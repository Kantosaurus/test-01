mod emails;
mod labels;
mod threads;
pub mod ai;

use axum::Router;
use std::sync::Arc;
use crate::AppState;

pub fn api_routes() -> Router<Arc<AppState>> {
    Router::new()
        .nest("/emails", emails::routes())
        .nest("/threads", threads::routes())
        .nest("/labels", labels::routes())
        .nest("/ai", ai::routes())
}
