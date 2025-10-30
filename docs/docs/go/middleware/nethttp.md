# net/http Middleware

Server-side X402 payment handling for Go's standard `net/http` package.

## Overview

The `openlibx402-nethttp` package provides middleware to require payments for HTTP endpoints using the standard library.

## Installation

```bash
go get github.com/openlibx402/go/openlibx402-nethttp
```

## Quick Start

```go
package main

import (
    "encoding/json"
    "net/http"
    "os"

    nethttp "github.com/openlibx402/go/openlibx402-nethttp"
)

func main() {
    // Initialize global configuration
    nethttp.InitX402(&nethttp.Config{
        PaymentAddress: os.Getenv("X402_PAYMENT_ADDRESS"),
        TokenMint:      os.Getenv("X402_TOKEN_MINT"),
        Network:        "solana-devnet",
        AutoVerify:     true,
    })

    // Free endpoint
    http.HandleFunc("/api/free", freeHandler)

    // Protected endpoint
    http.Handle("/api/premium", nethttp.PaymentRequired(nethttp.PaymentRequiredOptions{
        Amount: "0.10",
    })(http.HandlerFunc(premiumHandler)))

    http.ListenAndServe(":8080", nil)
}

func freeHandler(w http.ResponseWriter, r *http.Request) {
    json.NewEncoder(w).Encode(map[string]string{"data": "free"})
}

func premiumHandler(w http.ResponseWriter, r *http.Request) {
    json.NewEncoder(w).Encode(map[string]string{"data": "premium"})
}
```

## Configuration

### InitX402()

Initialize global X402 configuration. Call once at startup.

```go
nethttp.InitX402(&nethttp.Config{
    PaymentAddress: "YOUR_SOLANA_WALLET",      // Required
    TokenMint:      "USDC_MINT_ADDRESS",       // Required
    Network:        "solana-devnet",           // Optional: default shown
    RPCURL:         "https://api.devnet...",   // Optional
    AutoVerify:     true,                      // Optional: default shown
})
```

### Config Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| PaymentAddress | string | Yes | - | Wallet receiving payments |
| TokenMint | string | Yes | - | SPL token mint address |
| Network | string | No | "solana-devnet" | Solana network |
| RPCURL | string | No | Auto | RPC endpoint |
| AutoVerify | bool | No | false | Verify payments on-chain |

## Middleware

### PaymentRequired()

Add payment requirement to endpoints.

```go
http.Handle("/endpoint", nethttp.PaymentRequired(nethttp.PaymentRequiredOptions{
    Amount: "0.10",
})(handler))
```

### Options

```go
nethttp.PaymentRequired(nethttp.PaymentRequiredOptions{
    Amount:         "0.10",                 // Required: payment amount
    PaymentAddress: "override_address",     // Optional: override global
    TokenMint:      "override_mint",        // Optional: override global
    Network:        "solana-mainnet",       // Optional: override global
    Description:    "Premium data access", // Optional: human-readable
    ExpiresIn:      300,                    // Optional: seconds
    AutoVerify:     true,                   // Optional: verify on-chain
})
```

## Accessing Payment Details

Use `GetPaymentAuthorization()` in your handler:

```go
func myHandler(w http.ResponseWriter, r *http.Request) {
    auth := nethttp.GetPaymentAuthorization(r)
    if auth != nil {
        log.Printf("Payment ID: %s", auth.PaymentID)
        log.Printf("Amount: %s", auth.ActualAmount)
        log.Printf("Payer: %s", auth.PublicKey)
    }

    // Serve content
    json.NewEncoder(w).Encode(data)
}
```

### PaymentAuthorization Fields

```go
type PaymentAuthorization struct {
    PaymentID       string    // From payment request
    ActualAmount    string    // Amount paid
    PaymentAddress  string    // Recipient wallet
    AssetAddress    string    // Token mint
    Network         string    // Blockchain network
    Timestamp       time.Time // When authorized
    Signature       string    // Transaction signature
    PublicKey       string    // Payer's wallet
    TransactionHash string    // On-chain tx hash
}
```

## Patterns

### Multiple Pricing Tiers

```go
// Free tier
http.HandleFunc("/api/free", freeHandler)

// Basic tier ($0.05)
http.Handle("/api/basic",
    nethttp.PaymentRequired(nethttp.PaymentRequiredOptions{
        Amount: "0.05",
    })(http.HandlerFunc(basicHandler)))

// Standard tier ($0.10)
http.Handle("/api/standard",
    nethttp.PaymentRequired(nethttp.PaymentRequiredOptions{
        Amount: "0.10",
    })(http.HandlerFunc(standardHandler)))

// Premium tier ($1.00)
http.Handle("/api/premium",
    nethttp.PaymentRequired(nethttp.PaymentRequiredOptions{
        Amount: "1.00",
    })(http.HandlerFunc(premiumHandler)))
```

### Different Token Per Endpoint

```go
// USDC endpoint
http.Handle("/api/usdc",
    nethttp.PaymentRequired(nethttp.PaymentRequiredOptions{
        Amount: "0.10",
        TokenMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    })(handler))

// Custom token endpoint
http.Handle("/api/custom",
    nethttp.PaymentRequired(nethttp.PaymentRequiredOptions{
        Amount: "100.00",
        TokenMint: "YOUR_CUSTOM_TOKEN_MINT",
    })(handler))
```

### Logging Payments

```go
func loggedPaymentHandler(w http.ResponseWriter, r *http.Request) {
    auth := nethttp.GetPaymentAuthorization(r)
    if auth != nil {
        log.Printf("[PAYMENT] %s paid %s USDC (TX: %s)",
            auth.PublicKey[:8],
            auth.ActualAmount,
            auth.TransactionHash[:8])
    }

    json.NewEncoder(w).Encode(data)
}

http.Handle("/api/logged",
    nethttp.PaymentRequired(nethttp.PaymentRequiredOptions{
        Amount: "0.10",
    })(http.HandlerFunc(loggedPaymentHandler)))
```

