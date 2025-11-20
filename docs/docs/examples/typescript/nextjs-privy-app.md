# Next.js + Privy + X402 Example

This example demonstrates how to integrate Privy server wallets with X402 payment protocol in a Next.js application for autonomous payment handling.

## Overview

This is a **production-ready** example showing:

- **Server-side wallet management** using Privy (no private keys in code)
- **Automatic X402 payment handling** for paid API endpoints
- **Two-server architecture** (Next.js frontend + Express backend)
- **No webpack bundling issues** - proper separation of concerns
- **Perfect for AI agents and backend services**

## Architecture

Due to Next.js webpack limitations with Privy's dependencies, this example uses a two-server pattern:

```
┌──────────────────┐
│  Next.js (3000)  │  Frontend - UI with Tailwind CSS
│  - React pages   │
│  - Components    │
│  - Proxy routes  │
└────────┬─────────┘
         │ HTTP
         ▼
┌──────────────────┐
│ Express (3002)   │  Backend - Privy + X402 Integration
│  - Privy SDK     │
│  - X402 Client   │
│  - Wallet mgmt   │
└────────┬─────────┘
         │
         ├──► Privy API (signing)
         │
         └──► X402 APIs (payments)
```

This is a **production-standard pattern** for integrating Node.js-specific SDKs with modern frontends.

## Features

