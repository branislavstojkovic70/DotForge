use axum::{extract::Json, response::IntoResponse};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use crate::{chain, ipfs, crypto};

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
                "name": "init_repo",
                "description": "Initialize repo with X25519 keypair. Stores keypair locally (v2: Phala TEE).",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "repo_id": { "type": "number" }
                    },
                    "required": ["repo_id"]
                }
            },
            {
                "name": "git_commit",
                "description": "Commit files. Encrypts with repo pubkey, uploads to IPFS, stores CID on chain.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "repo_id": { "type": "number" },
                        "branch":  { "type": "string" },
                        "message": { "type": "string" },
                        "files":   { "type": "object", "description": "filename -> content" }
                    },
                    "required": ["repo_id", "branch", "message", "files"]
                }
            },
            {
                "name": "git_push",
                "description": "Confirm latest commit is on chain.",
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
                "name": "git_pull",
                "description": "Pull and decrypt latest files from a branch.",
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
                "description": "Get current branch CID from chain without downloading files.",
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
            }
        ]
    })
}

async fn call_tool(name: &str, args: Value) -> anyhow::Result<Value> {
    match name {
        "init_repo"  => init_repo(args).await,
        "git_commit" => git_commit(args).await,
        "git_push"   => git_push(args).await,
        "git_pull"   => git_pull(args).await,
        "git_fetch"  => git_fetch(args).await,
        "git_log"    => git_log(args).await,
        _ => Err(anyhow::anyhow!("unknown tool: {}", name)),
    }
}

fn load_keypair(repo_id: u64) -> anyhow::Result<(Vec<u8>, Vec<u8>)> {
    let store_path = format!("/tmp/dotforge_repo_{}.json", repo_id);
    let data: serde_json::Value = serde_json::from_str(
        &std::fs::read_to_string(&store_path)
            .map_err(|_| anyhow::anyhow!("repo not initialized - run: dotforge init {}", repo_id))?
    )?;
    let pubkey = hex::decode(data["pubkey"].as_str().unwrap_or(""))?;
    let privkey = hex::decode(data["privkey"].as_str().unwrap_or(""))?;
    Ok((pubkey, privkey))
}

async fn init_repo(args: Value) -> anyhow::Result<Value> {
    let repo_id = args["repo_id"].as_u64().unwrap_or(0);

    let keypair = crypto::generate_keypair();
    let pubkey_hex = hex::encode(&keypair.public);
    let privkey_hex = hex::encode(&keypair.private);

    let store_path = format!("/tmp/dotforge_repo_{}.json", repo_id);
    let data = serde_json::json!({
        "repo_id": repo_id,
        "pubkey": pubkey_hex,
        "privkey": privkey_hex,
    });
    std::fs::write(&store_path, data.to_string())?;

    Ok(json!({
        "status": "initialized",
        "repo_id": repo_id,
        "pubkey": pubkey_hex,
        "privkey": privkey_hex,
        "note": "keypair stored locally (v2: Phala TEE)"
    }))
}

async fn git_commit(args: Value) -> anyhow::Result<Value> {
    let repo_id = args["repo_id"].as_u64().unwrap_or(0);
    let branch  = args["branch"].as_str().unwrap_or("main").to_string();
    let message = args["message"].as_str().unwrap_or("").to_string();
    let files   = &args["files"];

    let (pubkey, _) = load_keypair(repo_id)?;

    let blob = serde_json::to_vec(&json!({
        "message": message,
        "branch": branch,
        "files": files,
        "timestamp": std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs()
    }))?;

    let encrypted = crypto::encrypt(&blob, &pubkey)?;
    let cid = ipfs::upload(encrypted).await?;
    let branch_hash = chain::hash_string(&branch);
    chain::store_commit_cid(repo_id, branch_hash, &cid)?;

    Ok(json!({
        "status": "committed",
        "cid": cid,
        "branch": branch,
        "message": message,
        "repo_id": repo_id,
        "encrypted": true,
    }))
}

async fn git_push(args: Value) -> anyhow::Result<Value> {
    let repo_id = args["repo_id"].as_u64().unwrap_or(0);
    let branch  = args["branch"].as_str().unwrap_or("main");

    let branch_hash = chain::hash_string(branch);
    let cid = chain::get_commit_cid(repo_id, branch_hash).await?;

    Ok(json!({
        "status": if cid.is_empty() { "no commits" } else { "ok" },
        "repo_id": repo_id,
        "branch": branch,
        "head_cid": cid,
    }))
}

async fn git_pull(args: Value) -> anyhow::Result<Value> {
    let repo_id = args["repo_id"].as_u64().unwrap_or(0);
    let branch  = args["branch"].as_str().unwrap_or("main");

    let branch_hash = chain::hash_string(branch);
    let cid = chain::get_commit_cid(repo_id, branch_hash).await?;

    if cid.is_empty() {
        return Ok(json!({
            "status": "empty",
            "message": "branch has no commits"
        }));
    }

    let encrypted = ipfs::fetch(&cid).await?;
    let (_, privkey) = load_keypair(repo_id)?;
    let decrypted = crypto::decrypt(&encrypted, &privkey)?;
    let commit: Value = serde_json::from_slice(&decrypted)?;

    Ok(json!({
        "status": "ok",
        "repo_id": repo_id,
        "branch": branch,
        "cid": cid,
        "message": commit["message"],
        "timestamp": commit["timestamp"],
        "files": commit["files"],
    }))
}

async fn git_fetch(args: Value) -> anyhow::Result<Value> {
    let repo_id = args["repo_id"].as_u64().unwrap_or(0);
    let branch  = args["branch"].as_str().unwrap_or("main");

    let branch_hash = chain::hash_string(branch);
    let cid = chain::get_commit_cid(repo_id, branch_hash).await?;

    Ok(json!({
        "repo_id": repo_id,
        "branch": branch,
        "head_cid": cid,
        "has_commits": !cid.is_empty(),
    }))
}

async fn git_log(args: Value) -> anyhow::Result<Value> {
    let repo_id = args["repo_id"].as_u64().unwrap_or(0);
    let branch  = args["branch"].as_str().unwrap_or("main");

    let branch_hash = chain::hash_string(branch);
    let cid = chain::get_commit_cid(repo_id, branch_hash).await?;

    Ok(json!({
        "repo_id": repo_id,
        "branch": branch,
        "latest_cid": cid,
        "has_commits": !cid.is_empty(),
    }))
}