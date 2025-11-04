# OpenLibx402 RAG Chatbot

The OpenLibx402 RAG (Retrieval-Augmented Generation) Chatbot is an intelligent assistant that provides real-time answers to questions about OpenLibx402 documentation. It uses Pinecone vector database for document retrieval and OpenAI's GPT models for response generation.

## Key Features

- **Real-time Documentation Search**: Retrieves relevant documentation snippets using semantic similarity
- **Intelligent Responses**: Uses OpenAI GPT models to generate contextual answers
- **Rate Limiting**: Protects API resources with configurable per-user daily limits
- **Solana USDC Payments**: Users can purchase additional queries with USDC tokens on Solana blockchain
- **Conversation History**: Maintains chat history using browser localStorage
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Architecture

### Backend Components

- **Deno Server**: High-performance server runtime with built-in TypeScript support
- **Hono Framework**: Lightweight web framework for handling HTTP requests
- **Pinecone Vector DB**: Stores and retrieves document embeddings
- **Deno KV**: Distributed key-value store for rate limiting and transaction tracking
- **Solana Web3.js**: Blockchain integration for payment verification

### Frontend Components

- **Vanilla JavaScript**: No framework dependencies for lightweight embedding
- **Phantom Wallet Integration**: Secure Solana payment handling
- **LocalStorage**: Persists conversation history
- **Range Slider UI**: Interactive payment amount selector

## Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Server | Deno 1.x | Runtime environment |
| Framework | Hono | HTTP request handling |
| API | OpenAI | Response generation |
| Vector DB | Pinecone | Document retrieval |
| Storage | Deno KV | Rate limit tracking |
| Blockchain | Solana | Payment verification |
| Wallet | Phantom | USDC transactions |
| Frontend | Vanilla JS | Widget embedding |

## Deployment

The chatbot is embedded in the mkdocs documentation site as a floating widget. It communicates with a separate Deno backend server via REST API.

### Running the Server

```bash
cd chatbot
deno run --allow-net --allow-env --allow-read --allow-ffi main.ts
```

The server will start on `http://localhost:3000` by default.

### Embedding in MkDocs

The chatbot widget is loaded via a script in the HTML template:

```html
<script>
  window.CHATBOT_API_URL = 'http://localhost:3000';
</script>
<script src="/assets/javascripts/chatbot.js"></script>
```

## User Flow

### Chat Interaction

1. User clicks the chat bubble (💬) in the bottom-right corner
2. Chatbot displays welcome message with query limit info
3. User types a question and presses Enter or clicks Send
4. Backend retrieves relevant documents from Pinecone
5. OpenAI generates a response with citations
6. Response is displayed in the chat interface

### Payment Flow

1. User exhausts their daily free queries (default: 3)
2. System displays payment modal with USDC amount selector
3. User selects amount (0.01 to 1.00 USDC) using interactive slider
4. User connects Phantom wallet and confirms transaction
5. Frontend waits for blockchain confirmation (5-30 seconds)
6. Backend verifies USDC token transfer
7. Queries are granted and chat resumes

## Rate Limiting

- **Free Tier**: 3 queries per day per user (identified by IP address)
- **Paid Credits**:
  - 0.01 USDC = 10 queries
  - 1.00 USDC = 1000 queries
  - Price: 1000 queries per USDC
- **Reset**: Daily at midnight UTC

## Configuration

See [Configuration Guide](configuration.md) for environment variables and settings.

## Security Considerations

- **HTTPS Only**: Payment endpoints use HTTPS in production
- **USDC Verification**: All transactions verified on Solana blockchain
- **Transaction Deduplication**: Used transaction signatures stored for 30 days
- **IP-Based Tracking**: Rate limits tracked by user IP address
- **CORS Protection**: Configured allowed origins for API access

## Cost Analysis

**Operating Costs**:
- GPT-5 nano: ~$0.000133 per query
- Pinecone vector retrieval: Minimal cost per query
- Total: ~$0.000133 per query

**Revenue Model**:
- User pays: $0.001 per query (at 0.01 USDC = 10 queries)
- Profit margin: ~87%

## Next Steps

- See [API Reference](api.md) for endpoint documentation
- See [Payment System](payments.md) for USDC integration details
- See [Deployment Guide](deployment.md) for production setup
