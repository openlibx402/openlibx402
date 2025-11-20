# Next.js + Privy + X402 Example

Complete example of integrating **Privy server wallets** with **X402 payment protocol** in a Next.js application.

## 🏗️ Architecture

This example uses a **two-server architecture** to work around Next.js webpack limitations with Privy's dependencies:

```
Next.js Frontend (3000) ←→ Express Backend (3001) ←→ Privy API + X402 Endpoints
```

**Why two servers?**
Privy's `@privy-io/server-auth` uses dynamic requires incompatible with Next.js webpack. The Express server handles all Privy operations while Next.js provides the UI.

See [README-ARCHITECTURE.md](README-ARCHITECTURE.md) for detailed explanation.

## ✨ Features

- 🔐 **Secure wallet management** via Privy (no private keys in code)
- 💳 **Automatic X402 payments** when accessing paid endpoints
- 🎨 **Beautiful Next.js UI** with Tailwind CSS
- 🚀 **Production-ready** Express backend
- 📊 **Real-time wallet info** and balance display
- 🧪 **Interactive API testing** interface

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- [Privy account](https://privy.io) with server wallet created

### 1. Install Dependencies

```bash
# Install Next.js dependencies
pnpm install

# Install Express server dependencies
cd server
pnpm install
cd ..
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Privy credentials:

```bash
PRIVY_APP_ID=your-privy-app-id
PRIVY_APP_SECRET=your-privy-app-secret
PRIVY_WALLET_ID=your-server-wallet-id
```

Get these from [dashboard.privy.io](https://dashboard.privy.io)

### 3. Run Both Servers

**Terminal 1 - Express Server:**
```bash
cd server
pnpm dev
```
✅ Server running on `http://localhost:3001`

**Terminal 2 - Next.js Frontend:**
```bash
pnpm dev
```
✅ Frontend running on `http://localhost:3000`

### 4. Open the App

Visit [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
nextjs-privy-app/
├── app/                      # Next.js frontend
│   ├── components/          # React components
│   │   ├── WalletDisplay.tsx
│   │   └── ApiTestCard.tsx
│   ├── page.tsx             # Home page
│   └── layout.tsx
│
├── server/                   # Express backend ⭐
│   ├── src/
│   │   └── index.ts         # Privy + X402 integration
│   ├── package.json
│   └── tsconfig.json
│
├── package.json              # Next.js deps
├── .env                      # Shared config
└── README.md
```

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PRIVY_APP_ID` | ✅ | Your Privy App ID |
| `PRIVY_APP_SECRET` | ✅ | Your Privy App Secret |
| `PRIVY_WALLET_ID` | ✅ | Your Privy Server Wallet ID |
| `X402_NETWORK` | ❌ | Solana network (default: `solana-devnet`) |
| `X402_MAX_PAYMENT` | ❌ | Max payment limit (default: `10.0`) |
| `X402_API_URL` | ❌ | Target X402 API (default: `localhost:8000`) |
| `SERVER_PORT` | ❌ | Express port (default: `3001`) |

## 🧪 Testing

### Test Wallet Info

1. Open [http://localhost:3000](http://localhost:3000)
2. Click "Test Endpoint" on **Wallet Information** card
3. See your Privy wallet address and SOL balance

### Test Paid Requests

You need an X402-enabled API running. Use the Express server example:

```bash
# In a new terminal
cd ../express-server
pnpm install
pnpm start
```

Then test the paid endpoints from the Next.js UI.

## 📊 API Endpoints

The Express server (`server/src/index.ts`) exposes:

### GET /api/wallet
Returns Privy wallet information and balance

```json
{
  "success": true,
  "wallet": {
    "address": "...",
    "network": "solana-devnet",
    "balances": { "sol": 1.234 }
  }
}
```

### GET /api/paid/data?url=<target>
Makes a paid GET request to an X402 endpoint

### POST /api/paid/data
Makes a paid POST request with body data

## 🚢 Deployment

### Option 1: Separate Deployments (Recommended)

**Frontend (Vercel):**
```bash
vercel
```

**Backend (Railway/Fly.io):**
```bash
cd server
fly deploy
```

Set `PRIVY_SERVER_URL` in Vercel to your backend URL.

### Option 2: Docker (Both Servers)

```dockerfile
FROM node:18
WORKDIR /app

# Install all dependencies
COPY package*.json ./
COPY server/package*.json ./server/
RUN npm install && cd server && npm install

# Build
COPY . .
RUN npm run build && cd server && npm run build

# Run both
CMD ["sh", "-c", "npm start & cd server && npm start"]
```

### Option 3: Express Only

Skip Next.js, use Express as standalone API:

```bash
cd server
pnpm dev
```

Access at `http://localhost:3001/api/*`

## 🔧 Development Tips

### Hot Reload

Both servers support hot reload:
- Next.js: Auto-reloads on file changes
- Express: Uses `ts-node` for instant updates

### Debugging

Enable verbose logging:
```bash
# In server/src/index.ts
console.log("Request received:", req.method, req.url);
```

### Testing Without X402 API

The wallet endpoint works standalone. Paid endpoints need an X402 API, but will show helpful error messages if unavailable.

## 🐛 Troubleshooting

### "Cannot connect to server"
→ Make sure Express server is running on port 3001
→ Check `PRIVY_SERVER_URL` in `.env`

### "Missing Privy credentials"
→ Set all three required variables in `.env`
→ Get credentials from [dashboard.privy.io](https://dashboard.privy.io)

### "Insufficient funds"
→ Fund your Privy wallet with SOL and USDC
→ For devnet: `solana airdrop 1 <address> --url devnet`

### Port already in use
→ Change `SERVER_PORT` in `.env`
→ Or kill existing process: `lsof -ti:3001 | xargs kill`

## 📚 Learn More

- **Architecture Details**: [README-ARCHITECTURE.md](README-ARCHITECTURE.md)
- **Implementation Guide**: [IMPLEMENTATION.md](IMPLEMENTATION.md)
- **Quick Start**: [QUICKSTART.md](QUICKSTART.md)
- **X402 Protocol**: [openlib.xyz](https://openlib.xyz)
- **Privy Docs**: [docs.privy.io](https://docs.privy.io)

## 💡 Use Cases

Perfect for:
- 🤖 AI agents making autonomous payments
- 🔄 Backend services accessing paid APIs
- 📡 Webhook handlers requiring paid data
- ⏰ Scheduled jobs accessing premium endpoints
- 🏢 Microservices with payment requirements

## 🤝 Contributing

Found an issue? Have a suggestion? Open an issue on [GitHub](https://github.com/openlibx402/openlibx402/issues).

## 📄 License

MIT

---

**Note**: This example demonstrates production patterns for integrating Privy with Next.js. The two-server architecture is necessary due to webpack limitations and is a common pattern in the industry.
