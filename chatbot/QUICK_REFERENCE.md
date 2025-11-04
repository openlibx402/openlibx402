# Quick Reference - RAG Chatbot

## Essential Commands

```bash
# Setup
cp .env.example .env          # Create environment file
deno task index               # Index documentation (required!)

# Development
deno task dev                 # Start with hot reload
deno task start               # Start production mode

# Deployment
./deploy.sh                   # Deploy to Deno Deploy

# Testing
curl http://localhost:8000/api/health
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'
```

## Required Environment Variables

```bash
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
PINECONE_INDEX_NAME=openlibx402-docs
```

## Project Structure

```
chatbot/
├── main.ts              # App entry point
├── src/
│   ├── handlers/       # HTTP handlers
│   ├── services/       # Business logic (RAG, LLM)
│   ├── middleware/     # Rate limiting
│   └── utils/          # Config, logger
└── scripts/
    └── index-docs.ts   # Indexing script
```

## API Endpoints

```
GET  /api/health         # Health check
GET  /api/status         # Rate limit status
POST /api/chat           # Chat (non-streaming)
POST /api/chat-stream    # Chat (SSE streaming)
POST /api/payment        # Submit payment
GET  /api/payment/info   # Payment details
```

## Common Tasks

### Re-index Documentation
```bash
deno task index
```
Run this whenever you update your docs!

### Change Rate Limits
```bash
# In .env or Deno Deploy
RATE_LIMIT_FREE_QUERIES=5
```

### Update Widget Colors
Edit: `docs/overrides/assets/stylesheets/chatbot.css`

### View Logs (Production)
```bash
# Deno Deploy dashboard
https://dash.deno.com/projects/openlibx402-ragbot/logs
```

### Test Streaming
```bash
curl -N -X POST http://localhost:8000/api/chat-stream \
  -H "Content-Type: application/json" \
  -d '{"message": "What is OpenLibx402?"}'
```

## Pinecone Setup

1. Create index at [app.pinecone.io](https://app.pinecone.io/)
2. Settings:
   - **Dimensions**: 1536
   - **Metric**: cosine
   - **Pod Type**: Starter (free) or Standard

## OpenAI Setup

1. Get API key at [platform.openai.com](https://platform.openai.com/)
2. Ensure billing is set up
3. Models used:
   - **Chat**: `gpt-4o-mini`
   - **Embeddings**: `text-embedding-3-small`

## Deployment Checklist

- [ ] Pinecone index created
- [ ] OpenAI API key obtained
- [ ] Environment variables configured
- [ ] Documentation indexed (`deno task index`)
- [ ] Local testing complete
- [ ] Deployed to Deno Deploy
- [ ] Environment variables set in Deno Deploy
- [ ] MkDocs config updated with deployment URL
- [ ] Widget tested on live site

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Rate limiter not initialized" | Add `"lib": ["deno.window", "deno.unstable"]` to `deno.json` |
| CORS errors | Update `ALLOWED_ORIGINS` in environment |
| No search results | Re-run `deno task index` |
| High costs | Use `gpt-4o-mini`, implement caching |

## Cost Breakdown

- **Indexing**: ~$0.10 (one-time)
- **Pinecone**: $0 (free) or $70/month
- **OpenAI**: $5-20/month
- **Deno Deploy**: $0 (free tier)

## Support Resources

- **README**: Comprehensive documentation
- **API.md**: API reference
- **SETUP.md**: Detailed setup guide
- **Issues**: https://github.com/openlibx402/openlibx402/issues

## Widget Integration

Already set up! Just verify in MkDocs:

```yaml
# mkdocs.yml
theme:
  custom_dir: overrides

extra:
  chatbot_api_url: https://your-deployment.deno.dev
```

## Rate Limiting Behavior

- **Free**: 3 queries/day per IP
- **Paid**: 0.1 USDC per query
- **Reset**: Daily at midnight UTC
- **Headers**: X-RateLimit-* in all responses

## Payment Flow

1. User exceeds 3 queries → 402 error
2. User sends 0.1 USDC to wallet
3. User submits tx signature to `/api/payment`
4. System verifies and grants 1 query

## Performance Tips

1. **Reduce latency**: Deploy Deno in region close to users
2. **Reduce costs**: Use smaller models, implement caching
3. **Improve accuracy**: Adjust chunk sizes, use hybrid search
4. **Scale up**: Upgrade Pinecone tier, use CDN for widget

## Next Steps

1. ✅ Set up Pinecone
2. ✅ Set up OpenAI
3. ✅ Configure environment
4. ✅ Index documentation
5. ✅ Test locally
6. ✅ Deploy to Deno Deploy
7. ✅ Update MkDocs config
8. ✅ Test on live site
9. 🔄 Monitor usage and costs
10. 🔄 Iterate based on user feedback
