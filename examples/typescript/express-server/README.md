# Express.js Server Example with X402 Payment Support

```bash
git clone https://github.com/openlibx402/openlibx402.git
cd openlibx402
```

This example demonstrates how to create an Express.js API server with X402 payment requirements for specific endpoints.

## Features

- **Free endpoints** - Public access without payment
- **Premium endpoints** - Require payment to access
- **Automatic payment verification** - Built-in Solana blockchain verification
- **Flexible pricing** - Different amounts for different endpoints
- **TypeScript** - Full type safety

## Setup

### 1. Install Dependencies

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
PAYMENT_WALLET_ADDRESS=your_solana_wallet_address_here
USDC_MINT_ADDRESS=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
SOLANA_RPC_URL=https://api.devnet.solana.com
PORT=3000
```

### 3. Build and Run

```bash
# Build TypeScript
npm run build

# Start server
npm start

# Or run in development mode
npm run dev
```

The server will start on `http://localhost:3000`.

## API Endpoints

### Free Endpoints

- **GET /** - API information (no payment)
- **GET /free-data** - Free data access (no payment)

### Paid Endpoints

- **GET /premium-data** - Premium data (0.10 USDC)
- **GET /expensive-data** - AI inference (1.00 USDC)
- **GET /tiered-data/:tier** - Tiered content (0.05 USDC)
- **POST /process-data** - Data processing (0.25 USDC)

## Usage Examples

### Free Endpoint

```bash
curl http://localhost:3000/free-data
```

Response:
```json
{
  "data": "This is free content available to everyone",
  "price": 0,
  "access": "public"
}
```

### Paid Endpoint (Without Payment)

```bash
curl http://localhost:3000/premium-data
```

Response (402 Payment Required):
```json
{
  "max_amount_required": "0.10",
  "asset_type": "SPL",
  "asset_address": "DEMO_USDC_MINT",
  "payment_address": "DEMO_WALLET_ADDRESS",
  "network": "solana-devnet",
  "expires_at": "2025-01-01T10:05:00Z",
  "nonce": "...",
  "payment_id": "...",
  "resource": "/premium-data"
}
```

### Paid Endpoint (With Payment)

Using the X402 client:

```typescript
import { X402AutoClient } from '@openlibx402/client';
import { Keypair } from '@solana/web3.js';

const keypair = Keypair.fromSecretKey(/* your key */);
const client = new X402AutoClient(keypair);

const response = await client.get('http://localhost:3000/premium-data');
console.log(response.data);
```

## Client Example

Run the included client example:

```bash
# Make sure the server is running first
npm start

# In another terminal
npm run dev src/client-example.ts
```

This demonstrates:
- Automatic payment handling with `X402AutoClient`
- Manual payment control with `X402Client`
- Accessing multiple endpoints

## Project Structure

```
express-server/
├── src/
│   ├── server.ts         # Main Express server
│   └── client-example.ts # Example client usage
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run watch
```

### Run with ts-node

```bash
npm run dev
```

## How It Works

### Server Side

1. Import and initialize X402:

```typescript
import { X402Config, initX402, paymentRequired } from '@openlibx402/express';

const config = new X402Config({
  paymentAddress: process.env.PAYMENT_WALLET_ADDRESS!,
  tokenMint: process.env.USDC_MINT_ADDRESS!,
  network: 'solana-devnet',
});

initX402(config);
```

2. Add payment requirement to routes:

```typescript
app.get(
  '/premium-data',
  paymentRequired({
    amount: '0.10',
    description: 'Access to premium market data',
  }),
  (req, res) => {
    res.json({ data: 'Premium content' });
  }
);
```

### Client Side

1. Create X402 client:

```typescript
import { X402AutoClient } from '@openlibx402/client';
import { Keypair } from '@solana/web3.js';

const client = new X402AutoClient(keypair);
```

2. Make requests (payment handled automatically):

```typescript
const response = await client.get('http://localhost:3000/premium-data');
```

## Notes

- This example uses Solana Devnet for testing
- You'll need USDC tokens on Devnet for actual payments
- The server verifies payments on-chain by default
- Payment verification can be disabled for testing

## Learn More

- [OpenLibx402 Documentation](../../packages/typescript/README.md)
- [X402 Protocol Specification](https://github.com/openlibx402/spec)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
