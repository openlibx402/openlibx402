# Architecture Documentation

Technical deep-dive into the OpenLibx402 RAG Chatbot architecture and design decisions.

## System Overview

The chatbot is a Retrieval-Augmented Generation (RAG) system that combines:

1. **Document Retrieval**: Pinecone vector database for semantic search
2. **Response Generation**: OpenAI GPT models for intelligent answers
3. **Rate Limiting**: Deno KV for per-user query tracking
4. **Payment Processing**: Solana blockchain for USDC transactions

## Component Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                      Client (Browser)                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Chatbot Widget (chatbot.js)                             │  │
│  │  - Chat interface (React-like pattern)                   │  │
│  │  - LocalStorage for conversation history                │  │
│  │  - Phantom wallet integration                           │  │
│  │  - Real-time payment UI updates                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                           ↓ HTTP (REST)
┌────────────────────────────────────────────────────────────────┐
│                    Deno Backend Server                          │
│                   (Hono Framework)                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  HTTP Handlers                                          │  │
│  │  ├─ POST /api/chat              → ChatHandler          │  │
│  │  ├─ GET /api/status             → RateLimitCheck       │  │
│  │  ├─ GET /api/payment/info       → PaymentInfo          │  │
│  │  └─ POST /api/payment           → PaymentHandler       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Middleware                                             │  │
│  │  ├─ CORS Middleware                                    │  │
│  │  ├─ RateLimiter Middleware                            │  │
│  │  └─ Logging Middleware                                │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Services                                               │  │
│  │  ├─ OpenAIService                                       │  │
│  │  │  └─ Text generation (GPT-5 nano)                     │  │
│  │  ├─ PineconeService                                     │  │
│  │  │  └─ Semantic search & retrieval                      │  │
│  │  ├─ SolanaVerificationService                           │  │
│  │  │  └─ USDC payment verification                        │  │
│  │  └─ RateLimiter                                         │  │
│  │     └─ Query counting & limits                          │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Storage                                                │  │
│  │  └─ Deno KV (Distributed key-value store)              │  │
│  │     ├─ rate_limit: userId → queryCount                 │  │
│  │     └─ used_transactions: txSignature → true           │  │
│  └─────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
     ↓ HTTP API          ↓ REST API       ↓ RPC JSON-RPC
  ┌────────────┐    ┌──────────────┐   ┌──────────────┐
  │ OpenAI     │    │ Pinecone     │   │ Solana RPC   │
  │ API        │    │ Vector DB    │   │ Mainnet/     │
  │            │    │              │   │ Devnet       │
  └────────────┘    └──────────────┘   └──────────────┘
```

## Data Flow

### Chat Message Flow

```
User Input
    ↓
[Browser] validateInput()
    ↓
[API] POST /api/chat { message, conversationId }
    ↓
[Middleware] checkLimit(userId, ipAddress)
    ↓
    ├─ If rate limited:
    │   return 402 Payment Required
    │
    └─ If allowed:
        [Service] Pinecone.search(message)
            ├─ Embed message (OpenAI)
            ├─ Search vector DB
            └─ Return top 5 documents
        ↓
        [Service] OpenAI.generate(message, documents)
            ├─ Create prompt with context
            ├─ Call GPT-5 nano
            └─ Return response with citations
        ↓
        [Middleware] incrementUsage(userId)
        ↓
        [Response] {
          success: true,
          response: "...",
          sources: [...],
          tokensUsed: 150
        }
        ↓
        [Browser] displayResponse()
        ↓
        [Browser] saveHistory(localStorage)
```

### Payment Flow

```
Rate Limit Exceeded
    ↓
[UI] showPaymentModal()
    ↓
[UI] User selects amount (slider)
    ↓
[UI] User clicks "Pay with Solana"
    ↓
[Service] Phantom.connect()
    ↓
[Service] buildUSDCTransaction()
    ├─ Calculate token accounts
    ├─ Create TransferChecked instruction
    └─ Build transaction
    ↓