- ✅ **Secure Wallet Management** - Private keys managed by Privy's SOC 2 certified infrastructure
- ✅ **Automatic Payments** - Transparent 402 payment handling
- ✅ **Safety Limits** - Configurable maximum payment amounts
- ✅ **Real-time Balance** - Live wallet balance display
- ✅ **Interactive UI** - Test endpoints directly from the browser
- ✅ **Production Ready** - Proper error handling and logging

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- [Privy account](https://privy.io) with server wallet

### 1. Install Dependencies

```bash
# From monorepo root
pnpm install

# Install Express server dependencies
cd examples/typescript/nextjs-privy-app
pnpm install
```

### 2. Get Privy Credentials

1. Go to [dashboard.privy.io](https://dashboard.privy.io)
2. Create or select an app
3. Get your **App ID** and **App Secret** from Settings
4. Create a **Server Wallet** and copy the **Wallet ID**

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Required - Get from Privy Dashboard
PRIVY_APP_ID=your-privy-app-id
PRIVY_APP_SECRET=your-privy-app-secret
PRIVY_WALLET_ID=your-server-wallet-id

# Optional
X402_NETWORK=solana-devnet
X402_MAX_PAYMENT=10.0
X402_API_URL=http://localhost:8000/premium-data
SERVER_PORT=3002
PRIVY_SERVER_URL=http://localhost:3002
```

### 4. Run Both Servers

**Terminal 1 - Express Backend:**

```bash
cd examples/typescript/nextjs-privy-app/server
NODE_PATH=../node_modules ../node_modules/.bin/ts-node src/index.ts
```

Server starts on `http://localhost:3002`

**Terminal 2 - Next.js Frontend:**

```bash
cd examples/typescript/nextjs-privy-app
pnpm dev
```

Frontend starts on `http://localhost:3000`

### 5. Open the App

Visit [http://localhost:3000](http://localhost:3000)

## How It Works

### Express Backend (server/src/index.ts)

The Express server handles all Privy SDK operations:

```typescript
import { PrivyX402Client, PrivyX402Config } from "@openlibx402/privy";

// Initialize Privy client
const config = new PrivyX402Config({
  appId: process.env.PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
  walletId: process.env.PRIVY_WALLET_ID!,
  network: "solana-devnet",
  maxPaymentAmount: "10.0",
});

const client = new PrivyX402Client(config);
await client.initialize();

// Make paid request - automatic payment handling
app.get("/api/paid/data", async (req, res) => {
  const response = await client.get(targetUrl);
  res.json(response.data);
});
```

### Next.js Frontend (app/api/*/route.ts)

Proxy routes forward requests to Express backend:

```typescript
// app/api/wallet/route.ts
const SERVER_URL = process.env.PRIVY_SERVER_URL || "http://localhost:3002";

export async function GET(req: NextRequest) {
  const response = await fetch(`${SERVER_URL}/api/wallet`);
  const data = await response.json();
  return NextResponse.json(data);
}
```

### React Components (app/components/)

Interactive UI for testing:

```typescript
// WalletDisplay.tsx - Shows Privy wallet info
const response = await fetch("/api/wallet");
const { wallet } = await response.json();

// ApiTestCard.tsx - Test API endpoints
const handleTest = async () => {
  const response = await fetch("/api/paid/data");
  setResult(await response.json());
};
```

## Payment Flow

1. User clicks "Test Endpoint" in UI
2. Frontend calls Next.js proxy route
3. Proxy forwards to Express backend
4. Express uses Privy client to make X402 request
5. Receives 402 Payment Required
6. Automatically creates & signs payment via Privy API
7. Broadcasts transaction to Solana
8. Retries request with payment authorization
9. Returns data back through proxy to frontend
10. UI displays result

## API Endpoints

### Express Backend (Port 3002)

- **GET /api/wallet** - Get Privy server wallet info & balance
- **GET /api/paid/data?url=<target>** - Make paid GET request to X402 endpoint
- **GET /health** - Health check

### Next.js Frontend (Port 3000)

- **GET /api/wallet** - Proxies to Express backend
- **GET /api/paid/data** - Proxies paid requests to Express

## File Structure

```
nextjs-privy-app/
├── app/                      # Next.js Frontend
│   ├── components/
│   │   ├── WalletDisplay.tsx # Wallet info display
│   │   └── ApiTestCard.tsx   # Interactive API tester
│   ├── api/                  # Proxy routes
│   │   ├── wallet/route.ts
│   │   └── paid/data/route.ts
│   ├── page.tsx              # Home page
│   └── layout.tsx
│
├── server/                   # Express Backend ⭐
│   ├── src/
│   │   └── index.ts          # Privy + X402 integration
│   ├── package.json
│   └── tsconfig.json
│
├── package.json              # Next.js dependencies
├── .env.example              # Environment template
└── README.md                 # Full documentation
```

## Why Two Servers?

**The Problem:**

Privy's `@privy-io/server-auth` uses dynamic `require()` statements incompatible with Next.js webpack bundling.

**The Solution:**

- **Express** - Full Node.js environment, no webpack, supports Privy SDK
- **Next.js** - Modern UI framework, proxy routes to Express
- **Industry Standard** - Common pattern for Node.js SDKs + modern frontends

## Deployment

### Option 1: Separate Deployments (Recommended)

**Frontend (Vercel):**
```bash
vercel deploy
```

**Backend (Railway/Fly.io/Heroku):**
```bash
cd server
fly deploy
```

Set `PRIVY_SERVER_URL` in Vercel to your backend URL.

### Option 2: Docker (Combined)

```dockerfile
FROM node:18

WORKDIR /app
COPY package*.json ./
COPY server/package*.json ./server/
RUN npm install && cd server && npm install

COPY . .
RUN npm run build && cd server && npm run build

CMD ["sh", "-c", "npm start & cd server && npm start"]
```

### Option 3: Express Only

Skip Next.js, use Express as standalone API:

```bash
cd server
NODE_PATH=../node_modules ../node_modules/.bin/ts-node src/index.ts
```

Access at `http://localhost:3002/api/*`

## Testing

### Test Wallet Info

1. Ensure both servers are running
2. Visit [http://localhost:3000](http://localhost:3000)
3. Click "Test Endpoint" on **Wallet Information** card
4. See your Privy wallet address and SOL balance

### Test Paid Requests

You need an X402-enabled API. Use the Express server example:

```bash
cd examples/typescript/express-server
pnpm install
pnpm start
```

Then test paid endpoints from the Next.js UI.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PRIVY_APP_ID` | ✅ | - | Privy App ID |
| `PRIVY_APP_SECRET` | ✅ | - | Privy App Secret |
| `PRIVY_WALLET_ID` | ✅ | - | Privy Server Wallet ID |
| `X402_NETWORK` | ❌ | `solana-devnet` | Solana network |
| `X402_MAX_PAYMENT` | ❌ | `10.0` | Max payment limit (USDC) |
| `X402_API_URL` | ❌ | `localhost:8000` | Target X402 API |
| `SERVER_PORT` | ❌ | `3002` | Express port |
| `PRIVY_SERVER_URL` | ❌ | `localhost:3002` | Express URL |

## Security Features

1. **No Private Keys** - All keys managed by Privy
2. **Payment Limits** - Configurable max per transaction
3. **Environment Variables** - Sensitive data in env only
4. **Audit Trail** - All transactions in Privy dashboard
5. **SOC 2 Compliance** - Privy's secure infrastructure

## Troubleshooting

### "Cannot connect to server"
→ Make sure Express is running on port 3002
→ Check `PRIVY_SERVER_URL` in `.env`

### "Missing Privy credentials"
→ Set all 3 variables in `.env`
→ Get from [dashboard.privy.io](https://dashboard.privy.io)

### "Insufficient funds"
→ Fund wallet with SOL and USDC
→ Devnet: `solana airdrop 1 <address> --url devnet`

### Port already in use
→ Change `SERVER_PORT` in `.env`
→ Or kill: `lsof -ti:3002 | xargs kill`

## Use Cases

Perfect for:

- 🤖 AI agents making autonomous payments
- 🔄 Backend services accessing paid APIs
- 📡 Webhook handlers requiring paid data
- ⏰ Scheduled jobs accessing premium endpoints
- 🏢 Microservices with payment requirements

## Learn More

- **Full Documentation**: See `README.md` in example directory
- **Architecture Details**: See `README-ARCHITECTURE.md`
- **Quick Start Guide**: See `QUICKSTART-UPDATED.md`
- **X402 Protocol**: [openlib.xyz](https://openlib.xyz)
- **Privy Docs**: [docs.privy.io](https://docs.privy.io)
- **Privy Package**: [openlibx402-privy](../../packages/typescript/openlibx402-privy.md)

## Related Examples

- [Privy Agent](./privy-agent.md) - Standalone Privy agent (no Next.js)
- [Next.js App](./nextjs-app.md) - Next.js with browser wallets
- [Express Server](./express-server.md) - X402 server example

## Source Code

View the complete source code in the repository:

```
examples/typescript/nextjs-privy-app/
```
