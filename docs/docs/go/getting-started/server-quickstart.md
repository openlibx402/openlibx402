# Server Quick Start

Build a payment-required API in minutes with OpenLibx402.

## 5-Minute Server

### Step 1: Initialize Your Project

```bash
mkdir x402-server
cd x402-server
go mod init github.com/yourname/x402-server
```

### Step 2: Install Dependencies

```bash
go get github.com/openlibx402/go/openlibx402-nethttp
```

### Step 3: Create Your Server

Create `main.go`:

```go
package main

import (
    "encoding/json"
    "log"
    "net/http"
    "os"

    nethttp "github.com/openlibx402/go/openlibx402-nethttp"
)

func main() {
    // Initialize X402 with configuration
    nethttp.InitX402(&nethttp.Config{
        PaymentAddress: os.Getenv("X402_PAYMENT_ADDRESS"),
        TokenMint:      os.Getenv("X402_TOKEN_MINT"),
        Network:        "solana-devnet",
        AutoVerify:     true,
    })

    // Free endpoint (no payment required)
    http.HandleFunc("/api/free", func(w http.ResponseWriter, r *http.Request) {
        json.NewEncoder(w).Encode(map[string]string{
            "message": "Free data",
            "data":    "Available to everyone",
        })
    })

    // Premium endpoint (requires $0.10)
    http.Handle("/api/premium", nethttp.PaymentRequired(nethttp.PaymentRequiredOptions{
        Amount:      "0.10",
        Description: "Premium data access",
    })(http.HandlerFunc(premiumHandler)))

    log.Println("Server listening on :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}

func premiumHandler(w http.ResponseWriter, r *http.Request) {
    // Access payment details if needed
    auth := nethttp.GetPaymentAuthorization(r)
    if auth != nil {
        log.Printf("Payment received: %s USDC", auth.ActualAmount)
    }

    json.NewEncoder(w).Encode(map[string]interface{}{
        "message": "Premium data",
        "data":    "You paid for this!",
        "premium": true,
    })
}
```

### Step 4: Set Environment Variables

```bash
export X402_PAYMENT_ADDRESS="YOUR_SOLANA_WALLET_ADDRESS"
export X402_TOKEN_MINT="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
```

### Step 5: Run Your Server

```bash
go run main.go
```

Output:
```
Server listening on :8080
```

### Step 6: Test It

**Test free endpoint:**
```bash
curl http://localhost:8080/api/free
```

Response:
```json
{
  "message": "Free data",
  "data": "Available to everyone"
}
```

**Test premium endpoint (will get 402):**
```bash
curl http://localhost:8080/api/premium
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
  "payment_id": "...",
  "resource": "/api/premium",
  "description": "Premium data access"
}
```

## With Echo Framework

Prefer Echo? It's even simpler:

```bash
go get github.com/openlibx402/go/openlibx402-echo
```

```go
package main

import (
    "net/http"
    "os"

    "github.com/labstack/echo/v4"
    echox402 "github.com/openlibx402/go/openlibx402-echo"
)

func main() {
    echox402.InitX402(&echox402.Config{
        PaymentAddress: os.Getenv("X402_PAYMENT_ADDRESS"),
        TokenMint:      os.Getenv("X402_TOKEN_MINT"),
        Network:        "solana-devnet",
        AutoVerify:     true,
    })

    e := echo.New()

    // Free endpoint
    e.GET("/api/free", func(c echo.Context) error {
        return c.JSON(http.StatusOK, map[string]string{
            "message": "Free data",
        })
    })

    // Premium endpoint
    e.GET("/api/premium", premiumHandler, echox402.PaymentRequired(echox402.PaymentRequiredOptions{
        Amount:      "0.10",
        Description: "Premium data access",
    }))

    e.Start(":8080")
}

func premiumHandler(c echo.Context) error {
    // Access payment details
    auth := echox402.GetPaymentAuthorization(c)
    if auth != nil {
        c.Logger().Infof("Payment: %s USDC", auth.ActualAmount)
    }

    return c.JSON(http.StatusOK, map[string]interface{}{
        "message": "Premium data",
        "premium": true,
    })
}
```

## Adding Multiple Price Tiers

