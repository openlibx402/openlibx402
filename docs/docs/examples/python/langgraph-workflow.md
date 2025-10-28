# LangGraph Workflow Example

Example LangGraph workflows with X402 payment nodes.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create and fund wallet:
```bash
# Run the script once to generate wallet
python main.py

# Fund the wallet with SOL (for transaction fees)
solana airdrop 1 YOUR_WALLET_ADDRESS --url devnet
```

3. Start the FastAPI server (in another terminal):
```bash
cd ../fastapi-server
python main.py
```

4. Run the workflow examples:
```bash
python main.py
```

## What it does

The examples demonstrate three workflow patterns:

### Example 1: Simple Workflow
Uses the convenience function to create a basic workflow with payment handling.

### Example 2: Custom Workflow
Shows how to build a workflow with separate fetch and payment nodes for more control.

### Example 3: Multi-Step Workflow
Demonstrates a workflow that accesses multiple paid APIs sequentially, handling payments for each.

## Key Features

- **Modular Design**: Payment logic is isolated in dedicated nodes
- **Conditional Routing**: Workflows automatically route to payment nodes when needed
- **Error Handling**: Graceful handling of payment errors
- **Composable**: Easy to add payment capabilities to existing workflows

## Workflow Patterns

### Pattern 1: Combined Node
```python
workflow.add_node("fetch", fetch_with_payment_node)
```
Simplest approach - fetch and pay in one node.

### Pattern 2: Separate Nodes
```python
workflow.add_node("fetch", fetch_node)
workflow.add_node("pay", payment_node)
workflow.add_conditional_edges("fetch", check_payment_required, {...})
```
More control - explicit payment step.

### Pattern 3: Multi-Step
```python
# Loop through multiple APIs
workflow.add_conditional_edges("collect", check_more_apis, {
    "fetch_next": "fetch",
    "complete": END
})
```
Complex workflows with multiple payments.