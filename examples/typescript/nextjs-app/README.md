# Next.js App Example with X402 Payment Support

This example demonstrates how to create a Next.js application with X402 payment requirements for API endpoints, including both server-side API routes and client-side payment handling.

## Features

- **Next.js App Router** - Modern Next.js 14 with App Router
- **Server-side API Routes** - Protected endpoints with payment requirements
- **Client-side Payment Handling** - React components with automatic payment flow
- **Free and Premium Endpoints** - Mix of public and paid content
- **TypeScript** - Full type safety
- **Tailwind CSS** - Modern styling
- **X402 Protocol** - Blockchain-based micropayments

## Setup

### 1. Install Dependencies

From the monorepo root:

```bash
pnpm install
```

Or from this directory:

```bash
npm install
```

### 2. Configure Environment

Create a `.env.local` file based on `.env.example`:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Solana wallet details:

```env
PAYMENT_WALLET_ADDRESS=your_solana_wallet_address_here
USDC_MINT_ADDRESS=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
SOLANA_RPC_URL=https://api.devnet.solana.com
```

### 3. Build and Run

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The app will start on `http://localhost:3000`.

## Project Structure

```
nextjs-app/
├── app/
│   ├── api/                    # API Routes
│   │   ├── config.ts          # X402 configuration
│   │   ├── route.ts           # Root endpoint
│   │   ├── free-data/         # Free endpoint
│   │   ├── premium-data/      # Premium endpoint (0.10 USDC)
│   │   ├── expensive-data/    # Expensive endpoint (1.00 USDC)
│   │   ├── tiered-data/       # Tiered endpoint (0.05 USDC)
│   │   └── process-data/      # POST endpoint (0.25 USDC)
│   ├── components/            # React components
│   │   ├── EndpointCard.tsx   # Endpoint demo card
│   │   └── X402ClientProvider.tsx  # Client context provider
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Home page
│   └── globals.css            # Global styles
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
└── README.md
```

## API Endpoints

### Free Endpoints

- **GET /api** - API information (no payment)
- **GET /api/free-data** - Free data access (no payment)

### Paid Endpoints

- **GET /api/premium-data** - Premium data (0.10 USDC)
- **GET /api/expensive-data** - AI inference (1.00 USDC)
- **GET /api/tiered-data/[tier]** - Tiered content (0.05 USDC)
- **POST /api/process-data** - Data processing (0.25 USDC)

## How It Works

### Server-Side (API Routes)

1. **Initialize X402 Configuration** (`app/api/config.ts`):

```typescript
import { X402Config, initX402 } from "@openlibx402/nextjs";

const config = new X402Config({
  paymentAddress: process.env.PAYMENT_WALLET_ADDRESS!,
  tokenMint: process.env.USDC_MINT_ADDRESS!,
  network: "solana-devnet",
});

initX402(config);
```

2. **Protect API Routes** with `withPayment`:

```typescript
import { withPayment } from "@openlibx402/nextjs";

export const GET = withPayment(
  {
    amount: "0.10",
    description: "Access to premium data",
  },
  async (req, context) => {
    return NextResponse.json({
      data: "Premium content",
      payment_id: context.payment?.paymentId,
    });
  }
);
```

### Client-Side (React Components)

1. **Setup X402 Client Provider** (`app/components/X402ClientProvider.tsx`):

```typescript
import { X402AutoClient } from "@openlibx402/client";
import { Keypair } from "@solana/web3.js";

const keypair = Keypair.generate(); // Or use browser wallet
const client = new X402AutoClient(keypair, rpcUrl);
```

2. **Make Requests** (automatic payment handling):

```typescript
const response = await client.get("/api/premium-data");
// Payment is handled automatically if required
```

## Key Components

### X402ClientProvider

Context provider that manages the X402 client instance and wallet:

- Creates and manages X402AutoClient
- Provides wallet address
- Handles client lifecycle

### EndpointCard

Reusable component for demonstrating API endpoints:

- Displays endpoint information
- Handles API calls
- Shows responses and errors
- Visual feedback for loading states

## Usage Example

The main page demonstrates all endpoints with interactive cards:

```typescript
<EndpointCard
  title="Premium Data"
  description="Access premium market data"
  endpoint="/api/premium-data"
  price="0.10"
  onFetch={async () => {
    const response = await client.get("/api/premium-data");
    return response.data;
  }}
/>
```

## Payment Flow

1. **User clicks** "Try Endpoint" button
2. **Client makes request** to API endpoint
3. **Server responds** with 402 Payment Required (if no payment)
4. **Client detects 402** and creates payment
5. **Client retries** request with payment authorization
6. **Server verifies** payment on-chain
7. **Server returns** protected content

## Notes

- This example uses Solana Devnet for testing
- Demo wallet has no funds (requests will show payment required)
- In production, integrate with browser wallets (Phantom, Solflare)
- Payment verification is done on-chain by default
- Server-side configuration is shared across all API routes

## Browser Wallet Integration

To integrate with browser wallets in production:

```typescript
// Instead of generating a keypair
import { useWallet } from "@solana/wallet-adapter-react";

const { publicKey, signTransaction } = useWallet();

// Use wallet adapter with X402Client
const client = new X402Client(/* wallet adapter */, rpcUrl);
```

## Development Tips

1. **Testing without funds**: The demo will show payment required errors, which is expected behavior
2. **Hot reload**: Changes to API routes and components are automatically reflected
3. **TypeScript**: Full type checking for both client and server code
4. **Tailwind CSS**: Utility-first styling for rapid UI development

## Learn More

- [OpenLibx402 Documentation](../../packages/typescript/README.md)
- [X402 Protocol Specification](https://github.com/openlibx402/spec)
- [Next.js Documentation](https://nextjs.org/docs)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)

## Troubleshooting

### Build Errors

If you encounter module resolution errors:

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
npm install

# Rebuild
npm run build
```

### Payment Verification Issues

- Ensure RPC URL is correct in `.env.local`
- Check wallet address is valid Solana address
- Verify token mint address matches network (devnet/mainnet)
