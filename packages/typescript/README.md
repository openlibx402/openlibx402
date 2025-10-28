# OpenLibx402 TypeScript Packages

TypeScript/JavaScript implementation of the X402 payment protocol for autonomous AI agent payments on Solana blockchain.

## Packages

### Core Packages

- **[@openlibx402/core](./openlibx402-core)** - Core models, errors, and Solana payment processor
- **[@openlibx402/client](./openlibx402-client)** - HTTP client with automatic payment handling
- **[@openlibx402/express](./openlibx402-express)** - Express.js middleware and utilities

### AI Agent Integration

- **[@openlibx402/langchain](./openlibx402-langchain)** - LangChain.js tools for autonomous payments
- **[@openlibx402/langgraph](./openlibx402-langgraph)** - LangGraph.js workflow nodes

## Quick Start

### 1. Install Dependencies

```bash
cd packages/typescript/openlibx402-core
npm install
npm run build

cd ../openlibx402-client
npm install
npm run build

cd ../openlibx402-express
npm install
npm run build

cd ../openlibx402-langchain
npm install
npm run build

cd ../openlibx402-langgraph
npm install
npm run build
```

### 2. Run the Express.js Example Server

```bash
cd ../../examples/express-server
npm install
npm run build
npm start
```

### 3. Create a Client Application

```typescript
import { Keypair } from '@solana/web3.js';
import { X402AutoClient } from '@openlibx402/client';

// Load your wallet keypair
const keypair = Keypair.fromSecretKey(/* your secret key */);

// Create auto client (handles payments automatically)
const client = new X402AutoClient(keypair, 'https://api.devnet.solana.com');

// Make request - payment happens automatically if required
const response = await client.get('http://localhost:3000/premium-data');
console.log(response.data);

await client.close();
```

## Package Architecture

### @openlibx402/core

Core payment protocol implementation:

- **Models**: `PaymentRequest`, `PaymentAuthorization`
- **Errors**: `X402Error`, `PaymentRequiredError`, etc.
- **Processor**: `SolanaPaymentProcessor` for blockchain operations

### @openlibx402/client

HTTP clients with payment support:

- **X402Client**: Manual payment control
- **X402AutoClient**: Automatic payment handling

### @openlibx402/express

Express.js integration:

- **Middleware**: `paymentRequired()` for protecting routes
- **Config**: Global configuration management
- **Responses**: Helper functions for 402 responses

### @openlibx402/langchain

LangChain.js integration:

- **X402PaymentTool**: Tool for agents to make payments
- Automatic payment handling in agent workflows

### @openlibx402/langgraph

LangGraph.js workflow integration:

- **paymentNode**: Node for handling payments
- **fetchWithPaymentNode**: Combined fetch + payment node
- **Conditional edges**: Payment routing logic

## Examples

See the [examples](../../examples) directory for complete applications:

- **[express-server](../../examples/express-server)** - Express.js API with payment requirements
- More examples coming soon!

## Development

### Building Packages

```bash
# Build individual package
cd packages/typescript/openlibx402-core
npm run build

# Watch mode for development
npm run dev
```

### Testing

```bash
npm test
```

## Environment Variables

Create a `.env` file in your application:

```env
PAYMENT_WALLET_ADDRESS=your_solana_wallet_address
USDC_MINT_ADDRESS=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
SOLANA_RPC_URL=https://api.devnet.solana.com
```

## Protocol Overview

The X402 protocol extends HTTP 402 "Payment Required" for blockchain-based micropayments:

1. Client requests protected endpoint
2. Server returns 402 with `PaymentRequest` JSON
3. Client creates Solana SPL token transfer
4. Client signs transaction and broadcasts to blockchain
5. Client retries with `X-Payment-Authorization` header
6. Server verifies payment and returns 200 with data

## License

MIT
