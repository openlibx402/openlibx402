# Quick Start Guide

Get up and running with the Next.js Privy X402 example in 5 minutes.

## Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- Privy account (sign up at [privy.io](https://privy.io))

## Step 1: Get Privy Credentials

1. Go to [dashboard.privy.io](https://dashboard.privy.io)
2. Create or select an app
3. Go to **Settings** → Copy your `App ID` and `App Secret`
4. Go to **Wallets** → Create a **Server Wallet** → Copy the `Wallet ID`

## Step 2: Configure Environment

```bash
# From the project root
cd examples/typescript/nextjs-privy-app

# Copy environment template
cp .env.example .env

# Edit .env and add your credentials
nano .env  # or use your preferred editor
```

Add your Privy credentials:
```bash
PRIVY_APP_ID=your-actual-app-id-here
PRIVY_APP_SECRET=your-actual-app-secret-here
PRIVY_WALLET_ID=your-actual-wallet-id-here
```

## Step 3: Install & Run

```bash
# Install dependencies (if not already done)
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 4: Fund Your Wallet (For Testing)

Your Privy wallet needs funds to make payments:

1. Get your wallet address from the app (shown on homepage)
2. Get devnet SOL:
   ```bash
   solana airdrop 1 <YOUR_WALLET_ADDRESS> --url devnet
   ```
3. Get devnet USDC from a faucet (search "Solana devnet USDC faucet")

## Step 5: Test It Out

### Test Wallet Info
Click "Test Endpoint" on the **Wallet Information** card to see your wallet details.

### Test Paid Requests
To test paid requests, you need an X402-enabled API:

**Option A: Use the Express Server Example**
```bash
# In a new terminal
cd examples/typescript/express-server
pnpm install
pnpm start
```

**Option B: Use Your Own X402 API**
Set the `X402_API_URL` environment variable in `.env`

## That's It!

You now have a working Next.js app with Privy-powered X402 payments.

## Common Issues

### "Missing required environment variables"
→ Check that all three Privy variables are set in `.env`

### Wallet balance shows 0
→ Make sure you funded the correct address shown in the app

### Paid requests fail
→ Make sure you have an X402 API running (see Step 5)

## Next Steps

- Read [README.md](README.md) for detailed documentation
- Check [IMPLEMENTATION.md](IMPLEMENTATION.md) for technical details
- Explore the code in the `app/` directory
- Try modifying the payment flow
- Build your own paid endpoints

## Get Help

- [X402 Documentation](https://openlib.xyz)
- [Privy Documentation](https://docs.privy.io)
- [GitHub Issues](https://github.com/openlibx402/openlibx402/issues)

Happy building! 🚀
