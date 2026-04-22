mod ipfs;
mod tools;
mod chain;

use axum::{routing::post, Router};

#[tokio::main]
async fn main() {
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    dotenvy::from_path(std::path::Path::new(manifest_dir).join(".env")).ok();
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt::init();

    let app = Router::new()
        .route("/mcp", post(tools::handle));

    let addr = "0.0.0.0:3000";
    println!("DotForge MCP server on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}