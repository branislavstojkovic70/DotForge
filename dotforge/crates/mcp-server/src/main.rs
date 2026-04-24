mod ipfs;
mod tools;
mod chain;
mod crypto;

use axum::{routing::{post, get}, Router};

#[tokio::main]
async fn main() {
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    dotenvy::from_path(std::path::Path::new(manifest_dir).join(".env")).ok();
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt::init();

    let app = Router::new()
        .route("/mcp", post(tools::handle))
        .route("/generate-keypair", post(generate_keypair_handler))
        .layer(tower_http::cors::CorsLayer::permissive());

    let addr = "0.0.0.0:3000";
    println!("DotForge MCP server on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn generate_keypair_handler() -> impl axum::response::IntoResponse {
    let keypair = crate::crypto::generate_keypair();
    axum::Json(serde_json::json!({
        "pubkey": hex::encode(&keypair.public),
        "privkey": hex::encode(&keypair.private),
    }))
}