# Quick Start Guide - Next.js + Privy + X402

Get running in **5 minutes**.

## Step 1: Get Privy Credentials (2 min)

1. Go to [dashboard.privy.io](https://dashboard.privy.io) and sign up/login
2. Create or select an app
3. Go to **Settings** → Copy `App ID` and `App Secret`
4. Go to **Wallets** → Create a **Server Wallet** → Copy `Wallet ID`

## Step 2: Install & Configure (1 min)

```bash
# Navigate to example
cd examples/typescript/nextjs-privy-app

# Install dependencies (both Next.js and Express)
pnpm install
cd server && pnpm install && cd ..

# Configure environment
cp .env.example .env
nano .env  # Add your Privy credentials
```

Your `.env` should look like:
```bash
PRIVY_APP_ID=your-actual-app-id
PRIVY_APP_SECRET=your-actual-secret
PRIVY_WALLET_ID=your-actual-wallet-id
```

## Step 3: Run (1 min)

Open **two terminals**:

**Terminal 1 - Express Server:**
```bash
cd examples/typescript/nextjs-privy-app/server
pnpm dev
```
Wait for: `✅ Privy X402 Server running on http://localhost:3001`

**Terminal 2 - Next.js:**
```bash
cd examples/typescript/nextjs-privy-app
pnpm dev
```
Wait for: `✓ Ready in X ms`

## Step 4: Test (1 min)

1. Open [http://localhost:3000](http://localhost:3000)
2. You should see the X402 + Privy demo page
3. Click "Test Endpoint" on the **Wallet Information** card
4. See your Privy wallet address and balance!

## That's It! 🎉

You now have:
- ✅ Next.js frontend running
- ✅ Express backend with Privy integration
- ✅ Wallet info displaying
- ✅ Ready to make X402 payments

## Next Steps

### Fund Your Wallet (Optional - for testing payments)

```bash
# Get your wallet address from the app
# Then airdrop devnet SOL:
solana airdrop 1 YOUR_WALLET_ADDRESS --url devnet
```

### Test Paid Requests (Optional)

Start an X402-enabled API:

```bash
# In terminal 3
cd examples/typescript/express-server
pnpm install
pnpm start
```

Then click "Test Endpoint" on the paid request cards in the UI.

## Common Issues

### Express server won't start
→ Check that you're in the `server` directory
→ Run `pnpm install` again

### "Missing Privy credentials"
→ Make sure all 3 variables are in `.env`
→ No quotes needed around the values

### Port 3001 already in use
→ Kill the process: `lsof -ti:3001 | xargs kill`
→ Or change `SERVER_PORT` in `.env`

### Frontend can't connect to backend
→ Make sure Express server is running first
→ Check terminal 1 for the "Server running" message

## Learn More

- [README-UPDATED.md](README-UPDATED.md) - Full documentation
- [README-ARCHITECTURE.md](README-ARCHITECTURE.md) - Why two servers?
- [IMPLEMENTATION.md](IMPLEMENTATION.md) - Technical details

## Get Help

- X402 Docs: https://openlib.xyz
- Privy Docs: https://docs.privy.io
- Issues: https://github.com/openlibx402/openlibx402/issues

Happy building! 🚀
