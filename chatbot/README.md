# OpenLibx402 RAG Chatbot

A production-ready RAG (Retrieval-Augmented Generation) chatbot for OpenLibx402 documentation, built with Deno, Hono, OpenAI, and Pinecone. Features rate limiting, payment support via Solana, and seamless MkDocs integration.

## Features

- 🤖 **RAG Pipeline**: Semantic search over documentation using Pinecone vector database
- 💬 **Streaming Responses**: Real-time SSE streaming with OpenAI GPT-4o-mini
- 🚦 **Rate Limiting**: 3 free queries per day per user using Deno KV
- 💰 **Payment Support**: Accept 0.1 USDC payments for additional queries (via OpenLibx402 protocol)
- 🎨 **Beautiful UI**: Embedded chat widget for MkDocs documentation
- 🔒 **Production Ready**: CORS, error handling, logging, and monitoring
- 🚀 **Serverless**: Deploy to Deno Deploy with zero configuration

## Quick Start

### Prerequisites

- [Deno](https://deno.land/) 1.38+
- OpenAI API key
- Pinecone API key and index
- (Optional) Solana wallet for payment features

### Installation

1. Clone the repository:
```bash
cd chatbot
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
```bash
# Required
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
PINECONE_INDEX_NAME=openlibx402-docs

# Optional (for payments)
X402_WALLET_SECRET_KEY=...
X402_WALLET_ADDRESS=...
```

### Indexing Documentation

Before running the chatbot, you need to index your documentation:

```bash
deno task index
```

This script will:
1. Read all markdown files from `../docs/docs/`
2. Split them into semantic chunks
3. Generate embeddings using OpenAI
4. Upload vectors to Pinecone

**Note**: Run this script every time you update your documentation.

### Running Locally

Development mode with hot reload:
```bash
deno task dev
```

Production mode:
```bash
deno task start
```

The server will start on `http://localhost:8000` by default.

### Testing the API

Health check:
```bash
curl http://localhost:8000/api/health
```

Rate limit status:
```bash
curl http://localhost:8000/api/status
```

Chat (non-streaming):
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I use OpenLibx402 with FastAPI?"
  }'
```

Chat (streaming with SSE):
```bash
curl -X POST http://localhost:8000/api/chat-stream \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Explain the 402 payment protocol"
  }'
```

## Deployment

### Deno Deploy

1. Install deployctl:
```bash
deno install -Arf https://deno.land/x/deploy/deployctl.ts
```

2. Get your Deno Deploy token from [dash.deno.com](https://dash.deno.com/account#access-tokens)

3. Set environment variables:
```bash
export DENO_DEPLOY_TOKEN=your-token
export DENO_PROJECT_NAME=openlibx402-ragbot
```

4. Deploy:
```bash
./deploy.sh
```

5. Configure environment variables in Deno Deploy dashboard:
   - Go to https://dash.deno.com/projects/openlibx402-ragbot
   - Add all required environment variables from `.env.example`

6. Update `docs/mkdocs.yml` with your deployment URL:
```yaml
extra:
  chatbot_api_url: https://your-project.deno.dev
```

## Architecture

### Components

```
chatbot/
├── main.ts                 # Application entry point
├── src/
│   ├── handlers/          # Request handlers
│   │   ├── chat.ts       # Chat endpoints (streaming & non-streaming)
│   │   ├── health.ts     # Health & status endpoints
│   │   └── payment.ts    # Payment processing
│   ├── services/         # Business logic
│   │   ├── rag.ts        # RAG retrieval & context formatting
│   │   └── llm.ts        # OpenAI chat completions
│   ├── middleware/       # HTTP middleware
│   │   └── rateLimit.ts  # Rate limiting with Deno KV
│   └── utils/            # Utilities
│       ├── config.ts     # Configuration management
│       └── logger.ts     # Logging utilities
└── scripts/
    └── index-docs.ts     # Documentation indexing script
