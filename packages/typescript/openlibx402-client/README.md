# @openlibx402/client

TypeScript HTTP client library for the X402 payment protocol with both manual and automatic payment handling.

## Overview

The client package provides HTTP client implementations for making requests to X402-protected resources. It includes two client types:
- **X402Client**: Manual payment control - you handle 402 responses and payment flow explicitly
- **X402AutoClient**: Automatic payment handling - automatically detects 402 responses and processes payments

## Features

- **Dual Client Modes**: Choose between manual or automatic payment handling
- **Solana Wallet Integration**: Built-in support for Solana keypair-based payments
- **Retry Logic**: Configurable automatic retry with payment
- **Safety Limits**: Optional maximum payment amount protection
- **Full TypeScript Support**: Complete type definitions and intellisense

## Installation

```bash
npm install @openlibx402/client
# or
pnpm add @openlibx402/client
# or
yarn add @openlibx402/client
```

## Usage

### Automatic Payment Client (Recommended)

The `X402AutoClient` automatically handles payment flow when encountering 402 responses:

```typescript
import { X402AutoClient } from '@openlibx402/client';
import { Keypair } from '@solana/web3.js';

// Load your wallet keypair
const walletKeypair = Keypair.fromSecretKey(secretKeyBytes);

// Create auto client
const client = new X402AutoClient(
  walletKeypair,
  'https://api.devnet.solana.com',
  {
    maxRetries: 1,
    autoRetry: true,
    maxPaymentAmount: '10000000' // Safety limit in lamports
  }
);

// Make requests - payment is handled automatically
const response = await client.fetch('https://api.example.com/premium-data');
console.log(response.data);

// Clean up
await client.close();
```

### Manual Payment Client

The `X402Client` gives you full control over the payment flow:

```typescript
import { X402Client } from '@openlibx402/client';
import { Keypair } from '@solana/web3.js';

const walletKeypair = Keypair.fromSecretKey(secretKeyBytes);
const client = new X402Client(
  walletKeypair,
  'https://api.devnet.solana.com'
);

try {
  // First request
  const response = await client.fetch('https://api.example.com/premium-data');
  console.log(response.data);
} catch (error) {
  if (error.response?.status === 402) {
    // Extract payment request from 402 response
    const paymentRequest = error.response.data;

    // Process payment
    const authorization = await client.makePayment(paymentRequest);

    // Retry with payment authorization
    const response = await client.fetch(
      'https://api.example.com/premium-data',
      {
        headers: {
          'X-Payment-Authorization': authorization.toHeaderValue()
        }
      }
    );
    console.log(response.data);
  }
}

await client.close();
```

### POST Requests with Payment

```typescript
const client = new X402AutoClient(walletKeypair);

// POST request with automatic payment handling
const response = await client.fetch(
  'https://api.example.com/process',
  {
    method: 'POST',
    data: {
      input: 'some data'
    }
  }
);
```

### Custom Configuration

```typescript
import { X402AutoClient } from '@openlibx402/client';

const client = new X402AutoClient(
  walletKeypair,
  'https://api.mainnet-beta.solana.com', // Custom RPC endpoint
  {
    maxRetries: 2,           // Retry up to 2 times
    autoRetry: true,         // Enable automatic retry
    maxPaymentAmount: '5000000' // Maximum 0.005 SOL equivalent
  }
);
```

## API Reference

### X402AutoClient

Constructor:
```typescript
constructor(
  walletKeypair: Keypair,
  rpcUrl?: string,
  options?: {
    maxRetries?: number;
    autoRetry?: boolean;
    maxPaymentAmount?: string;
  }
)
```

Methods:
- `fetch(url: string, options?: AxiosRequestConfig)` - Make HTTP request with automatic payment
- `close()` - Clean up resources

### X402Client

Constructor:
```typescript
constructor(walletKeypair: Keypair, rpcUrl?: string)
```

Methods:
- `fetch(url: string, options?: AxiosRequestConfig)` - Make HTTP request
- `makePayment(paymentRequest: PaymentRequest)` - Process payment manually
- `close()` - Clean up resources

## Documentation

For complete API documentation and guides, visit [openlibx402.github.io](https://openlibx402.github.io/docs/packages/typescript/openlibx402-client/)

## Testing

```bash
pnpm test
```

## Contributing

See [CONTRIBUTING.md](https://github.com/openlibx402/openlibx402/blob/main/CONTRIBUTING.md)

## License

MIT - See [LICENSE](https://github.com/openlibx402/openlibx402/blob/main/LICENSE)
