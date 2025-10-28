# LangGraph.js Workflow with X402 Payment Support

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