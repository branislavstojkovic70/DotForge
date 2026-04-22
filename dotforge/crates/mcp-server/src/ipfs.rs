use anyhow::Result;
use std::env;

fn ipfs_api() -> String {
    env::var("IPFS_API").unwrap_or_else(|_| "http://127.0.0.1:5001".to_string())
}

pub async fn upload(data: Vec<u8>) -> Result<String> {
    let client = reqwest::Client::new();
    let part = reqwest::multipart::Part::bytes(data).file_name("blob");
    let form = reqwest::multipart::Form::new().part("file", part);

    let res: serde_json::Value = client
        .post(format!("{}/api/v0/add", ipfs_api()))
        .multipart(form)
        .send()
        .await?
        .json()
        .await?;

    Ok(res["Hash"].as_str().unwrap_or("").to_string())
}

pub async fn fetch(cid: &str) -> Result<Vec<u8>> {
    let client = reqwest::Client::new();
    let bytes = client
        .post(format!("{}/api/v0/cat?arg={}", ipfs_api(), cid))
        .send()
        .await?
        .bytes()
        .await?;

    Ok(bytes.to_vec())
}
