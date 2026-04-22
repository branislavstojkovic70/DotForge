use axum::{extract::Json, response::IntoResponse};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

use crate::{chain, ipfs};

#[derive(Deserialize)]
pub struct McpRequest {
    pub method: String,
    pub params: Option<Value>,
}

#[derive(Serialize)]
pub struct McpResponse {
    pub result: Option<Value>,
    pub error: Option<String>,
}

pub async fn handle(Json(req): Json<McpRequest>) -> impl IntoResponse {
    match dispatch(req).await {
        Ok(val) => Json(McpResponse { result: Some(val), error: None }),
        Err(e)  => Json(McpResponse { result: None, error: Some(e.to_string()) }),
    }
}

async fn dispatch(req: McpRequest) -> anyhow::Result<Value> {
    match req.method.as_str() {
        "tools/list" => Ok(tools_list()),
        "tools/call" => {
            let params = req.params.unwrap_or(json!({}));
            let name = params["name"].as_str().unwrap_or("").to_string();
            let args = params["arguments"].clone();
            call_tool(&name, args).await
        }
        _ => Err(anyhow::anyhow!("unknown method: {}", req.method)),
    }
}

fn tools_list() -> Value {
    json!({
        "tools": [
            {
                "name": "git_commit",
                "description": "Commit files to a repo branch. Uploads to IPFS and returns values to store on chain.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "repo_id":  { "type": "number" },
                        "branch":   { "type": "string" },
                        "message":  { "type": "string" },
                        "files":    { "type": "object", "description": "filename -> content" }
                    },
                    "required": ["repo_id", "branch", "message", "files"]
                }
            },
            {
                "name": "git_pull",
                "description": "Pull latest files from a repo branch via IPFS.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "repo_id": { "type": "number" },
                        "branch":  { "type": "string" }
                    },
                    "required": ["repo_id", "branch"]
                }
            },
            {
                "name": "git_fetch",
                "description": "Get current branch head from contract.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "repo_id": { "type": "number" },
                        "branch":  { "type": "string" }
                    },
                    "required": ["repo_id", "branch"]
                }
            },
            {
                "name": "git_log",
                "description": "Get latest commit info for a branch.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "repo_id": { "type": "number" },
                        "branch":  { "type": "string" }
                    },
                    "required": ["repo_id", "branch"]
                }
            },
            {
                "name": "submit_grant_work",
                "description": "Submit completed grant work for AI audit.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "grant_id":    { "type": "number" },
                        "repo_id":     { "type": "number" },
                        "branch":      { "type": "string" },
                        "description": { "type": "string" }
                    },
                    "required": ["grant_id", "repo_id", "branch", "description"]
                }
            }
        ]
    })
}

async fn call_tool(name: &str, args: Value) -> anyhow::Result<Value> {
    match name {
        "git_commit"       => git_commit(args).await,
        "git_pull"         => git_pull(args).await,
        "git_fetch"        => git_fetch(args).await,
        "git_log"          => git_log(args).await,
        "submit_grant_work" => submit_grant_work(args).await,
        _ => Err(anyhow::anyhow!("unknown tool: {}", name)),
    }
}

async fn git_commit(args: Value) -> anyhow::Result<Value> {
    let repo_id = args["repo_id"].as_u64().unwrap_or(0);
    let branch  = args["branch"].as_str().unwrap_or("main").to_string();
    let message = args["message"].as_str().unwrap_or("").to_string();
    let files   = &args["files"];

    let blob = serde_json::to_vec(&json!({
        "message": message,
        "branch": branch,
        "files": files,
        "timestamp": std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs()
    }))?;

    let cid = ipfs::upload(blob).await?;
    let cid_hash    = chain::hash_string(&cid);
    let branch_hash = chain::hash_string(&branch);

    Ok(json!({
        "status": "committed",
        "cid": cid,
        "cid_hash": cid_hash,
        "branch_hash": branch_hash,
        "repo_id": repo_id,
        "branch": branch,
        "message": message,
        "next_step": "call store_commit on contract with repo_id, branch_hash, cid_hash"
    }))
}

async fn git_pull(args: Value) -> anyhow::Result<Value> {
    let repo_id = args["repo_id"].as_u64().unwrap_or(0);
    let branch  = args["branch"].as_str().unwrap_or("main");

    let cid_hash = chain::get_branch(repo_id, chain::hash_string(branch)).await?;

    if cid_hash == 0 {
        return Ok(json!({
            "status": "empty",
            "message": "branch has no commits"
        }));
    }

    Ok(json!({
        "status": "ok",
        "repo_id": repo_id,
        "branch": branch,
        "cid_hash": cid_hash,
    }))
}

async fn git_fetch(args: Value) -> anyhow::Result<Value> {
    let repo_id = args["repo_id"].as_u64().unwrap_or(0);
    let branch  = args["branch"].as_str().unwrap_or("main");
    let cid_hash = chain::get_branch(repo_id, chain::hash_string(branch)).await?;

    Ok(json!({
        "repo_id": repo_id,
        "branch": branch,
        "head_cid_hash": cid_hash,
    }))
}

async fn git_log(args: Value) -> anyhow::Result<Value> {
    let repo_id = args["repo_id"].as_u64().unwrap_or(0);
    let branch  = args["branch"].as_str().unwrap_or("main");
    let cid_hash = chain::get_branch(repo_id, chain::hash_string(branch)).await?;

    Ok(json!({
        "repo_id": repo_id,
        "branch": branch,
        "latest_commit_hash": cid_hash,
    }))
}

async fn submit_grant_work(args: Value) -> anyhow::Result<Value> {
    let grant_id    = args["grant_id"].as_u64().unwrap_or(0);
    let repo_id     = args["repo_id"].as_u64().unwrap_or(0);
    let branch      = args["branch"].as_str().unwrap_or("main");
    let description = args["description"].as_str().unwrap_or("");

    let cid_hash = chain::get_branch(repo_id, chain::hash_string(branch)).await?;

    Ok(json!({
        "status": "ready_for_audit",
        "grant_id": grant_id,
        "repo_id": repo_id,
        "branch": branch,
        "submission_cid_hash": cid_hash,
        "description": description,
        "next_step": "call submit_grant on contract to trigger AI audit"
    }))
}