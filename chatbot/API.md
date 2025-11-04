# RAG Chatbot API Documentation

## Base URL

- **Local**: `http://localhost:8000`
- **Production**: `https://your-project.deno.dev`

## Authentication

Currently, the API uses IP-based rate limiting. No authentication tokens are required for basic usage.

## Rate Limiting

- **Free Tier**: 3 queries per day per IP address
- **Paid Tier**: 0.1 USDC per query via Solana payment
- **Reset**: Daily at midnight UTC
- **Headers**: All responses include rate limit headers

### Rate Limit Headers

```
X-RateLimit-Limit: 3
X-RateLimit-Remaining: 2
X-RateLimit-Reset: 1704153600000
```

## Endpoints

### GET /

Get API information and available endpoints.

**Response**: 200 OK
```json
{
  "service": "OpenLibx402 RAG Chatbot",
  "version": "1.0.0",
  "endpoints": {
    "health": "GET /api/health",
    "status": "GET /api/status",
    "chat": "POST /api/chat",
    "chatStream": "POST /api/chat-stream",
    "payment": "POST /api/payment",
    "paymentInfo": "GET /api/payment/info"
  },
  "documentation": "https://github.com/openlibx402/openlibx402"
}
```

---

### GET /api/health

Health check endpoint. Not rate limited.

**Response**: 200 OK
```json
{
  "status": "ok",
  "service": "openlibx402-ragbot",
  "timestamp": "2025-01-04T12:00:00.000Z"
}
```

---

### GET /api/status

Get current rate limit status for the requesting IP.

**Rate Limited**: Yes

**Response**: 200 OK
```json
{
  "rateLimit": {
    "remaining": 2,
    "resetAt": 1704153600000,
    "requiresPayment": false
  }
}
```

When limit is exceeded:
```json
{
  "rateLimit": {
    "remaining": 0,
    "resetAt": 1704153600000,
    "requiresPayment": true
  },
  "payment": {
    "amount": 0.1,
    "token": "USDC",
    "network": "solana"
  }
}
```

---

### POST /api/chat

Send a chat message and receive a complete response (non-streaming).

**Rate Limited**: Yes

**Request Body**:
```json
{
  "message": "How do I use OpenLibx402 with FastAPI?",
  "conversationHistory": [
    {
      "role": "user",
      "content": "What is OpenLibx402?"
    },
    {
      "role": "assistant",
      "content": "OpenLibx402 is a library for implementing HTTP 402..."
    }
  ]
}
```

**Parameters**:
- `message` (string, required): The user's question
- `conversationHistory` (array, optional): Previous conversation for context (max 6 messages recommended)

**Response**: 200 OK
```json
{
  "message": "To use OpenLibx402 with FastAPI, you need to...",
  "sources": [
    {
      "file": "packages/python/openlibx402-fastapi.md",
      "section": "Installation",
      "relevance": 0.89
    },
    {
      "file": "examples/python/fastapi-server.md",
      "relevance": 0.85
    }
  ]
}
```

**Error Response**: 402 Payment Required
```json
{
  "error": "Rate limit exceeded",
  "message": "You have used all 3 free queries for today. Please make a payment to continue.",
  "remaining": 0,
  "resetAt": 1704153600000,
  "payment": {
    "required": true,
    "amount": 0.1,
    "token": "USDC"
  }
}
```

---

### POST /api/chat-stream

Send a chat message and receive a streaming response via Server-Sent Events (SSE).

**Rate Limited**: Yes

**Request Body**: Same as `/api/chat`

**Response**: 200 OK (text/event-stream)

**SSE Event Types**:

1. **sources** - Sent first with relevant documentation sources
```
event: sources
data: {"type":"sources","sources":[{"file":"packages/python/openlibx402-fastapi.md","section":"Installation","relevance":0.89}]}
```

2. **message** - Streamed content chunks
```
event: message
data: To use OpenLibx402
```

```
event: message
data:  with FastAPI
```

3. **done** - Final event with complete message
```
event: done
data: {"type":"done","message":"To use OpenLibx402 with FastAPI, you need to..."}
```

