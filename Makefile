# DotForge monorepo — orchestrates `dotforge/` (Rust) and `dotfront/` (Vite + React)
SHELL := /bin/bash
.DEFAULT_GOAL := help

DOTFORGE := dotforge
DOTFRONT := dotfront

.PHONY: help setup dev
help: ## List root and nested Makefile commands
	@echo "DotForge (repository root)"
	@echo ""
	@grep -E '^[a-zA-Z0-9_-]+:.*?## ' Makefile | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "dotforge/ ($(DOTFORGE)):"
	@$(MAKE) -C $(DOTFORGE) help
	@echo ""
	@echo "dotfront/ ($(DOTFRONT)):"
	@$(MAKE) -C $(DOTFRONT) help

setup: ## Run dotforge setup (CLI + tool checks) and dotfront npm install
	$(MAKE) -C $(DOTFORGE) setup
	$(MAKE) -C $(DOTFRONT) install

dev: ## Start MCP (dotforge) and the frontend dev server in parallel; Ctrl+C stops both
	@bash -c 'trap "kill 0" INT TERM; \
		$(MAKE) -C $(DOTFORGE) run-mcp & \
		$(MAKE) -C $(DOTFRONT) dev & \
		wait'
