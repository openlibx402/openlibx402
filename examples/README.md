# OpenLibx402 Examples

```bash
git clone https://github.com/openlibx402/openlibx402.git
cd openlibx402
```

This directory contains example applications demonstrating the X402 payment protocol in both Python and TypeScript.

## 📁 Structure

```
examples/
├── python/                      # Python examples
│   ├── fastapi-server/          # FastAPI server with payment endpoints
│   ├── langchain-agent/         # LangChain agent with autonomous payments
│   └── langgraph-workflow/      # LangGraph workflow with payment nodes
│
└── typescript/                  # TypeScript examples
    ├── express-server/          # Express.js server with payment endpoints
    ├── langchain-agent/         # LangChain.js agent with autonomous payments
    └── langgraph-workflow/      # LangGraph.js workflow with payment nodes
```

## 🐍 Python Examples

### FastAPI Server

HTTP API server that requires payments for premium endpoints.

**Location**: `python/fastapi-server/`

**Run**:
```bash
cd python/fastapi-server
uv run uvicorn main:app --reload
```

**Endpoints**:
- `GET /` - API info (free)
- `GET /free-data` - Free endpoint
- `GET /premium-data` - Requires 0.10 USDC
- `GET /expensive-data` - Requires 1.00 USDC
- `GET /tiered-data/{tier}` - Requires 0.05 USDC

### LangChain Agent

AI agent that autonomously pays for API access.

**Location**: `python/langchain-agent/`

**Run**:
```bash
cd python/langchain-agent
export OPENAI_API_KEY="your-key"
uv run python main.py
```

**Features**:
- Autonomous payment capability
- Multiple API access
- Custom tool integration

### LangGraph Workflow

Workflows with payment nodes for accessing paid APIs.

**Location**: `python/langgraph-workflow/`

**Run**:
```bash
cd python/langgraph-workflow
uv run python main.py
```

**Features**:
- Payment nodes
- Conditional routing
- Multi-step workflows

## 📦 TypeScript Examples

### Express.js Server

HTTP API server that requires payments for premium endpoints.

**Location**: `typescript/express-server/`

**Run**:
```bash
cd typescript/express-server
pnpm install && pnpm run build && pnpm start
```

Or from root:
```bash
make example-express
```

**Endpoints**:
- `GET /` - API info (free)
- `GET /free-data` - Free endpoint
- `GET /premium-data` - Requires 0.10 USDC
- `GET /expensive-data` - Requires 1.00 USDC
- `GET /tiered-data/:tier` - Requires 0.05 USDC

### LangChain.js Agent

AI agent that autonomously pays for API access.

**Location**: `typescript/langchain-agent/`

**Run**:
```bash
cd typescript/langchain-agent
cp .env.example .env
# Edit .env and add OPENAI_API_KEY
pnpm install && pnpm run build && pnpm start
```

Or from root:
```bash
make example-langchain
```

**Features**:
- Autonomous payment capability
- Multiple API access
- Custom tool configuration

### LangGraph.js Workflow

Workflows with payment nodes for accessing paid APIs.

**Location**: `typescript/langgraph-workflow/`

**Run**:
```bash
cd typescript/langgraph-workflow
pnpm install && pnpm run build && pnpm start
```

Or from root:
```bash
make example-langgraph
```

**Features**:
- Payment nodes
- Conditional routing
- Multi-step workflows

## 🚀 Quick Start

### 1. Start a Server

**Python FastAPI**:
```bash
cd examples/python/fastapi-server
uv run uvicorn main:app --reload
```

**TypeScript Express**:
```bash
cd examples/typescript/express-server
pnpm install && pnpm run build && pnpm start
```

Server will be available at:
- Python: `http://localhost:8000`
- TypeScript: `http://localhost:3000`

### 2. Test with Client

**Python Client**:
```python
from openlibx402_client import X402AutoClient
from solders.keypair import Keypair

keypair = Keypair()  # Load your keypair
client = X402AutoClient(keypair)

response = await client.get("http://localhost:8000/premium-data")
print(response.json())
```

**TypeScript Client**:
```typescript
import { X402AutoClient } from '@openlibx402/client';
import { Keypair } from '@solana/web3.js';

const keypair = Keypair.generate();  // Load your keypair
const client = new X402AutoClient(keypair);

const response = await client.get('http://localhost:3000/premium-data');
console.log(response.data);
```

### 3. Run Agent Examples

Make sure the server is running first!

**Python LangChain**:
```bash
cd examples/python/langchain-agent
export OPENAI_API_KEY="your-key"
uv run python main.py
```

**TypeScript LangChain.js**:
```bash
cd examples/typescript/langchain-agent
export OPENAI_API_KEY="your-key"
pnpm run dev
```

## 🔑 Prerequisites

### All Examples

- Solana wallet with:
  - SOL for transaction fees
  - USDC tokens for payments
- Running server (FastAPI or Express)

### Agent Examples (Additional)

- OpenAI API key (for LangChain/LangChain.js agents)
- Set as `OPENAI_API_KEY` environment variable

## 💰 Wallet Setup

All examples will create a `wallet.json` file on first run.

**Fund your wallet:**

```bash
# Get SOL on devnet
solana airdrop 1 <YOUR_ADDRESS> --url devnet

# Get USDC from a faucet
# Visit: https://spl-token-faucet.com/
```

**⚠️ Security Warning**:
- Never commit `wallet.json` to version control
- In production, use secure key management
- The wallet files are in `.gitignore`

## 🧪 Testing Flow

1. **Start Server**: Run FastAPI or Express server
2. **Test Free Endpoint**: `curl http://localhost:3000/free-data`
3. **Test Paid Endpoint**: `curl http://localhost:3000/premium-data`
   - Should return 402 Payment Required
4. **Run Agent**: Agent automatically handles payment
5. **Verify**: Check agent receives data

## 📚 Learn More

Each example directory contains its own detailed README:

- [FastAPI Server](python/fastapi-server/README.md)
- [Python LangChain Agent](python/langchain-agent/README.md)
- [Python LangGraph Workflow](python/langgraph-workflow/README.md)
- [Express.js Server](typescript/express-server/README.md)
- [TypeScript LangChain Agent](typescript/langchain-agent/README.md)
- [TypeScript LangGraph Workflow](typescript/langgraph-workflow/README.md)

## 🔧 Troubleshooting

### Server Won't Start
- Check port isn't already in use
- Verify dependencies are installed
- Check wallet address is configured

### Agent Can't Pay
- Ensure server is running
- Fund wallet with SOL and USDC
- Check OpenAI API key is set
- Verify server URL is correct

### Payment Verification Fails
- Check RPC URL is accessible
- Ensure transaction was broadcast
- Verify wallet has sufficient funds

## 🎯 Next Steps

1. Run the server examples
2. Test with simple curl requests
3. Try the agent examples
4. Build your own application!

For more information, see the [main documentation](../README.md).
