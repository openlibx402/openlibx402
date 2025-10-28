# Express.js Server Example with X402 Payment Support

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