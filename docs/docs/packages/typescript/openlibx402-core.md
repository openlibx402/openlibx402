# @openlibx402/core

Core TypeScript library for X402 payment protocol.

## Installation

```bash
npm install @openlibx402/core
```

## Features

- Payment request and authorization structures
- Solana blockchain integration
- HTTP 402 protocol support
- TypeScript types and interfaces

## Usage

```typescript
import { PaymentRequest, SolanaPaymentProcessor } from '@openlibx402/core';
import { Keypair } from '@solana/web3.js';

const processor = new SolanaPaymentProcessor('https://api.devnet.solana.com');

const request: PaymentRequest = {
  paymentAddress: 'wallet_address',
  amount: '0.10',
  assetAddress: 'token_mint'
};

const transaction = await processor.createPaymentTransaction(request, keypair);
const txHash = await processor.signAndSendTransaction(transaction, keypair);
```

## License

MIT