# Astro App Example with X402 Payment Support

This example demonstrates how to create an Astro application with X402 payment requirements for API endpoints, featuring server-side rendering, React component integration, and real Solana wallet payments.

## Features

- **Astro SSR** - Server-side rendering with `@astrojs/node` adapter
- **React Integration** - Interactive payment UI with React components
- **Server-side API Routes** - Protected endpoints with payment requirements
- **Phantom Wallet Support** - Real blockchain transactions on Solana devnet
- **Payment Simulation** - Demo mode for testing without wallet/funds
- **TypeScript** - Full type safety across client and server
- **Tailwind CSS** - Modern, responsive styling
- **X402 Protocol** - HTTP 402 Payment Required standard

## Setup

### 1. Install Dependencies

From the monorepo root:

```bash
pnpm install
```

Or from the `examples/typescript/astro-app` directory:

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` with your Solana wallet details:

```env
# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com

# X402 Payment Configuration
PAYMENT_WALLET_ADDRESS=your_wallet_address_here
USDC_MINT_ADDRESS=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```

### 3. Build and Run

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will start on `http://localhost:4321`.

## API Endpoints

### Free Endpoints

- **GET /api/free-data** - Public data access (no payment required)

### Paid Endpoints

- **GET /api/premium-data** - Premium data (0.10 USDC)
- **GET /api/expensive-data** - AI inference (1.00 USDC)
- **GET /api/tiered-data/[tier]** - Tiered content (0.05 USDC for premium)
- **POST /api/process-data** - Data processing (0.25 USDC)

## How It Works

### Server-Side (API Routes)

Astro API routes are located in `src/pages/api/` and export request handlers:

1. **Initialize X402 Configuration** (`src/utils/x402-config.ts`):

```typescript
import type { PaymentRequestData } from '@openlibx402/core';

export function initX402Config(): X402Config {
  const paymentAddress = process.env.PAYMENT_WALLET_ADDRESS;
  const tokenMint = process.env.USDC_MINT_ADDRESS;

  return {
    paymentAddress,
    tokenMint,
    network: 'solana-devnet',
    rpcUrl: 'https://api.devnet.solana.com',
    autoVerify: process.env.NODE_ENV === 'production',
  };
}
```

2. **Protect API Routes** with `withPayment` helper:

```typescript
import { withPayment } from '../utils/x402-config';

export async function GET(request: Request) {
  const response = await withPayment(
    request,
    {
      amount: "0.10",
      description: "Access to premium data",
    },
    async (request, context) => {
      return {
        data: "Premium content",
        payment_id: context.payment?.payment_id,
        timestamp: new Date().toISOString(),
      };
    }
  );

  return new Response(JSON.stringify(response.body), {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

### Client-Side (React Components)

1. **Wallet Connection** (`src/components/WalletButton.tsx`):

```typescript
import { useState, useEffect } from 'react';

export default function WalletButton() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const connectWallet = async () => {
    const response = await (window as any).phantom.solana.connect();
    setWalletAddress(response.publicKey.toString());
  };

  return (
    <button onClick={connectWallet}>
      {walletAddress ? `Connected: ${walletAddress.slice(0, 8)}...` : 'Connect Wallet'}
    </button>
  );
}
```

2. **Payment Endpoint Card** (`src/components/X402EndpointCard.tsx`):

```typescript
import { useState } from 'react';
import { generateMockPaymentAuthorization } from '../utils/mock-payment';
import { createPaymentTransaction, transactionToAuthHeader } from '../utils/real-payment';

