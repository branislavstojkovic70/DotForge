use anyhow::Result;
use sha2::{Sha256, Digest};

pub const CONTRACT_ADDRESS: &str = "0xf572b1098c3e8ca459ecefaccfd6978f85b0fd3a";
pub const RPC_URL: &str = "https://services.polkadothub-rpc.com/testnet";

pub fn hash_string(s: &str) -> u64 {
    let mut hasher = Sha256::new();
    hasher.update(s.as_bytes());
    let result = hasher.finalize();
    u64::from_le_bytes(result[..8].try_into().unwrap())
}

// encode getBranch(uint64 repoId, uint64 branchHash) call
fn encode_get_branch(repo_id: u64, branch_hash: u64) -> String {
    // selector = keccak256("getBranch(uint64,uint64)")[0:4]
    // precomputed: 0x4e69d560
    let selector = "4e69d560";
    let repo_encoded = format!("{:064x}", repo_id);
    let branch_encoded = format!("{:064x}", branch_hash);
    format!("0x{}{}{}", selector, repo_encoded, branch_encoded)
}

pub async fn get_branch(repo_id: u64, branch: &str) -> Result<u64> {
    let client = reqwest::Client::new();
    let branch_hash = hash_string(branch);
    let data = encode_get_branch(repo_id, branch_hash);

    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_call",
        "params": [{
            "to": CONTRACT_ADDRESS,
            "data": data
        }, "latest"],
        "id": 1
    });

    let res: serde_json::Value = client
        .post(RPC_URL)
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