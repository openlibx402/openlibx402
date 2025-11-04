# OpenLibx402 RAG Chatbot Documentation

Welcome to the comprehensive documentation for the OpenLibx402 RAG (Retrieval-Augmented Generation) Chatbot. This chatbot integrates AI-powered question answering with Solana blockchain payments.

## 📚 Documentation Overview

### For First-Time Users

Start here if you're new to the chatbot:

1. **[Quick Start](quickstart.md)** (5 min read)
   - Get the chatbot running locally in 5 minutes
   - Basic setup and testing
   - Common troubleshooting

2. **[Overview](overview.md)** (10 min read)
   - What is the chatbot?
   - Key features and benefits
   - High-level architecture
   - Technology stack

### For Developers

Develop and understand the system:

1. **[Architecture](architecture.md)** (20 min read)
   - System design and component interactions
   - Data flow diagrams
   - Design patterns and decisions
   - Performance and scalability considerations

2. **[Configuration](configuration.md)** (15 min read)
   - Environment variables
   - API key setup
   - Network configuration
   - Solana wallet setup

3. **[API Reference](api.md)** (15 min read)
   - All REST endpoints
   - Request/response formats
   - Error handling
   - Code examples in JavaScript and Python

4. **[Payment System](payments.md)** (15 min read)
   - How USDC payments work
   - Transaction verification
   - Testing payments
   - Security considerations

### For Operations

Deploy and maintain the system:

1. **[Deployment Guide](deployment.md)** (30 min read)
   - Step-by-step production deployment
   - Docker containerization
   - Nginx reverse proxy setup
   - Monitoring and alerts
   - Scaling strategies

## Quick Links

### Getting Started

- ⚡ [Quick Start](quickstart.md) - Run in 5 minutes
- 📖 [Configuration Guide](configuration.md) - Environment variables
- 🚀 [Deployment Guide](deployment.md) - Production setup

### API & Integration

- 📡 [API Reference](api.md) - Complete endpoint documentation
- 💰 [Payment System](payments.md) - USDC integration details
- 🏗️ [Architecture](architecture.md) - System design deep-dive

### Support

