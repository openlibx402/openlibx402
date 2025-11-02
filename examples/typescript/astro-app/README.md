# X402 Astro Demo

A demonstration of the [X402 HTTP 402 Payment Required](https://openlib.xyz) protocol implemented in [Astro](https://astro.build/) with [React](https://react.dev/) components.

## Overview

This example shows how to:
- Implement X402 payment-protected API endpoints in Astro
- Create a payment UI with React components
- Handle payment authorization flows
- Integrate with Solana wallets (Phantom, Solflare, etc.)

## Features

✅ **5 API Endpoints** with different payment amounts:
- Free endpoint (public access)
- Premium data (0.10 USDC)
- Expensive AI inference (1.00 USDC)
- Tiered content (0.05 USDC)
- Data processing POST endpoint (0.25 USDC)

✅ **Wallet Integration**: Connect with Phantom, Solflare, or other Solana wallets

✅ **Payment Simulation**: Demo mode for testing without real transactions

✅ **Responsive Design**: Built with Tailwind CSS

✅ **Server-Side Rendering**: Full SSR with Astro + Node adapter

## Getting Started

### Prerequisites
- Node.js 16.12.0 or higher
- pnpm (or npm/yarn)
- Phantom wallet extension (optional, for production testing)

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

The app will be available at `http://localhost:4321`

## Usage

### 1. Connect Your Wallet
Click the **"Connect Wallet"** button in the top-right corner to connect your Phantom or Solflare wallet.

### 2. Try Endpoints
- **Free Data**: Click "Try Endpoint" - returns data immediately without payment
- **Paid Endpoints**: Click "Try Endpoint" to trigger a 402 Payment Required response

### 3. Simulate Payment
When a 402 response is received:
1. View the payment details (amount, recipient, expiration)
2. Click **"Simulate Payment & Retry"** to generate a mock payment authorization
3. The app retries the request with the payment header
4. Success! You'll see the protected content

### In Production
For real payments on mainnet:
1. Connect your actual wallet with USDC tokens
2. Click "Try Endpoint" to create a real payment transaction
3. Sign the transaction with your wallet
4. The endpoint verifies the payment on-chain and returns protected content

## Architecture

### Frontend (Client-Side)
- **Astro Pages**: Server-rendered page templates
- **React Components**:
  - `WalletButton.tsx`: Wallet connection/disconnection
  - `X402EndpointCard.tsx`: Payment endpoint UI with state management
  - `EndpointCard.astro`: Free endpoint display

### Backend (Server-Side)
- **API Routes** (`src/pages/api/`):
  - All routes return SSR-compatible responses
  - Payment verification via `x402-config.ts`
  - Demo mode for testing without on-chain verification

### Utilities
- `src/utils/mock-payment.ts`: Mock payment authorization generator
- `src/utils/x402-config.ts`: X402 configuration and payment verification

## Configuration

### Environment Variables

Create a `.env` file (copy from `.env.example`):

```env
# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com

# X402 Payment Configuration
PAYMENT_WALLET_ADDRESS=your_wallet_address_here
USDC_MINT_ADDRESS=your_usdc_mint_here
```

### Astro Config

Configured with:
- `@astrojs/node`: Server-side rendering adapter
- `@astrojs/react`: React component integration
- `@astrojs/tailwind`: Tailwind CSS styling

## Project Structure

```
astro-app/
├── src/
│   ├── components/
│   │   ├── EndpointCard.astro          # Free endpoint component
│   │   ├── X402EndpointCard.tsx        # Paid endpoint component (React)
│   │   └── WalletButton.tsx            # Wallet connection (React)
│   ├── layouts/
│   │   └── Layout.astro                # Base layout
│   ├── pages/
│   │   ├── index.astro                 # Main demo page
│   │   └── api/
│   │       ├── free-data.ts            # Public endpoint
│   │       ├── premium-data.ts         # 0.10 USDC endpoint
│   │       ├── expensive-data.ts       # 1.00 USDC endpoint
│   │       ├── tiered-data/[tier].ts   # 0.05 USDC endpoint
│   │       └── process-data.ts         # 0.25 USDC POST endpoint
│   └── utils/
│       ├── mock-payment.ts             # Payment simulation
│       └── x402-config.ts              # X402 configuration
├── astro.config.mjs                    # Astro configuration
├── tailwind.config.ts                  # Tailwind CSS config
├── postcss.config.js                   # PostCSS config
├── package.json
└── README.md
```

## How It Works

### 1. Payment Flow

```
Request without payment header
        ↓
Server returns 402 with payment request details
        ↓
User clicks "Simulate Payment & Retry"
        ↓
Client generates mock payment authorization
        ↓
Request endpoint again with auth header
        ↓
Server verifies payment and returns data (200)
```

### 2. Server-Side Payment Verification

The `withPayment` helper in `x402-config.ts`:
1. Checks for `x-payment-authorization` header
2. If missing: returns 402 with payment request
3. If present:
   - Parses the authorization header (base64 JSON)
   - Verifies payment amount is sufficient
   - Verifies payment addresses match
   - Verifies token mint matches
   - (Optional) Verifies on-chain for production

## API Endpoints

### GET `/api/free-data`
Public endpoint, no payment required.

**Response (200):**
```json
{
  "data": "This is free content available to everyone",
  "price": 0,
  "access": "public"
}
```

### GET `/api/premium-data`
Requires 0.10 USDC payment.

### GET `/api/expensive-data`
Requires 1.00 USDC payment.

### GET `/api/tiered-data/:tier`
Requires 0.05 USDC for premium tier.

### POST `/api/process-data`
Requires 0.25 USDC payment. Accepts JSON body.

## Testing

### Manual Testing

1. **Test Free Endpoint**: Click "Try Endpoint" on Free Data
2. **Test 402 Response**: Click "Try Endpoint" on Premium Data (shows payment request)
3. **Test Payment Flow**: Click "Simulate Payment & Retry" to complete the demo

## Comparison with Other Implementations

This Astro example follows the same pattern as:
- [Next.js Example](../nextjs-app) - React + SSR
- [Nuxt Example](../nuxt-app) - Vue + SSR

All three implementations:
- Share the same API endpoint patterns
- Use identical payment verification logic
- Provide the same demo payment simulation
- Support the same payment amounts

## Production Deployment

### Build
```bash
pnpm build
```

The app builds to a standalone Node.js server with the `@astrojs/node` adapter.

## Resources

- [Astro Documentation](https://docs.astro.build/)
- [X402 Protocol](https://openlib.xyz)
- [Solana Documentation](https://docs.solana.com/)
- [Phantom Wallet](https://phantom.app/)

## License

MIT
