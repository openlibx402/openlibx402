# net/http Server Example

Complete working example of an X402-enabled server using Go's standard `net/http` package.

## Overview

This example demonstrates:

- Free and paid endpoints
- Multiple pricing tiers
- Payment verification
- Processing payment details in handlers

## Running the Example

### 1. Setup Environment

```bash
# Clone and navigate to example
cd examples/go/nethttp-server

# Set your Solana wallet
export X402_PAYMENT_ADDRESS="YOUR_SOLANA_WALLET_ADDRESS"
export X402_TOKEN_MINT="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
export X402_NETWORK="solana-devnet"
```

### 2. Install Dependencies

```bash
go mod tidy
```

### 3. Run Server

```bash
go run main.go
```

Output:
```
🚀 X402 Server starting on port 8080
📍 Network: solana-devnet
💰 Payment Address: YOUR_WALLET_ADDRESS
🪙 Token Mint: EPjFWdd5...

Available endpoints:
  GET  /api/free-data       - Free access (no payment)
  GET  /api/premium-data    - $0.10 USDC
  GET  /api/expensive-data  - $1.00 USDC
  POST /api/process         - $0.50 USDC
```

### 4. Test Endpoints

**Free endpoint (no payment needed):**
```bash
curl http://localhost:8080/api/free-data
```

Response:
```json
{
  "message": "This is free public data",
  "data": {
    "timestamp": "2024-01-01T00:00:00Z",
    "value": "basic information"
  }
}
```

**Premium endpoint (payment required):**
```bash
curl http://localhost:8080/api/premium-data
```

Response (402 Payment Required):
```json
{
  "max_amount_required": "0.10",
  "asset_type": "SPL",
  "asset_address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "payment_address": "YOUR_WALLET_ADDRESS",
  "network": "solana-devnet",
  "expires_at": "2025-01-01T00:05:00Z",
  "nonce": "abc123...",
  "payment_id": "def456...",
  "resource": "/api/premium-data",
  "description": "Premium market data access"
}
```

## Server Code

The server (`main.go`) contains:

### Configuration

```go
nethttp.InitX402(&nethttp.Config{
    PaymentAddress: os.Getenv("X402_PAYMENT_ADDRESS"),
    TokenMint:      os.Getenv("X402_TOKEN_MINT"),
    Network:        "solana-devnet",
    AutoVerify:     true,
})
```

### Endpoint Setup

```go
// Free endpoint
mux.HandleFunc("/api/free-data", freeDataHandler)

// Premium endpoints with different prices
mux.Handle("/api/premium-data", nethttp.PaymentRequired(nethttp.PaymentRequiredOptions{
    Amount:      "0.10",
    Description: "Premium market data access",
})(http.HandlerFunc(premiumDataHandler)))
```

## Client Example

### Automatic Payment

The `client_example.go` shows automatic payment:

```bash
# Set your wallet private key
export X402_PRIVATE_KEY="your-base58-private-key"

# Run client
go run client_example.go
```

The client will:
1. Request protected endpoint
2. Receive 402 response
3. Parse payment request
4. Create payment transaction
5. Broadcast to Solana
6. Retry with payment authorization
7. Display response

### Auto Client Code

```go
client := client.NewAutoClient(walletKeypair, "", &client.AutoClientOptions{
    MaxPaymentAmount: "10.0",
    AutoRetry:        true,
    AllowLocal:       true,
})
defer client.Close()

// Automatically handles payment
resp, err := client.Get(context.Background(), "http://localhost:8080/api/premium-data")
```

### Explicit Client Code

```go
// Manual payment control
client := client.NewX402Client(walletKeypair, "", nil, true)
defer client.Close()

resp, err := client.Get(ctx, url, nil)

if client.PaymentRequired(resp) {
    paymentReq, _ := client.ParsePaymentRequest(resp)
    auth, _ := client.CreatePayment(ctx, paymentReq, "")
    resp, _ = client.Get(ctx, url, auth)
}
```

## Project Structure

```
nethttp-server/
├── main.go              # Server with multiple endpoints
├── client_example.go    # Example clients (auto and explicit)
├── go.mod              # Module definition
└── README.md           # This file
```

## Endpoint Details

### /api/free-data (Free)

No payment required. Returns basic data.

```bash
curl http://localhost:8080/api/free-data | jq
```

### /api/premium-data ($0.10)

Requires $0.10 USDC payment. Returns market data.

```bash
# First request returns 402
curl http://localhost:8080/api/premium-data

# After payment with auth header
curl -H "X-Payment-Authorization: <base64>" http://localhost:8080/api/premium-data
```

### /api/expensive-data ($1.00)

Requires $1.00 USDC payment. Returns exclusive insights.

```bash
curl http://localhost:8080/api/expensive-data
```

### /api/process ($0.50)

POST endpoint requiring $0.50 USDC. Processes data.

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"data": "to process"}' \
  http://localhost:8080/api/process