export default function X402EndpointCard({ endpoint, price }) {
  const [paymentRequired, setPaymentRequired] = useState(null);

  // Try endpoint - may return 402 Payment Required
  const handleFetch = async (authHeader?: string) => {
    const headers = authHeader ? { 'x-payment-authorization': authHeader } : {};
    const response = await fetch(endpoint, { headers });

    if (response.status === 402) {
      const paymentData = await response.json();
      setPaymentRequired(paymentData);
    } else {
      const data = await response.json();
      setResult(data);
    }
  };

  // Real payment with Phantom wallet
  const handleRealPayment = async () => {
    const phantomProvider = (window as any).phantom?.solana;
    const txResult = await createPaymentTransaction(paymentRequired, phantomProvider);
    const authHeader = transactionToAuthHeader(txResult);
    await handleFetch(authHeader);
  };

  // Simulated payment for demo
  const handleSimulatePayment = async () => {
    const mockAuth = generateMockPaymentAuthorization(paymentRequired);
    await handleFetch(mockAuth);
  };

  return (
    <div>
      <button onClick={() => handleFetch()}>Try Endpoint</button>

      {paymentRequired && (
        <>
          <button onClick={handleRealPayment}>💰 Pay with Phantom Wallet</button>
          <button onClick={handleSimulatePayment}>Simulate Payment & Retry</button>
        </>
      )}
    </div>
  );
}
```

## Payment Flow

### Demo Mode (Simulated)

1. User clicks **"Try Endpoint"** button
2. Server responds with **402 Payment Required**
3. User clicks **"Simulate Payment & Retry"**
4. Client generates mock authorization header
5. Client retries request with authorization
6. Server validates and returns content

### Real Mode (Blockchain)

1. User clicks **"Connect Wallet"** and approves Phantom connection
2. User clicks **"Try Endpoint"** button
3. Server responds with **402 Payment Required**
4. User clicks **"💰 Pay with Phantom Wallet"**
5. Client creates Solana transaction and requests signature
6. User approves transaction in Phantom wallet
7. Transaction broadcasts to Solana devnet
8. Client retries request with transaction details
9. Server validates payment and returns content
10. Transaction visible on [Solscan](https://solscan.io/?cluster=devnet)

## Real Wallet Integration

### Setup Phantom Wallet for Testing

1. **Install Phantom**: Download from [phantom.app](https://phantom.app/)
2. **Switch to Devnet**: Settings → Developer Settings → Testnet Mode → Solana Devnet
3. **Get SOL**: Visit [solfaucet.com](https://solfaucet.com/) and request free devnet SOL
4. **Connect**: Click "Connect Wallet" button in the app

### Real Payment Implementation

The `src/utils/real-payment.ts` utility handles actual blockchain transactions:

```typescript
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

export async function createPaymentTransaction(
  paymentRequest: PaymentRequestData,
  phantomProvider: any
): Promise<PaymentTransactionResult> {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const senderPublicKey = new PublicKey(phantomProvider.publicKey);
  const recipientPublicKey = new PublicKey(paymentRequest.payment_address);

  // Check balance for transaction fees
  const balance = await connection.getBalance(senderPublicKey);
  if (balance < 5000) {
    throw new Error('Insufficient SOL for fees. Get free SOL from https://solfaucet.com');
  }

  // Create transaction
  const { blockhash } = await connection.getLatestBlockhash();
  const transaction = new Transaction({
    recentBlockhash: blockhash,
    feePayer: senderPublicKey,
  });

  transaction.add(
    SystemProgram.transfer({
      fromPubkey: senderPublicKey,
      toPubkey: recipientPublicKey,
      lamports: 1000, // ~0.000001 SOL for demo
    })
  );

  // Sign with Phantom
  const signedTransaction = await phantomProvider.signTransaction(transaction);

  // Broadcast
  const signature = await connection.sendRawTransaction(
    signedTransaction.serialize(),
    { skipPreflight: false, preflightCommitment: 'confirmed' }
  );

  // Wait for confirmation
  await connection.confirmTransaction(signature, 'confirmed');

  return {
    transactionHash: signature,
    signature: signature,
    publicKey: senderPublicKey.toString(),
    amount: paymentRequest.max_amount_required,
    timestamp: new Date().toISOString(),
    paymentAddress: paymentRequest.payment_address,
  };
}
```

### Verifying Transactions on Solscan

After a successful real payment:

1. Copy the transaction signature from the UI response
2. Visit: `https://solscan.io/tx/[SIGNATURE]?cluster=devnet`
3. View transaction details including:
   - Transaction status (Success/Failed)
   - Signer (your wallet address)
   - Recipient (payment wallet address)
   - Amount and fees
   - Block and timestamp

## Project Structure

```
astro-app/
├── src/
│   ├── components/
│   │   ├── EndpointCard.astro          # Free endpoint component
│   │   ├── X402EndpointCard.tsx        # Paid endpoint (React)
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
│       ├── real-payment.ts             # Real blockchain payments
│       └── x402-config.ts              # X402 configuration
├── astro.config.mjs                    # Astro configuration
├── tailwind.config.ts                  # Tailwind CSS config
├── package.json
└── README.md
```

