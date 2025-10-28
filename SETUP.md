# OpenLibX402 Setup Guide

Complete setup guide for OpenLibX402 - HTTP 402 Payment Protocol for AI Agents.

This project contains implementations in both **Python** and **TypeScript/Node.js**, each organized as a monorepo.

## 📁 Project Structure

```
openlibx402/
├── packages/
│   ├── python/              # Python packages (uv monorepo)
│   │   ├── openlibx402-core/
│   │   ├── openlibx402-client/
│   │   ├── openlibx402-fastapi/
│   │   ├── openlibx402-langchain/
│   │   └── openlibx402-langgraph/
│   │
│   └── typescript/          # TypeScript packages (pnpm monorepo)
│       ├── openlibx402-core/
│       ├── openlibx402-client/
│       ├── openlibx402-express/
│       ├── openlibx402-langchain/
│       └── openlibx402-langgraph/
│
├── examples/
│   ├── fastapi-server/      # Python FastAPI example
│   ├── langchain-agent/     # Python LangChain example
│   ├── langgraph-workflow/  # Python LangGraph example
│   └── express-server/      # TypeScript Express.js example
│
├── pnpm-workspace.yaml      # TypeScript monorepo config
├── pyproject.toml           # Python monorepo config
├── package.json             # Root package.json for TypeScript
├── Makefile                 # TypeScript commands (uv-style)
└── uv.lock                  # Python dependency lock
```

## 🐍 Python Setup (uv)

### Prerequisites

- Python >= 3.10
- uv >= 0.1.0

Install uv:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Setup

```bash
# Install all Python packages and dependencies
uv sync

# Run Python examples
uv run python examples/fastapi-server/main.py
uv run python examples/langchain-agent/main.py
uv run python examples/langgraph-workflow/main.py
```

### Python Commands

```bash
# Install dependencies
uv sync

# Add package
uv add package-name

# Run Python script
uv run python script.py

# Run tests
uv run pytest

# Run FastAPI server
cd examples/fastapi-server
uv run uvicorn main:app --reload
```

### Python Packages

- **openlibx402-core** - Core models, errors, Solana processor
- **openlibx402-client** - HTTP clients (X402Client, X402AutoClient)
- **openlibx402-fastapi** - FastAPI decorators and middleware
- **openlibx402-langchain** - LangChain integration
- **openlibx402-langgraph** - LangGraph workflow nodes

## 📦 TypeScript Setup (pnpm)

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

Install pnpm:
```bash
npm install -g pnpm
```

### Setup

```bash
# Install all TypeScript packages and dependencies
pnpm install

# Build all packages
pnpm run build

# Run Express.js example
pnpm run example:server
```

### TypeScript Commands

**Using pnpm:**
```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Build specific package
pnpm --filter @openlibx402/core run build

# Run tests
pnpm run test

# Watch mode
pnpm run dev

# Run example server
pnpm run example:server
```

**Using Makefile (uv-style):**
```bash
# Show all commands
make help

# Setup (install + build)
make setup

# Build all
make build

# Build specific packages
make build-core
make build-client
make build-express

# Run example
make example-server

# Clean
make clean
```

### TypeScript Packages

- **@openlibx402/core** - Core models, errors, Solana processor
- **@openlibx402/client** - HTTP clients (X402Client, X402AutoClient)
- **@openlibx402/express** - Express.js middleware
- **@openlibx402/langchain** - LangChain.js integration
- **@openlibx402/langgraph** - LangGraph.js workflow nodes

## 🚀 Quick Start Guide

### 1. Choose Your Language

**Python (FastAPI):**
```bash
# Setup
uv sync

# Run server
cd examples/fastapi-server
uv run uvicorn main:app --reload
```

**TypeScript (Express):**
```bash
# Setup
pnpm install
pnpm run build

# Run server
pnpm run example:server
```

### 2. Configure Environment

Create `.env` file in the example directory:

```env
PAYMENT_WALLET_ADDRESS=your_solana_wallet_address
USDC_MINT_ADDRESS=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
SOLANA_RPC_URL=https://api.devnet.solana.com
```

### 3. Test the API

**Free endpoint (no payment):**
```bash
curl http://localhost:8000/free-data    # Python
curl http://localhost:3000/free-data    # TypeScript
```

**Paid endpoint (requires payment):**
```bash
curl http://localhost:8000/premium-data  # Returns 402 Payment Required
```

### 4. Use the Client

