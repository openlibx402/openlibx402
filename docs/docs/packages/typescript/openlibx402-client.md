# @openlibx402/client

TypeScript HTTP client for X402 payment protocol.

## Installation

```bash
npm install @openlibx402/client
```

## Features

- **Explicit Client**: Manual control over payment flow
- **Implicit Client**: Automatic payment handling with configurable retries
- Support for all HTTP methods (GET, POST, PUT, DELETE)
- Safety limits with `maxPaymentAmount`
- URL validation and SSRF protection
- Local development support with `allowLocal`
- Proper connection cleanup and security

## Usage

### Explicit Client (Manual Control)

```typescript
import { X402Client } from '@openlibx402/client';
import { Keypair } from '@solana/web3.js';

// Load wallet
const keypair = new Keypair();

// Create client
const client = new X402Client(keypair);

// Make request
let response = await client.get("https://api.example.com/data");

// Check if payment required
if (client.paymentRequired(response)) {
  const paymentRequest = client.parsePaymentRequest(response);

  // Create payment
  const authorization = await client.createPayment(paymentRequest);

  // Retry with payment
  response = await client.get("https://api.example.com/data", { payment: authorization });
}

const data = response.data;

// Always cleanup
await client.close();
```

#### Local Development

For local development with localhost URLs:

```typescript
// Enable allowLocal for localhost/private IPs
const client = new X402Client(keypair, undefined, undefined, true);

let response = await client.get("http://localhost:3000/api/data");

if (client.paymentRequired(response)) {
  const paymentRequest = client.parsePaymentRequest(response);
  const authorization = await client.createPayment(paymentRequest);
  response = await client.get("http://localhost:3000/api/data", { payment: authorization });
}

await client.close();
```

### Implicit Client (Auto-Payment)

```typescript
import { X402AutoClient } from '@openlibx402/client';
import { Keypair } from '@solana/web3.js';

// Create auto-client with safety limits
const client = new X402AutoClient(keypair, undefined, {
  maxPaymentAmount: "5.0",  // Safety limit
  maxRetries: 1
});

// Automatically handles 402 and pays
const response = await client.fetch("https://api.example.com/data");
const data = response.data;

// Cleanup
await client.close();
```

#### Disable Auto-Retry

```typescript
// Disable auto-retry for specific request
try {
  const response = await client.fetch("https://api.example.com/data", {
    autoRetry: false
  });
} catch (error) {
  if (error instanceof PaymentRequiredError) {
    console.log(`Payment required: ${error.paymentRequest.maxAmountRequired}`);
  }
}
```

## Security Notes

- Always call `close()` when done to properly cleanup connections and sensitive data
- Private keys are held in memory - ensure proper disposal
- Only use URLs from trusted sources to prevent SSRF attacks
- Default RPC URL is devnet - use mainnet URL for production
- Set `allowLocal=true` for local development (localhost URLs)
- **NEVER** use `allowLocal=true` in production deployments

## API Reference

### X402Client

- `get(url, options?)` - GET request
- `post(url, data?, options?)` - POST request
- `put(url, data?, options?)` - PUT request
- `delete(url, options?)` - DELETE request
- `request(method, url, options?)` - Generic HTTP request
- `paymentRequired(response)` - Check if response requires payment
- `parsePaymentRequest(response)` - Parse payment request from 402 response
- `createPayment(request, amount?)` - Create and broadcast payment
- `close()` - Cleanup connections and sensitive data

### X402AutoClient

- `fetch(url, options?)` - Request with auto-payment
- `get(url, options?)` - GET with auto-payment
- `post(url, data?, options?)` - POST with auto-payment
- `put(url, data?, options?)` - PUT with auto-payment
- `delete(url, options?)` - DELETE with auto-payment
- `close()` - Cleanup connections

## License

MIT
