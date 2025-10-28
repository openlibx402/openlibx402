# @openlibx402/core

Core TypeScript implementation of the X402 payment protocol for autonomous AI agent payments on Solana.

## Overview

The core package provides fundamental primitives and utilities for implementing the X402 payment protocol. It includes payment request/authorization models, Solana payment processing, error handling, and serialization utilities.

## Features

- **Payment Models**: PaymentRequest and PaymentAuthorization classes with full serialization support
- **Solana Integration**: SolanaPaymentProcessor for handling on-chain payment verification
- **Error Handling**: Comprehensive error types for payment lifecycle management
- **Type Safety**: Full TypeScript support with exported types and interfaces

## Installation

```bash
npm install @openlibx402/core
# or
pnpm add @openlibx402/core
# or
yarn add @openlibx402/core
```

## Usage

### Payment Request

```typescript
import { PaymentRequest } from '@openlibx402/core';

// Create a payment request
const paymentRequest = new PaymentRequest({
  max_amount_required: '1000000',
  asset_type: 'spl-token',
  asset_address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  payment_address: 'YourWalletAddress',
  network: 'solana-devnet',
  expires_at: new Date(Date.now() + 3600000),
  nonce: 'unique-nonce',
  payment_id: 'payment-123',
  resource: '/api/data',
  description: 'Access to premium API endpoint'
});

// Check if expired
if (paymentRequest.isExpired()) {
  console.log('Payment request has expired');
}

// Serialize to JSON
const json = paymentRequest.toJSON();
```

### Payment Authorization

```typescript
import { PaymentAuthorization } from '@openlibx402/core';

// Create payment authorization
const authorization = new PaymentAuthorization({
  payment_id: 'payment-123',
  actual_amount: '1000000',
  payment_address: 'WalletAddress',
  asset_address: 'TokenMintAddress',
  network: 'solana-devnet',
  timestamp: new Date(),
  signature: 'base58-signature',
  public_key: 'base58-public-key',
  transaction_hash: 'transaction-signature'
});

// Convert to HTTP header value
const headerValue = authorization.toHeaderValue();
```

### Solana Payment Processing

```typescript
import { SolanaPaymentProcessor } from '@openlibx402/core';
import { Connection } from '@solana/web3.js';

const connection = new Connection('https://api.devnet.solana.com');
const processor = new SolanaPaymentProcessor(connection);

// Verify a payment
const isValid = await processor.verifyPayment(
  paymentRequest,
  paymentAuthorization
);
```

### Error Handling

```typescript
import {
  PaymentRequiredError,
  PaymentExpiredError,
  InsufficientFundsError,
  PaymentVerificationError,
  ERROR_CODES
} from '@openlibx402/core';

try {
  // Payment operations
} catch (error) {
  if (error instanceof PaymentExpiredError) {
    console.error('Payment has expired');
  } else if (error instanceof InsufficientFundsError) {
    console.error('Insufficient funds');
  }
}
```

## API Reference

### Exports

- `PaymentRequest` - Payment request model class
- `PaymentAuthorization` - Payment authorization model class
- `SolanaPaymentProcessor` - Solana blockchain payment processor
- Error classes: `X402Error`, `PaymentRequiredError`, `PaymentExpiredError`, `InsufficientFundsError`, `PaymentVerificationError`, `TransactionBroadcastError`, `InvalidPaymentRequestError`
- `ERROR_CODES` - Error code constants

## Documentation

For complete API documentation and guides, visit [openlibx402.github.io](https://openlibx402.github.io/docs/packages/typescript/openlibx402-core/)

## Testing

```bash
pnpm test
```

## Contributing

See [CONTRIBUTING.md](https://github.com/openlibx402/openlibx402/blob/main/CONTRIBUTING.md)

## License

MIT - See [LICENSE](https://github.com/openlibx402/openlibx402/blob/main/LICENSE)
