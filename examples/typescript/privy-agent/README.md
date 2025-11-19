# Privy Server Wallet Agent Example

```bash
git clone https://github.com/openlibx402/openlibx402.git
cd openlibx402
```

This example demonstrates using Privy's server-side wallet infrastructure with x402 for agentic payments, enabling AI agents to make autonomous payments without managing raw private keys.

## Features

- **Server-Side Wallets**: No private keys in your code - Privy manages them securely
- **Automatic 402 Handling**: Automatically detects and pays for 402 Payment Required responses
- **Configurable Limits**: Set maximum payment amounts for safety
- **Full Audit Trail**: All wallet operations logged in Privy dashboard
- **TypeScript**: Full type safety and modern async/await patterns

## Overview

The `@openlibx402/privy` package provides a secure way for AI agents and backend services to make x402 payments. Instead of managing raw Solana keypairs, you use Privy's server wallet API which handles key management, signing, and security in the cloud.

## Prerequisites

1. **Privy Account**: Create an account at https://privy.io
2. **Server Wallet**: Create a Solana server wallet in the Privy dashboard
3. **Express.js Server**: The express-server example must be running
   ```bash
   cd ../express-server
   pnpm install && pnpm run build && pnpm start
   ```

4. **Wallet with Funds**: Your Privy server wallet needs:
   - SOL for transaction fees
   - USDC tokens for payments (on devnet)

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` with your Privy credentials:
   ```bash
   PRIVY_APP_ID=your-app-id
   PRIVY_APP_SECRET=your-app-secret
   PRIVY_WALLET_ID=your-server-wallet-id
   ```

4. Fund your server wallet:
   - Get the wallet address from Privy dashboard
   - Get SOL: `solana airdrop 1 <ADDRESS> --url devnet`
   - Get USDC: Use a devnet faucet or mint test tokens

## Running the Example

```bash
# Run
pnpm start

# Or run in dev mode with ts-node
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

## Code Structure

```
privy-agent/
├── src/
│   └── agent.ts       # Main agent example
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Usage Examples

### Basic Usage

```typescript
import { PrivyX402Client, PrivyX402Config } from '@openlibx402/privy';

const config = new PrivyX402Config({
  appId: process.env.PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
  walletId: process.env.PRIVY_WALLET_ID!,
  maxPaymentAmount: '5.0', // Safety limit
});

const client = new PrivyX402Client(config);
await client.initialize();

// Make paid API request
const response = await client.get('http://localhost:8000/premium-data');
console.log(response.data);

await client.close();
```

### Check Balances

```typescript
const solBalance = await client.getSolBalance();
const usdcBalance = await client.getTokenBalance('USDC_MINT_ADDRESS');

console.log(`SOL: ${solBalance}`);
console.log(`USDC: ${usdcBalance}`);
```

### POST Requests

```typescript
const response = await client.post('http://localhost:8000/process-data', {
  query: 'analyze this data'
});
```

## Security Benefits

- **No Private Keys**: Keys never leave Privy's infrastructure
- **Audit Trail**: All operations logged in Privy dashboard
- **Access Controls**: Fine-grained permissions for wallet operations
- **Key Rotation**: Easy to rotate without code changes
- **Cloud-Native**: Works with serverless and containerized environments

## Troubleshooting

### "Wallet not found" Error
- Verify your `PRIVY_WALLET_ID` is correct
- Ensure the wallet exists in your Privy dashboard
- Check your `PRIVY_APP_ID` and `PRIVY_APP_SECRET` are correct

### "Insufficient Funds" Error
- Fund your server wallet with USDC tokens
- The error shows required vs available balance
- Get devnet USDC from a faucet

### "Payment amount exceeds maximum" Error
- Increase `maxPaymentAmount` in config
- This is a safety check to prevent unexpected large payments

### API Request Fails
- Ensure the Express.js server is running
- Check server is accessible at the correct URL

## Learn More

- [OpenLibx402 Documentation](../../../README.md)
- [Privy Documentation](https://docs.privy.io)
- [@openlibx402/privy Package](../../../packages/typescript/openlibx402-privy/README.md)
- [X402 Protocol Specification](https://www.x402.org)