**Python:**
```python
from openlibx402_client import X402AutoClient
from solders.keypair import Keypair

keypair = Keypair.from_bytes(bytes([...]))
client = X402AutoClient(keypair)

response = await client.get("http://localhost:8000/premium-data")
print(response.json())
```

**TypeScript:**
```typescript
import { X402AutoClient } from '@openlibx402/client';
import { Keypair } from '@solana/web3.js';

const keypair = Keypair.fromSecretKey(new Uint8Array([...]));
const client = new X402AutoClient(keypair);

const response = await client.get('http://localhost:3000/premium-data');
console.log(response.data);
```

## 🔄 Development Workflow

### Python Workflow (uv)

```bash
# 1. Install
uv sync

# 2. Make changes to packages/python/openlibx402-*/

# 3. Test changes
uv run pytest

# 4. Run example
cd examples/fastapi-server
uv run uvicorn main:app --reload
```

### TypeScript Workflow (pnpm)

```bash
# 1. Install & Build
pnpm install
pnpm run build

# 2. Make changes to packages/typescript/openlibx402-*/

# 3. Rebuild (or use watch mode)
pnpm run build
# or
pnpm run dev  # watch mode

# 4. Run example
pnpm run example:server
```

## 📊 Monorepo Comparison

| Feature | Python (uv) | TypeScript (pnpm) |
|---------|-------------|-------------------|
| Package manager | uv | pnpm |
| Config file | pyproject.toml | pnpm-workspace.yaml |
| Install command | `uv sync` | `pnpm install` |
| Run command | `uv run` | `pnpm run` |
| Add dependency | `uv add pkg` | `pnpm add pkg` |
| Workspace protocol | Path dependencies | `workspace:*` |
| Lock file | uv.lock | pnpm-lock.yaml |

## 🧪 Testing

**Python:**
```bash
uv run pytest
uv run pytest packages/python/openlibx402-core
```

**TypeScript:**
```bash
pnpm run test
pnpm --filter @openlibx402/core run test
```

## 📦 Adding Dependencies

**Python (to a specific package):**
```bash
cd packages/python/openlibx402-core
uv add requests
```

**TypeScript (to a specific package):**
```bash
pnpm --filter @openlibx402/core add axios
```

**TypeScript (to root/shared):**
```bash
pnpm add -D -w prettier
```

## 🔧 Troubleshooting

### Python Issues

**Clean install:**
```bash
rm -rf .venv uv.lock
uv sync
```

**Package not found:**
```bash
# Check pyproject.toml includes the package
# Rebuild with:
uv sync --force
```

### TypeScript Issues

**Clean install:**
```bash
make clean
make setup
# or
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm run build
```

**Workspace linking issues:**
```bash
pnpm list --depth 0  # Check links
rm -rf node_modules
pnpm install
```

**Build errors:**
```bash
pnpm run clean
pnpm run build
```

## 📚 Documentation

- **Python**: See [Python README](./packages/python/README.md)
- **TypeScript**: See [TypeScript README](./packages/typescript/README.md)
- **TypeScript Monorepo**: See [MONOREPO.md](./packages/typescript/MONOREPO.md)
- **Examples**: Each example has its own README

## 🎯 Example Comparisons

### Server Setup

**Python (FastAPI):**
```python
from fastapi import FastAPI
from openlibx402_fastapi import payment_required, init_x402, X402Config

app = FastAPI()
init_x402(X402Config(...))

@app.get("/premium")
@payment_required(amount="0.10")
async def premium():
    return {"data": "Premium content"}
```

**TypeScript (Express):**
```typescript
import express from 'express';
import { paymentRequired, initX402, X402Config } from '@openlibx402/express';

const app = express();
initX402(new X402Config({...}));

app.get('/premium',
  paymentRequired({ amount: '0.10' }),
  (req, res) => res.json({ data: 'Premium content' })
);
```

### Client Usage

**Python:**
```python
from openlibx402_client import X402AutoClient

client = X402AutoClient(keypair)
response = await client.get(url)
```

**TypeScript:**
```typescript
import { X402AutoClient } from '@openlibx402/client';

const client = new X402AutoClient(keypair);
const response = await client.get(url);
```

## 🚢 Deployment

Both implementations support:
- ✅ Solana Devnet (for testing)
- ✅ Solana Mainnet (for production)
- ✅ Docker deployment
- ✅ Cloud platforms (AWS, GCP, Azure, etc.)

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.