- 🆘 [Common Issues](quickstart.md#common-issues) - Troubleshooting
- 📋 [Configuration Troubleshooting](configuration.md#troubleshooting)
- 🔍 [Payment Troubleshooting](payments.md#troubleshooting)

## Feature Overview

### Chat Interface
- **AI-Powered Responses**: Uses OpenAI GPT-5 nano for intelligent answers
- **Document Retrieval**: Searches documentation using Pinecone vector database
- **Citation Sources**: Every answer includes links to source documents
- **Conversation History**: Stores chat history in browser localStorage

### Rate Limiting
- **Free Tier**: 3 queries per day per user (by IP address)
- **Paid Tier**: Purchase 10-1000 additional queries with USDC
- **Daily Reset**: Limits reset at midnight UTC
- **Transparent UI**: Shows remaining queries and reset time

### Payment System
- **USDC on Solana**: Secure, fast blockchain payments
- **Variable Amounts**: Choose from 0.01 to 1.00 USDC
- **Instant Verification**: Transaction verified on blockchain
- **Automatic Grants**: Queries granted immediately after payment

## Key Metrics

### Performance
- **Response Time**: < 2 seconds (P95)
- **Uptime Target**: 99.9%
- **Error Rate**: < 1%

### Cost
- **Operating Cost**: ~$0.000133 per query (GPT-5 nano)
- **User Revenue**: $0.001 per query
- **Profit Margin**: ~87%

## Architecture at a Glance

```
Frontend (Browser)
    ↓ (Chat, Payments)
Deno Backend Server
    ├─ OpenAI (Response generation)
    ├─ Pinecone (Document retrieval)
    ├─ Solana (Payment verification)
    └─ Deno KV (Rate limiting)
```

## File Structure

```
docs/
└── chatbot/
    ├── index.md                 # This file
    ├── quickstart.md           # 5-minute setup guide
    ├── overview.md             # Feature overview
    ├── architecture.md         # System design
    ├── configuration.md        # Environment setup
    ├── api.md                  # REST API reference
    ├── payments.md             # Payment system
    └── deployment.md           # Production deployment

chatbot/
├── src/
│   ├── main.ts                 # Server entry point
│   ├── handlers/               # HTTP request handlers
│   ├── middleware/             # Request middleware
│   ├── services/               # External integrations
│   └── utils/                  # Utilities
├── .env                        # Environment variables
└── deno.json                   # Deno configuration
```

## Common Tasks

### I want to...

**...try the chatbot locally**
→ Read [Quick Start](quickstart.md)

**...understand how it works**
→ Read [Overview](overview.md) and [Architecture](architecture.md)

**...integrate the API**
→ Read [API Reference](api.md)

**...set up payments**
→ Read [Payment System](payments.md)

**...deploy to production**
→ Read [Deployment Guide](deployment.md)

**...change configuration**
→ Read [Configuration Guide](configuration.md)

**...troubleshoot issues**
→ Read respective troubleshooting sections

## Environment Variables Summary

| Variable | Purpose | Status |
|----------|---------|--------|
| `OPENAI_API_KEY` | GPT API access | Required |
| `PINECONE_API_KEY` | Vector DB access | Required |
| `PINECONE_INDEX_NAME` | Index name | Required |
| `X402_WALLET_ADDRESS` | Payment receiver | Required |
| `X402_WALLET_SECRET_KEY` | Sign transactions | Required |
| `SOLANA_NETWORK` | devnet/mainnet | Required |
| `USDC_MINT_ADDRESS` | Token address | Required |
| `RATE_LIMIT_FREE_QUERIES` | Free queries/day | Optional (default: 3) |
| `PORT` | Server port | Optional (default: 3000) |
| `ALLOWED_ORIGINS` | CORS origins | Optional |

## Endpoints Summary

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/chat` | Send message to chatbot |
| GET | `/api/status` | Check rate limit status |
| GET | `/api/payment/info` | Get payment configuration |
| POST | `/api/payment` | Submit USDC payment |

## Pricing

| Amount | Queries | Cost/Query | Use Case |
|--------|---------|-----------|----------|
| Free | 3/day | $0 | Trial users |
| 0.01 USDC | 10 | $0.001 | Light users |
| 0.50 USDC | 500 | $0.001 | Active users |
| 1.00 USDC | 1000 | $0.001 | Power users |

## Support & Resources

### Documentation
- 📖 Full documentation: See above
- 🔗 API Swagger: (Coming soon)
- 📝 Changelog: Available in main README

### Getting Help
1. Check [Quick Start Troubleshooting](quickstart.md#common-issues)
2. Check relevant section (Configuration, Payments, Deployment)
3. Review server logs for `[ERROR]` messages
4. Create an issue on GitHub

### External Resources
- 🔗 [Deno Docs](https://deno.land/manual)
- 🔗 [Hono Framework](https://hono.dev)
- 🔗 [Pinecone Docs](https://docs.pinecone.io)
- 🔗 [OpenAI API Docs](https://platform.openai.com/docs)
- 🔗 [Solana Docs](https://docs.solana.com)
- 🔗 [Phantom Wallet](https://phantom.app)

## Roadmap

### Current Version (1.0)
✅ Chat with RAG
✅ Rate limiting
✅ USDC payments
✅ Conversation history

### Planned Features
- [ ] User accounts
- [ ] Subscription plans
- [ ] Multiple languages
- [ ] Voice input/output
- [ ] Export conversations
- [ ] Custom fine-tuning
- [ ] Analytics dashboard
- [ ] Admin panel

## License

OpenLibx402 RAG Chatbot is released under the [MIT License](../LICENSE).

## Contributors

Built with ❤️ by the OpenLibx402 team.

---

**Last Updated**: 2025-11-04
**Version**: 1.0.0
**Status**: Production Ready

Need help? Check the [Quick Start Guide](quickstart.md) or [Deployment Guide](deployment.md)!
