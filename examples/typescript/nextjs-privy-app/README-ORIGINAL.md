# Next.js + Privy + X402 Example

This example demonstrates how to integrate the **openlibx402-privy SDK** into a Next.js application for server-side wallet management and automatic X402 payment handling.

## Overview

This demo showcases:

- **Server-side wallet management** using Privy's secure infrastructure
- **Automatic X402 payment handling** when accessing paid API endpoints
- **No private keys in code** - all signing delegated to Privy
- **Perfect for AI agents and backend services** that need autonomous payment capabilities

## Architecture

```
┌─────────────────┐
│  Next.js App    │
│  (Frontend)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Routes     │
│  (Backend)      │
└────────┬────────┘
         │
         ├─► Privy SDK ───► Privy API (signing)
         │
         └─► X402 API ───► External Paid Endpoints
```

## Features

### 1. Server Wallet Management

The app uses a Privy-managed server wallet for all payment operations:

- **Secure**: Private keys never leave Privy's infrastructure
- **Auditable**: All transactions visible in Privy dashboard
- **Configurable**: Safety limits and network selection

### 2. Automatic Payment Flow

When accessing X402-protected endpoints:

1. API route receives request from frontend
2. Privy client makes request to target endpoint
3. Receives 402 Payment Required response
4. Automatically creates payment transaction
5. Signs transaction via Privy API
6. Broadcasts to Solana
7. Retries request with payment proof
8. Returns data to frontend

### 3. API Endpoints

- **`GET /api/wallet`** - Get Privy wallet info and balance
- **`GET /api/paid/data?url=<target>`** - Make paid GET request
- **`POST /api/paid/data`** - Make paid POST request
- **`GET /api`** - API documentation

## Prerequisites