4. **error** - Sent if an error occurs
```
event: error
data: {"type":"error","error":"An error occurred while generating the response"}
```

**Example Client**:
```javascript
const response = await fetch('http://localhost:8000/api/chat-stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'How do I use OpenLibx402?'
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      console.log(data);
    }
  }
}
```

---

### GET /api/payment/info

Get payment information for extending rate limits.

**Rate Limited**: No

**Response**: 200 OK
```json
{
  "amount": 0.1,
  "token": "USDC",
  "network": "solana",
  "recipient": "YourSolanaWalletAddress...",
  "instructions": [
    "Send the specified amount of USDC to the recipient address",
    "Submit the transaction signature to the /api/payment endpoint",
    "You will receive 1 additional query after successful verification"
  ]
}
```

---

### POST /api/payment

Submit a Solana payment signature to extend rate limit.

**Rate Limited**: No

**Request Body**:
```json
{
  "signature": "5J7X...", // Solana transaction signature
  "amount": 0.1,
  "token": "USDC"
}
```

**Parameters**:
- `signature` (string, required): Solana transaction signature
- `amount` (number, optional): Payment amount (defaults to 0.1)
- `token` (string, optional): Token symbol (defaults to USDC)

**Response**: 200 OK
```json
{
  "success": true,
  "message": "Payment accepted. You have been granted 1 additional query.",
  "signature": "5J7X..."
}
```

**Error Response**: 400 Bad Request
```json
{
  "error": "Invalid payment signature"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input |
| 402 | Payment Required - Rate limit exceeded |
| 500 | Internal Server Error |

## Error Response Format

All errors follow this format:
```json
{
  "error": "Error title",
  "message": "Detailed error message"
}
```

## CORS

The API supports CORS. Allowed origins can be configured via the `ALLOWED_ORIGINS` environment variable.

Default headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Best Practices

1. **Conversation History**: Include the last 3-6 messages for context, but avoid sending entire conversation to save tokens
2. **Caching**: Cache responses on the client side when appropriate
3. **Error Handling**: Always handle 402 Payment Required responses
4. **Streaming**: Use `/api/chat-stream` for better UX with long responses
5. **Rate Limits**: Check `/api/status` before making requests to provide user feedback

## SDK Examples

### JavaScript/TypeScript

```typescript
class OpenLibx402ChatClient {
  constructor(private apiUrl: string) {}

  async chat(message: string, history: any[] = []) {
    const response = await fetch(`${this.apiUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, conversationHistory: history })
    });

    if (response.status === 402) {
      const data = await response.json();
      throw new PaymentRequiredError(data);
    }

    return response.json();
  }

  async *chatStream(message: string, history: any[] = []) {
    const response = await fetch(`${this.apiUrl}/api/chat-stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, conversationHistory: history })
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          yield line.slice(6);
        }
      }
    }
  }
}
```

### Python

```python
import requests
from typing import Generator

class OpenLibx402ChatClient:
    def __init__(self, api_url: str):
        self.api_url = api_url

    def chat(self, message: str, history: list = None) -> dict:
        response = requests.post(
            f"{self.api_url}/api/chat",
            json={
                "message": message,
                "conversationHistory": history or []
            }
        )

        if response.status_code == 402:
            raise PaymentRequiredError(response.json())

        return response.json()

    def chat_stream(self, message: str, history: list = None) -> Generator:
        response = requests.post(
            f"{self.api_url}/api/chat-stream",
            json={
                "message": message,
                "conversationHistory": history or []
            },
            stream=True
        )

        for line in response.iter_lines():
            if line.startswith(b'data: '):
                yield line[6:].decode('utf-8')
```

## Webhooks

Currently not supported. Future versions may include webhook support for:
- Payment confirmations
- Rate limit resets
- Usage analytics

## Versioning

The API currently uses an implicit version (v1). Future breaking changes will be released under new versions (v2, v3, etc.) with the path prefix `/v2/api/...`

## Support

For API issues or questions:
- GitHub Issues: https://github.com/openlibx402/openlibx402/issues
- Documentation: https://openlibx402.github.io/docs/
