# @openlibx402/privy

Privy integration for X402 payment protocol - enables agentic and programmatic payments using Privy's server-side wallet infrastructure.

## Overview

This package allows AI agents and backend services to make x402 payments without managing raw private keys. Instead, Privy's server wallet API handles all signing operations securely in the cloud.

## Installation

```bash
npm install @openlibx402/privy
# or
pnpm add @openlibx402/privy
```

## Prerequisites

1. Create a Privy account at https://privy.io
2. Create a new app in the Privy dashboard
3. Get your App ID and App Secret
4. Create a server wallet in the Wallets section
5. Fund the server wallet with SOL and tokens (USDC) for payments

## Quick Start

```typescript
import { PrivyX402Client, PrivyX402Config } from '@openlibx402/privy';

// Configure the client
const config = new PrivyX402Config({
  appId: process.env.PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
  walletId: process.env.PRIVY_WALLET_ID!,
  network: 'solana-devnet',
  maxPaymentAmount: '5.0', // Safety limit
});

// Create and initialize client
const client = new PrivyX402Client(config);
await client.initialize();

// Make paid API request (automatically handles 402 responses)
const response = await client.get('https://api.example.com/premium-data');
console.log(response.data);

// Cleanup
await client.close();
```

## Configuration

### PrivyX402Config Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `appId` | string | Yes | Privy App ID from dashboard |
| `appSecret` | string | Yes | Privy App Secret from dashboard |
| `walletId` | string | Yes | Server wallet ID from Privy |
| `network` | string | No | Solana network (default: `solana-devnet`) |
| `rpcUrl` | string | No | Custom RPC URL |
| `maxPaymentAmount` | string | No | Maximum payment amount allowed (default: `10.0`) |

### Environment Variables

```bash
# Required
PRIVY_APP_ID=your-app-id
PRIVY_APP_SECRET=your-app-secret
PRIVY_WALLET_ID=your-server-wallet-id

# Optional
X402_NETWORK=solana-devnet
X402_RPC_URL=https://api.devnet.solana.com
X402_MAX_PAYMENT=10.0
```

## API Reference

### PrivyX402Client

The main client for making x402 payments with Privy.

#### Methods

##### `initialize(): Promise<void>`

Initialize the client by fetching wallet details from Privy. Must be called before making requests.

##### `get(url: string, options?: PrivyRequestOptions): Promise<AxiosResponse>`

Make a GET request with automatic x402 payment handling.

##### `post(url: string, data?: unknown, options?: PrivyRequestOptions): Promise<AxiosResponse>`

Make a POST request with automatic x402 payment handling.

##### `put(url: string, data?: unknown, options?: PrivyRequestOptions): Promise<AxiosResponse>`

Make a PUT request with automatic x402 payment handling.

##### `delete(url: string, options?: PrivyRequestOptions): Promise<AxiosResponse>`

Make a DELETE request with automatic x402 payment handling.

##### `getWalletAddress(): string`

Get the wallet address.

##### `getTokenBalance(tokenMint: string): Promise<number>`

Get the token balance for a specific token mint.

##### `getSolBalance(): Promise<number>`

Get the SOL balance.

##### `close(): Promise<void>`

Cleanup resources.

## How It Works

1. **Initial Request**: Client makes HTTP request to the target URL
2. **402 Response**: If the server returns HTTP 402 Payment Required, client parses the payment request
3. **Safety Check**: Validates the payment amount against `maxPaymentAmount`
4. **Create Payment**: Creates a Solana transaction for the payment
5. **Sign with Privy**: Sends transaction to Privy's server wallet API for signing
6. **Broadcast**: Submits signed transaction to the Solana network
7. **Retry Request**: Retries the original request with payment authorization header

## Security Benefits

- **No Private Keys in Code**: Privy manages keys in their secure infrastructure
- **Audit Trail**: All wallet operations logged in Privy dashboard
- **Access Controls**: Fine-grained permissions for different operations
- **Key Rotation**: Easy to rotate keys without code changes

## Use Cases

- **AI Agents**: Autonomous agents with budgeted server wallets
- **Backend Services**: API-to-API paid communications
- **Batch Processing**: Programmatic payments at scale
- **Multi-Tenant**: Different wallets per customer/use-case

## Advanced Usage

### Custom Request Options

```typescript
const response = await client.fetch('https://api.example.com/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  data: { query: 'some data' },
  timeout: 30000,
});
```

### Checking Balances

```typescript
// Check token balance
const usdcBalance = await client.getTokenBalance('USDC_MINT_ADDRESS');
console.log(`USDC Balance: ${usdcBalance}`);

// Check SOL balance
const solBalance = await client.getSolBalance();
console.log(`SOL Balance: ${solBalance}`);
```

### Using Individual Components

```typescript
import { PrivySigner, PrivySolanaPaymentProcessor } from '@openlibx402/privy';

// Create signer
const signer = new PrivySigner(appId, appSecret, walletId, walletAddress);

// Create processor
const processor = new PrivySolanaPaymentProcessor(rpcUrl, signer);

// Use for custom payment flows
const tx = await processor.createPaymentTransaction(paymentRequest, amount);
const signature = await processor.signAndSendTransaction(tx);
```

## Error Handling

```typescript
import { PaymentExpiredError, InsufficientFundsError } from '@openlibx402/core';

try {
  const response = await client.get('https://api.example.com/premium');
} catch (error) {
  if (error instanceof PaymentExpiredError) {
    console.error('Payment request expired');
  } else if (error instanceof InsufficientFundsError) {
    console.error('Insufficient funds for payment');
  } else {
    console.error('Error:', error);
  }
}
```

## License

MIT