```go
// Basic tier: $0.05
http.Handle("/api/basic", nethttp.PaymentRequired(nethttp.PaymentRequiredOptions{
    Amount:      "0.05",
    Description: "Basic data access",
})(basicHandler))

// Standard tier: $0.10
http.Handle("/api/standard", nethttp.PaymentRequired(nethttp.PaymentRequiredOptions{
    Amount:      "0.10",
    Description: "Standard data access",
})(standardHandler))

// Premium tier: $1.00
http.Handle("/api/premium", nethttp.PaymentRequired(nethttp.PaymentRequiredOptions{
    Amount:      "1.00",
    Description: "Premium data access",
})(premiumHandler))
```

## Accessing Payment Details

Your handlers can access payment information:

```go
func myHandler(w http.ResponseWriter, r *http.Request) {
    auth := nethttp.GetPaymentAuthorization(r)
    if auth != nil {
        // Access payment details
        log.Printf("Payment ID: %s", auth.PaymentID)
        log.Printf("Amount: %s", auth.ActualAmount)
        log.Printf("Payer: %s", auth.PublicKey)
        log.Printf("TX Hash: %s", auth.TransactionHash)
    }

    // Serve premium content
    json.NewEncoder(w).Encode(premiumData)
}
```

## Configuration Options

```go
nethttp.InitX402(&nethttp.Config{
    PaymentAddress: "wallet_address",     // Required: where payments go
    TokenMint:      "token_mint_address", // Required: which token
    Network:        "solana-devnet",      // Optional: solana-mainnet for production
    RPCURL:         "https://...",        // Optional: custom RPC endpoint
    AutoVerify:     true,                 // Optional: verify payments on-chain
})
```

## Payment Options

```go
nethttp.PaymentRequired(nethttp.PaymentRequiredOptions{
    Amount:      "0.10",                  // Required: payment amount
    PaymentAddress: "override_address",   // Optional: override global
    TokenMint:    "override_mint",        // Optional: override global
    Network:      "solana-mainnet",       // Optional: override global
    Description:  "Premium data access", // Optional: description shown to user
    ExpiresIn:    300,                    // Optional: expiration in seconds
    AutoVerify:   true,                   // Optional: verify payment on-chain
})
```

## Next Steps

- **Production Setup**: Configure for Solana mainnet
- **Full Example**: See [net/http Server Example](../examples/nethttp-server.md)
- **Client Development**: [Client Quick Start](client-quickstart.md)
- **API Reference**: [Core Library Documentation](../libraries/core.md)

## Common Patterns

### Dynamic Pricing

```go
func getPriceTier(tier string) string {
    switch tier {
    case "basic":
        return "0.05"
    case "premium":
        return "0.10"
    case "ultimate":
        return "1.00"
    default:
        return "0.05"
    }
}
```

### Rate Limiting Per Payment

```go
func rateLimitHandler(w http.ResponseWriter, r *http.Request) {
    auth := nethttp.GetPaymentAuthorization(r)

    // Allow 100 requests per $1 paid
    if auth != nil {
        amount, _ := strconv.ParseFloat(auth.ActualAmount, 64)
        requestsAllowed := int(amount * 100)
        // Implement rate limiting based on payment
    }

    json.NewEncoder(w).Encode(data)
}
```

### Logging Payments

```go
func logPayment(auth *core.PaymentAuthorization) {
    if auth != nil {
        log.Printf("[PAYMENT] ID:%s Amount:%s Payer:%s TX:%s",
            auth.PaymentID,
            auth.ActualAmount,
            auth.PublicKey,
            auth.TransactionHash)
    }
}
```

## Troubleshooting

### "X402 not initialized" error

Make sure to call `InitX402()` before defining handlers.

### "paymentAddress and tokenMint must be configured"

Check that environment variables are set:
```bash
echo $X402_PAYMENT_ADDRESS
echo $X402_TOKEN_MINT
```

### Payment verification failures

- Ensure RPC endpoint is accessible
- Check network configuration matches (devnet vs mainnet)
- Verify transaction hash is valid

## Support

- [Examples](../examples/nethttp-server.md)
- [API Reference](../reference/api-reference.md)
- [Error Handling](../reference/errors.md)
