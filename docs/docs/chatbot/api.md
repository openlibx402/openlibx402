# Chatbot API Reference

Complete API documentation for the OpenLibx402 RAG Chatbot backend server.

## Base URL

- **Development**: `http://localhost:8000` (Deno) or `http://localhost:3000` (Node.js)
- **Production**: `https://your-project.deno.dev` or `https://api.chatbot.openlibx402.com`

> **Note**: The base URL is configured in `docs/mkdocs.yml` under `extra.chatbot.api_url`. See [Backend API Configuration](../BACKEND_API_CONFIGURATION.md) for setup details.

## Authentication

The API does not require authentication. Rate limiting is handled per user based on IP address.

## Endpoints

### 1. Chat Message

Send a message to the chatbot and receive an AI-generated response.

**Endpoint**: `POST /api/chat`

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "message": "What is OpenLibx402?",
  "conversationId": "optional-uuid-for-tracking"
}
```

**Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | User's question or message |
| `conversationId` | string | No | Optional ID for tracking conversations |

**Response (200 OK)**:
```json
{
  "success": true,
  "response": "OpenLibx402 is a library that provides...",
  "sources": [
    {
      "title": "Introduction",
      "url": "https://docs.openlibx402.com/intro",
      "excerpt": "OpenLibx402 is..."
    },
    {
      "title": "Features",
      "url": "https://docs.openlibx402.com/features",
      "excerpt": "Key features include..."
    }
  ],
  "tokensUsed": 150
}
```

**Response (402 Payment Required)**:

The response uses the standardized OpenLibx402 PaymentRequest format:

```json
{
  "max_amount_required": "0.01",
  "asset_type": "SPL",
  "asset_address": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  "payment_address": "HMYDGuLTCL6r5pGL8yUbj27i4pyafpomfhZLq3psxm7L",
  "network": "solana-devnet",
  "expires_at": "2025-11-05T12:05:00Z",
  "nonce": "base64-encoded-nonce",
  "payment_id": "uuid-payment-id",
  "resource": "/api/chat",
  "description": "Access to /api/chat endpoint - 3 free queries/day used"
}
```

> **X402 Standard**: This follows the OpenLibx402 HTTP 402 Payment Required protocol for standardized payment requests. See [Payment System Documentation](payments.md) for details.

**Response (500 Internal Server Error)**:
```json
{
  "error": "Failed to process request",
  "message": "An unexpected error occurred"
}
```

**Example Usage**:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I use OpenLibx402?",
    "conversationId": "user-123"
  }'
```

**JavaScript Example**:

```javascript
const response = await fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'How do I use OpenLibx402?',
    conversationId: 'user-123'
  })
});

if (response.status === 402) {
  // Handle rate limit - show payment modal
  console.log('Rate limit exceeded - payment required');
} else if (response.ok) {
  const data = await response.json();
  console.log('Response:', data.response);
  console.log('Sources:', data.sources);
} else {
  console.error('Error:', response.status);
}
```

---

### 2. Status / Rate Limit Check

Check the current rate limit status for your user (IP address).

**Endpoint**: `GET /api/status`

**Response (200 OK - Queries Available)**:
```json
{
  "allowed": true,
  "remaining": 2,
  "resetAt": 1730851200000,
  "requiresPayment": false,
  "rateLimit": {
    "allowed": true,
    "remaining": 2,
    "resetAt": 1730851200000,
    "requiresPayment": false
  }
}
```

**Response (402 Payment Required - No Queries)**:
```json
{
  "error": "Rate limit exceeded",
  "message": "You have used all 3 free queries for today. Please make a payment to continue.",
  "remaining": 0,
  "resetAt": 1730851200000,
  "payment": {
    "required": true,
    "amount": 0.01,
    "token": "USDC"
  }
}
```

**Example Usage**:

```bash
curl http://localhost:3000/api/status
```

---

### 3. Payment Info

Get payment configuration information in standardized X402 format.

**Endpoint**: `GET /api/payment/info`

