# OpenLibX402: Autonomous Payments for AI Agents

> Enable AI agents and web APIs to autonomously pay for services using HTTP 402 "Payment Required" and Solana blockchain

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

## What is OpenLibX402?

OpenLibX402 is a library ecosystem that implements the [X402 protocol](https://www.x402.org/x402-whitepaper.pdf) - an open standard for enabling AI agents to autonomously pay for API access, data, and digital services using the HTTP 402 "Payment Required" status code and blockchain micropayments.

### Key Features

✨ **One-Line Integration** - Add payments to APIs with a single decorator  
🤖 **AI-Native** - Built specifically for autonomous agent workflows  
⚡ **Instant Settlement** - Payments settle in ~200ms on Solana  
💰 **Micropayments** - Support payments as low as $0.001  
🔐 **No Accounts** - No API keys, subscriptions, or manual billing  
🌐 **Chain-Agnostic Design** - Solana first, architected for multi-chain  
🛠️ **Framework Integrations** - FastAPI, LangChain, LangGraph, and more

## Quick Start

### Server (FastAPI)
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

### Client (Auto-Payment)
```python
from openlibx402_client import X402AutoClient
from solders.keypair import Keypair

client = X402AutoClient(wallet_keypair=keypair)

# Automatically handles 402 and pays
response = await client.fetch("https://api.example.com/premium-data")
data = response.json()
```

### LangChain Agent
```python
from openlibx402_langchain import create_x402_agent
from langchain.chat_models import ChatOpenAI

agent = create_x402_agent(
    wallet_keypair=keypair,
    llm=ChatOpenAI(),
    max_payment="5.0"
)

response = agent.run("Get premium market data from the API")
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

📚 **[Technical Specification](openlibx402-technical-spec.md)** - Complete architecture and design  
🚀 **[Implementation Guide](implementation-guide.md)** - Step-by-step build instructions  
📖 **[Quick Reference](quick-reference.md)** - Common patterns and examples  
📝 **[Project Summary](project-summary.md)** - Overview and next steps

## Packages

### Core
- **`openlibx402-core`** - Core protocol implementation
- **`@openlibx402/core`** - TypeScript equivalent

### Server Frameworks
- **`openlibx402-fastapi`** - FastAPI middleware (Python)
- **`@openlibx402/express`** - Express.js middleware (TypeScript)
- **`@openlibx402/nextjs`** - Next.js API routes (TypeScript)
- **`@openlibx402/hono`** - Hono middleware (TypeScript)

### Client Libraries
- **`openlibx402-client`** - HTTP client with payment support (Python)
- **`@openlibx402/client`** - TypeScript client

### AI Agent Integrations
- **`openlibx402-langchain`** - LangChain Tool & Middleware (Python)
- **`openlibx402-langgraph`** - LangGraph nodes (Python)
- **`@openlibx402/langchain`** - TypeScript LangChain integration
- **`@openlibx402/langgraph`** - TypeScript LangGraph integration

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

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ FastAPI  │  │LangChain │  │LangGraph │             │
│  │ Middleware│  │   Tool   │  │  Nodes   │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
└───────┼─────────────┼─────────────┼──────────────────────┘
        │             │             │
┌───────┴─────────────┴─────────────┴──────────────────────┐
│              openlibx402-core / @openlibx402/core              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │   Payment    │  │    Solana    │  │     Error     │  │
│  │    Models    │  │  Processor   │  │   Handling    │  │
│  └──────────────┘  └──────────────┘  └───────────────┘  │
└───────────────────────────┬──────────────────────────────┘
                            │
┌───────────────────────────┴──────────────────────────────┐
│                   Blockchain Layer                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Solana  │  │ Ethereum │  │   Base   │  (Future)    │
│  │  Devnet  │  │ Mainnet  │  │    L2    │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└──────────────────────────────────────────────────────────┘
```

## Development Status

### ✅ Phase 1: MVP (Current)
- [x] Technical specification complete
- [x] Claude Code implementation prompt ready
- [ ] Core package (Python)
- [ ] FastAPI integration
- [ ] Client library
- [ ] LangChain integration
- [ ] LangGraph integration
- [ ] Example implementations

### 🔲 Phase 2: TypeScript
- [ ] Core package (TypeScript)
- [ ] Express.js middleware
- [ ] Next.js integration
- [ ] Client library (TS)
- [ ] LangChain.js integration

### 🔲 Phase 3: Ecosystem
- [ ] Flask middleware
- [ ] Django middleware
- [ ] Hono middleware
- [ ] Additional agent frameworks
- [ ] CLI tools

### 🔲 Phase 4: Advanced
- [ ] Multi-chain support (Ethereum, Base)
- [ ] Payment batching
- [ ] Admin dashboard
- [ ] Analytics & monitoring
- [ ] Browser extension

## Installation (When Available)

### Python
```bash
pip install openlibx402-core openlibx402-fastapi openlibx402-client
pip install openlibx402-langchain openlibx402-langgraph
```

### TypeScript
```bash
npm install @openlibx402/core @openlibx402/express @openlibx402/client
npm install @openlibx402/langchain @openlibx402/langgraph
```

## Examples

### FastAPI Server
```python
from fastapi import FastAPI
from openlibx402_fastapi import X402Config, init_x402, payment_required

# Initialize X402
config = X402Config(
    payment_address="YOUR_WALLET",
    token_mint="USDC_MINT",
    network="solana-devnet"
)
init_x402(config)

app = FastAPI()

@app.get("/basic-data")
async def get_basic_data():
    return {"data": "Free content"}

@app.get("/premium-data")
@payment_required(amount="0.10", description="Premium market data")
async def get_premium_data():
    return {"data": "Premium content", "price": 100.50}
```

### LangChain Agent
```python
from langchain.chat_models import ChatOpenAI
from openlibx402_langchain import create_x402_agent
from solders.keypair import Keypair

# Load wallet
keypair = Keypair()

# Create agent with X402 support
agent = create_x402_agent(
    wallet_keypair=keypair,
    llm=ChatOpenAI(),
    max_payment="5.0"
)

# Agent can now autonomously pay for API access
response = agent.run(
    "Get the latest market data from https://api.example.com/premium-data "
    "and summarize the key trends"
)
```

### LangGraph Workflow
```python
from typing import TypedDict
from langgraph.graph import StateGraph, END
from openlibx402_langgraph import payment_node, check_payment_required
from solders.keypair import Keypair

class AgentState(TypedDict):
    api_url: str
    api_response: str
    payment_required: bool
    payment_completed: bool
    wallet_keypair: Keypair

workflow = StateGraph(AgentState)

workflow.add_node("fetch", fetch_api_node)
workflow.add_node("pay", payment_node)  # From openlibx402-langgraph
workflow.add_node("process", process_node)

workflow.set_entry_point("fetch")

workflow.add_conditional_edges(
    "fetch",
    check_payment_required,
    {
        "payment_required": "pay",
        "success": "process",
        "error": END
    }
)

workflow.add_edge("pay", "fetch")
workflow.add_edge("process", END)

app = workflow.compile()
```

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
from openlibx402_fastapi import X402Config

config = X402Config(
    payment_address="YOUR_WALLET",
    token_mint="USDC_MINT",
    network="solana-devnet",
    rpc_url="https://api.devnet.solana.com",
    payment_timeout=300,  # 5 minutes
    auto_verify=True
)
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

### Mock Payment Processor
```python
from openlibx402_core.testing import MockSolanaPaymentProcessor

processor = MockSolanaPaymentProcessor()
processor.balance = 100.0

# Use in tests without real blockchain
client = X402AutoClient(wallet_keypair=test_keypair)
client.client.processor = processor
```

### Test Server
```python
from openlibx402_core.testing import TestServer

server = TestServer(
    payment_address="test_address",
    token_mint="test_usdc"
)
server.start(port=8402)

# Test against mock server
# ...
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

# Run tests
pytest

# Format code
black packages/python/
```

## Roadmap

### Q2 2025
- ✅ Technical specification
- ✅ Claude Code implementation guide
- 🔲 Core libraries (Python & TypeScript)
- 🔲 FastAPI integration
- 🔲 LangChain/LangGraph integrations

### Q3 2025
- 🔲 Express.js, Next.js integrations
- 🔲 Additional framework support
- 🔲 CLI tools
- 🔲 Documentation site

### Q4 2025
- 🔲 Multi-chain support (Ethereum, Base)
- 🔲 Admin dashboard
- 🔲 Analytics & monitoring
- 🔲 Production deployments

### 2026
- 🔲 Browser extension
- 🔲 Wallet UI components
- 🔲 Zapier/Make.com integrations
- 🔲 Enterprise features

## FAQ

**Q: Why Solana first?**  
A: Solana offers ~200ms transaction finality and <$0.0001 fees, making it ideal for micropayments.

**Q: Will this support other blockchains?**  
A: Yes! The architecture is designed to be chain-agnostic. Ethereum and Base L2 support is planned.

**Q: Do I need crypto knowledge to use this?**  
A: Minimal. The libraries handle blockchain complexity. You just need a wallet and some tokens.

**Q: Is this production-ready?**  
A: Not yet. We're currently in development. Follow progress on GitHub.

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

## Community

- 💬 [Discord](#) - Coming soon
- 🐦 [Twitter](#) - Coming soon
- 📧 [Email](#) - hello@openlibx402.org

## License

OpenLibX402 is released under the [MIT License](LICENSE).

## Acknowledgments

- Built on the [X402 protocol](https://www.x402.org) by Coinbase
- Powered by [Solana](https://solana.com) blockchain
- Integrates with [LangChain](https://langchain.com) and [LangGraph](https://langchain-ai.github.io/langgraph)

---

**Built with ❤️ for the autonomous AI economy**

[Get Started](docs/getting-started.md) | [Documentation](docs/) | [Examples](examples/) | [Contribute](#contributing)
