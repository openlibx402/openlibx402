# OpenLibX402: Autonomous Payments for AI Agents

> Enable AI agents and web APIs to autonomously pay for services using HTTP 402 "Payment Required" and Solana blockchain

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js 18+](https://img.shields.io/badge/node-18+-green.svg)](https://nodejs.org/)

## What is OpenLibX402?

OpenLibX402 is a library ecosystem that implements the [X402 protocol](https://www.x402.org/x402-whitepaper.pdf) - an open standard for enabling AI agents to autonomously pay for API access using HTTP 402 "Payment Required" status code and blockchain micropayments on Solana.

### Key Features

✨ **One-Line Integration** - Add payments to APIs with a single decorator
🤖 **AI-Native** - Built specifically for autonomous agent workflows
⚡ **Instant Settlement** - Payments settle in ~200ms on Solana
💰 **Micropayments** - Support payments as low as $0.001
🔐 **No Accounts** - No API keys, subscriptions, or manual billing
🌐 **Chain-Agnostic Design** - Solana first, architected for multi-chain
🛠️ **Framework Integrations** - FastAPI, LangChain, LangGraph, and more

## Available in Python & TypeScript

OpenLibX402 is available in both **Python** and **TypeScript/Node.js**, with full feature parity:

- 🐍 **Python**: FastAPI, LangChain, LangGraph
- 📦 **TypeScript**: Express.js, LangChain.js, LangGraph.js

Both implementations use **pnpm/uv monorepo** setup for easy development.

## Quick Start

### Server (Python - FastAPI)

```python
from fastapi import FastAPI
from openlibx402_fastapi import payment_required

app = FastAPI()

@app.get("/premium-data")
@payment_required(
    amount="0.10",
    payment_address="YOUR_WALLET_ADDRESS",
    token_mint="USDC_MINT_ADDRESS"
)
async def get_premium_data():
    return {"data": "Premium content"}
```

### Server (TypeScript - Express.js)

```typescript
import express from 'express';
import { paymentRequired, initX402, X402Config } from '@openlibx402/express';

const app = express();
initX402(new X402Config({
    paymentAddress: "YOUR_WALLET_ADDRESS",
    tokenMint: "USDC_MINT_ADDRESS"
}));

app.get('/premium-data',
    paymentRequired({ amount: '0.10' }),
    (req, res) => res.json({ data: 'Premium content' })
);

app.listen(3000);
```

### Client (Python - Auto-Payment)

```python
from openlibx402_client import X402AutoClient
from solders.keypair import Keypair

client = X402AutoClient(wallet_keypair=keypair)

# Automatically handles 402 and pays
response = await client.fetch("https://api.example.com/premium-data")
data = response.json()
```

### Client (TypeScript - Auto-Payment)

```typescript
import { X402AutoClient } from '@openlibx402/client';
import { Keypair } from '@solana/web3.js';

const client = new X402AutoClient(keypair);

// Automatically handles 402 and pays
const response = await client.get('https://api.example.com/premium-data');
const data = response.data;
```

### LangChain Agent

```python
from openlibx402_langchain import create_x402_agent

agent = create_x402_agent(
    wallet_keypair=keypair,
    max_payment="5.0"
)

response = agent.run("Get premium market data from the API")
```

## Installation

### Python Packages

```bash
# Using pip
pip install openlibx402-core openlibx402-fastapi openlibx402-client

# Or using uv (recommended)
uv sync
```

### TypeScript Packages

```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install @openlibx402/core @openlibx402/express @openlibx402/client
```

### Development Installation

**Python (uv monorepo):**
```bash
git clone https://github.com/openlibx402/openlibx402.git
cd openlibx402
uv sync
```

**TypeScript (pnpm monorepo):**
```bash
git clone https://github.com/openlibx402/openlibx402.git
cd openlibx402
pnpm install
pnpm run build
```

See **[SETUP.md](./SETUP.md)** for detailed setup instructions.

## Project Structure

```
openlibx402/
├── packages/
│   ├── python/                     # Python packages (uv monorepo)
│   │   ├── openlibx402-core/          # Core protocol
│   │   ├── openlibx402-fastapi/       # FastAPI middleware
│   │   ├── openlibx402-client/        # HTTP client
│   │   ├── openlibx402-langchain/     # LangChain integration
│   │   └── openlibx402-langgraph/     # LangGraph integration
│   │
│   └── typescript/                 # TypeScript packages (pnpm monorepo)
│       ├── openlibx402-core/          # Core protocol (TS)
│       ├── openlibx402-express/       # Express.js middleware
│       ├── openlibx402-client/        # HTTP client (TS)
│       ├── openlibx402-langchain/     # LangChain.js integration
│       └── openlibx402-langgraph/     # LangGraph.js integration
│
├── examples/
│   ├── fastapi-server/             # Python FastAPI demo
│   ├── express-server/             # TypeScript Express.js demo
│   ├── langchain-agent/            # Python LangChain agent
│   └── langgraph-workflow/         # Python LangGraph workflow
│
├── pnpm-workspace.yaml             # TypeScript monorepo config
├── pyproject.toml                  # Python monorepo config
├── package.json                    # Root TypeScript package
├── Makefile                        # TypeScript build commands
└── docs/
    ├── SETUP.md                    # Setup guide
    └── openlibx402-technical-spec.md  # Technical specification
```

## Examples

### FastAPI Server

```bash
cd examples/fastapi-server
pip install -r requirements.txt
python main.py
```

Visit http://localhost:8000/docs for API documentation.

### LangChain Agent

```bash
cd examples/langchain-agent
pip install -r requirements.txt
export OPENAI_API_KEY='your-key-here'
python main.py
```

### LangGraph Workflow

```bash
cd examples/langgraph-workflow
pip install -r requirements.txt
python main.py
```

## How It Works

```
┌─────────────┐         ┌──────────────┐         ┌────────────┐
│  AI Agent   │  ─1─→   │  API Server  │         │ Blockchain │
│   (Client)  │         │   (Server)   │         │  (Solana)  │
└─────────────┘         └──────────────┘         └────────────┘
       │                        │                        │
       │  GET /data             │                        │
       ├───────────────────────→│                        │
       │                        │                        │
       │  402 Payment Required  │                        │
       │  + Payment Details     │                        │
       │←───────────────────────┤                        │
       │                        │                        │
       │  Create & Broadcast    │                        │
       │  Payment Transaction   │                        │
       ├────────────────────────┼───────────────────────→│
       │                        │                        │
       │                        │   Verify Transaction   │
       │                        │←───────────────────────┤
       │                        │                        │
       │  GET /data             │                        │
       │  + Payment Auth Header │                        │
       ├───────────────────────→│                        │
       │                        │                        │
       │  200 OK + Data         │                        │
       │←───────────────────────┤                        │
```

## Documentation

📚 **[Setup Guide](SETUP.md)** - Complete setup for Python and TypeScript
🚀 **[Technical Specification](docs/openlibx402-technical-spec.md)** - Complete architecture
📦 **[TypeScript Monorepo](packages/typescript/MONOREPO.md)** - pnpm workspace guide
🐍 **[Python Packages](packages/python/README.md)** - Python package guide
📖 **[TypeScript README](README_TYPESCRIPT.md)** - TypeScript implementation guide

## Use Cases

### For API Providers
- 💵 Monetize APIs with pay-per-use pricing
- 🚫 Eliminate API key management
- ⚡ Instant payment settlement
- 🛡️ No chargebacks or fraud risk

### For AI Agents
- 🔓 Access premium data without human intervention
- 💰 Pay exactly for what you use
- 🌍 No geographic restrictions
- 🤖 Fully autonomous operation

### Real-World Examples
- 📊 Research agent paying per financial data point
- 🎯 Trading bot accessing real-time market data
- 📰 Content aggregator paying per article
- 🖼️ Image generation API charging per image
- ☁️ GPU compute charged per minute

## Development Status

### ✅ Phase 1: Python MVP (Complete)
- [x] Core package (Python)
- [x] FastAPI integration
- [x] Client library
- [x] LangChain integration
- [x] LangGraph integration
- [x] Example implementations
- [x] Testing utilities

### ✅ Phase 2: TypeScript (Complete)
- [x] Core package (TypeScript)
- [x] Express.js middleware
- [x] Client library (TS)
- [x] LangChain.js integration
- [x] LangGraph.js integration
- [x] pnpm monorepo setup
- [x] Example server & clients

### 🔲 Phase 3: Ecosystem
- [ ] Flask middleware
- [ ] Django middleware
- [ ] Next.js integration
- [ ] Additional agent frameworks
- [ ] CLI tools

### 🔲 Phase 4: Advanced
- [ ] Multi-chain support (Ethereum, Base)
- [ ] Payment batching
- [ ] Admin dashboard
- [ ] Analytics & monitoring

## Configuration

### Environment Variables

```bash
X402_PAYMENT_ADDRESS=YourSolanaWalletAddress
X402_TOKEN_MINT=USDC_MINT_ADDRESS
X402_NETWORK=solana-devnet
X402_RPC_URL=https://api.devnet.solana.com
```

### Code Configuration

```python
from openlibx402_fastapi import X402Config, init_x402

config = X402Config(
    payment_address="YOUR_WALLET",
    token_mint="USDC_MINT",
    network="solana-devnet"
)
init_x402(config)
```

## Security

🔐 **Key Security Features:**
- Private keys never leave client
- On-chain transaction verification
- Nonce-based replay protection
- Payment expiration timestamps
- Maximum payment limits
- HTTPS required for production

⚠️ **Security Best Practices:**
- Never log private keys
- Use environment variables for secrets
- Validate all payment fields
- Set reasonable payment timeouts
- Implement rate limiting
- Use hardware wallets in production

## Testing

```python
from openlibx402_core.testing import MockSolanaPaymentProcessor

processor = MockSolanaPaymentProcessor()
processor.balance = 100.0

# Use in tests without real blockchain
client = X402AutoClient(wallet_keypair=test_keypair)
client.client.processor = processor
```

## Contributing

We welcome contributions! Here's how you can help:

1. 🐛 Report bugs via GitHub Issues
2. 💡 Suggest features or improvements
3. 📝 Improve documentation
4. 🔧 Submit pull requests
5. ⭐ Star the repository

### Development Setup

```bash
# Clone repository
git clone https://github.com/openlibx402/openlibx402.git
cd openlibx402

# Install development dependencies
pip install -e "packages/python/openlibx402-core[dev]"
pip install -e "packages/python/openlibx402-fastapi[dev]"
pip install -e "packages/python/openlibx402-client[dev]"

# Run tests
pytest packages/python/*/tests

# Format code
black packages/python/
```

## FAQ

**Q: Why Solana first?**
A: Solana offers ~200ms transaction finality and <$0.0001 fees, making it ideal for micropayments.

**Q: Will this support other blockchains?**
A: Yes! The architecture is designed to be chain-agnostic. Ethereum and Base L2 support is planned.

**Q: Do I need crypto knowledge to use this?**
A: Minimal. The libraries handle blockchain complexity. You just need a wallet and some tokens.

**Q: How much do transactions cost?**
A: On Solana devnet/mainnet, transaction fees are <$0.0001. Payment amounts are configurable.

**Q: Can agents really operate autonomously?**
A: Yes! Once configured with a wallet, agents can discover, pay for, and use APIs without human intervention.

## Resources

- 📄 [X402 Whitepaper](https://www.x402.org/x402-whitepaper.pdf)
- 🌐 [X402 Protocol Website](https://www.x402.org)
- 📚 [Solana Documentation](https://docs.solana.com)
- 🔗 [SPL Token Program](https://spl.solana.com/token)
- 🦜 [LangChain Docs](https://python.langchain.com)
- 🕸️ [LangGraph Docs](https://langchain-ai.github.io/langgraph)

## License

OpenLibX402 is released under the [MIT License](LICENSE).

## Acknowledgments

- Built on the [X402 protocol](https://www.x402.org) by Coinbase
- Powered by [Solana](https://solana.com) blockchain
- Integrates with [LangChain](https://langchain.com) and [LangGraph](https://langchain-ai.github.io/langgraph)

---

**Built with ❤️ for the autonomous AI economy**

[Get Started](#quick-start) | [Documentation](docs/) | [Examples](examples/) | [Contribute](#contributing)
