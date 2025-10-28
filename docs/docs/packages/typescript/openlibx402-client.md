# @openlibx402/client

TypeScript HTTP client for X402 payment protocol.

## Installation

```bash
npm install @openlibx402/client
```

## Features

- HTTP client with X402 payment support
- Automatic payment handling
- Solana blockchain integration
- TypeScript support

## Usage

```typescript
import { X402Client } from '@openlibx402/client';
import { Keypair } from '@solana/web3.js';

// Create client
const client = new X402Client({
  wallet: keypair,
  maxPaymentAmount: 5.0
});

// Make request with automatic payment
const response = await client.fetch('https://api.example.com/data');
const data = await response.json();
```

## License

MIT