# LangGraph.js Workflow with X402 Payment Support

```bash
git clone https://github.com/openlibx402/openlibx402.git
cd openlibx402
```

This example demonstrates how to build LangGraph.js workflows that include payment nodes for accessing paid APIs using the X402 payment protocol.

## Features

- **Payment Nodes**: Reusable nodes for handling payments in workflows
- **Conditional Routing**: Route based on payment requirements
- **Multi-Step Workflows**: Access multiple paid APIs in sequence
- **State Management**: Proper state handling for payment status
- **TypeScript**: Full type safety with LangGraph.js

## Prerequisites

1. **Express.js Server**: The express-server example must be running
   ```bash
   cd ../express-server
   pnpm install && pnpm run build && pnpm start
   ```

2. **Wallet with Funds**: You need a Solana wallet with:
   - SOL for transaction fees
   - USDC tokens for payments (on devnet)

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Create `.env` file (optional):
   ```bash
   cp .env.example .env
   ```

3. The first run will create a wallet file (`wallet.json`)
   - **Important**: Fund this wallet with SOL and USDC on devnet
   - Get SOL: `solana airdrop 1 <ADDRESS> --url devnet`
   - Get USDC: Use a devnet faucet

## Running Examples

```bash
# Build
pnpm run build

# Run
pnpm start

# Or run in dev mode
pnpm run dev
```

## Examples

### Example 1: Simple Payment Workflow

Uses `fetchWithPaymentNode` for easy payment integration:
- Single node handles both fetch and payment
- Minimal configuration
- Automatic payment handling

### Example 2: Custom Workflow with Conditional Payment

Demonstrates explicit payment handling:
- Separate fetch and payment nodes
- Conditional routing based on payment requirements
- Custom error handling

### Example 3: Multi-Step Research Workflow

Shows complex multi-API workflows:
- Access multiple paid APIs sequentially
- Collect and aggregate results
- State management across multiple steps

## How It Works

### Payment Flow

1. **Fetch Node**: Attempts to fetch API
2. **Check Payment**: Determines if payment is required (402 response)
3. **Payment Node**: Creates and broadcasts payment if needed
4. **Process Node**: Processes API response
5. **State Updates**: Tracks payment status throughout workflow

### State Management

```typescript
interface PaymentState {
  wallet_keypair: Keypair;
  api_url: string;
  api_response?: string;
  payment_required?: boolean;
  payment_completed?: boolean;
  payment_error?: string;
  max_payment_amount?: string;
}
```

## Available Nodes

### `fetchWithPaymentNode`
Combined fetch + payment node:
- Automatically handles 402 responses
- Creates and broadcasts payments
- Updates state with response

### `paymentNode`
Explicit payment handling:
- Makes payment for a payment request
- Updates payment completion status
- Handles errors

### Conditional Edges

- `checkPaymentRequired`: Routes based on payment requirement
- `checkPaymentCompleted`: Routes based on payment status

## Code Structure

```
langgraph-workflow/
├── src/
│   └── workflow.ts     # Main workflow examples
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Workflow Patterns

### Pattern 1: Simple Flow

```
[Fetch with Payment] → [Process] → [END]
```

### Pattern 2: Conditional Flow

```
[Fetch] → (Check Payment?)
   ├─ Payment Required → [Payment] → [Process] → [END]
   └─ Success → [Process] → [END]
```

### Pattern 3: Multi-Step

```
[Plan] → [Fetch+Pay] → [Collect] → (More APIs?)
                         ↑              ├─ Yes → [Fetch+Pay]
                         └──────────────┘
                                        └─ No → [END]
```

## Wallet Management

The example automatically creates a wallet file (`wallet.json`) on first run.

**⚠️ Security Warning**:
- Never commit `wallet.json` to version control
- In production, use secure key management
- The wallet file is added to `.gitignore`

## Troubleshooting

### "Payment Required" Error Without Payment
- Check that payment nodes are properly connected
- Verify conditional edges route to payment node
- Ensure state includes `wallet_keypair`

### "Insufficient Funds" Error
- Fund your wallet with SOL: `solana airdrop 1 <ADDRESS> --url devnet`
- Get devnet USDC tokens from a faucet

### Workflow Hangs or Doesn't Progress
- Check conditional edge functions return correct values
- Verify all edges are properly connected
- Look for missing END edges

### Payment Succeeds But Data Not Retrieved
- Ensure payment node connects to fetch/process node
- Check state is properly passed between nodes
- Verify API response is stored in state

## Advanced Usage

### Custom Payment Limits

```typescript
const result = await app.invoke({
  wallet_keypair: keypair,
  api_url: 'http://localhost:3000/premium-data',
  max_payment_amount: '2.0', // Custom limit
});
```

### Error Handling

```typescript
const processNode = async (state: State) => {
  if (state.payment_error) {
    // Handle payment error
    return { error: state.payment_error };
  }
  // Process normally
};
```

### Multiple Retries

```typescript
// Add retry logic in custom nodes
let attempts = 0;
while (attempts < 3 && !state.payment_completed) {
  // Attempt payment
  attempts++;
}
```

## Learn More

- [OpenLibx402 Documentation](../../../README.md)
- [LangGraph.js Documentation](https://langchain-ai.github.io/langgraphjs/)
- [X402 Protocol Specification](https://www.x402.org)
- [State Management in LangGraph](https://langchain-ai.github.io/langgraphjs/concepts/state/)
