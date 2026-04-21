mod contract;
mod ipfs;
mod tools;

use axum::{routing::post, Router};

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let app = Router::new()
        .route("/mcp", post(tools::handle));

    let addr = "0.0.0.0:3000";
    println!("DotForge MCP server on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}