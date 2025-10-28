# openlibx402-langgraph

LangGraph integration for the X402 payment protocol - build workflows that include payment nodes for accessing paid APIs.

## Overview

The `openlibx402-langgraph` package provides LangGraph nodes and utilities for building AI workflows that can automatically handle payment requirements. Create workflows that seamlessly integrate payment processing for accessing premium APIs.

## Features

- Pre-built payment nodes for LangGraph workflows
- Conditional routing based on payment requirements
- Helper functions for quick workflow creation
- Support for multi-step workflows with multiple API calls
- Async and sync payment node support
- State management utilities for payment workflows

## Installation

```bash
pip install openlibx402-langgraph
```

## Quick Start

### Simple Payment Workflow

The easiest way to create a payment-enabled workflow:

```python
from openlibx402_langgraph import create_simple_payment_workflow
from solders.keypair import Keypair
import json

# Load wallet
with open("wallet.json") as f:
    wallet_data = json.load(f)
    keypair = Keypair.from_bytes(bytes(wallet_data))

# Create simple workflow
workflow = create_simple_payment_workflow(
    wallet_keypair=keypair,
    api_url="http://localhost:8000/premium-data",
    max_payment="1.0",
)

# Run workflow
result = workflow()
print(f"Payment completed: {result.get('payment_completed')}")
print(f"Response: {result.get('api_response')}")
```

## Usage Patterns

### Pattern 1: Simple Workflow (Recommended)

Best for single API access with payment:

```python
from openlibx402_langgraph import create_simple_payment_workflow
from solders.keypair import Keypair

keypair = Keypair()  # Your wallet

workflow = create_simple_payment_workflow(
    wallet_keypair=keypair,
    api_url="https://api.example.com/premium-data",
    max_payment="1.0",
)

result = workflow()
```

### Pattern 2: Custom Workflow with Payment Nodes

For more complex workflows with custom logic:

```python
from typing import TypedDict, Optional
from langgraph.graph import StateGraph, END
from openlibx402_langgraph import (
    payment_node,
    fetch_with_payment_node,
    check_payment_required,
)
from solders.keypair import Keypair

# Define state
class WorkflowState(TypedDict):
    api_url: str
    api_response: Optional[str]
    payment_required: bool
    payment_completed: bool
    payment_error: Optional[str]
    wallet_keypair: Keypair
    max_payment_amount: str

# Build workflow
workflow = StateGraph(WorkflowState)

# Add nodes
workflow.add_node("fetch", fetch_with_payment_node)
workflow.add_node("payment", payment_node)

# Set entry point
workflow.set_entry_point("fetch")

# Add conditional routing
workflow.add_conditional_edges(
    "fetch",
    check_payment_required,
    {
        "payment_required": "payment",
        "success": END,
        "error": END
    }
)

workflow.add_edge("payment", END)

app = workflow.compile()

# Run workflow
keypair = Keypair()
result = app.invoke({
    "api_url": "https://api.example.com/data",
    "wallet_keypair": keypair,
    "max_payment_amount": "5.0"
})
```

### Pattern 3: Multi-Step Research Workflow

Build workflows that access multiple paid APIs:

```python
from typing import TypedDict, Optional, List
from langgraph.graph import StateGraph, END
from openlibx402_langgraph import fetch_with_payment_node
from solders.keypair import Keypair

# Define state with multiple APIs
class ResearchState(TypedDict):
    wallet_keypair: Keypair
    apis: List[str]
    current_api_index: int
    api_url: str
    api_response: Optional[str]
    payment_completed: bool
    results: List[dict]
    max_payment_amount: str

def plan_node(state: ResearchState) -> ResearchState:
    """Initialize research plan"""
    state["apis"] = [
        "http://localhost:8000/premium-data",
        "http://localhost:8000/tiered-data/premium",
    ]
    state["current_api_index"] = 0
    state["api_url"] = state["apis"][0]
    state["results"] = []
    return state

def collect_result_node(state: ResearchState) -> ResearchState:
    """Collect result and move to next API"""
    if state.get("api_response"):
        state["results"].append({
            "api": state["api_url"],
            "response": state["api_response"]
        })

    # Move to next API
    state["current_api_index"] += 1
    if state["current_api_index"] < len(state["apis"]):
        state["api_url"] = state["apis"][state["current_api_index"]]
        state["api_response"] = None
        state["payment_completed"] = False

    return state

def check_more_apis(state: ResearchState) -> str:
    """Check if there are more APIs to access"""
    if state["current_api_index"] < len(state["apis"]):
        return "fetch_next"
    return "complete"

# Build workflow
workflow = StateGraph(ResearchState)
workflow.add_node("plan", plan_node)
workflow.add_node("fetch", fetch_with_payment_node)
workflow.add_node("collect", collect_result_node)

workflow.set_entry_point("plan")
workflow.add_edge("plan", "fetch")
workflow.add_edge("fetch", "collect")
workflow.add_conditional_edges(
    "collect",
    check_more_apis,
    {"fetch_next": "fetch", "complete": END}
)

app = workflow.compile()

# Run multi-step workflow
keypair = Keypair()
result = app.invoke({
    "wallet_keypair": keypair,
    "max_payment_amount": "5.0"
})

print(f"APIs processed: {len(result.get('results', []))}")
```

## Complete Example

```python
from openlibx402_langgraph import create_simple_payment_workflow
from solders.keypair import Keypair
import json

# Load wallet
with open("wallet.json") as f:
    wallet_data = json.load(f)
    keypair = Keypair.from_bytes(bytes(wallet_data))

# Create and run workflow
workflow = create_simple_payment_workflow(
    wallet_keypair=keypair,
    api_url="http://localhost:8000/premium-data",
    max_payment="1.0",
)

result = workflow()

if result.get("payment_completed"):
    print("✅ Payment completed successfully")
    print(f"Response: {result.get('api_response')[:100]}...")
else:
    print(f"❌ Error: {result.get('payment_error')}")
```

## Available Nodes

### Payment Processing Nodes

- `payment_node`: Process payment for current API request
- `async_payment_node`: Async version of payment node
- `fetch_with_payment_node`: Fetch API with automatic payment handling
- `async_fetch_with_payment_node`: Async version

### Conditional Routing Functions

- `check_payment_required`: Route based on payment requirement
- `check_payment_completed`: Route based on payment status

### State Utilities

- `PaymentState`: TypedDict for payment-capable state
- `create_payment_capable_state`: Create custom state with payment fields
- `add_payment_workflow`: Add payment nodes to existing workflow

## Configuration

### Node Parameters (via State)

- `wallet_keypair`: Your Solana wallet keypair (required)
- `api_url`: URL to access (required)
- `max_payment_amount`: Maximum payment limit (required)
- `payment_required`: Payment requirement flag
- `payment_completed`: Payment completion flag
- `payment_error`: Error message if payment fails

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
- [Documentation](https://docs.openlibx402.org)
- [GitHub Repository](https://github.com/openlibx402/openlibx402)
- [Full Example](https://github.com/openlibx402/openlibx402/tree/main/examples/python/langgraph-workflow)

## Testing

```bash
pytest tests/
```

## License

MIT License - See [LICENSE](LICENSE) file for details.
