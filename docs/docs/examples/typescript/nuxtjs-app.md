# Nuxt.js App Example with X402 Payment Support

This example demonstrates how to create a Nuxt.js application with X402 payment requirements for API endpoints, including both server-side API routes with on-chain payment verification and client-side payment handling.

## Features

- **Nuxt.js 4** - Modern Nuxt with Vue 3 Composition API
- **Server API Routes** - Protected endpoints with payment requirements
- **On-Chain Payment Verification** - Uses `@openlibx402/core` with `SolanaPaymentProcessor`
- **Client-side Payment Handling** - Vue components with automatic payment flow
- **Free and Premium Endpoints** - Mix of public and paid content
- **TypeScript** - Full type safety
- **Tailwind CSS** - Modern styling
- **X402 Protocol** - Blockchain-based micropayments
- **Solana Wallet Integration** - Support for Phantom, Solflare, and more

## Getting Started

### Installation

```bash
cd examples/typescript/nuxt-app
pnpm install
```

### Configuration

Create a `.env` file:

```env
PAYMENT_WALLET_ADDRESS=your_solana_wallet_address_here
USDC_MINT_ADDRESS=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
SOLANA_RPC_URL=https://api.devnet.solana.com
```

### Running the App

```bash
# Development
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

The app will start on `http://localhost:3000`.

## API Endpoints

### Free Endpoints

- **GET /api** - API information (no payment)
- **GET /api/free-data** - Free data access (no payment)

### Paid Endpoints

- **GET /api/premium-data** - Premium data (0.10 USDC)
- **GET /api/expensive-data** - AI inference (1.00 USDC)
- **GET /api/tiered-data/[tier]** - Tiered content (0.05 USDC)
- **POST /api/process-data** - Data processing (0.25 USDC)

## Key Features

### Server-Side Implementation

API routes are protected using the `withPayment` helper which:
- Validates payment authorization headers
- Verifies amounts and addresses
- Performs on-chain verification in production mode
- Returns 402 Payment Required if payment is invalid or missing

### Client-Side Implementation

Vue composables handle:
- **useWallet**: Solana wallet connection and management
- **useX402Client**: X402 payment client lifecycle
- Automatic payment flow handling with 402 response interception
- Support for demo mode with simulated payments

### Payment Flow

1. User initiates request to protected endpoint
2. Server responds with 402 Payment Required
3. Client displays payment request details
4. User simulates or signs real payment
5. Client retries request with payment authorization
6. Server verifies payment and returns content

## On-Chain Verification

- **Development mode**: Mock payments (no blockchain verification)
- **Production mode**: Full on-chain verification using Solana devnet RPC
- Enabled via `NODE_ENV=production` environment variable

## Project Structure

```
nuxt-app/
├── components/              # Vue components
├── composables/            # Vue composables (useWallet, useX402Client)
├── pages/                  # Nuxt pages
├── server/                 # Server-side code
│   ├── api/               # API routes
│   └── utils/             # X402 configuration
├── utils/                 # Client utilities
├── assets/                # Stylesheets
├── nuxt.config.ts         # Nuxt configuration
├── tailwind.config.ts     # Tailwind config
└── package.json
```

## Learn More

- [OpenLibx402 Documentation](https://openlibx402.github.io/docs)
- [X402 Protocol Specification](https://www.x402.org/x402-whitepaper.pdf)
- [Nuxt.js Documentation](https://nuxt.com/docs)
- [Vue 3 Composition API](https://vuejs.org/guide/introduction.html)
