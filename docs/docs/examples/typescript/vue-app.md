# Vue.js App Example with X402 Payment Support

This example demonstrates how to create a Vue.js 3 application with X402 payment requirements for API endpoints, including a separate Express API server with payment protection and client-side payment handling.

## Features

- **Vue 3 with Composition API** - Modern Vue using `<script setup>` syntax
- **Express API Server** - Separate backend with `@openlibx402/express` middleware
- **On-Chain Payment Verification** - Uses `SolanaPaymentProcessor` to verify transactions on Solana devnet
- **Client-side Payment Handling** - Vue components with automatic payment flow
- **Free and Premium Endpoints** - Mix of public and paid content
- **TypeScript** - Full type safety
- **Vite** - Lightning-fast dev server and HMR
- **Tailwind CSS** - Modern styling
- **X402 Protocol** - Blockchain-based micropayments
- **Solana Wallet Integration** - Support for Phantom, Solflare, and more

## Architecture

This example uses a **client-server architecture**:
- **Frontend (Port 5173)**: Vue.js app built with Vite
- **Backend (Port 3001)**: Express.js API server with X402 middleware
- **Proxy**: Vite proxies `/api/*` requests to the Express server

## Getting Started

### Installation

```bash
cd examples/typescript/vue-app
pnpm install
```

### Configuration

Create a `.env` file:

```env
# Server configuration
PAYMENT_WALLET_ADDRESS=your_solana_wallet_address_here
USDC_MINT_ADDRESS=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
SOLANA_RPC_URL=https://api.devnet.solana.com

# Client configuration (Vite variables)
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_API_URL=http://localhost:3001
```

### Running the App

```bash
# Start both frontend and backend
pnpm dev

# Frontend: http://localhost:5173
# Backend: http://localhost:3001
```

For separate development:

```bash
# Terminal 1: Frontend only
pnpm dev:vite

# Terminal 2: Backend only
pnpm dev:server
```

## API Endpoints

### Free Endpoints

- **GET /api** - API information (no payment)
- **GET /api/free-data** - Free data access (no payment)

### Paid Endpoints

- **GET /api/premium-data** - Premium data (0.10 USDC)
- **GET /api/expensive-data** - AI inference (1.00 USDC)
- **GET /api/tiered-data/:tier** - Tiered content (0.05 USDC)
- **POST /api/process-data** - Data processing (0.25 USDC)

## Key Features

### Backend (Express Server)

API routes are protected using the `paymentRequired` middleware which:
- Validates payment authorization headers
- Verifies amounts and addresses
- Performs on-chain verification in production mode
- Returns 402 Payment Required if payment is invalid or missing

### Frontend (Vue.js)

Vue composables and components handle:
- **useWallet**: Solana wallet connection and management
- **useX402Client**: X402 payment client lifecycle
- **EndpointCard**: Component for free endpoints
- **X402EndpointCard**: Component for paid endpoints with payment flow
- Automatic 402 response handling with payment retry logic

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
vue-app/
├── server/                # Express API server
│   └── index.ts          # Express app with X402 routes
├── src/                  # Vue.js frontend
│   ├── components/       # Vue components
│   ├── composables/      # Vue composables
│   ├── utils/            # Utility functions
│   ├── assets/           # Stylesheets
│   ├── App.vue           # Main app component
│   └── main.ts           # Entry point
├── vite.config.ts        # Vite configuration
├── tailwind.config.ts    # Tailwind config
└── package.json
```

## Learn More

- [OpenLibx402 Documentation](https://openlibx402.github.io/docs)
- [X402 Protocol Specification](https://www.x402.org/x402-whitepaper.pdf)
- [Vue.js Documentation](https://vuejs.org/guide/introduction.html)
- [Vite Documentation](https://vite.dev/)
- [Express.js Documentation](https://expressjs.com/)
