use anyhow::Result;
use sha2::{Digest, Sha256};
use std::env;
use std::process::Command;

fn contract() -> String {
    env::var("CONTRACT_ADDRESS").expect("CONTRACT_ADDRESS not set")
}

fn rpc() -> String {
    env::var("RPC_URL").expect("RPC_URL not set")
}

fn wallet() -> String {
    env::var("WALLET_NAME").expect("WALLET_NAME not set")
}

fn caller() -> String {
    env::var("CALLER_ADDRESS").expect("CALLER_ADDRESS not set")
}

pub fn hash_string(s: &str) -> u64 {
    let mut hasher = Sha256::new();
    hasher.update(s.as_bytes());
    let result = hasher.finalize();
    u64::from_le_bytes(result[..8].try_into().unwrap())
}

pub fn encode_u64(val: u64) -> String {
    format!("{:064x}", val)
}

fn cast_send(calldata: &str) -> Result<String> {
    let output = Command::new("cast")
        .args([
            "send",
            &contract(),
            "--rpc-url", &rpc(),
            "--account", &wallet(),
            calldata,
        ])
        .output()?;

    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr);
        return Err(anyhow::anyhow!("cast send failed: {}", err));
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

pub fn create_org() -> Result<String> {
    cast_send("0x3fb3b835")
}

pub fn create_repo(org_id: u64) -> Result<String> {
    cast_send(&format!("0x11b334ec{}", encode_u64(org_id)))
}

pub fn store_commit(repo_id: u64, branch_hash: u64, cid_hash: u64) -> Result<String> {
    let calldata = format!(
        "0xc4480d34{}{}{}",
        encode_u64(repo_id),
        encode_u64(branch_hash),
        encode_u64(cid_hash)
    );
    cast_send(&calldata)
}

pub async fn get_branch(repo_id: u64, branch_hash: u64) -> Result<u64> {
    let calldata = format!(
        "0xe2551191{}{}",
        encode_u64(repo_id),
        encode_u64(branch_hash)
    );

    println!("get_branch calldata: {}", calldata);
    println!("hash of 'main': {:x}", hash_string("main"));

    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_call",
        "params": [{
            "from": caller(),
            "to": contract(),
            "data": calldata
        }, "latest"],
        "id": 1
    });

    let res: serde_json::Value = client
        .post(rpc())
        .json(&body)
        .send()
        .await?
        .json()
        .await?;

    let hex = res["result"].as_str().unwrap_or("0x0");
    let hex = hex.trim_start_matches("0x");
    if hex.is_empty() || hex == "0" {
        return Ok(0);
    }

    let val = u64::from_str_radix(&hex[hex.len().saturating_sub(16)..], 16)
        .unwrap_or(0);

    Ok(val)
}