[Service] Phantom.signAndSendTransaction()
    ↓
[API] POST /api/payment { signature, amount }
    ↓
[Service] Solana.verifyTransaction(signature, amount)
    ├─ Fetch transaction from RPC
    ├─ Check token balance changes
    ├─ Validate recipient
    └─ Return true/false
    ↓
    ├─ If invalid:
    │   return 400 Bad Request
    │
    └─ If valid:
        [Service] SolanaService.markTransactionUsed(signature)
        ↓
        [Service] RateLimiter.grantQueries(userId, queriesGranted)
            ├─ Calculate: queriesGranted = amount * 1000
            ├─ Update KV store
            └─ Verify grant
        ↓
        [Response] {
          success: true,
          queriesGranted: 10,
          rateLimit: { remaining: 10, ... }
        }
        ↓
        [UI] updateQueryCount()
        ↓
        [UI] closePaymentModal()
        ↓
        Chat resumes
```

## Architecture Patterns

### 1. Service-Oriented Architecture

Each external integration is wrapped in a service:

```
┌─ OpenAIService
│  └─ Handles all OpenAI API calls
│     ├─ Embedding
│     ├─ Text generation
│     └─ Error handling
│
├─ PineconeService
│  └─ Handles vector DB operations
│     ├─ Vector search
│     ├─ Caching
│     └─ Error handling
│
├─ SolanaVerificationService
│  └─ Handles blockchain verification
│     ├─ Transaction fetching
│     ├─ Balance validation
│     └─ Error handling
│
└─ RateLimiter
   └─ Handles rate limiting
      ├─ Query tracking
      ├─ Limit checking
      └─ Grant management
```

### 2. Middleware Pipeline

```
Request
  ↓
[CORS] Check origin
  ↓
[Logging] Log request
  ↓
[RateLimiter] Check rate limit
  ↓
[Handler] Process request
  ↓
[Logging] Log response
  ↓
Response
```

### 3. Error Handling Strategy

```
Try
  ├─ Call external service
  └─ Handle service errors
        ├─ Retry? (with backoff)
        ├─ Fallback? (cached data)
        └─ Return error response
Catch
  └─ Log error
  └─ Return 500 with generic message
```

## State Management

### Deno KV Schema

**Rate Limiting**:
```
Key:   ['rate_limit', 'user:192.168.1.1', '2025-11-04']
Value: 2  // number of queries used today
TTL:   25 hours
```

**Used Transactions**:
```
Key:   ['used_transactions', '3xMqyz4f...']
Value: true
TTL:   30 days
```

**Rate Limit Index** (for cleanup):
```
Key:   ['rate_limit_users', 'user:192.168.1.1']
Value: ['2025-11-04', '2025-11-03']
```

## Code Organization

```
src/
├── main.ts                          # Server entry point
│   ├─ Initialize Hono server
│   ├─ Register middleware
│   ├─ Register routes
│   └─ Start listening
│
├── handlers/                        # HTTP request handlers
│   ├─ chat.ts                       # Chat endpoint
│   │  ├─ Validate message
│   │  ├─ Call services
│   │  └─ Return response
│   │
│   └─ payment.ts                    # Payment endpoint
│      ├─ Validate signature/amount
│      ├─ Call Solana service
│      ├─ Grant queries
│      └─ Return confirmation
│
├── middleware/                      # Request middleware
│   └─ rateLimit.ts                  # Rate limiting
│      ├─ getUserId()
│      ├─ checkLimit()
│      ├─ incrementUsage()
│      └─ grantQueries()
│
├── services/                        # External integrations
│   ├─ openai.ts                     # GPT integration
│   ├─ pinecone.ts                   # Vector DB
│   ├─ solana.ts                     # Blockchain verification
│   └─ logger.ts                     # Logging
│
└── utils/                           # Utilities
    ├─ config.ts                     # Configuration loading
    ├─ logger.ts                     # Logging setup
    └─ types.ts                      # TypeScript types
