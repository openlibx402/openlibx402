# openlibx402-langchain

LangChain integration for the X402 payment protocol - enables AI agents to autonomously pay for API access.

## Overview

The `openlibx402-langchain` package provides LangChain tools and utilities that enable AI agents to autonomously make payments to access paid APIs using the X402 protocol. Agents can detect payment requirements, process payments, and retry requests automatically.

## Features

- Autonomous payment capability for LangChain agents
- X402 payment tool for LangChain agent workflows
- Helper functions for quick agent creation
- Configurable payment limits for safety
- Seamless integration with existing LangChain applications

## Installation

```bash
pip install openlibx402-langchain
```

## Quick Start

### Simple Agent with Autonomous Payment

The easiest way to create an X402-enabled agent:

```python
from openlibx402_langchain import create_x402_agent
from langchain_openai import ChatOpenAI
from solders.keypair import Keypair
import json

# Load wallet
with open("wallet.json") as f:
    wallet_data = json.load(f)
    keypair = Keypair.from_bytes(bytes(wallet_data))

# Create agent with X402 support in one function call
agent = create_x402_agent(
    wallet_keypair=keypair,
    llm=ChatOpenAI(temperature=0),
    max_payment="5.0",  # Safety limit
    debug=True,
)

# Agent can now autonomously pay for API access
inputs = {
    "messages": [
        {
            "role": "user",
            "content": "Get the premium data from http://localhost:8000/premium-data"
        }
    ]
}

for chunk in agent.stream(inputs, stream_mode="updates"):
    if "agent" in chunk:
        result = chunk["agent"]

if result and "messages" in result:
    final_message = result["messages"][-1]
    print(f"Agent response: {final_message.content}")
```

## Usage Patterns

### Pattern 1: Quick Agent Creation (Recommended)

Best for most use cases - creates a fully configured agent:

```python
from openlibx402_langchain import create_x402_agent
from langchain_openai import ChatOpenAI
from solders.keypair import Keypair

keypair = Keypair()  # Your wallet

agent = create_x402_agent(
    wallet_keypair=keypair,
    llm=ChatOpenAI(temperature=0),
    max_payment="10.0",
    debug=True,
)

# Use the agent
result = agent.invoke({
    "messages": [
        {"role": "user", "content": "Access paid APIs"}
    ]
})
```

### Pattern 2: Custom Agent with Payment Tool

For custom agent configurations:

```python
from openlibx402_langchain import X402PaymentTool
from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from solders.keypair import Keypair

keypair = Keypair()

# Create X402 payment tool
payment_tool = X402PaymentTool(
    wallet_keypair=keypair,
    max_payment="5.0",
    name="pay_for_api",
    description="Make payment to access premium API data"
)

# Create custom agent with your tools
agent = create_agent(
    model=ChatOpenAI(temperature=0),
    tools=[payment_tool, *other_tools],
    system_prompt="Your custom system prompt",
)
```

### Pattern 3: Multi-API Access

Agent accessing multiple paid APIs:

```python
from openlibx402_langchain import create_x402_agent
from langchain_openai import ChatOpenAI
from solders.keypair import Keypair

keypair = Keypair()

agent = create_x402_agent(
    wallet_keypair=keypair,
    llm=ChatOpenAI(temperature=0),
    max_payment="10.0",  # Higher limit for multiple payments
    debug=True,
)

inputs = {
    "messages": [
        {
            "role": "user",
            "content": "Get data from both /premium-data and /expensive-data APIs, then compare them"
        }
    ]
}

result = agent.invoke(inputs)
```

## Complete Example

```python
from openlibx402_langchain import (
    create_x402_agent,
    X402PaymentTool,
)
from langchain_openai import ChatOpenAI
from solders.keypair import Keypair
import json
import os

# Load wallet keypair
with open("wallet.json") as f:
    wallet_data = json.load(f)
    keypair = Keypair.from_bytes(bytes(wallet_data))

# Create X402-enabled agent
agent = create_x402_agent(
    wallet_keypair=keypair,
    llm=ChatOpenAI(
        temperature=0,
        api_key=os.getenv("OPENAI_API_KEY")
    ),
    max_payment="5.0",
    debug=True,
)

# Run agent
inputs = {
    "messages": [
        {
            "role": "user",
            "content": "Get premium market data from http://localhost:8000/premium-data and summarize it"
        }
    ]
}

for chunk in agent.stream(inputs, stream_mode="updates"):
    if "agent" in chunk:
        result = chunk["agent"]
        if "messages" in result:
            print(result["messages"][-1].content)
```

## Configuration

### create_x402_agent Parameters

- `wallet_keypair`: Your Solana wallet keypair for payments (required)
- `llm`: LangChain LLM instance (required)
- `max_payment`: Maximum payment amount - safety limit (required)
- `debug`: Enable debug logging (optional)

### X402PaymentTool Parameters

- `wallet_keypair`: Your Solana wallet keypair
- `max_payment`: Maximum payment limit
- `name`: Tool name for agent (default: "x402_payment")
- `description`: Tool description for agent

## Wallet Setup

```python
import json
from solders.keypair import Keypair

# Create new wallet
keypair = Keypair()
wallet_data = list(bytes(keypair))
with open("wallet.json", "w") as f:
    json.dump(wallet_data, f)

print(f"Wallet address: {keypair.pubkey()}")
print("Fund this wallet with SOL and USDC on devnet!")
```

## Documentation

For complete API reference and guides, see:
- [Documentation](https://openlibx402.github.io/docs)
- [GitHub Repository](https://github.com/openlibx402/openlibx402)
- [Full Example](https://github.com/openlibx402/openlibx402/tree/main/examples/python/langchain-agent)

## Testing

```bash
pytest tests/
```

## License

MIT License - See [LICENSE](LICENSE) file for details.
