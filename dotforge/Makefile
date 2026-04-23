# DotForge Rust workspace: CLI, core, backend, MCP server (PolkaVM contract lives in crates/project)
SHELL := /bin/bash
.DEFAULT_GOAL := help

# MCP loads config from here; contract deploy reuses the same file for PRIVATE_KEY
MCP_ENV := crates/mcp-server/.env
PROJECT_DIR := crates/project

# Declares targets that are not files (see https://www.gnu.org/software/make/manual/html_node/Phony-Targets.html)
.PHONY: help build build-contract deploy-contract run-mcp install-cli test clean setup

# --- targets ---

help: ## Show this help
	@grep -E '^[a-zA-Z0-9_-]+:.*?## ' Makefile | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

# Build every crate in the root Cargo workspace (core, backend, cli, mcp-server)
build: ## Build all workspace crates (excludes the standalone PolkaVM project crate; see build-contract)
	cargo build --workspace

# Standalone `crates/project` workspace (PolkaVM); not a member of the parent workspace
build-contract: ## Build the PolkaVM smart contract (cargo in crates/project)
	cd $(PROJECT_DIR) && cargo build

# Sourcing assigns PRIVATE_KEY (and any other vars) for the Hardhat child process
deploy-contract: ## Deploy contract: load PRIVATE_KEY from crates/mcp-server/.env, run Hardhat on polkadotTestnet
	@test -f $(MCP_ENV) || { echo "Missing $(MCP_ENV). Copy and edit env for PRIVATE_KEY."; exit 1; }
	@set -a && . "$(MCP_ENV)" && set +a && \
		cd $(PROJECT_DIR) && npx hardhat run scripts/deploy.ts --network polkadotTestnet

# IPFS is required for MCP; start daemon before the axum app
run-mcp: ## Start IPFS in the background, then run the axum MCP server (dotforge-mcp)
	@echo "Starting IPFS daemon in the background..."
	@ipfs daemon >/dev/null 2>&1 &
	@sleep 2
	@echo "Running dotforge-mcp (ensure $(MCP_ENV) exists)..."
	cargo run -p dotforge-mcp

# Installs the `dotforge` binary from `crates/cli` into Cargo's bin path
install-cli: ## Install the dotforge CLI from crates/cli (binary name: dotforge)
	cargo install --path crates/cli --force

test: ## Run cargo test for the workspace
	cargo test

clean: ## Run cargo clean at the workspace root
	cargo clean

# Runs install-cli, then checks Foundry (cast), IPFS, Node, and Cargo
setup: install-cli ## Install CLI, verify toolchain tools, print versions
	@echo ""
	@echo "=== Tooling check (warnings only if a binary is missing) ==="
	@$(call _check, cargo,  cargo --version)
	@$(call _check, node,   node --version)
	@$(call _check, ipfs,   sh -c 'ipfs version 2>/dev/null | head -n1 || ipfs --version 2>/dev/null | head -n1')
	@$(call _check, cast,   cast --version)
	@echo ""

define _check
	@if command -v $(1) >/dev/null 2>&1; then \
		echo "  [ok]   $(1): $$($(2) 2>/dev/null | head -n1)"; \
	else \
		echo "  [warn] $(1) is not installed or not on PATH — install it for full functionality"; \
	fi
endef