```

## Technology Choices

### Deno Runtime

**Why Deno?**
- ✅ Built-in TypeScript support (no build step)
- ✅ Secure by default (explicit permissions)
- ✅ Modern JavaScript features
- ✅ Better developer experience
- ✅ Easy to deploy (single binary)

**Drawbacks**
- ⚠️ Smaller ecosystem than Node.js
- ⚠️ Less third-party library support

### Hono Framework

**Why Hono?**
- ✅ Lightweight (optimized for edge computing)
- ✅ Works with Deno
- ✅ TypeScript first
- ✅ Minimal boilerplate
- ✅ Built-in middleware support

**Alternative**: Express (Node.js)

### Pinecone for Vectors

**Why Pinecone?**
- ✅ Managed vector database (no ops)
- ✅ Semantic search built-in
- ✅ Scales automatically
- ✅ Free tier available

**Alternatives**:
- Weaviate (open source)
- Milvus (open source)
- Qdrant (open source)

### OpenAI for Generation

**Why OpenAI?**
- ✅ GPT-5 nano is very cheap
- ✅ High quality responses
- ✅ Easy API
- ✅ Well documented

**Alternatives**:
- Claude (Anthropic)
- Llama 2 (Meta, open source)
- Mistral (open source)

### Solana for Payments

**Why Solana?**
- ✅ Low transaction fees (~$0.00025)
- ✅ Fast confirmation (1-2 seconds)
- ✅ USDC widely available
- ✅ Developer friendly

**Alternatives**:
- Ethereum (expensive gas fees)
- Polygon (cheaper alternative)
- Lightning Network (Bitcoin)

### Deno KV for Storage

**Why Deno KV?**
- ✅ Distributed key-value store
- ✅ Built into Deno Deploy
- ✅ Atomic operations
- ✅ TTL support
- ✅ No external service to manage

**Alternatives**:
- Redis (requires separate deployment)
- PostgreSQL (more overhead)
- MongoDB (overkill for this use case)

## Performance Considerations

### Query Response Time Target: < 2 seconds

Breakdown:
1. **Pinecone search**: ~500ms (network + embedding)
2. **OpenAI generation**: ~1000ms (API call)
3. **Other overhead**: ~200ms (parsing, formatting)
4. **Total**: ~1.7 seconds

### Optimization Strategies

1. **Parallel requests**:
   ```typescript
   // Bad: Sequential
   const embedding = await openai.embed(message);
   const docs = await pinecone.search(embedding);

   // Good: Parallel
   const response = await openai.generate(message, docs);
   ```

2. **Caching**:
   - Cache common questions
   - Cache document embeddings
   - Cache OpenAI responses

3. **Batching**:
   - Batch payment verification
   - Batch rate limit checks

### Cost Optimization

**Current costs per query**:
- OpenAI: ~$0.000133 (GPT-5 nano @ $0.15/1M tokens)
- Pinecone: ~$0 (free tier)
- Solana: ~$0 (negligible)
- **Total: ~$0.000133**

**Revenue per query**: $0.001
**Profit margin**: ~87%

**Cost reduction opportunities**:
1. Cache common responses (reduce OpenAI calls)
2. Use cron job for batch processing
3. Migrate to open source models (Llama 2)
4. Implement query deduplication

## Security Architecture

### Input Validation

```typescript
// Message validation
if (!message || message.trim().length === 0) {
  throw new Error('Message cannot be empty');
}

// Amount validation
if (amount < 0.01 || amount > 1.0) {
  throw new Error('Invalid amount');
}

