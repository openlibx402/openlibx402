# @openlibx402/express

Express.js middleware and decorators for X402 payment protocol.

## Installation

```bash
npm install @openlibx402/express
```

## Features

- Express middleware for payment requirements
- Automatic payment verification
- 402 response handling
- TypeScript support

## Usage

```typescript
import express from 'express';
import { paymentRequired } from '@openlibx402/express';

const app = express();

app.get('/premium-data', paymentRequired({
  amount: '0.10',
  paymentAddress: 'YOUR_WALLET_ADDRESS',
  tokenMint: 'USDC_MINT_ADDRESS',
  description: 'Access to premium data'
}), (req, res) => {
  res.json({ data: 'Premium content' });
});
```

## License

MIT