```

### API Endpoints

| Endpoint | Method | Description | Rate Limited |
|----------|--------|-------------|--------------|
| `/` | GET | API information | No |
| `/api/health` | GET | Health check | No |
| `/api/status` | GET | Rate limit status | Yes |
| `/api/chat` | POST | Chat (non-streaming) | Yes |
| `/api/chat-stream` | POST | Chat (SSE streaming) | Yes |
| `/api/payment` | POST | Submit payment | No |
| `/api/payment/info` | GET | Payment information | No |

### Rate Limiting

- **Free Tier**: 3 queries per day per user (tracked by IP)
- **Paid Tier**: 0.1 USDC per additional query
- **Reset**: Daily at midnight UTC
- **Storage**: Deno KV (built-in, serverless)

### Payment Flow

1. User exceeds free tier (3 queries/day)
2. API returns 402 Payment Required with payment details
3. User sends 0.1 USDC to specified Solana address
4. User submits transaction signature to `/api/payment`
5. Server verifies payment and grants 1 additional query

## MkDocs Integration

The chatbot widget is automatically embedded in your MkDocs site:

1. **Files Created**:
   - `docs/overrides/main.html` - Template with widget
   - `docs/overrides/assets/javascripts/chatbot.js` - Widget logic
   - `docs/overrides/assets/stylesheets/chatbot.css` - Widget styles

2. **Configuration** in `mkdocs.yml`:
```yaml
theme:
  custom_dir: overrides

extra:
  chatbot_api_url: https://your-project.deno.dev
```

3. **Features**:
   - Floating chat button (bottom-right corner)
   - Conversation history (stored in localStorage)
   - Source citations for answers
   - Rate limit display
   - Payment integration

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | - | OpenAI API key |
| `PINECONE_API_KEY` | Yes | - | Pinecone API key |
| `PINECONE_INDEX_NAME` | No | `openlibx402-docs` | Pinecone index name |
| `RATE_LIMIT_FREE_QUERIES` | No | `3` | Free queries per day |
| `X402_WALLET_SECRET_KEY` | No | - | Solana wallet private key |
| `X402_WALLET_ADDRESS` | No | - | Solana wallet address |
| `X402_PAYMENT_AMOUNT` | No | `0.1` | Payment amount in USDC |
| `PORT` | No | `8000` | Server port |
| `ALLOWED_ORIGINS` | No | `*` | CORS allowed origins (comma-separated) |

### Pinecone Index Setup

1. Create a new index at [pinecone.io](https://app.pinecone.io/)
2. Settings:
   - **Dimensions**: 1536 (for `text-embedding-3-small`)
   - **Metric**: Cosine
   - **Cloud**: AWS (recommended) or GCP
   - **Region**: Choose closest to your users

## Development

### Project Structure

See [Architecture](#architecture) section above.

### Adding New Endpoints

1. Create handler in `src/handlers/`
2. Import in `main.ts`
3. Add route with appropriate middleware
4. Update API documentation

### Customizing the Widget

- **Styles**: Edit `docs/overrides/assets/stylesheets/chatbot.css`
- **Behavior**: Edit `docs/overrides/assets/javascripts/chatbot.js`
- **Template**: Edit `docs/overrides/main.html`

### Testing

```bash
# Run the chatbot locally
deno task dev

# In another terminal, test endpoints
curl http://localhost:8000/api/health
```

## Troubleshooting

### Common Issues

**1. "Rate limiter not initialized" error**

Deno KV requires the `--unstable` flag in some Deno versions. Update `deno.json`:
```json
{
  "compilerOptions": {
    "lib": ["deno.window", "deno.unstable"]
  }
}
```

**2. CORS errors in browser**

Update `ALLOWED_ORIGINS` in `.env`:
```bash
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
```

**3. No results from RAG**

Run the indexing script again:
```bash
deno task index
```

**4. OpenAI rate limits**

The chatbot uses GPT-4o-mini and text-embedding-3-small for cost efficiency. If you hit rate limits, consider:
- Upgrading your OpenAI tier
- Implementing request queuing
- Caching common queries

## Reusable Package

This implementation also creates `@openlibx402/ragbot`, a reusable TypeScript package for RAG functionality.

**Location**: `packages/typescript/openlibx402-ragbot/`

**Usage**:
```typescript
import { RAGService, LLMService, EmbeddingsService } from '@openlibx402/ragbot';

// Initialize services
const embeddings = new EmbeddingsService(apiKey);
const rag = new RAGService(embeddings, vectorStore);
const llm = new LLMService(config);

// Use in your application
const context = await rag.retrieve('user query');
const response = await llm.complete(messages, context);
```

## License

MIT

## Support

- Documentation: https://openlibx402.github.io/docs/
- Issues: https://github.com/openlibx402/openlibx402/issues
- Discussions: https://github.com/openlibx402/openlibx402/discussions
