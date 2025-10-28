# LangChain.js Payment Tool Example

This example demonstrates the X402 payment tool for LangChain.js, which enables payment capabilities that can be integrated with AI agents.

## Features

- **X402 Payment Tool**: LangChain.js tool for making payments to access APIs
- **Multiple APIs**: Examples of accessing multiple paid APIs
- **Custom Behavior**: Configurable payment limits and RPC URLs
- **TypeScript**: Full type safety and modern async/await patterns
- **Agent-Ready**: Tool can be integrated with LangChain agents for autonomous payments

## Overview

The X402PaymentTool can be integrated with LangChain.js agents to enable autonomous payment capabilities. This example shows direct tool usage for clarity. In production, integrate this tool with LangChain agents that use LLMs to decide when to make payments.

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

2. The first run will create a wallet file (`wallet.json`)
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

### Example 1: Simple Payment Tool

Demonstrates basic tool usage:
- Creates X402PaymentTool
- Makes payment to access a single API
- Shows direct tool invocation

### Example 2: Multiple APIs

Demonstrates accessing multiple paid APIs:
- Higher payment limit for multiple payments
- Sequential API access
- Handles multiple 402 responses

### Example 3: Custom Payment Behavior

Shows customization options:
- Custom RPC URL
- Specific payment limits
- Custom tool names and descriptions

## Integration with LangChain Agents

To use this tool with a LangChain agent:

```typescript
import { createX402PaymentTool } from '@openlibx402/langchain';
import { ChatOpenAI } from '@langchain/openai';

// Create the payment tool
const paymentTool = createX402PaymentTool({
  walletKeypair: yourKeypair,
  maxPayment: '5.0',
});

// Use with your LangChain agent
const agent = createYourAgent({
  llm: new ChatOpenAI(),
  tools: [paymentTool, ...otherTools],
});

// Agent can now autonomously make payments
const result = await agent.invoke({
  input: 'Get data from http://localhost:3000/premium-data'
});