use anyhow::Result;
use sha2::{Digest, Sha256};
use std::process::Command;

pub const CONTRACT: &str = "0x5a34a12dd68cc6c56565f87f10c3173e808ee8be";
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

fn bytes_to_u64x4(b: &[u8]) -> [u64; 4] {
    let mut arr = [0u8; 32];
    let len = b.len().min(32);
    arr[..len].copy_from_slice(&b[..len]);
    [
        u64::from_le_bytes(arr[0..8].try_into().unwrap()),
        u64::from_le_bytes(arr[8..16].try_into().unwrap()),
        u64::from_le_bytes(arr[16..24].try_into().unwrap()),
        u64::from_le_bytes(arr[24..32].try_into().unwrap()),
    ]
}

fn bytes_to_u64x6(b: &[u8]) -> [u64; 6] {
    let mut arr = [0u8; 48];
    let len = b.len().min(48);
    arr[..len].copy_from_slice(&b[..len]);
    [
        u64::from_le_bytes(arr[0..8].try_into().unwrap()),
        u64::from_le_bytes(arr[8..16].try_into().unwrap()),
        u64::from_le_bytes(arr[16..24].try_into().unwrap()),
        u64::from_le_bytes(arr[24..32].try_into().unwrap()),
        u64::from_le_bytes(arr[32..40].try_into().unwrap()),
        u64::from_le_bytes(arr[40..48].try_into().unwrap()),
    ]
}

fn u64x4_result_to_bytes(hex: &str) -> Vec<u8> {
    let hex = hex.trim_start_matches("0x");
    if hex.len() < 256 {
        return vec![0u8; 32];
    }
    let mut result = vec![0u8; 32];
    for i in 0..4 {
        let chunk = &hex[i * 64..(i + 1) * 64];
        let val = u64::from_str_radix(&chunk[48..], 16).unwrap_or(0);
        result[i * 8..(i + 1) * 8].copy_from_slice(&val.to_le_bytes());
    }
    result
}

fn u64x6_result_to_string(hex: &str) -> String {
    let hex = hex.trim_start_matches("0x");
    if hex.len() < 384 {
        return String::new();
    }
    let mut result = vec![0u8; 48];
    for i in 0..6 {
        let chunk = &hex[i * 64..(i + 1) * 64];
        let val = u64::from_str_radix(&chunk[48..], 16).unwrap_or(0);
        result[i * 8..(i + 1) * 8].copy_from_slice(&val.to_le_bytes());
    }
    // trim null bytes i konvertuj u string
    let trimmed: Vec<u8> = result.into_iter().take_while(|&b| b != 0).collect();
    String::from_utf8(trimmed).unwrap_or_default()
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

// ── Org / Repo ────────────────────────────────────────────────────────────

pub fn create_org() -> Result<String> {
    cast_send("0x3fb3b835")
}

pub fn create_repo(org_id: u64) -> Result<String> {
    cast_send(&format!("0x11b334ec{}", encode_u64(org_id)))
}

// ── Keypair (4x u64) ──────────────────────────────────────────────────────

pub fn store_repo_pubkey(repo_id: u64, pubkey: &[u8]) -> Result<String> {
    let k = bytes_to_u64x4(pubkey);
    let calldata = format!(
        "0x5c3f3743{}{}{}{}{}",
        encode_u64(repo_id),
        encode_u64(k[0]),
        encode_u64(k[1]),
        encode_u64(k[2]),
        encode_u64(k[3]),
    );
    cast_send(&calldata)
}

pub fn store_repo_privkey(repo_id: u64, privkey: &[u8]) -> Result<String> {
    let k = bytes_to_u64x4(privkey);
    let calldata = format!(
        "0xa74b2d9a{}{}{}{}{}",
        encode_u64(repo_id),
        encode_u64(k[0]),
        encode_u64(k[1]),
        encode_u64(k[2]),
        encode_u64(k[3]),
    );
    cast_send(&calldata)
}

pub async fn get_repo_pubkey(repo_id: u64) -> Result<Vec<u8>> {
    let result = eth_call(&format!("0x64e5a77f{}", encode_u64(repo_id))).await?;
    Ok(u64x4_result_to_bytes(&result))
}

pub async fn get_repo_privkey(repo_id: u64) -> Result<Vec<u8>> {
    let result = eth_call(&format!("0x5d1bfdcc{}", encode_u64(repo_id))).await?;
    Ok(u64x4_result_to_bytes(&result))
}

// ── Commit CID (6x u64) ───────────────────────────────────────────────────

pub fn store_commit_cid(repo_id: u64, branch_hash: u64, cid: &str) -> Result<String> {
    // čuvaj CID lokalno
    let store_path = format!("/tmp/dotforge_cid_{}_{}.txt", repo_id, branch_hash);
    std::fs::write(&store_path, cid)?;

    // upiši hash na chain kao potvrda
    let cid_hash = hash_string(cid);
    let calldata = format!(
        "0xc4480d34{}{}{}",
        encode_u64(repo_id),
        encode_u64(branch_hash),
        encode_u64(cid_hash),
    );
    cast_send(&calldata)
}

pub async fn get_commit_cid(repo_id: u64, branch_hash: u64) -> Result<String> {
    // provjeri da chain ima hash
    let calldata = format!(
        "0xe2551191{}{}",
        encode_u64(repo_id),
        encode_u64(branch_hash)
    );
    let result = eth_call(&calldata).await?;
    let hex = result.trim_start_matches("0x");
    if hex.is_empty() || hex.chars().all(|c| c == '0') {
        return Ok(String::new());
    }

    // čitaj CID lokalno
    let store_path = format!("/tmp/dotforge_cid_{}_{}.txt", repo_id, branch_hash);
    Ok(std::fs::read_to_string(&store_path).unwrap_or_default())
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