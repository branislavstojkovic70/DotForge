# DotForge

Decentralized git + grant system built on Polkadot. Organizations create grants, developers submit code via encrypted commits, AI agents audit submissions, and escrow releases DOT automatically.

Built for the Polkadot Blockchain Paradise hackathon using PolkaVM (PVM) — Polkadot's new EVM-compatible execution environment.

---

## Architecture

```
Frontend (React.js + wagmi)
    │
    ▼
Rust Smart Contract (PolkaVM / Paseo testnet)
    │
    ▼
MCP Server (Rust + axum)
    │
    ▼
IPFS (encrypted blobs)
```

**Encryption:** X25519 ECDH key exchange + AES-256-GCM. Each repository gets its own keypair. In v1 the keypair is stored locally. In v2 it will be stored inside Phala Network TEE.

**MCP Server:** Implements the Model Context Protocol — Claude and other AI agents can use `git_commit`, `git_pull`, `git_fetch`, `git_log` as native tools.

---

## Stack

| Layer | Technology |
|---|---|
| Smart Contract | Rust on PolkaVM (PVM) |
| Contract Deploy | Hardhat + viem |
| MCP Server | Rust, axum, reqwest |
| Encryption | x25519-dalek, aes-gcm |
| Storage | IPFS (local daemon) |
| Frontend | React.js, wagmi, viem, MUI |
| CLI | Rust |
| Network | Paseo testnet (Polkadot Hub) |

---

## Contract

**Address:** `0x5a34a12dd68cc6c56565f87f10c3173e808ee8be`
**Network:** Paseo testnet
**Chain ID:** 420420417
**RPC:** `https://services.polkadothub-rpc.com/testnet`
**Explorer:** `https://blockscout-passet-hub.parity-testnet.parity.io`

---

## Prerequisites

- Rust + cargo (nightly)
- Node.js 18+
- [Foundry](https://getfoundry.sh) (`cast`, `forge`)
- [IPFS Desktop](https://docs.ipfs.tech/install/ipfs-desktop/) or `ipfs` CLI
- MetaMask with Paseo testnet configured

---

## Setup

### 1. Clone

```bash
git clone https://github.com/branislavstojkovic70/DotForge.git
cd DotForge
```

### 2. Backend (MCP Server + CLI)

```bash
cd dotforge

# copy env
cp crates/mcp-server/.env.example crates/mcp-server/.env
# fill in WALLET_PASSWORD and optionally OPENAI_API_KEY

# install CLI
cargo install --path crates/cli --force

# start IPFS daemon
ipfs daemon &

# start MCP server
cargo run -p dotforge-mcp
```

### 3. Frontend

```bash
cd dotfront
npm install
npm run dev
```

Open `http://localhost:5173`.

---

## Usage

### Frontend

1. Connect MetaMask (Paseo testnet)
2. Create Organization
3. Deposit PAS tokens
4. Create Repository
5. Add members, create grants, assign grants

### CLI

```bash
# initialize repo encryption keypair
dotforge init <repo_id>

# commit files (encrypts + uploads to IPFS + stores hash on chain)
dotforge commit <repo_id> <branch> "<message>" file1 file2 ...

# pull latest files (fetches from IPFS + decrypts)
dotforge pull <repo_id> <branch>

# check latest CID on chain
dotforge fetch <repo_id> <branch>

# show latest commit info
dotforge log <repo_id> <branch>
```

**Example:**

```bash
mkdir my-project && cd my-project
echo 'fn main() { println!("hello"); }' > main.rs

dotforge init 1
dotforge commit 1 main "initial commit" main.rs
dotforge pull 1 main
cat main.rs
```

---

## Environment Variables

`dotforge/crates/mcp-server/.env`:

```
CONTRACT_ADDRESS=0x5a34a12dd68cc6c56565f87f10c3173e808ee8be
RPC_URL=https://services.polkadothub-rpc.com/testnet
CALLER_ADDRESS=0xYOUR_DEPLOYER_ADDRESS
WALLET_NAME=your-keystore-name
WALLET_PASSWORD=your-password
IPFS_API=http://127.0.0.1:5001
```

---

## Grant Flow

```
1. Org creates grant with bounty amount
2. Org assigns grant to developer wallet
3. Developer commits code via CLI
4. Developer calls submit_grant on contract
5. Auditor (or AI) reviews and calls submit_verdict
6. On approval → funds released
```

Grant statuses: `Open → InProgress → PendingAudit → Approved / Rejected`

---

## Building the Contract

```bash
cd dotforge/crates/project
cargo build

export PRIVATE_KEY=0xYOUR_KEY
npx hardhat run scripts/deploy.ts --network polkadotTestnet
```

---

## Bug Reports Filed

During development we hit 7 bugs in the PolkaVM toolchain and filed issues:

1. `cargo-pvm-contract` does not forward `-Zjson-target-spec` to the inner build
2. `panic_immediate_abort` is deprecated in recent nightly without a clear migration path
3. `picoalloc` panics on PolkaVM because `target_has_atomic="8"` is not set
4. Rust 2024 edition forbids `static mut` references used in older PVM examples
5. `pvm_contract_macros` injects an allocator — manual `#[global_allocator]` causes a conflict
6. ABI bytes encoding offset is relative to the dynamic data section, not the calldata start — documentation is missing
7. `Bytes` type from `pvm_contract_types` does not decode correctly when called from viem or cast

All issues filed at: `https://github.com/paritytech/cargo-pvm-contract`

---

## Retrospective

### What worked

- PolkaVM compilation pipeline is solid once you understand the toolchain
- `cast send` with raw calldata is reliable for testing
- IPFS + AES-GCM gives real privacy without any external service
- MCP protocol makes the CLI work natively as an AI tool

### What didn't work

- `Bytes` type in `pvm_contract_types` fails to decode when called from external clients (viem, cast) — we worked around this by encoding all dynamic data as fixed `uint64` arrays
- `cargo pvm-contract build` does not rebuild when only the Solidity interface changes
- No way to enumerate storage keys on PolkaVM — had to build manual indexing

### v2 Plans

- Move keypair storage to Phala Network TEE — full privacy
- XCM multi-chain grant payouts
- AI consensus (multiple auditor agents)
- Polkadot Treasury integration

---

## License

MIT