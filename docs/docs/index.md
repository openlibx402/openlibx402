# OpenLibx402: Autonomous Payments for AI Agents

> Enable AI agents and web APIs to autonomously pay for services using HTTP 402 "Payment Required" and Solana blockchain

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Go 1.21+](https://img.shields.io/badge/go-1.21+-00ADD8.svg)](https://go.dev/)
[![Rust 1.70+](https://img.shields.io/badge/rust-1.70+-orange.svg)](https://www.rust-lang.org/)
[![Java 11+](https://img.shields.io/badge/java-11+-red.svg)](https://www.java.com/)
[![Kotlin](https://img.shields.io/badge/kotlin-1.9+-7F52FF.svg)](https://kotlinlang.org/)

## What is OpenLibx402?

OpenLibx402 is a library ecosystem that implements the [X402 protocol](https://www.x402.org/x402-whitepaper.pdf) - an open standard for enabling AI agents to autonomously pay for API access, data, and digital services using the HTTP 402 "Payment Required" status code and blockchain micropayments.

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
📖 **[Quick Reference](quick-reference.md)** - Common patterns and examples
📝 **[Project Summary](project-summary.md)** - Overview and next steps
🤖 **[RAG Chatbot Documentation](chatbot/index.md)** - AI-powered chatbot with X402 payments

### Guides

🧪 **[Testing Guide](guides/testing.md)** - Testing strategies and mock processors
🚀 **[Production Deployment](guides/production.md)** - Deploy to production environments
🔧 **[Troubleshooting](guides/troubleshooting.md)** - Common issues and solutions
🔄 **[Language Comparison](guides/language-comparison.md)** - Choose the right language for your project

## Feature Parity Matrix

| Feature | Python | TypeScript | Go | Rust | Java | Kotlin |
|---------|:------:|:----------:|:--:|:----:|:----:|:------:|
| **Core Protocol** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Client Library** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Auto-Payment Client** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Server Middleware** | ✅ FastAPI | ✅ Express, Next.js | ✅ net/http, Echo | ✅ Rocket, Actix | ⚠️ Custom | ⚠️ Custom |
| **LangChain Integration** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **LangGraph Integration** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Payment Verification** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Mock Processors** | ✅ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ |
| **Async Support** | ✅ async/await | ✅ Promises | ✅ Goroutines | ✅ async/await | ⚠️ Future | ✅ Coroutines |
| **Type Safety** | ⚠️ Runtime | ✅ Compile | ✅ Compile | ✅ Compile | ✅ Compile | ✅ Compile |
| **Examples** | 3 | 8 | 2 | 2 | 1 | 1 |
| **Documentation** | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Complete |

### Legend
- ✅ Fully supported
- ⚠️ Partial support or requires custom implementation
- ❌ Not available

## Packages

### Core Protocol (6 Languages)

**Python:**
- **`openlibx402-core`** - Core protocol implementation
- [Python Documentation](packages/python/)

**TypeScript:**
- **`@openlibx402/core`** - Core protocol (TypeScript)
- [TypeScript Documentation](packages/typescript/)

**Go:**
- **`openlibx402-core`** - Core protocol (Go)
- [Go Documentation](go/)

**Rust:**
- **`openlibx402-core`** - Core protocol (Rust)
- [Rust Documentation](rust/)

**Java:**
- **`openlibx402-core`** - Core protocol (Java)
- [Java Documentation](java/)

**Kotlin:**
- **`openlibx402-core`** - Core protocol (Kotlin)
- [Kotlin Documentation](kotlin/)

### Server Frameworks

**Python:**
- **`openlibx402-fastapi`** - FastAPI middleware
- [FastAPI Guide](packages/python/openlibx402-fastapi.md)

**TypeScript:**
- **`@openlibx402/express`** - Express.js middleware
- **`@openlibx402/nextjs`** - Next.js API routes
- [Express Guide](packages/typescript/openlibx402-express.md) | [Next.js Guide](packages/typescript/openlibx402-nextjs.md)

**Go:**
- **`openlibx402-nethttp`** - net/http middleware
- **`openlibx402-echo`** - Echo framework integration
- [Go Server Guide](go/getting-started/server-quickstart.md)

**Rust:**
- **`openlibx402-rocket`** - Rocket framework integration
- **`openlibx402-actix`** - Actix Web integration
- [Rust Server Guide](rust/getting-started/server-quickstart.md)

**Java & Kotlin:**
- Custom Spring Boot / Ktor implementations
- [Java Server Guide](java/getting-started/server-quickstart.md) | [Kotlin Server Guide](kotlin/getting-started/server-quickstart.md)

### Client Libraries (All Languages)

- **Python:** `openlibx402-client`
- **TypeScript:** `@openlibx402/client`
- **Go:** `openlibx402-client`
- **Rust:** `openlibx402-client`
- **Java:** `openlibx402-client`
- **Kotlin:** `openlibx402-client`

All clients support both explicit and automatic payment handling.

### AI Agent Integrations

**Python:**
- **`openlibx402-langchain`** - LangChain Tool & Middleware
- **`openlibx402-langgraph`** - LangGraph nodes

**TypeScript:**
- **`@openlibx402/langchain`** - LangChain.js integration
- **`@openlibx402/langgraph`** - LangGraph.js integration

### Specialized Packages

**RAG & Chatbot:**
- **`@openlibx402/ragbot`** - RAG utilities (embeddings, vector search, LLM)
- [RAGBot Documentation](packages/typescript/openlibx402-ragbot.md)
- [Chatbot Application](chatbot/index.md) - Production RAG chatbot with X402 payments

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

### ✅ Phase 1: Python (Complete)
- ✅ Core package (Python)
- ✅ FastAPI integration
- ✅ Client library
- ✅ LangChain integration
- ✅ LangGraph integration
- ✅ Example implementations

### ✅ Phase 2: TypeScript (Complete)
- ✅ Core package (TypeScript)
- ✅ Express.js middleware
- ✅ Next.js integration
- ✅ Client library (TS)
- ✅ LangChain.js integration
- ✅ LangGraph.js integration
- ✅ Frontend examples (Vue, Nuxt, Astro)

### ✅ Phase 3: Go (Complete)
- ✅ Core package (Go)
- ✅ Client library (Go)
- ✅ net/http middleware
- ✅ Echo framework integration
- ✅ Example servers

### ✅ Phase 4: Rust (Complete)
- ✅ Core package (Rust)
- ✅ Client library (Rust)
- ✅ Rocket framework integration
- ✅ Actix Web integration
- ✅ Example servers

### ✅ Phase 5: Java & Kotlin (Complete)
- ✅ Core packages (Java & Kotlin)
- ✅ Client libraries (Java & Kotlin)
- ✅ Maven & Gradle setups
- ✅ Coroutine support (Kotlin)
- ✅ Documentation & examples

### ✅ Phase 6: Chatbot & RAGBot (Complete)
- ✅ RAG Chatbot (Deno + Hono)
- ✅ RAGBot TypeScript package
- ✅ OpenAI & Pinecone integration
- ✅ USDC payment integration
- ✅ Rate limiting & streaming
- ✅ Deno Deploy deployment

### 🔲 Phase 7: Ecosystem Expansion
- [ ] Flask middleware (Python)
- [ ] Django middleware (Python)
- [ ] Additional agent frameworks
- [ ] CLI tools
- [ ] Admin dashboard

### 🔲 Phase 8: Advanced Features
- [ ] Multi-chain support (Ethereum, Base)
- [ ] Payment batching
- [ ] Subscription management
- [ ] Analytics & monitoring
- [ ] Browser extension
- [ ] Wallet UI components

## Installation

### Python

```bash
# Using pip
pip install openlibx402-core openlibx402-fastapi openlibx402-client
pip install openlibx402-langchain openlibx402-langgraph

# Using uv (recommended for development)
uv sync
```

### TypeScript

```bash
# Using pnpm (recommended)
pnpm add @openlibx402/core @openlibx402/express @openlibx402/client
pnpm add @openlibx402/langchain @openlibx402/langgraph

# Using npm
npm install @openlibx402/core @openlibx402/express @openlibx402/client
```

### Go

```bash
go get github.com/openlibx402/openlibx402-go/core
go get github.com/openlibx402/openlibx402-go/client
go get github.com/openlibx402/openlibx402-go/nethttp
go get github.com/openlibx402/openlibx402-go/echo
```

### Rust

```toml
# Add to Cargo.toml
[dependencies]
openlibx402-core = "0.1.0"
openlibx402-client = "0.1.0"
openlibx402-rocket = "0.1.0"  # For Rocket
openlibx402-actix = "0.1.0"   # For Actix Web
```

### Java

```xml
<!-- Add to pom.xml -->
<dependency>
    <groupId>xyz.openlib</groupId>
    <artifactId>openlibx402-core</artifactId>
    <version>0.1.0</version>
</dependency>
<dependency>
    <groupId>xyz.openlib</groupId>
    <artifactId>openlibx402-client</artifactId>
    <version>0.1.0</version>
</dependency>
```

### Kotlin

```kotlin
// Add to build.gradle.kts
dependencies {
    implementation("xyz.openlib:openlibx402-core-kotlin:0.1.0")
    implementation("xyz.openlib:openlibx402-client-kotlin:0.1.0")
}
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

### ✅ 2024 Q4 (Completed)

- ✅ Technical specification
- ✅ Core libraries (Python, TypeScript, Go, Rust, Java, Kotlin)
- ✅ Server middleware (FastAPI, Express, Next.js, net/http, Echo, Rocket, Actix)
- ✅ Client libraries (all 6 languages)
- ✅ LangChain/LangGraph integrations (Python & TypeScript)
- ✅ RAG Chatbot with X402 payments
- ✅ RAGBot package for reusable RAG utilities
- ✅ Frontend examples (Vue, Nuxt, Astro)
- ✅ Comprehensive documentation (75+ pages)
- ✅ Testing guides and production deployment guides

### 🔜 2025 Q1

- 🔲 Flask middleware (Python)
- 🔲 Django middleware (Python)
- 🔲 CLI tools for wallet management
- 🔲 Payment analytics dashboard
- 🔲 Additional AI agent frameworks
- 🔲 Package publishing to npm/PyPI/crates.io

### 🔮 2025 Q2+

- 🔲 Multi-chain support (Ethereum, Base L2)
- 🔲 Payment batching & subscriptions
- 🔲 Admin dashboard for API providers
- 🔲 Real-time analytics & monitoring
- 🔲 Browser extension for payment management
- 🔲 Wallet UI components
- 🔲 Zapier/Make.com integrations
- 🔲 Enterprise features (SSO, team management)

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
- 🐦 [Twitter](https://x.com/openlibx402) - @openlibx402
- 📧 [Email](mailto:x402@openlib.xyz) - x402@openlib.xyz

## License

OpenLibx402 is released under the [MIT License](https://github.com/openlibx402/openlibx402/blob/main/LICENSE).

## Acknowledgments

- Built on the [X402 protocol](https://www.x402.org) by Coinbase
- Powered by [Solana](https://solana.com) blockchain
- Integrates with [LangChain](https://langchain.com) and [LangGraph](https://langchain-ai.github.io/langgraph)

---

**Built with ❤️ for the autonomous AI economy**

[Documentation](openlibx402-technical-spec.md) | [Examples](#examples) | [Contribute](#contributing)
