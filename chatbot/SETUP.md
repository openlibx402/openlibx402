# Setup Guide - OpenLibx402 RAG Chatbot

This guide will help you set up and deploy the RAG chatbot from scratch.

## Prerequisites Checklist

- [ ] Deno 1.38+ installed
- [ ] OpenAI account with API access
- [ ] Pinecone account (free tier works)
- [ ] (Optional) Solana wallet for payments
- [ ] (Optional) Deno Deploy account

## Step 1: Pinecone Setup

### Create Pinecone Index

1. Go to [app.pinecone.io](https://app.pinecone.io/)
2. Sign up or log in
3. Click "Create Index"
4. Configure:
   - **Name**: `openlibx402-docs`
   - **Dimensions**: `1536`
   - **Metric**: `cosine`
   - **Pod Type**: Starter (free) or Standard
   - **Replicas**: 1
   - **Pods**: 1

5. Wait for index creation (usually takes 1-2 minutes)
6. Get your API key:
   - Go to "API Keys" section
   - Copy your API key

### Verify Index

```bash
curl -X GET "https://api.pinecone.io/indexes/openlibx402-docs" \
  -H "Api-Key: YOUR_PINECONE_API_KEY"
```

## Step 2: OpenAI Setup

### Get API Key

1. Go to [platform.openai.com](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys
4. Click "Create new secret key"
5. Copy and save the key (you won't see it again)

### Verify Access

```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_OPENAI_API_KEY"
```

You should see a list of available models including `gpt-4o-mini` and `text-embedding-3-small`.

### Check Billing

Make sure you have billing set up and credits available:
- Go to Settings > Billing
- Add payment method if needed
- Set usage limits (recommended: $10-20/month for development)

## Step 3: Local Development Setup

### Clone and Configure

```bash
# Navigate to chatbot directory
cd chatbot

# Copy environment template
cp .env.example .env

# Edit .env file
nano .env  # or use your preferred editor
```

### Configure Environment Variables

Required variables:
```bash
OPENAI_API_KEY=sk-...                    # From Step 2
PINECONE_API_KEY=...                     # From Step 1
PINECONE_INDEX_NAME=openlibx402-docs     # Your index name
```

Optional variables (use defaults for now):
```bash
RATE_LIMIT_FREE_QUERIES=3
PORT=8000
ALLOWED_ORIGINS=*
```

### Index Documentation

This is a crucial step - it populates your vector database:

```bash
# Run the indexing script
deno task index
```

**Expected output:**
```
Starting document indexing...
Reading markdown files from: /path/to/docs

Found 42 markdown files

Processing: index.md
  Created 5 chunks
Processing: packages/python/openlibx402-core.md
  Created 12 chunks
...

Total chunks: 237

Generating embeddings for 237 chunks...
  Processed 100/237
  Processed 200/237
  Processed 237/237

Upserting vectors to Pinecone...
  Uploaded 100/237
  Uploaded 200/237
  Uploaded 237/237

Indexing complete! ✓

Index stats:
  Total vectors: 237
  Dimensions: 1536
```

**Time estimate**: 2-5 minutes depending on documentation size

**Cost estimate**: ~$0.05-0.10 in OpenAI embedding costs

### Start Development Server

```bash
# Start with hot reload
deno task dev
```

You should see:
```
[2025-01-04T12:00:00.000Z] [INFO] [RAGBOT] Configuration loaded
[2025-01-04T12:00:00.000Z] [INFO] [RAGBOT] Rate limiter initialized with Deno KV
[2025-01-04T12:00:00.000Z] [INFO] [RAGBOT] Services initialized
[2025-01-04T12:00:00.000Z] [INFO] [RAGBOT] Starting server on port 8000
```

### Test Locally

In a new terminal:

```bash
# Health check
curl http://localhost:8000/api/health

# Check rate limit
curl http://localhost:8000/api/status

# Send a test message
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is OpenLibx402?"}'
```

Expected response:
```json
{
  "message": "OpenLibx402 is a library that implements the HTTP 402...",
  "sources": [
    {
      "file": "index.md",
      "relevance": 0.92
    }
  ]
}
```

## Step 4: MkDocs Integration

The widget is already set up, you just need to verify and customize:

### Verify Files

Check that these files exist:
- `docs/overrides/main.html`
- `docs/overrides/assets/javascripts/chatbot.js`
- `docs/overrides/assets/stylesheets/chatbot.css`

### Update mkdocs.yml

Ensure these settings are in `docs/mkdocs.yml`:

```yaml
theme:
  custom_dir: overrides

extra:
  chatbot_api_url: http://localhost:8000  # For local testing
```

### Test MkDocs Locally

```bash
# Navigate to docs directory
cd ../docs

# Serve MkDocs
mkdocs serve
```

Visit http://localhost:8000 and you should see a chat button in the bottom-right corner.

### Customize Widget (Optional)

Edit appearance in `docs/overrides/assets/stylesheets/chatbot.css`:
```css
/* Change widget colors */
.chatbot-header {
  background: linear-gradient(135deg, #your-color-1, #your-color-2);
}
```

## Step 5: Production Deployment

### Deploy to Deno Deploy

1. **Install deployctl**:
```bash
deno install -Arf https://deno.land/x/deploy/deployctl.ts
```

2. **Get Deno Deploy token**:
   - Go to https://dash.deno.com/account#access-tokens
   - Click "New Access Token"
   - Give it a name (e.g., "RAG Chatbot")
   - Copy the token

3. **Set environment variables**:
```bash
export DENO_DEPLOY_TOKEN=your-token-here
export DENO_PROJECT_NAME=openlibx402-ragbot
```

4. **Deploy**:
```bash
cd chatbot
./deploy.sh
```

5. **Configure production environment**:
   - Go to https://dash.deno.com/projects/openlibx402-ragbot
   - Click "Settings" > "Environment Variables"
   - Add all variables from `.env`:
     - `OPENAI_API_KEY`
     - `PINECONE_API_KEY`
     - `PINECONE_INDEX_NAME`
     - `RATE_LIMIT_FREE_QUERIES`
     - `ALLOWED_ORIGINS` (set to your docs domain)

6. **Update MkDocs config**:
```yaml
extra:
  chatbot_api_url: https://openlibx402-ragbot.deno.dev
```

7. **Deploy MkDocs**:
```bash
cd ../docs
mkdocs build
# Deploy to GitHub Pages, Netlify, Vercel, etc.
```

### Verify Production

```bash
# Test production API
curl https://openlibx402-ragbot.deno.dev/api/health

# Visit your docs site
open https://openlibx402.github.io/docs/
```

## Step 6: Enable Payments (Optional)

### Setup Solana Wallet

1. **Create wallet**:
```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"

# Create new keypair
solana-keygen new --outfile ~/openlibx402-wallet.json
```

2. **Get wallet address**:
```bash
solana-keygen pubkey ~/openlibx402-wallet.json
```

3. **Add to environment**:
```bash
# In .env or Deno Deploy
X402_WALLET_ADDRESS=YourWalletAddressHere...
X402_WALLET_SECRET_KEY=base58-encoded-secret
X402_PAYMENT_AMOUNT=0.1
X402_PAYMENT_TOKEN=USDC
```

### Test Payment Flow

1. User exceeds rate limit (3 queries)
2. API returns 402 with payment info
3. User sends USDC to wallet
4. User submits transaction signature
5. System verifies and grants access

## Monitoring and Maintenance

### View Logs (Deno Deploy)

```bash
# Via dashboard
# https://dash.deno.com/projects/openlibx402-ragbot/logs

# Via deployctl
deployctl logs --project=openlibx402-ragbot
```

### Monitor Usage

- **Deno Deploy**: Dashboard shows requests, errors, runtime
- **OpenAI**: Usage dashboard shows API costs
- **Pinecone**: Dashboard shows query volume

### Re-index Documentation

Whenever you update docs:

```bash
cd chatbot
deno task index
```

**Pro tip**: Set up a GitHub Action to auto-index on docs changes:

```yaml
# .github/workflows/index-docs.yml
name: Index Documentation
on:
  push:
    paths:
      - 'docs/**/*.md'
jobs:
  index:
    runs-on: ubuntu-latest
    steps:
      - uses: denoland/setup-deno@v1
      - run: cd chatbot && deno task index
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          PINECONE_API_KEY: ${{ secrets.PINECONE_API_KEY }}
```

### Update Rate Limits

Edit in Deno Deploy environment variables or `.env`:
```bash
RATE_LIMIT_FREE_QUERIES=5  # Increase to 5 queries
```

## Troubleshooting

### "Rate limiter not initialized"

Add to `deno.json`:
```json
{
  "compilerOptions": {
    "lib": ["deno.window", "deno.unstable"]
  }
}
```

### CORS errors

Update allowed origins:
```bash
ALLOWED_ORIGINS=https://your-domain.com,http://localhost:8000
```

### High OpenAI costs

- Use caching for common queries
- Reduce `maxTokens` in config
- Increase chunk overlap to reduce retrieval calls

### Pinecone connection errors

- Verify API key is correct
- Check index name matches
- Ensure index region is accessible

### No search results

- Verify indexing completed successfully
- Check embedding dimensions (must be 1536)
- Lower the `minScore` threshold in RAG service

## Next Steps

- [ ] Customize widget appearance
- [ ] Set up monitoring and alerts
- [ ] Implement payment verification
- [ ] Add analytics tracking
- [ ] Create custom prompt templates
- [ ] Add multilingual support

## Cost Estimates

**Monthly costs** (based on moderate usage):

- **Pinecone**: $0 (free tier) or $70 (standard)
- **OpenAI**: $5-20 (depends on query volume)
- **Deno Deploy**: $0-20 (free tier covers most use cases)

**Total**: $5-110/month

## Support

- Documentation: See [README.md](./README.md)
- API Reference: See [API.md](./API.md)
- Issues: https://github.com/openlibx402/openlibx402/issues
