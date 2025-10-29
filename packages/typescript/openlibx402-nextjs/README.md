# @openlibx402/nextjs

Next.js middleware and utilities for the X402 payment protocol. This package provides seamless integration of blockchain-based micropayments into your Next.js applications.

## Features

- **App Router Support** - Built for Next.js 13+ App Router
- **Payment Verification** - Automatic on-chain payment verification
- **TypeScript** - Full type safety
- **Flexible Configuration** - Global or per-route configuration
- **Easy Integration** - Simple higher-order function API

## Installation

```bash
npm install @openlibx402/nextjs @openlibx402/core @solana/web3.js
```

## Quick Start

### 1. Initialize X402 Configuration

Create a configuration file for your API routes:

```typescript
// app/api/config.ts
import { X402Config, initX402 } from "@openlibx402/nextjs";

const config = new X402Config({
  paymentAddress: process.env.PAYMENT_WALLET_ADDRESS!,
  tokenMint: process.env.USDC_MINT_ADDRESS!,
  network: "solana-devnet",
  rpcUrl: process.env.SOLANA_RPC_URL,
});

initX402(config);

export { config };
```

### 2. Protect API Routes

Use the `withPayment` higher-order function to add payment requirements:

```typescript
// app/api/premium-data/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withPayment } from "@openlibx402/nextjs";
import "../config"; // Initialize config

export const GET = withPayment(
  {
    amount: "0.10",
    description: "Access to premium data",
  },
  async (req: NextRequest, context) => {
    return NextResponse.json({
      data: "Premium content",
      payment_id: context.payment?.paymentId,
    });
  }
);
```

### 3. Make Client Requests

Use the X402 client to make requests from your frontend:

```typescript
import { X402AutoClient } from "@openlibx402/client";
import { Keypair } from "@solana/web3.js";

const keypair = Keypair.generate(); // Or use browser wallet
const client = new X402AutoClient(keypair, "https://api.devnet.solana.com");

// Payment is handled automatically
const response = await client.get("/api/premium-data");
console.log(response.data);
```

## API Reference

### Configuration

#### `X402Config`

Configuration class for X402 settings.

```typescript
interface X402ConfigOptions {
  paymentAddress: string; // Solana wallet address to receive payments
  tokenMint: string; // SPL token mint address (e.g., USDC)
  network?: string; // "solana-mainnet", "solana-devnet", or "solana-testnet"
  rpcUrl?: string; // Custom RPC URL (optional)
  defaultAmount?: string; // Default payment amount
  paymentTimeout?: number; // Payment timeout in seconds (default: 300)
  autoVerify?: boolean; // Auto-verify payments on-chain (default: true)
}

const config = new X402Config(options);
```

#### `initX402(config)`

Initialize global X402 configuration.

```typescript
import { initX402 } from "@openlibx402/nextjs";

initX402(config);
```

### Middleware

#### `withPayment(options, handler)`

Higher-order function that wraps API route handlers with payment verification.

```typescript
interface PaymentRequiredOptions {
  amount: string; // Payment amount required
  paymentAddress?: string; // Override global payment address
  tokenMint?: string; // Override global token mint
  network?: string; // Override global network
  description?: string; // Payment description
  expiresIn?: number; // Payment expiration in seconds
  autoVerify?: boolean; // Override auto-verify setting
}

type X402Handler = (
  req: NextRequest,
  context: X402HandlerContext
) => Promise<NextResponse> | NextResponse;

const handler = withPayment(options, async (req, context) => {
  // Access payment info via context.payment
  return NextResponse.json({ data: "..." });
});
```

#### `X402HandlerContext`

Context object passed to route handlers.

```typescript
interface X402HandlerContext {
  payment?: PaymentAuthorization; // Payment authorization info (if paid)
}
```

### Response Builders

#### `build402Response(options)`

Build a 402 Payment Required response.

```typescript
interface Build402ResponseOptions {
  amount: string;
  paymentAddress: string;
  tokenMint: string;
  network: string;
  resource: string;
  description?: string;
  expiresIn?: number;
}

const response = build402Response(options);
```

## Examples

