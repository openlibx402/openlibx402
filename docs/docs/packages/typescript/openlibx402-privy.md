# @openlibx402/privy

Privy integration for X402 payment protocol - server-side wallet support for agentic payments.

## Installation

```bash
npm install @openlibx402/privy
```

## Features

- **Server-Side Wallets**: No private keys in your code - Privy manages them securely
- **Automatic 402 Handling**: Automatically detects and pays for 402 Payment Required responses
- **Configurable Limits**: Set maximum payment amounts for safety
- **Full Audit Trail**: All wallet operations logged in Privy dashboard
- **TypeScript**: Full type safety and modern async/await patterns

## Prerequisites

1. Create a Privy account at https://privy.io
2. Create a new app in the Privy dashboard
3. Get your App ID and App Secret
4. Create a Solana server wallet in the Wallets section
5. Fund the server wallet with SOL and USDC

## Usage

### Basic Usage

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

### Check Balances

```typescript
// Check token balance
const usdcBalance = await client.getTokenBalance('USDC_MINT_ADDRESS');
console.log(`USDC Balance: ${usdcBalance}`);

// Check SOL balance
const solBalance = await client.getSolBalance();
console.log(`SOL Balance: ${solBalance}`);
```

### POST Requests

```typescript
const response = await client.post('https://api.example.com/process', {
  query: 'analyze this data'
});
```

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

## Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `appId` | string | Yes | Privy App ID from dashboard |
| `appSecret` | string | Yes | Privy App Secret from dashboard |
| `walletId` | string | Yes | Server wallet ID from Privy |
| `network` | string | No | Solana network (default: `solana-devnet`) |
| `rpcUrl` | string | No | Custom RPC URL |
| `maxPaymentAmount` | string | No | Maximum payment amount allowed (default: `10.0`) |

## Environment Variables

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

## How It Works

1. **Initialize**: Client fetches wallet details from Privy API
2. **Request**: Makes HTTP request to paid endpoint
3. **402 Response**: Server returns "Payment Required" with payment details
4. **Safety Check**: Validates payment amount against configured maximum
5. **Transaction**: Creates Solana payment transaction
6. **Sign with Privy**: Sends transaction to Privy API for signing
7. **Broadcast**: Submits signed transaction to Solana network
8. **Retry**: Retries request with payment authorization header
9. **Success**: Server verifies payment and returns data

## Security Benefits

- **No Private Keys**: Keys never leave Privy's infrastructure
- **Audit Trail**: All operations logged in Privy dashboard
- **Access Controls**: Fine-grained permissions for wallet operations
- **Key Rotation**: Easy to rotate without code changes
- **Cloud-Native**: Works with serverless and containerized environments

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

## API Reference

### PrivyX402Config

Configuration class for Privy x402 integration.

- `getRpcUrl()` - Get the RPC URL for the configured network
- `isMainnet()` - Check if running on mainnet

### PrivyX402Client

Main HTTP client that uses Privy server wallets for payments.

- `initialize()` - Initialize client (must be called before making requests)
- `get(url, options?)` - GET request with auto-payment
- `post(url, data?, options?)` - POST request with auto-payment
- `put(url, data?, options?)` - PUT request with auto-payment
- `delete(url, options?)` - DELETE request with auto-payment
- `fetch(url, options?)` - Generic request with auto-payment
- `getWalletAddress()` - Get the wallet address
- `getTokenBalance(tokenMint)` - Get token balance
- `getSolBalance()` - Get SOL balance
- `close()` - Cleanup resources

### PrivySigner

Privy-based signer for Solana transactions.

- `signTransaction(transaction)` - Sign a transaction using Privy's server wallet
- `getAddress()` - Get the wallet address as a string

### PrivySolanaPaymentProcessor

Solana payment processor using Privy for signing.

- `createPaymentTransaction(request, amount)` - Create a payment transaction
- `signAndSendTransaction(transaction)` - Sign and broadcast a transaction
- `getTokenBalance(tokenMint)` - Get token balance
- `getSolBalance()` - Get SOL balance
- `close()` - Cleanup resources

## Use Cases

- **AI Agents**: Autonomous agents with budgeted server wallets
- **Backend Services**: API-to-API paid communications
- **Batch Processing**: Programmatic payments at scale
- **Multi-Tenant**: Different wallets per customer/use-case

## License

MIT
