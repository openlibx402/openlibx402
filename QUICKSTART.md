# OpenLibX402 Quick Start Guide

Get up and running with OpenLibX402 in 5 minutes!

## Prerequisites

- Python 3.8+
- Basic understanding of async Python
- (Optional) OpenAI API key for agent examples

## Step 1: Installation

```bash
# Clone the repository
git clone https://github.com/openlibx402/openlibx402.git
cd openlibx402

# Install all packages
pip install -e packages/python/openlibx402-core
pip install -e packages/python/openlibx402-fastapi
pip install -e packages/python/openlibx402-client
pip install -e packages/python/openlibx402-langchain
pip install -e packages/python/openlibx402-langgraph
```

## Step 2: Create a Wallet

```bash
# Create a Solana wallet
python -c "
from solders.keypair import Keypair
import json

keypair = Keypair()
wallet_data = list(bytes(keypair))

with open('wallet.json', 'w') as f:
    json.dump(wallet_data, f)

print(f'✅ Wallet created!')
print(f'📍 Address: {keypair.pubkey()}')
print(f'💰 Fund this wallet on devnet to test')
"
```

## Step 3: Fund Your Wallet (Devnet)

```bash
# Get the wallet address
WALLET_ADDRESS=$(python -c "from solders.keypair import Keypair; import json; print(Keypair.from_bytes(bytes(json.load(open('wallet.json')))).pubkey())")

# Get devnet SOL (for transaction fees)
solana airdrop 1 $WALLET_ADDRESS --url devnet

# Check balance
solana balance $WALLET_ADDRESS --url devnet
```

## Step 4: Start the FastAPI Server

```bash
# Navigate to server example
cd examples/fastapi-server

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
PAYMENT_WALLET_ADDRESS=$WALLET_ADDRESS
USDC_MINT_ADDRESS=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
SOLANA_RPC_URL=https://api.devnet.solana.com
EOF

# Start the server
python main.py
```

Server will start at http://localhost:8000

## Step 5: Test with curl

In another terminal:

```bash
# Test free endpoint
curl http://localhost:8000/free-data

# Try premium endpoint (will return 402)
curl -v http://localhost:8000/premium-data

# You'll see a 402 response with payment details
```

## Step 6: Test with Python Client

Create a test script:

```python
# test_client.py
import asyncio
from solders.keypair import Keypair
from openlibx402_client import X402AutoClient
import json

async def main():
    # Load wallet
    with open('wallet.json') as f:
        keypair = Keypair.from_bytes(bytes(json.load(f)))

    # Create auto-payment client
    client = X402AutoClient(
        wallet_keypair=keypair,
        max_payment_amount="5.0"
    )

    # Fetch premium data (automatically pays if needed)
    try:
        response = await client.fetch("http://localhost:8000/premium-data")
        print("✅ Success!")
        print(response.json())
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(main())
```

Run it:

```bash
python test_client.py
```

## Step 7: Try the LangChain Agent

```bash
# Navigate to agent example
cd examples/langchain-agent

# Install dependencies
pip install -r requirements.txt

# Set OpenAI API key
export OPENAI_API_KEY='your-key-here'

# Copy your wallet
cp ../../wallet.json .

# Run the agent
python main.py
```

The agent will autonomously pay for API access!

## Common Patterns

### 1. FastAPI Server - Add Payment to Endpoint

```python
from fastapi import FastAPI
from openlibx402_fastapi import payment_required

app = FastAPI()

@app.get("/premium")
@payment_required(
    amount="0.10",
    payment_address="YOUR_WALLET",
    token_mint="USDC_MINT"
)
async def premium_endpoint():
    return {"data": "Premium content"}
```

### 2. Python Client - Auto Payment

```python
from openlibx402_client import X402AutoClient

client = X402AutoClient(wallet_keypair=keypair)

# Automatically handles 402 responses
response = await client.fetch("https://api.example.com/data")
```

### 3. LangChain Agent - Create X402 Agent

```python
from openlibx402_langchain import create_x402_agent

agent = create_x402_agent(
    wallet_keypair=keypair,
    max_payment="5.0"
)

response = agent.run("Get data from paid API")
```

### 4. LangGraph Workflow - Add Payment Node

```python
from langgraph.graph import StateGraph
from openlibx402_langgraph import payment_node, check_payment_required

workflow = StateGraph(YourState)
workflow.add_node("fetch", fetch_node)
workflow.add_node("pay", payment_node)

workflow.add_conditional_edges(
    "fetch",
    check_payment_required,
    {
        "payment_required": "pay",
        "success": "process"
    }
)
```

## Troubleshooting

### "Insufficient Funds" Error

```bash
# Check balance
solana balance YOUR_ADDRESS --url devnet

# Get more SOL
solana airdrop 1 YOUR_ADDRESS --url devnet
```

### "Transaction Failed" Error

- Check RPC endpoint is accessible
- Ensure devnet is operational
- Try a different RPC endpoint

### "Import Error"

```bash
# Verify installation
pip list | grep openlibx402

# Reinstall if needed
pip install --force-reinstall -e packages/python/openlibx402-core
```

### Server Won't Start

- Check port 8000 is available
- Verify .env file exists and has correct values
- Check Python version (3.8+)

## Next Steps

1. **Read Documentation**: Check [docs/](docs/) for detailed guides
2. **Explore Examples**: Try all three examples in [examples/](examples/)
3. **Build Something**: Integrate X402 into your project
4. **Contribute**: See [CONTRIBUTING.md](CONTRIBUTING.md)

## Useful Commands

```bash
# Check wallet address
python -c "from solders.keypair import Keypair; import json; print(Keypair.from_bytes(bytes(json.load(open('wallet.json')))).pubkey())"

# Check SOL balance
solana balance YOUR_ADDRESS --url devnet

# Test API server
curl http://localhost:8000/docs

# Format code
black packages/python/

# Run tests
pytest packages/python/*/tests
```

## Resources

- 📚 [Full Documentation](docs/)
- 💻 [Technical Specification](docs/openlibx402-technical-spec.md)
- 📖 [Quick Reference](docs/quick-reference.md)
- 🚀 [Examples](examples/)
- 🐛 [Report Issues](https://github.com/openlibx402/openlibx402/issues)

## Support

Need help?

- 💬 [GitHub Discussions](https://github.com/openlibx402/openlibx402/discussions)
- 📧 Email: hello@openlibx402.org
- 📖 [Installation Guide](INSTALL.md)

---

**You're ready to build with OpenLibX402! 🚀**
