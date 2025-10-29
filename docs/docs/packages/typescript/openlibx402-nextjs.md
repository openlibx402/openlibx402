# @openlibx402/nextjs

Next.js middleware and utilities for the X402 payment protocol. This package provides seamless integration of blockchain-based micropayments into your Next.js applications.

## Installation

```bash
npm install @openlibx402/nextjs @openlibx402/core @solana/web3.js
```

## Features

- **App Router Support** - Built for Next.js 13+ App Router
- **Payment Verification** - Automatic on-chain payment verification
- **TypeScript** - Full type safety
- **Flexible Configuration** - Global or per-route configuration
- **Easy Integration** - Simple higher-order function API

## Usage

```typescript
import { X402Config, initX402, withPayment } from '@openlibx402/nextjs';

// Initialize configuration
const config = new X402Config({
  paymentAddress: process.env.PAYMENT_WALLET_ADDRESS!,
  tokenMint: process.env.USDC_MINT_ADDRESS!,
  network: 'solana-devnet',
});

initX402(config);

// Protect API routes
export const GET = withPayment(
  {
    amount: '0.10',
    description: 'Access to premium data',
  },
  async (req, context) => {
    return NextResponse.json({
      data: 'Premium content',
      payment_id: context.payment?.paymentId,
    });
  }
);
```

## License

MIT
