# Echo Server Example

Complete working example of an X402-enabled server using the Echo web framework.

## Overview

This example demonstrates:

- Free and paid endpoints
- Multiple pricing tiers
- Dynamic pricing by URL parameter
- Payment verification and logging
- POST request handling with payment

## Running the Example

### 1. Setup Environment

```bash
# Clone and navigate to example
cd examples/go/echo-server

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
🚀 X402 Echo Server starting on port 8080
📍 Network: solana-devnet
💰 Payment Address: YOUR_WALLET_ADDRESS
🪙 Token Mint: EPjFWdd5...

Available endpoints:
  GET  /api/free-data         - Free access (no payment)
  GET  /api/premium-data      - $0.10 USDC
  GET  /api/expensive-data    - $1.00 USDC
  POST /api/process           - $0.50 USDC
  GET  /api/tiered/:tier      - Dynamic pricing by tier
```

### 4. Test Endpoints

**Free endpoint (no payment needed):**
```bash
curl http://localhost:8080/api/free-data | jq
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

**Tiered endpoint with dynamic pricing:**
```bash
# Basic tier ($0.05)
curl http://localhost:8080/api/tiered/basic

# Standard tier ($0.10)
curl http://localhost:8080/api/tiered/standard

# Premium tier ($0.25)
curl http://localhost:8080/api/tiered/premium

# Ultimate tier ($1.00)
curl http://localhost:8080/api/tiered/ultimate
```

**POST endpoint with data:**
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"data": "to process"}' \
  http://localhost:8080/api/process
```

## Server Code

The server (`main.go`) contains:

### Configuration

```go
echox402.InitX402(&echox402.Config{
    PaymentAddress: os.Getenv("X402_PAYMENT_ADDRESS"),
    TokenMint:      os.Getenv("X402_TOKEN_MINT"),
    Network:        "solana-devnet",
    AutoVerify:     true,
})
```

### Endpoint Setup

```go
// Free endpoint
e.GET("/api/free-data", freeDataHandler)

// Premium endpoints with different prices
e.GET("/api/premium-data", premiumDataHandler, echox402.PaymentRequired(echox402.PaymentRequiredOptions{
    Amount:      "0.10",
    Description: "Premium market data access",
}))

// Dynamic pricing by tier
e.GET("/api/tiered/:tier", tieredDataHandler)
```

## Handler Examples

### Free Handler

```go
func freeDataHandler(c echo.Context) error {
    data := map[string]interface{}{
        "message": "This is free public data",
        "data": map[string]interface{}{
            "timestamp": "2024-01-01T00:00:00Z",
            "value":     "basic information",
        },
    }
    return c.JSON(http.StatusOK, data)
}
```

### Premium Handler (with Payment Access)

```go
func premiumDataHandler(c echo.Context) error {
    // Access payment details if needed
    auth := echox402.GetPaymentAuthorization(c)
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
    return c.JSON(http.StatusOK, data)
}
```

### POST Handler with Payment

```go
func processHandler(c echo.Context) error {
    auth := echox402.GetPaymentAuthorization(c)
    if auth != nil {
        log.Printf("✅ Payment received: %s USDC from %s",
            auth.ActualAmount, auth.PublicKey)
    }

    // Parse request body
    var input map[string]interface{}
    if err := c.Bind(&input); err != nil {
        return echo.NewHTTPError(http.StatusBadRequest, "Invalid JSON")
    }

    // Process the data
    result := map[string]interface{}{
        "message": "Data processed successfully (paid $0.50)",
        "input":   input,
        "result": map[string]interface{}{
            "processed": true,
            "timestamp": "2024-01-01T00:00:00Z",
            "output":    "Processed: " + fmt.Sprint(input),
        },
    }
    return c.JSON(http.StatusOK, result)
}
```

### Dynamic Pricing Handler

```go
func tieredDataHandler(c echo.Context) error {
    tier := c.Param("tier")

    // Define pricing per tier
    pricing := map[string]string{
        "basic":    "0.05",
        "standard": "0.10",
        "premium":  "0.25",
        "ultimate": "1.00",
    }

    amount, ok := pricing[tier]
    if !ok {
        return echo.NewHTTPError(http.StatusBadRequest, "Invalid tier")
    }

    // Apply payment middleware dynamically
    paymentMiddleware := echox402.PaymentRequired(echox402.PaymentRequiredOptions{
        Amount:      amount,
        Description: fmt.Sprintf("Tiered data access - %s tier", tier),
    })

    // Wrap handler with payment middleware
    handler := paymentMiddleware(func(c echo.Context) error {
        auth := echox402.GetPaymentAuthorization(c)
        if auth != nil {
            log.Printf("✅ Payment received: %s USDC from %s for %s tier",
                auth.ActualAmount, auth.PublicKey, tier)
        }

        data := map[string]interface{}{
            "message": fmt.Sprintf("This is %s tier data (paid $%s)", tier, amount),
            "tier":    tier,
            "data": map[string]interface{}{
                "timestamp": "2024-01-01T00:00:00Z",
                "value":     fmt.Sprintf("%s tier content", tier),
                "quality":   tier,
            },
        }
        return c.JSON(http.StatusOK, data)
    })

    return handler(c)
}
```