### Custom Handler Wrapper

```go
func withPayment(amount string, handler http.HandlerFunc) http.Handler {
    return nethttp.PaymentRequired(nethttp.PaymentRequiredOptions{
        Amount: amount,
    })(handler)
}

// Usage
http.Handle("/api/data", withPayment("0.10", myDataHandler))
http.Handle("/api/export", withPayment("1.00", myExportHandler))
```

### Conditional Payment

```go
func conditionalHandler(w http.ResponseWriter, r *http.Request) {
    // Get query parameter
    tier := r.URL.Query().Get("tier")

    // Determine if payment needed
    if tier != "free" && tier != "" {
        // Payment was required before reaching here
        // Middleware already handled it
        auth := nethttp.GetPaymentAuthorization(r)
        if auth == nil {
            http.Error(w, "Payment required", http.StatusForbidden)
            return
        }
    }

    json.NewEncoder(w).Encode(data)
}

// Note: For conditional payment, you may need custom logic
// or use explicit payment in your handler
```

### Request Metadata

```go
func trackingHandler(w http.ResponseWriter, r *http.Request) {
    auth := nethttp.GetPaymentAuthorization(r)

    // Log request details
    log.Printf("Request: %s %s", r.Method, r.URL.Path)
    log.Printf("Payer: %s", auth.PublicKey)
    log.Printf("Amount: %s", auth.ActualAmount)

    // Could update analytics, billing, etc.
    updateAnalytics(r.URL.Path, auth.PublicKey, auth.ActualAmount)

    json.NewEncoder(w).Encode(data)
}

http.Handle("/api/tracked",
    nethttp.PaymentRequired(nethttp.PaymentRequiredOptions{
        Amount: "0.10",
    })(http.HandlerFunc(trackingHandler)))
```

## Error Handling

The middleware automatically handles errors:

- **No payment header**: Returns 402 with PaymentRequest
- **Invalid payment**: Returns 400 Bad Request
- **Verification failed**: Returns 403 Forbidden
- **Amount insufficient**: Returns 403 Forbidden
- **Address mismatch**: Returns 403 Forbidden

Your handler won't be called if payment fails.

## Configuration Override

### Per-Handler Override

```go
nethttp.InitX402(&nethttp.Config{
    PaymentAddress: "default_address",
    TokenMint:      "default_mint",
})

// Override for specific endpoint
http.Handle("/api/premium",
    nethttp.PaymentRequired(nethttp.PaymentRequiredOptions{
        Amount:         "0.10",
        PaymentAddress: "different_address",
        TokenMint:      "different_mint",
    })(handler))
```

### Environment-Based Configuration

```go
config := &nethttp.Config{
    PaymentAddress: os.Getenv("X402_PAYMENT_ADDRESS"),
    TokenMint:      os.Getenv("X402_TOKEN_MINT"),
}

if os.Getenv("X402_MAINNET") == "true" {
    config.Network = "solana-mainnet"
    config.RPCURL = "https://api.mainnet-beta.solana.com"
} else {
    config.Network = "solana-devnet"
    config.RPCURL = "https://api.devnet.solana.com"
}

nethttp.InitX402(config)
```

## Production Setup

### Configuration

```bash
# .env or environment variables
X402_PAYMENT_ADDRESS="YOUR_MAINNET_WALLET"
X402_TOKEN_MINT="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
X402_NETWORK="solana-mainnet"
X402_RPC_URL="https://api.mainnet-beta.solana.com"
PORT=443
```

### SSL/TLS

```go
http.ListenAndServeTLS(":443", "cert.pem", "key.pem", nil)
```

### Rate Limiting

```go
import "golang.org/x/time/rate"

var limiter = rate.NewLimiter(100, 10) // 100 req/s, burst 10

func rateLimited(handler http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        if !limiter.Allow() {
            http.Error(w, "Rate limited", http.StatusTooManyRequests)
            return
        }
        handler(w, r)
    }
}

http.Handle("/api/data",
    rateLimited(nethttp.PaymentRequired(opts)(handler)))
```

## Testing

### Mock Payment

For testing without real payments:

```go
func testHandler(t *testing.T) {
    // In test, you can mock the middleware
    // Or use devnet with test tokens
    rec := httptest.NewRecorder()
    req := httptest.NewRequest("GET", "/api/premium", nil)

    // Handler will return 402 in test without payment auth
    handler(rec, req)
    assert.Equal(t, http.StatusPaymentRequired, rec.Code)
}
```

## Troubleshooting

### "X402 not initialized" error

```
Error: X402 not initialized. Call InitX402() first.
```

**Solution**: Call `InitX402()` before defining routes.

```go
nethttp.InitX402(&nethttp.Config{...})
http.Handle("/api", myHandler)
```

### "paymentAddress and tokenMint must be configured"

**Solution**: Set environment variables or pass to `InitX402()`.

```bash
export X402_PAYMENT_ADDRESS="YOUR_ADDRESS"
export X402_TOKEN_MINT="YOUR_MINT"
```

### Payment verification failures

**Solution**: Check RPC endpoint and network configuration.

```go
config := nethttp.Config{
    Network: "solana-devnet",
    RPCURL:  "https://api.devnet.solana.com",
    AutoVerify: false,  // Disable if RPC is slow
}
```

## See Also

- [Echo Middleware](echo.md) - Alternative framework
- [Server Quick Start](../getting-started/server-quickstart.md)
- [Core Library](../libraries/core.md)
- [Error Reference](../reference/errors.md)
