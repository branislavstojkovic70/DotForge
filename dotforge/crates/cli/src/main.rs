use std::process::Command;
use serde_json::Value;

const MCP: &str = "http://localhost:3000/mcp";

fn call(tool: &str, args: Value) -> Value {
    let body = serde_json::json!({
        "method": "tools/call",
        "params": {
            "name": tool,
            "arguments": args
        }
    });

    let output = Command::new("curl")
        .args([
            "-s", "-X", "POST", MCP,
            "-H", "Content-Type: application/json",
            "-d", &body.to_string(),
        ])
        .output()
        .expect("failed to call MCP");

    serde_json::from_slice(&output.stdout).unwrap_or(serde_json::json!({"error": "parse failed"}))
}

fn print_result(res: &Value) {
    if let Some(err) = res["error"].as_str() {
        eprintln!("Error: {}", err);
        std::process::exit(1);
    }
    if let Some(result) = res.get("result") {
        println!("{}", serde_json::to_string_pretty(result).unwrap());
    }
}

fn main() {
    let args: Vec<String> = std::env::args().collect();

    if args.len() < 2 {
        eprintln!("Usage:");
        eprintln!("  dotforge init <repo_id>");
        eprintln!("  dotforge commit <repo_id> <branch> <message> <file1> [file2...]");
        eprintln!("  dotforge push <repo_id> <branch>");
        eprintln!("  dotforge pull <repo_id> <branch>");
        eprintln!("  dotforge fetch <repo_id> <branch>");
        eprintln!("  dotforge log <repo_id> <branch>");
        std::process::exit(1);
    }

    match args[1].as_str() {
        "init" => {
            let repo_id: u64 = args.get(2).and_then(|s| s.parse().ok()).unwrap_or(1);
            let res = call("init_repo", serde_json::json!({"repo_id": repo_id}));
            print_result(&res);
        }

        "commit" => {
            if args.len() < 5 {
                eprintln!("Usage: dotforge commit <repo_id> <branch> <message> <file1> [file2...]");
                std::process::exit(1);
            }
            let repo_id: u64 = args[2].parse().unwrap_or(1);
            let branch = &args[3];
            let message = &args[4];

            // čitaj fajlove
            let mut files = serde_json::Map::new();
            for path in &args[5..] {
                let content = std::fs::read_to_string(path)
                    .unwrap_or_else(|_| format!("could not read {}", path));
                let filename = std::path::Path::new(path)
                    .file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or(path);
                files.insert(filename.to_string(), serde_json::Value::String(content));
            }

            let res = call("git_commit", serde_json::json!({
                "repo_id": repo_id,
                "branch": branch,
                "message": message,
                "files": files
            }));
            print_result(&res);
        }

        "push" => {
            let repo_id: u64 = args.get(2).and_then(|s| s.parse().ok()).unwrap_or(1);
            let branch = args.get(3).map(|s| s.as_str()).unwrap_or("main");
            let res = call("git_push", serde_json::json!({
                "repo_id": repo_id,
                "branch": branch
            }));
            print_result(&res);
        }

        "pull" => {
            let repo_id: u64 = args.get(2).and_then(|s| s.parse().ok()).unwrap_or(1);
            let branch = args.get(3).map(|s| s.as_str()).unwrap_or("main");
            let res = call("git_pull", serde_json::json!({
                "repo_id": repo_id,
                "branch": branch
            }));
            print_result(&res);

            // sačuvaj fajlove lokalno
            if let Some(files) = res["result"]["files"].as_object() {
                for (name, content) in files {
                    if let Some(c) = content.as_str() {
                        std::fs::write(name, c).ok();
                        println!("saved: {}", name);
                    }
                }
            }
        }

        "fetch" => {
            let repo_id: u64 = args.get(2).and_then(|s| s.parse().ok()).unwrap_or(1);
            let branch = args.get(3).map(|s| s.as_str()).unwrap_or("main");
            let res = call("git_fetch", serde_json::json!({
                "repo_id": repo_id,
                "branch": branch
            }));
            print_result(&res);
        }

        "log" => {
            let repo_id: u64 = args.get(2).and_then(|s| s.parse().ok()).unwrap_or(1);
            let branch = args.get(3).map(|s| s.as_str()).unwrap_or("main");
            let res = call("git_log", serde_json::json!({
                "repo_id": repo_id,
                "branch": branch
            }));
            print_result(&res);
        }

        _ => {
            eprintln!("unknown command: {}", args[1]);
            std::process::exit(1);
        }
    }
}