## Client Example

### Automatic Payment

The client automatically handles 402 responses:

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

## Project Structure

```
echo-server/
├── main.go              # Server with multiple endpoints
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

### /api/tiered/:tier (Variable)

Dynamic pricing based on tier parameter:
- `basic`: $0.05
- `standard`: $0.10
- `premium`: $0.25
- `ultimate`: $1.00

```bash
curl http://localhost:8080/api/tiered/premium
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
echox402.PaymentRequired(echox402.PaymentRequiredOptions{
    Amount:      "0.10",
    Description: "Custom description",
    ExpiresIn:   300,  // Seconds
    AutoVerify:  true, // Verify on-chain
})
```

## Middleware Setup

The example uses Echo's standard middleware:

```go
// Request logging
e.Use(middleware.Logger())

// Panic recovery
e.Use(middleware.Recover())

// CORS support
e.Use(middleware.CORS())
```

Add the X402 payment middleware on specific routes:

```go
e.GET("/api/premium", handler, echox402.PaymentRequired(opts))
```

## Testing Locally

### Test Without Real Payments

For development, test the payment flow without real transactions:

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
e.StartTLS(":443", "cert.pem", "key.pem")
```

### 3. Add Rate Limiting

```go
import "golang.org/x/time/rate"

var limiter = rate.NewLimiter(100, 10)

func rateLimited(next echo.HandlerFunc) echo.HandlerFunc {
    return func(c echo.Context) error {
        if !limiter.Allow() {
            return echo.NewHTTPError(http.StatusTooManyRequests, "Rate limited")
        }
        return next(c)
    }
}

e.Use(rateLimited)
```

### 4. Add Logging

```go
e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
    Format: "[${time_rfc3339}] ${status} ${method} ${path}\n",
}))
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

### 6. Graceful Shutdown

```go
import "os/signal"

go func() {
    if err := e.Start(":8080"); err != nil {
        e.Logger.Info("shutting down:", err)
    }
}()

quit := make(chan os.Signal, 1)
signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
<-quit

ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
defer cancel()
if err := e.Shutdown(ctx); err != nil {
    e.Logger.Fatal(err)
}
```

## Troubleshooting

### 402 responses even after payment

- Check payment amount matches exactly
- Verify payment address is correct
- Ensure RPC endpoint is accessible
- Check network configuration (devnet vs mainnet)

### Server won't start

- Check port is available: `lsof -i :8080`
- Verify environment variables are set
- Ensure dependencies are installed: `go mod tidy`

### Payment verification failures

- Disable `AutoVerify: false` temporarily for testing
- Check Solana network is operational
- Verify RPC endpoint is responding

### Echo context issues

- Ensure payment middleware is added to route definition
- Payment middleware must be called after route handler is defined
- Use `echox402.GetPaymentAuthorization(c)` to access payment in handler

## Extended Examples

### Route Groups with Different Tiers

```go
// Free tier
free := e.Group("/api/free")
free.GET("/data", freeDataHandler)

// Premium tier
premium := e.Group("/api/premium", echox402.PaymentRequired(echox402.PaymentRequiredOptions{
    Amount: "0.10",
}))
premium.GET("/data", premiumDataHandler)
premium.POST("/export", exportHandler)

// Enterprise tier
enterprise := e.Group("/api/enterprise", echox402.PaymentRequired(echox402.PaymentRequiredOptions{
    Amount: "5.00",
}))
enterprise.GET("/analytics", analyticsHandler)
enterprise.GET("/export", enterpriseExportHandler)
```

### Subscription-Based Access

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

### Custom Error Responses

```go
e.HTTPErrorHandler = func(err error, c echo.Context) {
    code := http.StatusInternalServerError
    message := "Internal Server Error"

    if he, ok := err.(*echo.HTTPError); ok {
        code = he.Code
        message = fmt.Sprint(he.Message)
    }

    c.JSON(code, map[string]interface{}{
        "error": message,
    })
}
```

## See Also

- [net/http Server Example](nethttp-server.md)
- [Echo Middleware Docs](../middleware/echo.md)
- [Server Quick Start](../getting-started/server-quickstart.md)
- [Client Library Docs](../libraries/client.md)
