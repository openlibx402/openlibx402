# Vue.js App Example with X402 Payment Support

```bash
git clone https://github.com/openlibx402/openlibx402.git
cd openlibx402
```

This example demonstrates how to create a Vue.js 3 application with X402 payment requirements for API endpoints, including a separate Express API server with payment protection and client-side payment handling.

## Features

- **Vue 3 with Composition API** - Modern Vue using `<script setup>` syntax
- **Express API Server** - Separate backend with `@openlibx402/express` middleware
- **On-Chain Payment Verification** - Uses `SolanaPaymentProcessor` to verify transactions on Solana devnet
- **Client-side Payment Handling** - Vue components with automatic payment flow
- **Free and Premium Endpoints** - Mix of public and paid content
- **TypeScript** - Full type safety across frontend and backend
- **Vite** - Lightning-fast dev server and HMR
- **Tailwind CSS** - Modern styling
- **X402 Protocol** - Blockchain-based micropayments
- **Solana Wallet Integration** - Support for Phantom, Solflare, and more

## Architecture

This example uses a **client-server architecture**:
- **Frontend (Port 5173)**: Vue.js app built with Vite
- **Backend (Port 3001)**: Express.js API server with X402 middleware
- **Proxy**: Vite proxies `/api/*` requests to the Express server

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

Create a `.env` file in the vue-app directory:

```bash
cp .env.example .env
```

Edit `.env` with your Solana wallet details:

```env
# Server configuration
PAYMENT_WALLET_ADDRESS=your_solana_wallet_address_here
USDC_MINT_ADDRESS=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
SOLANA_RPC_URL=https://api.devnet.solana.com

# Client configuration (Vite variables)
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_API_URL=http://localhost:3001
```

### 3. Run Development Servers

The `dev` script runs both servers concurrently:

```bash
# Start both frontend and backend
npm run dev

# This runs:
# - Vite dev server on http://localhost:5173
# - Express API server on http://localhost:3001
```

Open http://localhost:5173 in your browser.

### 4. Build for Production

```bash
# Build Vue app
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
vue-app/
├── server/                # Express API server
│   └── index.ts          # Express app with X402 routes
├── src/                  # Vue.js frontend
│   ├── components/       # Vue components
│   │   ├── WalletButton.vue     # Wallet connection button
│   │   ├── EndpointCard.vue     # Free endpoint demo
│   │   └── X402EndpointCard.vue # Paid endpoint demo
│   ├── composables/      # Vue composables
│   │   ├── useWallet.ts         # Wallet management
│   │   └── useX402Client.ts     # X402 client management
│   ├── utils/            # Utilities
│   │   └── mock-payment.ts      # Mock payment generation
│   ├── assets/
│   │   └── css/
│   │       └── main.css         # Tailwind CSS
│   ├── App.vue           # Main app component
│   ├── main.ts           # Vue app entry point
│   └── router/           # Vue Router
├── vite.config.ts        # Vite configuration
├── tailwind.config.ts    # Tailwind configuration
├── package.json
└── README.md
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

## How It Works

### Backend (Express Server)

1. **Initialize X402 Configuration** (`server/index.ts`):

```typescript
import { X402Config, initX402, paymentRequired } from '@openlibx402/express'

const config = new X402Config({
  paymentAddress: process.env.PAYMENT_WALLET_ADDRESS,
  tokenMint: process.env.USDC_MINT_ADDRESS,
  network: 'solana-devnet',
  rpcUrl: process.env.SOLANA_RPC_URL,
  autoVerify: process.env.NODE_ENV === 'production',
})

initX402(config)
```

2. **Protect API Routes** with `paymentRequired` middleware:

```typescript
app.get(
  '/api/premium-data',
  paymentRequired({
    amount: '0.10',
    description: 'Access to premium data',
  }),
  (req: X402Request, res: Response) => {
    res.json({
      data: 'Premium content',
      payment_id: req.payment?.paymentId,
    })
  }
)
```

3. **On-Chain Verification** (when `autoVerify: true`):
   - `@openlibx402/express` uses `SolanaPaymentProcessor` from `@openlibx402/core`
   - Connects to Solana devnet RPC
   - Verifies transaction exists on-chain with correct parameters

### Frontend (Vue.js)

1. **Setup Wallet Composable**:

```typescript
import { useWallet } from '@/composables/useWallet'

const { connected, walletAddress, connect, disconnect } = useWallet()
```

2. **Setup X402 Client Composable**:

```typescript
import { useX402Client } from '@/composables/useX402Client'

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