**Response (200 OK)**:
```json
{
  "x402_format": "v1",
  "asset_type": "SPL",
  "asset_address": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  "payment_address": "HMYDGuLTCL6r5pGL8yUbj27i4pyafpomfhZLq3psxm7L",
  "network": "solana-devnet",
  "amount": 0.01,
  "token": "USDC",
  "recipient": "HMYDGuLTCL6r5pGL8yUbj27i4pyafpomfhZLq3psxm7L",
  "payment_methods": [
    {
      "method": "x-payment-authorization-header",
      "description": "Submit as X-Payment-Authorization header in base64-encoded JSON"
    },
    {
      "method": "post-body-legacy",
      "description": "Submit as JSON POST body (backward compatible)"
    }
  ],
  "instructions": [
    "1. Send the specified amount of USDC to the payment address",
    "2. Get the transaction signature",
    "3. Submit via X-Payment-Authorization header OR POST body to /api/payment",
    "4. Receive query credits (1 USDC = 1000 queries)"
  ]
}
```

**Example Usage**:

```bash
curl http://localhost:8000/api/payment/info
```

---

### 4. Submit Payment

Submit a Solana transaction signature to verify USDC payment and grant queries.

**Endpoint**: `POST /api/payment`

**Headers**:
```
Content-Type: application/json
```

The endpoint supports **two submission methods**:

#### Method 1: X-Payment-Authorization Header (Recommended)

```
POST /api/payment
X-Payment-Authorization: base64-encoded-json
```

Header value (base64-encoded):
```json
{
  "payment_id": "uuid",
  "actual_amount": "0.01",
  "signature": "3xMqyz4fTVaVPpZxbMCuKgf2PQ2hLzpvgLFAkf6fV5zR3FVFBsG9U8k3VzZgPRbmm6U3K3uKZT2",
  "payment_address": "HMYDGuLTCL6r5pGL8yUbj27i4pyafpomfhZLq3psxm7L"
}
```

#### Method 2: POST Body (Legacy, Backward Compatible)

**Request Body**:
```json
{
  "signature": "3xMqyz4fTVaVPpZxbMCuKgf2PQ2hLzpvgLFAkf6fV5zR3FVFBsG9U8k3VzZgPRbmm6U3K3uKZT2",
  "amount": 0.01,
  "token": "USDC",
  "payment_id": "optional-uuid"
}
```

**Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `signature` | string | Yes | Solana transaction signature |
| `amount` | number | Yes | Amount sent (0.01 - 1.00 USDC) |
| `token` | string | Optional | Token symbol ("USDC") |
| `payment_id` | string | Optional | Payment ID for tracking |

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Payment accepted. You have been granted 10 additional queries.",
  "signature": "3xMqyz4fTVaVPpZxbMCuKgf2PQ2hLzpvgLFAkf6fV5zR3FVFBsG9U8k3VzZgPRbmm6U3K3uKZT2",
  "queriesGranted": 10,
  "rateLimit": {
    "remaining": 10,
    "resetAt": 1730851200000,
    "requiresPayment": false
  }
}
```

**Response (400 Bad Request)**:
```json
{
  "error": "Invalid or unconfirmed transaction. Please ensure you sent 0.01 USDC (not SOL) to the recipient address.",
  "details": "Transaction verification failed. Check that: 1) You sent USDC tokens (not SOL), 2) Amount is 0.01 USDC, 3) Sent to the correct recipient address, 4) Transaction has been confirmed on the blockchain"
}
```

**Example Usage**:

Method 1 - Using X-Payment-Authorization header:
```bash
AUTH_JSON='{"payment_id":"uuid","actual_amount":"0.01","signature":"3xMqyz4fTVaVPpZxbMCuKgf2PQ2hLzpvgLFAkf6fV5zR3FVFBsG9U8k3VzZgPRbmm6U3K3uKZT2","payment_address":"HMYDGuLTCL6r5pGL8yUbj27i4pyafpomfhZLq3psxm7L"}'
AUTH_HEADER=$(echo -n "$AUTH_JSON" | base64)

curl -X POST http://localhost:8000/api/payment \
  -H "Content-Type: application/json" \
  -H "X-Payment-Authorization: $AUTH_HEADER"
```

Method 2 - Using POST body (legacy):
```bash
curl -X POST http://localhost:8000/api/payment \
  -H "Content-Type: application/json" \
  -d '{
    "signature": "3xMqyz4fTVaVPpZxbMCuKgf2PQ2hLzpvgLFAkf6fV5zR3FVFBsG9U8k3VzZgPRbmm6U3K3uKZT2",
    "amount": 0.01,
    "token": "USDC"
  }'
