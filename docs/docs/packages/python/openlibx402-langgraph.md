# OpenLibx402 LangGraph

LangGraph integration for X402 payment protocol.

## Installation

```bash
pip install openlibx402-langgraph
```

## Features

- Payment nodes for LangGraph workflows
- Async and sync node implementations
- Conditional edge functions for routing
- State management utilities
- Simple workflow creator

## Usage

### Basic Payment Node

```python
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
workflow.add_node("pay", payment_node)
workflow.add_node("process", process_node)

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

### Combined Fetch + Payment Node

```python
from openlibx402_langgraph import fetch_with_payment_node

workflow.add_node("fetch", fetch_with_payment_node)
workflow.set_entry_point("fetch")
workflow.add_edge("fetch", "process")
```

### Simple Workflow Helper

```python
from openlibx402_langgraph import create_simple_payment_workflow

workflow = create_simple_payment_workflow(
    wallet_keypair=keypair,
    api_url="https://api.example.com/data"
)

result = workflow({})
print(result["api_response"])
```

## License

MIT