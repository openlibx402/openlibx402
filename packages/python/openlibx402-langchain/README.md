# OpenLibX402 LangChain

LangChain integration for X402 payment protocol.

## Installation

```bash
pip install openlibx402-langchain
```

## Features

- X402PaymentTool for LangChain agents
- X402RequestsWrapper for automatic payment handling
- Convenience function for creating X402-enabled agents

## Usage

### Using X402PaymentTool

```python
from langchain.chat_models import ChatOpenAI
from langchain.agents import initialize_agent, AgentType
from openlibx402_langchain import X402PaymentTool
from solders.keypair import Keypair

keypair = Keypair()

payment_tool = X402PaymentTool(
    wallet_keypair=keypair,
    max_payment="5.0"
)

agent = initialize_agent(
    tools=[payment_tool],
    llm=ChatOpenAI(),
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION
)

response = agent.run("Get premium data from https://api.example.com/data")
```

### Using X402RequestsWrapper

```python
from langchain.agents import load_tools
from openlibx402_langchain import X402RequestsWrapper

requests_wrapper = X402RequestsWrapper(
    wallet_keypair=keypair,
    max_payment="1.0"
)

tools = load_tools(
    ["requests_all"],
    llm=ChatOpenAI(),
    requests_wrapper=requests_wrapper
)

agent = initialize_agent(tools=tools, llm=ChatOpenAI())
```

### Convenience Function

```python
from openlibx402_langchain import create_x402_agent

agent = create_x402_agent(
    wallet_keypair=keypair,
    max_payment="5.0"
)

response = agent.run("Get premium data from API")
```

## License

MIT
