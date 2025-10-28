# OpenLibX402 TypeScript Monorepo Makefile
# Similar to Python's uv-based Makefile

.PHONY: help install install-typescript install-python build test clean dev example-express example-langchain example-langgraph example-python-fastapi example-python-langchain example-python-langgraph

# Default target
help:
	@echo "OpenLibX402 TypeScript Monorepo Commands"
	@echo "======================================"
	@echo ""
	@echo "Setup:"
	@echo "  make install             Install pnpm + uv dependencies"
	@echo "  make install-typescript  Install TypeScript dependencies (pnpm)"
	@echo "  make install-python      Sync Python dependencies (uv)"
	@echo "  make build               Build all TypeScript packages"
	@echo ""
	@echo "Development:"
	@echo "  make dev                 Watch mode for all packages"
	@echo "  make test                Run tests for all packages"
	@echo "  make lint                Lint all packages"
	@echo "  make clean               Clean build artifacts"
	@echo ""
	@echo "Examples (TypeScript):"
	@echo "  make example-express       Run Express.js example server"
	@echo "  make example-langchain     Run LangChain.js agent example"
	@echo "  make example-langgraph     Run LangGraph.js workflow example"
	@echo ""
	@echo "Examples (Python via uv):"
	@echo "  make example-python-fastapi   Run FastAPI server example"
	@echo "  make example-python-langchain Run LangChain agent example"
	@echo "  make example-python-langgraph Run LangGraph workflow example"
	@echo ""
	@echo "Individual packages:"
	@echo "  make build-core          Build @openlibx402/core"
	@echo "  make build-client        Build @openlibx402/client"
	@echo "  make build-express       Build @openlibx402/express"
	@echo "  make build-langchain     Build @openlibx402/langchain"
	@echo "  make build-langgraph     Build @openlibx402/langgraph"

# Setup
install: install-typescript install-python
	@echo "Dependencies installed!"

install-typescript:
	@echo "Installing TypeScript dependencies..."
	pnpm install

install-python:
	@echo "Syncing Python dependencies with uv..."
	@if command -v uv >/dev/null 2>&1; then \
		uv sync; \
	else \
		echo "uv not found; skipping Python dependency sync. Install uv to enable Python tooling."; \
	fi

# Build
build:
	@echo "Building all packages..."
	pnpm run build

build-core:
	@echo "Building @openlibx402/core..."
	pnpm --filter @openlibx402/core run build

build-client:
	@echo "Building @openlibx402/client..."
	pnpm --filter @openlibx402/client run build

build-express:
	@echo "Building @openlibx402/express..."
	pnpm --filter @openlibx402/express run build

build-langchain:
	@echo "Building @openlibx402/langchain..."
	pnpm --filter @openlibx402/langchain run build

build-langgraph:
	@echo "Building @openlibx402/langgraph..."
	pnpm --filter @openlibx402/langgraph run build

# Development
dev:
	@echo "Starting watch mode for all packages..."
	pnpm run dev

test:
	@echo "Running tests..."
	pnpm run test

lint:
	@echo "Linting..."
	pnpm run lint

clean:
	@echo "Cleaning build artifacts..."
	pnpm run clean
	@echo "Removing node_modules..."
	rm -rf node_modules
	rm -rf packages/typescript/*/node_modules
	rm -rf examples/typescript/*/node_modules

# Examples
example-express:
	@echo "Starting Express.js example server..."
	pnpm run example:express

example-langchain:
	@echo "Starting LangChain.js agent example..."
	pnpm run example:langchain

example-langgraph:
	@echo "Starting LangGraph.js workflow example..."
	pnpm run example:langgraph

example-python-fastapi:
	@echo "Starting FastAPI example server (uv)..."
	cd examples/python/fastapi-server && uv run uvicorn main:app --reload

example-python-langchain:
	@echo "Starting Python LangChain agent example (uv)..."
	cd examples/python/langchain-agent && uv run python main.py

example-python-langgraph:
	@echo "Starting Python LangGraph workflow example (uv)..."
	cd examples/python/langgraph-workflow && uv run python main.py

# Full setup (like uv sync)
setup: install build
	@echo "Setup complete!"

# Full rebuild
rebuild: clean setup
	@echo "Rebuild complete!"