### WalletButton Component

Wallet connection UI:

- Shows "Connect Wallet" button when disconnected
- Displays wallet address when connected
- Handles connect/disconnect actions

### EndpointCard Component

For free endpoints:

- Displays endpoint information
- Makes API calls
- Shows responses and errors

### X402EndpointCard Component

For paid endpoints:

- Displays endpoint information and price
- Handles payment flow (402 -> payment -> retry)
- Shows payment requests
- Simulates payments for demo

## Payment Flow

1. **User clicks** "Try Endpoint" button
2. **Client makes request** to API endpoint (proxied to Express server)
3. **Express server** responds with 402 Payment Required (if no payment)
4. **Client shows** payment request details
5. **User clicks** "Simulate Payment & Retry"
6. **Client creates** mock payment authorization header
7. **Client retries** request with payment header
8. **Express server** validates payment using `@openlibx402/express`:
   - Parses authorization header
   - Verifies amount, addresses, and token mint
   - **In production**: Verifies transaction on Solana devnet blockchain
9. **Server returns** protected content

## On-Chain Verification

### Development Mode (NODE_ENV !== 'production')

- `autoVerify` is **disabled** by default
- Payments are validated for format and parameters only
- No connection to Solana blockchain
- Useful for testing without real transactions

### Production Mode (NODE_ENV === 'production')

- `autoVerify` is **enabled** by default
- Uses `SolanaPaymentProcessor` connected to Solana devnet
- Every payment authorization is verified on-chain:
  - Fetches transaction from blockchain using RPC
  - Verifies transaction is confirmed
  - Validates recipient address matches
  - Validates amount matches or exceeds requirement
  - Validates token mint matches (USDC)
- Rejects invalid or fake payments

## Development Tips

1. **Running servers separately**:
   ```bash
   # Terminal 1: Frontend
   npm run dev:vite
   
   # Terminal 2: Backend
   npm run dev:server
   ```

2. **Testing without funds**: The demo uses simulated payments (no on-chain verification in dev mode)

3. **Testing in production mode**: 
   ```bash
   NODE_ENV=production npm run dev:server
   ```

4. **Hot reload**: Frontend changes reload automatically, backend uses `tsx watch`

5. **TypeScript**: Full type checking with `npm run type-check`

## Notes

- **Development mode**: Uses mock payments (no blockchain verification)
- **Production mode**: Full on-chain verification using Solana devnet RPC
- Uses `@openlibx402/express` for server (same as Express example)
- Uses `@openlibx402/client` for frontend
- Vite proxy handles API routing during development

## Differences from Other Examples

### vs Next.js/Nuxt.js
- **Separate servers**: Vue app (Vite) + Express API, not a full-stack framework
- **No SSR**: Client-side only (can add with Vite SSR if needed)
- **Express middleware**: Uses `@openlibx402/express` instead of framework-specific packages
- **Vite proxy**: API requests proxied during development

### vs Express Example
- **Adds frontend**: Complete UI for testing endpoints
- **Wallet integration**: Browser wallet connection (Phantom, Solflare)
- **Interactive demo**: Visual payment flow demonstration

## Browser Wallet Integration

The example includes basic wallet adapter integration. For production:

1. **Install wallet extensions** (Phantom, Solflare)
2. **Connect wallet** via WalletButton
3. **Sign real USDC transactions** with connected wallet
4. **Server verifies** payments on Solana devnet blockchain

## Learn More

- [OpenLibx402 Documentation](https://openlibx402.github.io/docs)
- [X402 Protocol Specification](https://www.x402.org/x402-whitepaper.pdf)
- [Vue.js Documentation](https://vuejs.org/guide/introduction.html)
- [Vite Documentation](https://vite.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [Solana Web3.js](https://solana.com/docs/clients/javascript)

## Troubleshooting

### Build Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Rebuild
npm run build
```

### Server Connection Issues

- Ensure Express server is running on port 3001
- Check Vite proxy configuration in `vite.config.ts`
- Verify `.env` file has correct values

### Payment Verification Issues

- Ensure RPC URL is correct in `.env`
- Check wallet address is valid Solana address
- Verify token mint address matches network (devnet/mainnet)
- In production, ensure transaction is confirmed on-chain before retrying

### Wallet Connection Issues

- Ensure wallet extension is installed
- Check network is set to Devnet
- Try refreshing the page and reconnecting

### On-Chain Verification Debugging

Set `NODE_ENV=production` for Express server:

```bash
NODE_ENV=production npm run dev:server
```

Check server console for verification logs and errors.