```

See [Payment System Documentation](payments.md) for detailed payment flow.

---

## HTTP Headers

### Request Headers

Standard request headers:

```
Content-Type: application/json
Accept: application/json
```

### Response Headers

Standard response headers:

```
Content-Type: application/json
X-RateLimit-Limit: 3
X-RateLimit-Remaining: 2
X-RateLimit-Reset: 1730851200000
```

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Total free queries per day |
| `X-RateLimit-Remaining` | Queries remaining today |
| `X-RateLimit-Reset` | Unix timestamp (ms) when limit resets |

---

## Rate Limiting

Rate limiting is applied per user (identified by IP address).

**Free Tier**: 3 queries per day

**Paid**: Purchase additional queries with USDC (0.01 - 1.00 USDC)

**Reset**: Daily at midnight UTC

**Behavior**:
- Requests within limit: `200 OK`
- Requests exceeding limit: `402 Payment Required`

---

## Error Handling

All errors follow this format:

```json
{
  "error": "Error category",
  "message": "Human-readable error message",
  "details": "Optional additional context"
}
```

### Common HTTP Status Codes

| Status | Meaning | Example |
|--------|---------|---------|
| `200` | Success | Query completed |
| `400` | Bad Request | Invalid amount |
| `402` | Payment Required | Rate limit exceeded |
| `500` | Server Error | Internal failure |

### Error Types

**400 Bad Request**:
- Missing required fields
- Invalid request format
- Amount outside range

**402 Payment Required**:
- Daily query limit reached
- Payment required to continue

**500 Internal Server Error**:
- OpenAI API failure
- Pinecone connection error
- Deno KV failure
- Blockchain communication error

---

## Rate Limit Behavior

### Within Limit

```
GET /api/status
→ 200 OK

POST /api/chat { "message": "..." }
→ 200 OK { "response": "...", "sources": [...] }
```

Rate limit headers:
```
X-RateLimit-Remaining: 2
```

### Exceeds Limit

```
POST /api/chat { "message": "..." }
→ 402 Payment Required

{
  "error": "Rate limit exceeded",
  "message": "You have used all 3 free queries for today. Please make a payment to continue.",
  "remaining": 0,
  "resetAt": 1730851200000,
  "payment": {
    "required": true,
    "amount": 0.01,
    "token": "USDC"
  }
}
```

---

## CORS Configuration

Cross-Origin Resource Sharing (CORS) is configured for allowed origins:

```env
ALLOWED_ORIGINS=http://localhost:8000,http://localhost:3000,https://openlibx402.github.io
```

**Allowed Methods**: GET, POST, OPTIONS

**Allowed Headers**: Content-Type

---

## Integration Examples

### JavaScript (Fetch API)

```javascript
// Check rate limit
const checkStatus = async () => {
  const response = await fetch('http://localhost:3000/api/status');
  const data = await response.json();
  console.log(`Remaining queries: ${data.remaining}`);
  return data;
};

// Send chat message
const sendMessage = async (message) => {
  const response = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });

  if (response.status === 402) {
    console.log('Payment required');
    return null;
  }

  const data = await response.json();
  return data;
};

// Submit payment
const submitPayment = async (signature, amount) => {
  const response = await fetch('http://localhost:3000/api/payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      signature,
      amount,
      token: 'USDC'
    })
  });

  const data = await response.json();
  return data;
};
```

### Python (Requests)

```python
import requests

BASE_URL = 'http://localhost:3000'

# Check rate limit
def check_status():
    response = requests.get(f'{BASE_URL}/api/status')
    return response.json()

# Send chat message
def send_message(message):
    response = requests.post(
        f'{BASE_URL}/api/chat',
        json={'message': message}
    )
    if response.status_code == 402:
        return None
    return response.json()

# Submit payment
def submit_payment(signature, amount):
    response = requests.post(
        f'{BASE_URL}/api/payment',
        json={
            'signature': signature,
            'amount': amount,
            'token': 'USDC'
        }
    )
    return response.json()
```

---

## Changelog

### Version 1.0.0

- ✅ Chat endpoint with RAG
- ✅ Rate limiting per IP
- ✅ USDC payment system
- ✅ Payment info endpoint
- ✅ Status/rate limit check