### Basic Protected Route

```typescript
// app/api/data/route.ts
import { withPayment } from "@openlibx402/nextjs";
import { NextRequest, NextResponse } from "next/server";

export const GET = withPayment(
  { amount: "0.10" },
  async (req: NextRequest) => {
    return NextResponse.json({ data: "Protected content" });
  }
);
```

### Accessing Payment Details

```typescript
export const GET = withPayment(
  { amount: "1.00", description: "Premium API access" },
  async (req: NextRequest, context) => {
    const payment = context.payment;

    return NextResponse.json({
      data: "Premium content",
      payment_id: payment?.paymentId,
      transaction_hash: payment?.transactionHash,
      amount_paid: payment?.actualAmount,
    });
  }
);
```

### Dynamic Route with Payment

```typescript
// app/api/content/[id]/route.ts
export const GET = withPayment(
  { amount: "0.05" },
  async (req: NextRequest, context) => {
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();

    return NextResponse.json({
      id,
      data: `Content for ${id}`,
    });
  }
);
```

### POST Request with Payment

```typescript
// app/api/process/route.ts
export const POST = withPayment(
  { amount: "0.25", description: "Data processing" },
  async (req: NextRequest) => {
    const body = await req.json();

    return NextResponse.json({
      status: "processed",
      result: processData(body),
    });
  }
);
```

### Custom Payment Configuration

```typescript
export const GET = withPayment(
  {
    amount: "0.50",
    paymentAddress: "CUSTOM_WALLET_ADDRESS",
    tokenMint: "CUSTOM_TOKEN_MINT",
    network: "solana-mainnet",
    expiresIn: 600, // 10 minutes
    autoVerify: true,
  },
  async (req: NextRequest) => {
    return NextResponse.json({ data: "Custom config content" });
  }
);
```

## Payment Flow

1. **Client makes request** to protected API endpoint
2. **Server checks** for payment authorization header
3. **If no payment**: Server returns 402 with payment request
4. **Client creates payment** and retries with authorization
5. **Server verifies** payment on-chain (if autoVerify enabled)
6. **Server returns** protected content

## Environment Variables

```env
PAYMENT_WALLET_ADDRESS=your_solana_wallet_address
USDC_MINT_ADDRESS=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
SOLANA_RPC_URL=https://api.devnet.solana.com
```

## TypeScript

Full TypeScript support with type definitions included.

```typescript
import type {
  X402Config,
  X402ConfigOptions,
  PaymentRequiredOptions,
  X402Handler,
  X402HandlerContext,
  PaymentRequest,
  PaymentAuthorization,
} from "@openlibx402/nextjs";
```

## Error Handling

The middleware automatically handles common errors:

- **400 Bad Request** - Invalid payment authorization format
- **402 Payment Required** - No payment provided
- **403 Forbidden** - Payment verification failed
- **500 Internal Server Error** - Server-side errors

## Best Practices

1. **Initialize once**: Call `initX402()` in a shared config file
2. **Environment variables**: Store sensitive config in environment variables
3. **Error handling**: Wrap client calls in try-catch blocks
4. **Amount precision**: Use string amounts to avoid floating-point issues
5. **Network matching**: Ensure client and server use the same network
6. **RPC limits**: Use paid RPC providers for production (Alchemy, QuickNode)

## Testing

For testing without actual payments, set `autoVerify: false`:

```typescript
const config = new X402Config({
  paymentAddress: "TEST_ADDRESS",
  tokenMint: "TEST_MINT",
  autoVerify: false, // Skip on-chain verification
});
```

## Examples

See the [Next.js example](../../examples/typescript/nextjs-app) for a complete working application.

## Related Packages

- [@openlibx402/core](../openlibx402-core) - Core X402 protocol implementation
- [@openlibx402/client](../openlibx402-client) - Client library for making payments
- [@openlibx402/express](../openlibx402-express) - Express.js middleware

## License

MIT

## Links

- [Documentation](https://openlib.xyz/docs)
- [GitHub](https://github.com/openlibx402/openlibx402)
- [X402 Protocol Spec](https://github.com/openlibx402/spec)
