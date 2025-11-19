# Privy Server Wallet Agent

This example demonstrates using Privy's server-side wallet infrastructure with x402 for agentic payments.

## Overview

The `@openlibx402/privy` package provides a secure way for AI agents and backend services to make x402 payments without managing raw private keys. Instead, Privy's server wallet API handles key management, signing, and security in the cloud.

## Prerequisites

1. **Privy Account**: Create an account at https://privy.io
2. **Server Wallet**: Create a Solana server wallet in the Privy dashboard
3. **Express.js Server**: The express-server example must be running
4. **Wallet with Funds**: Your Privy server wallet needs SOL and USDC

## Setup

1. Navigate to the example:
   ```bash
   cd examples/typescript/privy-agent
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Configure environment:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` with your Privy credentials:
   ```bash
   PRIVY_APP_ID=your-app-id
   PRIVY_APP_SECRET=your-app-secret
   PRIVY_WALLET_ID=your-server-wallet-id
   ```

## Running

```bash
# Build and run
pnpm start

# Or run in dev mode
pnpm run dev
```

## Getting Privy Credentials

### App ID and App Secret

1. Go to https://dashboard.privy.io
2. Select your app (or create a new one)
3. Navigate to **Settings** → **API Keys**
4. Copy your **App ID** and **App Secret**

### Server Wallet ID

1. In the Privy dashboard, go to **Wallets** → **Server Wallets**
2. Click **Create Wallet**
3. Select **Solana** as the chain type
4. Copy the wallet ID (format: `wallet-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

## Code Example

```typescript
import { PrivyX402Client, PrivyX402Config } from '@openlibx402/privy';

// Configure the client
const config = new PrivyX402Config({
  appId: process.env.PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
  walletId: process.env.PRIVY_WALLET_ID!,
  network: 'solana-devnet',
  maxPaymentAmount: '5.0',
});

const client = new PrivyX402Client(config);

// Initialize (fetches wallet details from Privy)
await client.initialize();
console.log(`Wallet address: ${client.getWalletAddress()}`);

// Check balances
const solBalance = await client.getSolBalance();
console.log(`SOL Balance: ${solBalance.toFixed(4)} SOL`);

// Make paid API request
const response = await client.get('http://localhost:8000/premium-data');
console.log('Response:', response.data);

// Cleanup
await client.close();
```

## How It Works

1. **Initialize**: Client fetches wallet details from Privy API
2. **Request**: Makes HTTP request to paid endpoint
3. **402 Response**: Server returns "Payment Required" with payment details
4. **Safety Check**: Validates payment amount against configured maximum
5. **Transaction**: Creates Solana payment transaction
6. **Sign with Privy**: Sends transaction to Privy API for signing (no private keys locally)
7. **Broadcast**: Submits signed transaction to Solana network
8. **Retry**: Retries request with payment authorization header
9. **Success**: Server verifies payment and returns data

## Project Structure

```
privy-agent/
├── src/
│   └── agent.ts       # Main agent example
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Security Benefits

- **No Private Keys**: Keys never leave Privy's infrastructure
- **Audit Trail**: All operations logged in Privy dashboard
- **Access Controls**: Fine-grained permissions for wallet operations
- **Key Rotation**: Easy to rotate without code changes

## Troubleshooting

### "Wallet not found" Error
- Verify your `PRIVY_WALLET_ID` is correct
- Ensure the wallet exists in your Privy dashboard
- Check your `PRIVY_APP_ID` and `PRIVY_APP_SECRET` are correct

### "Insufficient Funds" Error
- Fund your server wallet with USDC tokens
- Get devnet USDC from a faucet

### "Payment amount exceeds maximum" Error
- Increase `maxPaymentAmount` in config

## Related

- [@openlibx402/privy Package](../../packages/typescript/openlibx402-privy.md)
- [Express Server Example](express-server.md)
- [LangChain Agent Example](langchain-agent.md)
