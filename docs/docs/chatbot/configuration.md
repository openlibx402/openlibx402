# Chatbot Configuration

The chatbot backend is configured via environment variables in the `.env` file located in the `chatbot/` directory.

## Environment Variables

### OpenAI Configuration

```env
OPENAI_API_KEY=sk-proj-xxx...
```

Your OpenAI API key for accessing GPT models. Get one from [OpenAI Platform](https://platform.openai.com/api-keys).

**Required**: Yes

### Pinecone Configuration

```env
PINECONE_API_KEY=pcsk_xxx...
PINECONE_INDEX_NAME=openlibx402-docs
```

**PINECONE_API_KEY**: Your Pinecone API key from [Pinecone Console](https://app.pinecone.io)

**PINECONE_INDEX_NAME**: The name of your Pinecone index containing document embeddings. Default: `openlibx402-docs`

**Required**: Yes

### Solana Payment Configuration

```env
X402_WALLET_ADDRESS=HMYDGuLTCL6r5pGL8yUbj27i4pyafpomfhZLq3psxm7L
X402_WALLET_SECRET_KEY=[137,174,28,79,...]
SOLANA_NETWORK=devnet
USDC_MINT_ADDRESS=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
X402_PAYMENT_AMOUNT=0.01
X402_PAYMENT_TOKEN=USDC
```

| Variable | Description | Default |
|----------|-------------|---------|
| `X402_WALLET_ADDRESS` | Solana wallet address to receive payments | Required |
| `X402_WALLET_SECRET_KEY` | Secret key (as JSON array) for signing transactions | Required |
| `SOLANA_NETWORK` | Network: `devnet` or `mainnet-beta` | `devnet` |
| `USDC_MINT_ADDRESS` | USDC token mint address | `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` (devnet) |
| `X402_PAYMENT_AMOUNT` | Default payment amount (deprecated, frontend uses slider) | `0.01` |
| `X402_PAYMENT_TOKEN` | Token symbol for payments | `USDC` |

**Notes**:
- Secret key must be in JSON array format: `[byte1,byte2,...]`
- For production, use mainnet USDC: `EPjFWaYCh7QFMZWWB2BHXZPE6q8bZvWfNvwsKqVDTLST`
- Never commit secret keys to version control

### Rate Limiting Configuration

```env
RATE_LIMIT_FREE_QUERIES=3
```

Number of free queries allowed per user per day. Default: `3`

### Server Configuration

```env
PORT=3000
ALLOWED_ORIGINS=http://localhost:8000,http://localhost:3000,https://openlibx402.github.io
```

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:8000,http://localhost:3000` |

## Environment Files

### Development (.env)

Local development configuration. Never commit this to version control.

```env
OPENAI_API_KEY=sk-proj-test-key...
PINECONE_API_KEY=pcsk-test-key...
PINECONE_INDEX_NAME=openlibx402-docs
X402_WALLET_ADDRESS=your-devnet-wallet
X402_WALLET_SECRET_KEY=[...]
SOLANA_NETWORK=devnet
USDC_MINT_ADDRESS=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
RATE_LIMIT_FREE_QUERIES=3
PORT=3000
ALLOWED_ORIGINS=http://localhost:8000,http://localhost:3000
```

### Production (.env.production)

Production configuration with mainnet settings.

```env
OPENAI_API_KEY=sk-proj-production-key...
PINECONE_API_KEY=pcsk-production-key...
PINECONE_INDEX_NAME=openlibx402-docs-prod
X402_WALLET_ADDRESS=your-mainnet-wallet
X402_WALLET_SECRET_KEY=[...]
SOLANA_NETWORK=mainnet-beta
USDC_MINT_ADDRESS=EPjFWaYCh7QFMZWWB2BHXZPE6q8bZvWfNvwsKqVDTLST
RATE_LIMIT_FREE_QUERIES=5
PORT=3000
ALLOWED_ORIGINS=https://openlibx402.github.io,https://docs.openlibx402.com
```

## Runtime Configuration

The chatbot loads configuration via the `Config` interface in `src/utils/config.ts`:

```typescript
export interface Config {
  openai: {
    apiKey: string;
  };
  pinecone: {
    apiKey: string;
    indexName: string;
  };
  rateLimit: {
    freeQueries: number;
  };
  server: {
    port: number;
  };
  cors: {
    allowedOrigins: string[];
  };
}
```

## Payment Pricing

The pricing is hardcoded in the payment handler for all deployments:

- **Minimum**: 0.01 USDC = 10 queries
- **Maximum**: 1.00 USDC = 1000 queries
- **Rate**: 1000 queries per USDC

To change pricing, modify `src/handlers/payment.ts` line 100:

```typescript
const queriesGranted = Math.floor(paymentAmount * 1000); // Change multiplier here
```

## Solana Network Setup

### Devnet (Development)

For local development on Solana devnet:

1. Get devnet USDC tokens: https://spl-token-faucet.com/
2. Use devnet wallet address
3. Set `SOLANA_NETWORK=devnet`

### Mainnet (Production)

For production on Solana mainnet:

1. Create mainnet wallet with SOL for transaction fees
2. Ensure wallet has USDC tokens for testing
3. Use mainnet USDC mint: `EPjFWaYCh7QFMZWWB2BHXZPE6q8bZvWfNvwsKqVDTLST`
4. Set `SOLANA_NETWORK=mainnet-beta`

## Frontend Configuration

The frontend chatbot is configured via the HTML script tag:

```html
<script>
  // Optional: Override API URL (defaults to current origin)
  window.CHATBOT_API_URL = 'http://localhost:3000';

  // Load chatbot widget
  window.CHATBOT_DISABLED = false; // Set to true to disable chatbot
</script>
<script src="/assets/javascripts/chatbot.js"></script>
```

## Verifying Configuration

Start the server and check the logs:

```bash
cd chatbot
deno run --allow-net --allow-env --allow-read --allow-ffi main.ts
```

You should see:
```
[INFO] [RAGBOT] Starting OpenLibx402 RAG Chatbot server...
[INFO] [RAGBOT] OpenAI API configured
[INFO] [RAGBOT] Pinecone index connected: openlibx402-docs
[INFO] [RAGBOT] Rate limiter initialized with Deno KV
[INFO] [RAGBOT] CORS enabled for origins: http://localhost:8000, http://localhost:3000
[INFO] [RAGBOT] Server listening on http://localhost:3000
```

## Troubleshooting

### API Key Errors

```
[ERROR] OpenAI API key not configured
```

**Solution**: Ensure `OPENAI_API_KEY` is set in `.env` file.

### Pinecone Connection Errors

```
[ERROR] Failed to connect to Pinecone
```

**Solution**:
- Verify `PINECONE_API_KEY` is correct
- Check `PINECONE_INDEX_NAME` exists in Pinecone console
- Ensure network connectivity to Pinecone

### CORS Errors

```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution**: Add your origin to `ALLOWED_ORIGINS` in `.env`:

```env
ALLOWED_ORIGINS=http://localhost:8000,http://localhost:3000,https://your-domain.com
```

### Solana Network Errors

```
RpcError: failed to send transaction
```

**Solution**:
- Verify wallet address is valid
- Check wallet has SOL for transaction fees
- Ensure network matches (devnet vs mainnet)
- Verify recipient wallet exists on the network

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use environment variables** for all secrets
3. **Rotate API keys** regularly
4. **Monitor spending** on OpenAI and Pinecone
5. **Use HTTPS** in production
6. **Validate all inputs** on the backend
7. **Rate limit payment endpoints** to prevent abuse
