# Quick Start Guide

Get the OpenLibx402 RAG Chatbot up and running in 5 minutes.

## Prerequisites

- Deno 1.x+ ([Install](https://deno.land/#installation))
- OpenAI API key ([Get one](https://platform.openai.com/api-keys))
- Pinecone account ([Create](https://app.pinecone.io))

## 1. Setup (2 minutes)

```bash
# Navigate to chatbot directory
cd openlibx402/chatbot

# Create .env file
cat > .env << 'EOF'
OPENAI_API_KEY=sk-proj-your-key-here
PINECONE_API_KEY=pcsk_your-key-here
PINECONE_INDEX_NAME=openlibx402-docs
X402_WALLET_ADDRESS=HMYDGuLTCL6r5pGL8yUbj27i4pyafpomfhZLq3psxm7L
X402_WALLET_SECRET_KEY=[137,174,28,79,13,105,253,115,92,47,1,209,169,160,241,189,17,251,27,225,172,209,84,43,143,100,219,114,248,112,8,117,242,253,229,233,202,205,228,253,191,126,8,194,34,243,59,154,2,74,186,146,72,72,94,206,84,43,36,16,140,176,239,55]
SOLANA_NETWORK=devnet
USDC_MINT_ADDRESS=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
RATE_LIMIT_FREE_QUERIES=3
PORT=3000
ALLOWED_ORIGINS=http://localhost:8000,http://localhost:3000
EOF
```

Replace the API keys with your actual keys.

## 2. Start Server (1 minute)

```bash
deno run --allow-net --allow-env --allow-read --allow-ffi src/main.ts
```

You should see:
```
[INFO] [RAGBOT] Server listening on http://localhost:3000
```

## 3. Test Chatbot (2 minutes)

### Option A: Via Browser

1. Open `http://localhost:8000` (your docs site)
2. Click the chat bubble (💬) in bottom-right
3. Type a question: "What is OpenLibx402?"
4. See the response!

### Option B: Via cURL

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What is OpenLibx402?"}'
```

## 4. Test Payments (Optional)

To test the payment system:

1. **Get devnet tokens**:
   - Visit https://spl-token-faucet.com/
   - Paste your Phantom wallet address
   - Select USDC token
   - Request airdrop

2. **Make a test payment**:
   - Use 3 free queries in chatbot
   - Click "Pay with Solana"
   - Select 0.01 USDC (10 queries)
   - Confirm in Phantom wallet
   - Wait for blockchain confirmation
   - See queries granted!

## Common Issues

### "Server won't start"

```bash
# Check Deno is installed
deno --version

# Check port 3000 is available
lsof -i :3000
```

### "OpenAI API error"

```bash
# Verify your API key
echo $OPENAI_API_KEY

# Check your account has credits
# https://platform.openai.com/account/billing/overview
```

### "Pinecone connection error"

```bash
# Check index exists
# https://app.pinecone.io

# Verify API key in .env file
cat .env | grep PINECONE
```

### "No responses from chat"

Check server logs for errors:
```bash
# Look for [ERROR] messages
# Verify Pinecone index has documents
# Check OpenAI API key is valid
```

## Next Steps

- 📖 Read [Configuration Guide](configuration.md) for advanced setup
- 🚀 See [Deployment Guide](deployment.md) for production
- 💰 Learn about [Payment System](payments.md)
- 📚 Check [API Reference](api.md) for all endpoints

## File Structure

```
chatbot/
├── src/
│   ├── main.ts                 # Server entry point
│   ├── handlers/
│   │   ├── chat.ts            # Chat endpoint
│   │   └── payment.ts         # Payment endpoint
│   ├── middleware/
│   │   └── rateLimit.ts       # Rate limiting
│   ├── services/
│   │   ├── openai.ts          # OpenAI integration
│   │   ├── pinecone.ts        # Pinecone integration
│   │   └── solana.ts          # Solana verification
│   └── utils/
│       ├── config.ts          # Configuration
│       └── logger.ts          # Logging
├── .env                        # Environment variables
├── deno.json                   # Deno config
└── deno.lock                   # Dependency lock file

docs/
├── overrides/
│   ├── main.html              # MkDocs template
│   └── assets/javascripts/
│       └── chatbot.js         # Frontend widget
└── chatbot/
    ├── overview.md            # This guide
    ├── configuration.md       # Configuration docs
    ├── api.md                 # API reference
    ├── payments.md            # Payment docs
    ├── deployment.md          # Deployment guide
    └── quickstart.md          # Quick start
```

## Key Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/chat` | Send message to chatbot |
| GET | `/api/status` | Check rate limit |
| GET | `/api/payment/info` | Get payment info |
| POST | `/api/payment` | Submit payment |

## Environment Variables Summary

| Variable | Purpose | Required |
|----------|---------|----------|
| `OPENAI_API_KEY` | GPT API access | ✅ Yes |
| `PINECONE_API_KEY` | Vector DB access | ✅ Yes |
| `PINECONE_INDEX_NAME` | Index name | ✅ Yes |
| `X402_WALLET_ADDRESS` | Payment receiver | ✅ Yes |
| `X402_WALLET_SECRET_KEY` | Sign transactions | ✅ Yes |
| `SOLANA_NETWORK` | devnet/mainnet | ✅ Yes |
| `USDC_MINT_ADDRESS` | Token address | ✅ Yes |
| `RATE_LIMIT_FREE_QUERIES` | Free limit per day | ⚠️ Optional (default: 3) |
| `PORT` | Server port | ⚠️ Optional (default: 3000) |
| `ALLOWED_ORIGINS` | CORS origins | ⚠️ Optional |

## Rate Limiting

- **Free**: 3 queries per day (per IP)
- **Paid**: Purchase with USDC (10-1000 queries)
- **Reset**: Daily at midnight UTC

## Pricing

- **Cost to user**: $0.001 per query (0.01 USDC = 10 queries)
- **Cost to operate**: ~$0.000133 per query
- **Profit margin**: ~87%

## Support

For issues or questions:
1. Check [Configuration Guide](configuration.md#troubleshooting)
2. Check [Payment System](payments.md#troubleshooting)
3. Review server logs for [ERROR] messages
4. Create an issue on GitHub

## What's Next?

Once you have the chatbot running:

1. **Test thoroughly** on devnet with USDC payments
2. **Review the API** at `/docs/chatbot/api.md`
3. **Configure production** settings following `/docs/chatbot/deployment.md`
4. **Deploy to production** using Docker or VPS
5. **Monitor costs** and performance
6. **Gather feedback** from users

Enjoy your RAG chatbot! 🚀