```

## Handler Examples

### Free Handler

```go
func freeDataHandler(w http.ResponseWriter, r *http.Request) {
    data := map[string]interface{}{
        "message": "This is free public data",
        "data": map[string]interface{}{
            "timestamp": "2024-01-01T00:00:00Z",
            "value":     "basic information",
        },
    }
    respondJSON(w, http.StatusOK, data)
}
```

### Premium Handler (with Payment Access)

```go
func premiumDataHandler(w http.ResponseWriter, r *http.Request) {
    // Access payment details if needed
    auth := nethttp.GetPaymentAuthorization(r)
    if auth != nil {
        log.Printf("✅ Payment received: %s USDC from %s",
            auth.ActualAmount, auth.PublicKey)
    }

    data := map[string]interface{}{
        "message": "This is premium data (paid $0.10)",
        "data": map[string]interface{}{
            "timestamp": "2024-01-01T00:00:00Z",
            "value":     "premium market data",
            "metrics": map[string]interface{}{
                "price":  42.50,
                "volume": 1000000,
                "trend":  "bullish",
            },
        },
    }
    respondJSON(w, http.StatusOK, data)
}
```

## Configuration Options

### Environment Variables

```bash
# Required
X402_PAYMENT_ADDRESS="YOUR_SOLANA_WALLET"
X402_TOKEN_MINT="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"

# Optional
X402_NETWORK="solana-devnet"  # or solana-mainnet
X402_RPC_URL="https://api.devnet.solana.com"
PORT=8080
```

### Per-Endpoint Configuration

In `main.go`, modify the `PaymentRequiredOptions`:

```go
nethttp.PaymentRequired(nethttp.PaymentRequiredOptions{
    Amount:      "0.10",
    Description: "Custom description",
    ExpiresIn:   300,  // Seconds
    AutoVerify:  true, // Verify on-chain
})
```

## Testing Locally

### Test Without Real Payments

For development, you can test the payment flow without real transactions:

1. Use devnet tokens (free from faucet)
2. Set `AutoVerify: false` to skip on-chain verification
3. Use client with `AllowLocal: true`

### Mock Payment Response

For testing without a server:

```go
// Simulate 402 response
resp := &http.Response{
    StatusCode: http.StatusPaymentRequired,
    Body:       io.NopCloser(bytes.NewBufferString(paymentJSON)),
}

// Test parsing
paymentReq, err := client.ParsePaymentRequest(resp)
```

## Production Considerations

### 1. Use Mainnet

Update environment:
```bash
export X402_NETWORK="solana-mainnet"
export X402_RPC_URL="https://api.mainnet-beta.solana.com"
```

### 2. Enable HTTPS

```go
err := http.ListenAndServeTLS(":443", "cert.pem", "key.pem", mux)
```

### 3. Add Rate Limiting

```go
import "golang.org/x/time/rate"

var limiter = rate.NewLimiter(100, 10)

func rateLimited(h http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        if !limiter.Allow() {
            http.Error(w, "Too many requests", http.StatusTooManyRequests)
            return
        }
        h(w, r)
    }
}

mux.Handle("/api/premium", rateLimited(premiumHandler))
```

### 4. Add Logging

```go
import "log"

func logRequest(handler http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        log.Printf("%s %s", r.Method, r.URL.Path)
        handler(w, r)
    }
}
```

### 5. Monitor Payments

```go
func logPayment(auth *core.PaymentAuthorization) {
    log.Printf("[PAYMENT] ID:%s Amount:%s Payer:%s TX:%s",
        auth.PaymentID,
        auth.ActualAmount,
        auth.PublicKey[:8],
        auth.TransactionHash[:8])
}
```

## Troubleshooting

### 402 responses even after payment

- Check payment amount matches exactly
- Verify payment address is correct
- Ensure RPC endpoint is accessible
- Check network configuration (devnet vs mainnet)

### Client connection refused

- Ensure server is running: `go run main.go`
- Check port is correct: `lsof -i :8080`
- Verify localhost is accessible

### Payment verification failures

- Disable `AutoVerify: false` temporarily for testing
- Check Solana network is operational
- Verify RPC endpoint is responding

## Extended Examples

### Dynamic Pricing

Modify the endpoint setup:

```go
func getPriceTier(endpoint string) string {
    switch endpoint {
    case "/api/basic":
        return "0.05"
    case "/api/premium":
        return "0.10"
    case "/api/ultimate":
        return "1.00"
    default:
        return "0.05"
    }
}
```

### Subscription-Based

Track payments and allow multiple requests:

```go
type Subscription struct {
    Address    string
    PaidUntil  time.Time
    Requests   int
}

func checkSubscription(auth *core.PaymentAuthorization) bool {
    // Check if payer has active subscription
    return true
}
```

## See Also

- [Echo Server Example](echo-server.md)
- [Server Quick Start](../getting-started/server-quickstart.md)
- [net/http Middleware Docs](../middleware/nethttp.md)
- [Client Library Docs](../libraries/client.md)
