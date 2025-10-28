# LangChain Agent Example

Example LangChain agent with autonomous X402 payment capabilities.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set OpenAI API key:
```bash
export OPENAI_API_KEY='your-key-here'
```

3. Create and fund wallet:
```bash
# Run the script once to generate wallet
python main.py

# Fund the wallet with SOL (for transaction fees)
solana airdrop 1 YOUR_WALLET_ADDRESS --url devnet

# You'll also need USDC on devnet for payments
# Use a faucet or swap service
```

4. Start the FastAPI server (in another terminal):
```bash
cd ../fastapi-server
python main.py
```

5. Run the agent examples:
```bash
python main.py
```

## What it does

The examples demonstrate three scenarios:

### Example 1: Simple Agent
Creates an agent using the convenience function that can autonomously detect and pay for 402 responses.

### Example 2: Custom Tools
Shows how to combine X402 payment capabilities with other LangChain tools.

### Example 3: Multi-API
Demonstrates an agent making multiple payments to different APIs in a single workflow.

## Key Features

- **Autonomous Payments**: Agent detects 402 responses and pays automatically
- **Safety Limits**: `max_payment` parameter prevents overspending
- **Transparent**: Verbose mode shows payment decisions
- **Flexible**: Works with any X402-enabled API