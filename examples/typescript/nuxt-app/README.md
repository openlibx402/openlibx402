# Nuxt.js App Example with X402 Payment Support

```bash
git clone https://github.com/openlibx402/openlibx402.git
cd openlibx402
```

This example demonstrates how to create a Nuxt.js application with X402 payment requirements for API endpoints, including both server-side API routes with **on-chain payment verification** and client-side payment handling.

## Features

- **Nuxt.js 4** - Modern Nuxt with Vue 3 Composition API
- **Server API Routes** - Protected endpoints with payment requirements
- **On-Chain Payment Verification** - Uses `@openlibx402/core` with `SolanaPaymentProcessor` to verify transactions on Solana devnet
- **Client-side Payment Handling** - Vue components with automatic payment flow
- **Free and Premium Endpoints** - Mix of public and paid content
- **TypeScript** - Full type safety
- **Tailwind CSS** - Modern styling
- **X402 Protocol** - Blockchain-based micropayments
- **Solana Wallet Integration** - Support for Phantom, Solflare, and more

## Setup

### 1. Install Dependencies

From the monorepo root:

```bash
pnpm install
```

Or from npm:

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file in the nuxt-app directory:

```bash
cp .env.example .env
```

Edit `.env` with your Solana wallet details:

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
npm run preview
```

The app will start on `http://localhost:3000`.

## Project Structure

```
nuxt-app/
├── components/              # Vue components
│   ├── WalletButton.vue    # Wallet connection button
│   ├── EndpointCard.vue    # Free endpoint demo card
│   └── X402EndpointCard.vue # Paid endpoint demo card
├── composables/            # Vue composables
│   ├── useWallet.ts       # Wallet management
│   └── useX402Client.ts   # X402 client management
├── pages/                 # Nuxt pages
│   └── index.vue         # Home page
├── server/               # Server-side code
│   ├── api/             # API routes
│   │   ├── index.get.ts           # Root endpoint
│   │   ├── free-data.get.ts       # Free endpoint
│   │   ├── premium-data.get.ts    # Premium endpoint (0.10 USDC)
│   │   ├── expensive-data.get.ts  # Expensive endpoint (1.00 USDC)
│   │   ├── tiered-data/
│   │   │   └── [tier].get.ts      # Tiered endpoint (0.05 USDC)
│   │   └── process-data.post.ts   # POST endpoint (0.25 USDC)
│   └── utils/
│       └── x402-config.ts         # X402 configuration with on-chain verification
├── utils/                 # Client-side utilities
│   └── mock-payment.ts   # Mock payment generation (for demo)
├── assets/
│   └── css/
│       └── main.css      # Global styles
├── nuxt.config.ts        # Nuxt configuration
├── tailwind.config.ts    # Tailwind configuration
├── package.json
├── tsconfig.json
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

1. **Initialize X402 Configuration** (`server/utils/x402-config.ts`):

```typescript
import { SolanaPaymentProcessor, PaymentAuthorization } from '@openlibx402/core'

