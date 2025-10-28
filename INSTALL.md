# Installation Guide

Complete installation guide for OpenLibX402.

## Prerequisites

- Python 3.8 or higher
- pip package manager
- (Optional) Solana CLI for wallet management
- (Optional) OpenAI API key for LangChain examples

## Basic Installation

### Install from PyPI (When Published)

```bash
# Core protocol
pip install openlibx402-core

# FastAPI integration
pip install openlibx402-fastapi

# HTTP client
pip install openlibx402-client

# LangChain integration
pip install openlibx402-langchain

# LangGraph integration
pip install openlibx402-langgraph

# Install all packages
pip install openlibx402-core openlibx402-fastapi openlibx402-client openlibx402-langchain openlibx402-langgraph
```

### Install from Source

```bash
# Clone the repository
git clone https://github.com/openlibx402/openlibx402.git
cd openlibx402

# Install packages in development mode
pip install -e packages/python/openlibx402-core
pip install -e packages/python/openlibx402-fastapi
pip install -e packages/python/openlibx402-client
pip install -e packages/python/openlibx402-langchain
pip install -e packages/python/openlibx402-langgraph
```

## Solana Setup

### Install Solana CLI (Optional)

```bash
# On Linux/Mac
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Verify installation
solana --version
```

### Create Wallet

```bash
# Using Solana CLI
solana-keygen new --outfile ~/.config/solana/wallet.json

# Using Python
python -c "from solders.keypair import Keypair; import json; kp = Keypair(); json.dump(list(bytes(kp)), open('wallet.json', 'w')); print(f'Address: {kp.pubkey()}')"
```

### Fund Wallet (Devnet)

```bash
# Get devnet SOL for transaction fees
solana airdrop 1 YOUR_WALLET_ADDRESS --url devnet

# Check balance
solana balance YOUR_WALLET_ADDRESS --url devnet
```

### Get USDC (Devnet)

1. Visit Solana devnet faucets
2. Or use a devnet DEX to swap SOL for devnet USDC
3. Devnet USDC mint: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`

## Framework-Specific Setup

### FastAPI Server

```bash
# Install FastAPI dependencies
pip install openlibx402-core openlibx402-fastapi
pip install fastapi uvicorn

# Create .env file
cat > .env << EOF
PAYMENT_WALLET_ADDRESS=YOUR_WALLET_ADDRESS
USDC_MINT_ADDRESS=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
SOLANA_RPC_URL=https://api.devnet.solana.com
EOF
```

### LangChain Agent

```bash
# Install LangChain dependencies
pip install openlibx402-core openlibx402-client openlibx402-langchain
pip install langchain openai

# Set OpenAI API key
export OPENAI_API_KEY='your-key-here'

# Create wallet
python -c "from solders.keypair import Keypair; import json; kp = Keypair(); json.dump(list(bytes(kp)), open('wallet.json', 'w'))"
```

### LangGraph Workflow

```bash
# Install LangGraph dependencies
pip install openlibx402-core openlibx402-client openlibx402-langgraph
pip install langgraph langchain

# Create wallet
python -c "from solders.keypair import Keypair; import json; kp = Keypair(); json.dump(list(bytes(kp)), open('wallet.json', 'w'))"
```

## Development Installation

For development and testing:

```bash
# Clone repository
git clone https://github.com/openlibx402/openlibx402.git
cd openlibx402

# Install all packages with dev dependencies
pip install -e "packages/python/openlibx402-core[dev]"
pip install -e "packages/python/openlibx402-fastapi[dev]"
pip install -e "packages/python/openlibx402-client[dev]"
pip install -e "packages/python/openlibx402-langchain[dev]"
pip install -e "packages/python/openlibx402-langgraph[dev]"

# Install development tools
pip install black ruff mypy pytest pytest-asyncio

# Run tests
pytest
```

## Verification

Verify your installation:

```python
# Check core package
from openlibx402_core import PaymentRequest
print("✅ openlibx402-core installed")

# Check FastAPI package
from openlibx402_fastapi import payment_required
print("✅ openlibx402-fastapi installed")

# Check client package
from openlibx402_client import X402AutoClient
print("✅ openlibx402-client installed")

# Check LangChain package
from openlibx402_langchain import create_x402_agent
print("✅ openlibx402-langchain installed")

# Check LangGraph package
from openlibx402_langgraph import payment_node
print("✅ openlibx402-langgraph installed")
```

## Troubleshooting

### Import Errors

```bash
# Ensure packages are installed
pip list | grep openlibx402

# Reinstall if needed
pip install --force-reinstall openlibx402-core
```

### Solana Connection Issues

```bash
# Test RPC connection
curl https://api.devnet.solana.com -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'

# Try different RPC endpoint
export SOLANA_RPC_URL='https://api.devnet.solana.com'
```

### Wallet Issues

```bash
# Check wallet file format
python -c "import json; print(json.load(open('wallet.json'))[:5])"

# Verify wallet address
solana-keygen pubkey wallet.json
```

### Missing Dependencies

```bash
# Install all Solana dependencies
pip install solana solders spl-token

# Install all FastAPI dependencies
pip install fastapi uvicorn pydantic

# Install all LangChain dependencies
pip install langchain langchain-openai
```

## Next Steps

1. **Run Examples**: Try the example implementations in the `examples/` directory
2. **Read Documentation**: Check out the [Technical Specification](docs/openlibx402-technical-spec.md)
3. **Join Community**: Participate in discussions and contribute
4. **Build Something**: Start integrating X402 into your project!

## Support

- 📖 [Documentation](docs/)
- 💬 [GitHub Discussions](https://github.com/openlibx402/openlibx402/discussions)
- 🐛 [Report Issues](https://github.com/openlibx402/openlibx402/issues)
- 📧 Email: hello@openlibx402.org