// Signature validation
if (!isValidSolanaSignature(signature)) {
  throw new Error('Invalid signature format');
}
```

### Authentication

The chatbot uses **IP-based identification** (not authentication):
- Each request gets a user ID based on IP
- Rate limits are tracked per IP
- Suitable for public documentation

**Not suitable for**:
- User accounts
- Sensitive data
- Enterprise use

### Authorization

All endpoints are public (no authorization required):
- Anyone can chat
- Anyone can pay
- No authentication credentials needed

**Future enhancement**: Add API keys for enterprise deployments

### Data Privacy

**What we store**:
- ✅ Rate limit counts (KV, auto-expiring)
- ✅ Used transaction signatures (KV, 30-day TTL)
- ❌ Not storing chat history (ephemeral)
- ❌ Not storing personal data

**What third parties see**:
- OpenAI: Chat messages (covered by their privacy policy)
- Pinecone: Chat messages (covered by their privacy policy)
- Solana: Only public transaction data

## Scalability Architecture

### Horizontal Scaling

```
┌─────────────────────────┐
│   Load Balancer         │
│   (Nginx/HAProxy)       │
└──────────┬──────────────┘
           │
    ┌──────┼──────┬───────┐
    ↓      ↓      ↓       ↓
  [Pod1] [Pod2] [Pod3] [Pod4]
    │      │      │       │
    └──────┴──────┴───────┘
           │
    ┌──────┴──────┐
    ↓             ↓
[Pinecone]  [Deno KV]
           (shared storage)
```

### Vertical Scaling

- Increase memory: 512MB → 2GB
- Increase CPU: 1 core → 4 cores
- Cache more aggressively
- Use CDN for static assets

### Rate Limiting Strategy

1. **Per-IP**: 3 free queries/day
2. **Per-endpoint**: 100 req/s (DDoS protection)
3. **Per-user-paid**: 1000 queries/day

## Monitoring and Observability

### Key Metrics

```
Request Latency
├─ P50: < 1s
├─ P95: < 2s
└─ P99: < 5s

Error Rate
├─ < 1% API errors
├─ < 0.1% payment failures
└─ < 0.01% data loss

Cost
├─ OpenAI: ${cost per day}
├─ Pinecone: ${cost per day}
└─ Solana: ${cost per day}
```

### Logging

```typescript
logger.info('Chat request', { userId, messageLength, ipAddress });
logger.warn('Rate limit exceeded', { userId, queries });
logger.error('Payment verification failed', { signature, error });
```

### Alerting

```
IF error_rate > 5% THEN alert("High error rate")
IF avg_latency > 3s THEN alert("Slow response times")
IF openai_cost > $100/day THEN alert("High OpenAI costs")
```

## Testing Strategy

### Unit Tests
- Service methods
- Rate limiter logic
- Payment verification

### Integration Tests
- Chat endpoint
- Payment endpoint
- Rate limiting

### E2E Tests
- Full chat flow
- Full payment flow
- Rate limit reset

### Load Testing
- 100 concurrent users
- 1000 msg/sec throughput
- Validate cost per user

## Disaster Recovery

### Backup Strategy
- Daily Deno KV snapshots
- Version control for code
- Environment variable backups (encrypted)

### Failover Plan
- Spin up new instance
- Restore KV data
- Verify blockchain payments still work
- Re-check Pinecone access

### RTO/RPO
- **RTO** (Recovery Time Objective): 1 hour
- **RPO** (Recovery Point Objective): 24 hours

## Future Enhancements

1. **Multi-LLM Support**: Swap between Claude, Llama, GPT
2. **Subscription Plans**: Monthly recurring payments
3. **User Accounts**: Per-user rate limiting instead of IP
4. **Analytics**: Track usage patterns
5. **A/B Testing**: Test different prompts
6. **Feedback Loop**: Learn from user interactions
7. **Multi-language**: Support non-English queries
8. **Voice Chat**: Accept voice input
9. **Export History**: Allow users to export conversations
10. **Custom Models**: Fine-tune on documentation

## References

- [Deno Documentation](https://deno.land/manual)
- [Hono Framework](https://hono.dev)
- [Pinecone API](https://docs.pinecone.io)
- [OpenAI API](https://platform.openai.com/docs)
- [Solana Docs](https://docs.solana.com)
- [RAG Pattern](https://www.promptingguide.ai/techniques/rag)