1. **Privy Account**: Sign up at [privy.io](https://privy.io)
2. **Privy Server Wallet**: Create a server wallet in Privy dashboard
3. **Node.js 18+**: For running the application
4. **pnpm**: Package manager (or npm/yarn)

## Setup

### 1. Install Dependencies

From the repository root:

```bash
pnpm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cd examples/typescript/nextjs-privy-app
cp .env.example .env
```

Edit `.env` and add your Privy credentials:

```bash
# Required
PRIVY_APP_ID=your-privy-app-id
PRIVY_APP_SECRET=your-privy-app-secret
PRIVY_WALLET_ID=your-server-wallet-id

# Optional
X402_NETWORK=solana-devnet
X402_RPC_URL=https://api.devnet.solana.com
X402_MAX_PAYMENT=10.0
X402_API_URL=http://localhost:8000/premium-data
```

### 3. Get Privy Credentials

1. Go to [dashboard.privy.io](https://dashboard.privy.io)
2. Create or select an app
3. Navigate to **Settings** to get your `App ID` and `App Secret`
4. Create a **Server Wallet** and copy the `Wallet ID`

### 4. Fund Your Wallet

For testing on Solana Devnet:

```bash
# Get your wallet address from the app or Privy dashboard
solana airdrop 1 <YOUR_WALLET_ADDRESS> --url devnet

# Get devnet USDC from a faucet (search "Solana devnet USDC faucet")
```

## Running the Demo

### Development Mode

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production Mode

```bash
pnpm build
pnpm start
```

## Testing with X402 API

To test the paid endpoints, you need an X402-enabled API running:

### Option 1: Use the Express Server Example

```bash
# In a separate terminal
cd examples/typescript/express-server
pnpm install
pnpm start
```

The server will start on `http://localhost:8000`

### Option 2: Use Any X402 API

Set the `X402_API_URL` environment variable to your API endpoint:

```bash
X402_API_URL=https://your-x402-api.com/premium-data
```

## Code Structure

```
nextjs-privy-app/
├── app/
│   ├── api/
│   │   ├── privy-client.ts       # Privy SDK singleton
│   │   ├── wallet/
│   │   │   └── route.ts           # Wallet info endpoint
│   │   ├── paid/
│   │   │   └── data/
│   │   │       └── route.ts       # Paid request endpoint
│   │   └── route.ts               # API root
│   ├── components/
│   │   ├── WalletDisplay.tsx      # Wallet info component
│   │   └── ApiTestCard.tsx        # API test interface
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Home page
│   └── globals.css                # Styles
├── package.json
├── tsconfig.json
├── next.config.js
└── .env.example
```

## Key Components

### Privy Client Singleton

[app/api/privy-client.ts](app/api/privy-client.ts)

```typescript
import { PrivyX402Client, PrivyX402Config } from "@openlibx402/privy";

let privyClient: PrivyX402Client | null = null;

export async function getPrivyClient(): Promise<PrivyX402Client> {
  if (privyClient) {
    return privyClient;
  }

  const config = new PrivyX402Config({
    appId: process.env.PRIVY_APP_ID!,
    appSecret: process.env.PRIVY_APP_SECRET!,
    walletId: process.env.PRIVY_WALLET_ID!,
    network: process.env.X402_NETWORK || "solana-devnet",
    maxPaymentAmount: process.env.X402_MAX_PAYMENT || "10.0",
  });

  privyClient = new PrivyX402Client(config);
  await privyClient.initialize();

  return privyClient;
}
```

### Paid Request Handler

[app/api/paid/data/route.ts](app/api/paid/data/route.ts)

```typescript
export async function GET(req: NextRequest) {
  const targetUrl = req.nextUrl.searchParams.get("url") ||
                    process.env.X402_API_URL;

  const client = await getPrivyClient();

  // Automatically handles 402 payment flow
  const response = await client.get(targetUrl);

  return NextResponse.json({
    success: true,
    data: response.data,
  });
}
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PRIVY_APP_ID` | Yes | - | Your Privy App ID |
| `PRIVY_APP_SECRET` | Yes | - | Your Privy App Secret |
| `PRIVY_WALLET_ID` | Yes | - | Your Privy Server Wallet ID |
| `X402_NETWORK` | No | `solana-devnet` | Solana network to use |
| `X402_RPC_URL` | No | `https://api.devnet.solana.com` | Custom RPC endpoint |
| `X402_MAX_PAYMENT` | No | `10.0` | Max payment per transaction (USDC) |
| `X402_API_URL` | No | `http://localhost:8000/premium-data` | Default target API |

## Security Considerations

### Private Key Management

- Private keys **never** exist in your application code
- All signing operations delegated to Privy's secure API
- Keys stored in Privy's SOC 2 Type II certified infrastructure

### Payment Safety

- Configure `X402_MAX_PAYMENT` to limit transaction amounts
- Review all transactions in Privy dashboard
- Use separate wallets for development and production

### Environment Variables

- Never commit `.env` to version control
- Use environment variable management in production (Vercel, etc.)
- Rotate credentials regularly

## Deployment

### Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t nextjs-privy-app .
docker run -p 3000:3000 --env-file .env nextjs-privy-app
```

## Troubleshooting

### "Missing required Privy environment variables"

Make sure all three Privy variables are set in `.env`:
- `PRIVY_APP_ID`
- `PRIVY_APP_SECRET`
- `PRIVY_WALLET_ID`

### "Insufficient funds" error

Your Privy wallet needs:
- **SOL**: For transaction gas fees (~0.001 SOL per transaction)
- **USDC**: For actual payments (varies by endpoint)

Get devnet SOL: `solana airdrop 1 <address> --url devnet`

### "Connection refused" when testing paid endpoints

Make sure you have an X402-enabled API running on the configured URL. Try starting the Express server example.

### Wallet balance shows 0

Check that you've funded the correct wallet address shown in the app. It can take a few seconds for balance updates to reflect.

## Next Steps

### Integration Ideas

1. **AI Agent Backend**: Use this pattern for autonomous AI agents that need to access paid APIs
2. **Microservices**: Build microservices that can pay for premium data sources
3. **Webhook Handlers**: Process webhooks that require paid API calls
4. **Scheduled Jobs**: Cron jobs that access paid endpoints automatically

### Customization

- Add authentication/authorization to API routes
- Implement webhook notifications for payments
- Add payment history tracking
- Create admin dashboard for wallet management
- Implement multi-wallet support

## Resources

- [X402 Protocol Documentation](https://openlib.xyz)
- [Privy Documentation](https://docs.privy.io)
- [OpenLibx402 GitHub](https://github.com/openlibx402/openlibx402)
- [Solana Documentation](https://docs.solana.com)

## Support

For issues or questions:

1. Check the [troubleshooting section](#troubleshooting)
2. Review [Privy docs](https://docs.privy.io)
3. Open an issue on [GitHub](https://github.com/openlibx402/openlibx402/issues)

## License

MIT