// Configuration is initialized on first use
const config = initX402Config()
// In production, creates SolanaPaymentProcessor for on-chain verification
```

2. **Protect API Routes** with `withPayment`:

```typescript
export default defineEventHandler(async (event) => {
  return await withPayment(
    event,
    {
      amount: '0.10',
      description: 'Access to premium data',
    },
    async (event, context) => {
      // This handler only runs after payment is verified
      return {
        data: 'Premium content',
        payment_id: context.payment?.paymentId,
      }
    }
  )
})
```

3. **On-Chain Verification** (in production mode):

```typescript
// From x402-config.ts
if (config.autoVerify && authorization.transactionHash && paymentProcessor) {
  const verified = await paymentProcessor.verifyTransaction(
    authorization.transactionHash,
    config.paymentAddress,
    authorization.actualAmount,
    config.tokenMint
  )
  // Connects to Solana devnet RPC and verifies the transaction on-chain
}
```

### Client-Side (Vue Components)

1. **Setup Wallet Composable** (`composables/useWallet.ts`):

```typescript
const { connected, walletAddress, connect, disconnect } = useWallet()
```

2. **Setup X402 Client Composable** (`composables/useX402Client.ts`):

```typescript
const { client, isReady } = useX402Client()
```

3. **Make Requests** with payment handling:

```typescript
const fetchPremiumData = async (authHeader?: string) => {
  const headers = authHeader ? { 'x-payment-authorization': authHeader } : {}
  const response = await fetch('/api/premium-data', { headers })
  
  if (response.status === 402) {
    const paymentRequest = await response.json()
    throw new Error('Payment Required: ' + JSON.stringify(paymentRequest))
  }
  
  return await response.json()
}
```

## Key Components

### useWallet Composable

Manages Solana wallet connection:

- Initializes wallet adapters (Phantom, Solflare)
- Handles wallet connection/disconnection
- Provides wallet address and connection status

### useX402Client Composable

Manages X402 client instance:

- Creates X402AutoClient when wallet is connected
- Automatically handles client lifecycle
- Provides client for making payments

### WalletButton

Component for connecting/disconnecting wallet:

- Shows "Connect Wallet" button when disconnected
- Displays wallet address when connected
- Handles connect/disconnect actions

### EndpointCard

Component for free endpoints:

- Displays endpoint information
- Makes API calls
- Shows responses and errors

### X402EndpointCard

Component for paid endpoints:

- Displays endpoint information and price
- Handles payment flow (402 -> payment -> retry)
- Shows payment requests
- Simulates payments for demo

## Payment Flow

1. **User clicks** "Try Endpoint" button
2. **Client makes request** to API endpoint
3. **Server responds** with 402 Payment Required (if no payment)
4. **Client shows** payment request details
5. **User clicks** "Simulate Payment & Retry" (demo) or signs real transaction (production)
6. **Client creates** payment authorization header
7. **Client retries** request with payment header
8. **Server validates** payment using `@openlibx402/core`:
   - Parses authorization with `PaymentAuthorization.fromHeader()`
   - Verifies amount, addresses, and token mint
   - **In production**: Connects to Solana devnet RPC via `SolanaPaymentProcessor`
   - **In production**: Verifies transaction exists on-chain with correct parameters
9. **Server returns** protected content

## On-Chain Verification

### Development Mode (NODE_ENV !== 'production')

- `autoVerify` is **disabled** by default
- Payments are validated for format and parameters only
- No connection to Solana blockchain
- Useful for testing without real transactions

### Production Mode (NODE_ENV === 'production')

- `autoVerify` is **enabled** by default
- Creates `SolanaPaymentProcessor` connected to Solana devnet
- Every payment authorization is verified on-chain:
  - Fetches transaction from blockchain using RPC
  - Verifies transaction is confirmed
  - Validates recipient address matches
  - Validates amount matches or exceeds requirement
  - Validates token mint matches (USDC)
- Rejects invalid or fake payments

### Configuration

In `nuxt.config.ts`:

```typescript
runtimeConfig: {
  paymentWalletAddress: process.env.PAYMENT_WALLET_ADDRESS,
  usdcMintAddress: process.env.USDC_MINT_ADDRESS,
  solanaRpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
}
```

In `server/utils/x402-config.ts`:

```typescript
autoVerify: process.env.NODE_ENV === 'production',
// When true, uses SolanaPaymentProcessor for on-chain verification
```

## Notes

- **Development mode**: Uses mock payments (no blockchain verification)
- **Production mode**: Full on-chain verification using Solana devnet RPC
- Uses `@openlibx402/core` library (same as Next.js example)
- Server-side configuration uses Nuxt runtime config
- Demo UI shows payment simulation for testing without real funds

## Browser Wallet Integration

The example includes basic wallet adapter integration. For production:

1. **Install wallet extensions** (Phantom, Solflare)
2. **Connect wallet** via WalletButton
3. **Sign real USDC transactions** with connected wallet
4. **Server verifies** payments on Solana devnet blockchain

## Development Tips

1. **Testing in dev mode**: The demo uses simulated payments (no on-chain verification)
2. **Testing in prod mode**: Set `NODE_ENV=production` to enable on-chain verification
3. **Hot reload**: Changes are automatically reflected
4. **TypeScript**: Full type checking for both client and server
5. **Tailwind CSS**: Utility-first styling

## Differences from Next.js Example

### Framework Differences
- Uses Nuxt.js file-based routing instead of Next.js App Router
- Server routes use Nuxt's `defineEventHandler` instead of Next.js route handlers
- Uses Vue composables instead of React hooks and context
- Vue components with `<template>` instead of JSX
- Uses `nuxt.config.ts` for configuration instead of `next.config.js`

### X402 Implementation
- **Same core library**: Both use `@openlibx402/core` with `SolanaPaymentProcessor`
- **Same on-chain verification**: Both verify payments on Solana devnet in production
- **Different wrapper**: Next.js uses `@openlibx402/nextjs` package, Nuxt implements `withPayment` helper directly
- **Same behavior**: Both implementations verify transactions on-chain when `autoVerify` is enabled

## Learn More

- [OpenLibx402 Documentation](https://openlibx402.github.io/docs)
- [X402 Protocol Specification](https://www.x402.org/x402-whitepaper.pdf)
- [Nuxt.js Documentation](https://nuxt.com/docs)
- [Solana Web3.js](https://solana.com/docs/clients/javascript)
- [Vue 3 Composition API](https://vuejs.org/guide/introduction.html)

## Troubleshooting

### Build Errors

If you encounter module resolution errors:

```bash
# Clear Nuxt cache
rm -rf .nuxt

# Reinstall dependencies
npm install

# Rebuild
npm run build
```

### Payment Verification Issues

- Ensure RPC URL is correct in `.env`
- Check wallet address is valid Solana address
- Verify token mint address matches network (devnet/mainnet)
- In production, ensure transaction is confirmed on-chain before retrying
- Check server logs for detailed verification errors

### Wallet Connection Issues

- Ensure wallet extension is installed
- Check network is set to Devnet
- Try refreshing the page and reconnecting

### On-Chain Verification Debugging

Set `NODE_ENV=production` and check server console for verification logs:

```bash
NODE_ENV=production npm run dev
```

Verification errors will show:
- Transaction hash being verified
- Expected vs actual parameters
- RPC connection issues
