# dotfront: Vite + React app
.DEFAULT_GOAL := help

.PHONY: help dev build install

help: ## Show this help
	@grep -E '^[a-zA-Z0-9_-]+:.*?## ' Makefile | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

.PHONY: dev
dev: ## Start Vite dev server
	npm run dev

.PHONY: build
build: ## Production build (tsc -b && vite build)
	npm run build

.PHONY: install
install: ## Install Node dependencies
	npm install
