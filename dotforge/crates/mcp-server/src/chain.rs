use anyhow::Result;
use sha2::{Digest, Sha256};
use std::process::Command;

pub const CONTRACT: &str = "0x9468ed655c0da9898ed0885cd4557f7906bc3a30";
pub const RPC: &str = "https://services.polkadothub-rpc.com/testnet";
pub const WALLET: &str = "dotforge-deployer";
pub const CALLER: &str = "0xB79AFcc9e941E022e2D00ba94778FEec424A3108";

pub fn hash_string(s: &str) -> u64 {
    let mut hasher = Sha256::new();
    hasher.update(s.as_bytes());
    let result = hasher.finalize();
    u64::from_le_bytes(result[..8].try_into().unwrap())
}

pub fn encode_u64(val: u64) -> String {
    format!("{:064x}", val)
}

fn encode_bytes_arg(data: &[u8], offset: usize) -> String {
    let len = data.len();
    let padded_len = (len + 31) / 32 * 32;
    let mut hex_data = hex::encode(data);
    while hex_data.len() < padded_len * 2 {
        hex_data.push('0');
    }
    format!(
        "{}{}{}",
        format!("{:064x}", offset as u64),
        format!("{:064x}", len as u64),
        hex_data
    )
}

fn cast_send(calldata: &str) -> Result<String> {
    let password = std::env::var("WALLET_PASSWORD").unwrap_or_default();
    let output = Command::new("cast")
        .args([
            "send",
            CONTRACT,
            "--rpc-url", RPC,
            "--account", WALLET,
            "--password", &password,
            calldata,
        ])
        .output()?;

    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr);
        return Err(anyhow::anyhow!("cast send failed: {}", err));
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

async fn eth_call(calldata: &str) -> Result<String> {
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_call",
        "params": [{
            "from": CALLER,
            "to": CONTRACT,
            "data": calldata
        }, "latest"],
        "id": 1
    });

    let res: serde_json::Value = client
        .post(RPC)
        .json(&body)
        .send()
        .await?
        .json()
        .await?;

    if let Some(err) = res.get("error") {
        return Err(anyhow::anyhow!("eth_call error: {}", err));
    }

    Ok(res["result"].as_str().unwrap_or("0x").to_string())
}

fn decode_bytes_result(hex: &str) -> Vec<u8> {
    let hex = hex.trim_start_matches("0x");
    if hex.len() < 128 {
        return vec![];
    }
    // skip first 32 bytes (offset pointer)
    let len = u64::from_str_radix(&hex[64..128], 16).unwrap_or(0) as usize;
    if hex.len() < 128 + len * 2 {
        return vec![];
    }
    hex::decode(&hex[128..128 + len * 2]).unwrap_or_default()
}

// ── Org / Repo ────────────────────────────────────────────────────────────

pub fn create_org() -> Result<String> {
    cast_send("0x3fb3b835")
}

pub fn create_repo(org_id: u64) -> Result<String> {
    cast_send(&format!("0x11b334ec{}", encode_u64(org_id)))
}

// ── Keypair ───────────────────────────────────────────────────────────────

pub fn store_repo_pubkey(repo_id: u64, pubkey: &[u8]) -> Result<String> {
    let calldata = format!(
        "0x7d9b17f4{}{}",
        encode_u64(repo_id),
        encode_bytes_arg(pubkey, 64)  // 2 words * 32 = 64
    );
    cast_send(&calldata)
}

pub fn store_repo_privkey(repo_id: u64, privkey: &[u8]) -> Result<String> {
    let calldata = format!(
        "0x774806c5{}{}",
        encode_u64(repo_id),
        encode_bytes_arg(privkey, 64)  // 2 words * 32 = 64
    );
    cast_send(&calldata)
}

pub async fn get_repo_pubkey(repo_id: u64) -> Result<Vec<u8>> {
    let result = eth_call(&format!("0x64e5a77f{}", encode_u64(repo_id))).await?;
    Ok(decode_bytes_result(&result))
}

pub async fn get_repo_privkey(repo_id: u64) -> Result<Vec<u8>> {
    let result = eth_call(&format!("0x5d1bfdcc{}", encode_u64(repo_id))).await?;
    Ok(decode_bytes_result(&result))
}

// ── Commit CID ────────────────────────────────────────────────────────────

pub fn store_commit_cid(repo_id: u64, branch_hash: u64, cid: &str) -> Result<String> {
    let calldata = format!(
        "0x5a3c6c2f{}{}{}",
        encode_u64(repo_id),
        encode_u64(branch_hash),
        encode_bytes_arg(cid.as_bytes(), 96)  // 3 words * 32 = 96
    );
    cast_send(&calldata)
}

pub async fn get_commit_cid(repo_id: u64, branch_hash: u64) -> Result<String> {
    let calldata = format!(
        "0x36ea9a44{}{}",
        encode_u64(repo_id),
        encode_u64(branch_hash)
    );
    let result = eth_call(&calldata).await?;
    let bytes = decode_bytes_result(&result);
    Ok(String::from_utf8(bytes).unwrap_or_default())
}

// ── Legacy ────────────────────────────────────────────────────────────────

pub async fn get_branch(repo_id: u64, branch_hash: u64) -> Result<u64> {
    let calldata = format!(
        "0xe2551191{}{}",
        encode_u64(repo_id),
        encode_u64(branch_hash)
    );
    let result = eth_call(&calldata).await?;
    let hex = result.trim_start_matches("0x");
    if hex.is_empty() {
        return Ok(0);
    }
    Ok(u64::from_str_radix(&hex[hex.len().saturating_sub(16)..], 16).unwrap_or(0))
}