# Privy Agent Example

This example demonstrates how to use Privy's server-side wallets with x402 for agentic payments.

## Setup

1. **Create a Privy Account**
   - Go to https://privy.io and create an account
   - Create a new app in the dashboard

2. **Get Credentials**
   - Copy your App ID and App Secret from the dashboard
   - Create a server wallet in the Wallets section
   - Note the wallet ID

3. **Fund the Wallet**
   - For devnet: Use a faucet to get devnet SOL and USDC
   - For mainnet: Transfer real SOL and USDC to the wallet address

4. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Privy credentials
   ```

## Running

```bash
# Install dependencies
pnpm install

# Run the example
pnpm start
```

## How It Works

1. The agent initializes a Privy client with server wallet credentials
2. When making an HTTP request, if the server returns 402 Payment Required:
   - The client creates a Solana payment transaction
   - Sends it to Privy for signing (no private keys in code)
   - Broadcasts the signed transaction
   - Retries the request with payment authorization

## Testing with a Local Server

You can test with any x402-enabled server. See the `express-server` example for setting up a local server.

```bash
# In one terminal, run the server
cd ../express-server
pnpm start

# In another terminal, run this agent
pnpm start
```

## Security Notes

- Never commit your `.env` file
- Use environment variables for production
- Set appropriate `maxPaymentAmount` limits
- Monitor wallet activity in Privy dashboard