## Configuration

### Astro Config (`astro.config.mjs`)

```javascript
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import node from '@astrojs/node';

export default defineConfig({
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [tailwind(), react()],
  output: 'server',
  image: {
    service: {
      entrypoint: 'astro/assets/services/noop'
    }
  },
  vite: {
    ssr: {
      external: ['@solana/wallet-adapter-base', '@solana/web3.js']
    }
  }
});
```

Key configuration points:

- **`@astrojs/node`**: Server-side rendering adapter (required for API routes)
- **`@astrojs/react`**: Enables React components with client-side interactivity
- **`output: 'server'`**: Full SSR mode (not static or hybrid)
- **Vite SSR externals**: Prevents bundling Solana packages server-side

## Development Tips

### Testing Workflow

1. **Start with Demo Mode**: Use "Simulate Payment & Retry" to test the flow without wallet setup
2. **Test Free Endpoint**: Verify basic API routing works correctly
3. **Set up Phantom**: Only needed when testing real blockchain payments
4. **Check Browser Console**: Detailed error messages appear in developer tools

### Common Issues

**"Phantom wallet not connected"**
- Solution: Click "Connect Wallet" button first
- Verify Phantom extension is installed and enabled

**"Insufficient SOL balance"**
- Solution: Visit [solfaucet.com](https://solfaucet.com/) for free devnet SOL
- Need at least 0.000005 SOL for transaction fees

**"Payment address mismatch"**
- Solution: Ensure `.env` file has correct `PAYMENT_WALLET_ADDRESS`
- Check address matches between client and server

**"Transaction doesn't appear on Solscan"**
- Verify you used "Pay with Phantom Wallet" (not simulate)
- Check correct cluster: `?cluster=devnet` in URL
- Wait 30 seconds for confirmation

### Hot Reload

Astro supports hot module replacement:
- Changes to `.astro` files reload automatically
- React component changes (`.tsx`) hot-reload
- API route changes require manual refresh
- `.env` changes require server restart

## Production Considerations

### Mainnet Deployment

For production on Solana mainnet:

1. **Update RPC URL**: Use mainnet endpoint or dedicated provider
2. **Use Real USDC**: Update `USDC_MINT_ADDRESS` to mainnet USDC mint
3. **Implement SPL Token Transfers**: Replace SOL transfers with proper USDC token transfers
4. **On-chain Verification**: Enable `autoVerify` in X402 config
5. **Rate Limiting**: Add rate limiting middleware
6. **Database Storage**: Store payment receipts and transaction history
7. **Error Handling**: Implement retry logic and user notifications

### Security Best Practices

- **Never expose private keys** in client-side code
- **Validate all inputs** on server-side
- **Use HTTPS** for production deployments
- **Implement CORS** policies appropriately
- **Monitor transactions** for suspicious activity
- **Test thoroughly** on devnet before mainnet

## Comparison with Other Frameworks

### Astro vs Next.js

**Astro Advantages:**
- Lighter JavaScript bundle (less client-side JS by default)
- Flexible component framework (React, Vue, Svelte in one project)
- Better static site performance

**Next.js Advantages:**
- More mature ecosystem
- Built-in API routes with middleware
- Better TypeScript integration

### Astro vs Nuxt

**Astro Advantages:**
- Framework-agnostic (not tied to Vue)
- Better performance for content-heavy sites
- Simpler mental model

**Nuxt Advantages:**
- Better for full Vue.js applications
- More integrated dev experience with Vue ecosystem
- Auto-imports and conventions

All three frameworks (Astro, Next.js, Nuxt) support X402 with similar implementation patterns.

## Learn More

- [OpenLibx402 Documentation](https://openlibx402.github.io/docs)
- [X402 Protocol Specification](https://www.x402.org/x402-whitepaper.pdf)
- [Astro Documentation](https://docs.astro.build/)
- [Phantom Wallet Docs](https://docs.phantom.app/)
- [Solana Web3.js](https://solana.com/docs/clients/javascript)
- [Solscan Explorer](https://solscan.io/?cluster=devnet)

## Additional Resources

For detailed setup instructions on real wallet payments, see [REAL_PAYMENTS.md](https://github.com/openlibx402/openlibx402/blob/main/examples/typescript/astro-app/REAL_PAYMENTS.md) in the example directory.
