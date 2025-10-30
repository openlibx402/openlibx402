# Echo Middleware

Server-side X402 payment handling for the Echo web framework.

## Overview

The `openlibx402-echo` package provides middleware for Echo to require payments for endpoints.

## Installation

```bash
go get github.com/openlibx402/go/openlibx402-echo
```

## Quick Start

```go
package main

import (
    "net/http"
    "os"

    "github.com/labstack/echo/v4"
    echox402 "github.com/openlibx402/go/openlibx402-echo"
)

func main() {
    // Initialize configuration
    echox402.InitX402(&echox402.Config{
        PaymentAddress: os.Getenv("X402_PAYMENT_ADDRESS"),
        TokenMint:      os.Getenv("X402_TOKEN_MINT"),
        Network:        "solana-devnet",
        AutoVerify:     true,
    })

    e := echo.New()

    // Free endpoint
    e.GET("/api/free", freeHandler)

    // Protected endpoint
    e.GET("/api/premium", premiumHandler, echox402.PaymentRequired(echox402.PaymentRequiredOptions{
        Amount: "0.10",
    }))

    e.Start(":8080")
}

func freeHandler(c echo.Context) error {
    return c.JSON(http.StatusOK, map[string]string{"data": "free"})
}

func premiumHandler(c echo.Context) error {
    return c.JSON(http.StatusOK, map[string]string{"data": "premium"})
}
```

## Configuration

### InitX402()

Initialize global X402 configuration. Call once at startup.

```go
echox402.InitX402(&echox402.Config{
    PaymentAddress: "YOUR_SOLANA_WALLET",      // Required
    TokenMint:      "USDC_MINT_ADDRESS",       // Required
    Network:        "solana-devnet",           // Optional
    RPCURL:         "https://api.devnet...",   // Optional
    AutoVerify:     true,                      // Optional
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

Add payment requirement to routes.

```go
e.GET("/api/premium", handler, echox402.PaymentRequired(echox402.PaymentRequiredOptions{
    Amount: "0.10",
}))
```

Multiple routes:

```go
admin := e.Group("/admin", echox402.PaymentRequired(echox402.PaymentRequiredOptions{
    Amount: "1.00",
}))
admin.GET("/users", adminHandler)
admin.GET("/config", configHandler)
```

### Options

```go
echox402.PaymentRequired(echox402.PaymentRequiredOptions{
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
func myHandler(c echo.Context) error {
    auth := echox402.GetPaymentAuthorization(c)
    if auth != nil {
        c.Logger().Infof("Payment: %s USDC", auth.ActualAmount)
    }

    return c.JSON(http.StatusOK, data)
}

e.GET("/api/data", myHandler, echox402.PaymentRequired(echox402.PaymentRequiredOptions{
    Amount: "0.10",
}))
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
e.GET("/api/free", freeHandler)

// Basic tier ($0.05)
e.GET("/api/basic", basicHandler, echox402.PaymentRequired(echox402.PaymentRequiredOptions{
    Amount: "0.05",
}))

// Standard tier ($0.10)
e.GET("/api/standard", standardHandler, echox402.PaymentRequired(echox402.PaymentRequiredOptions{
    Amount: "0.10",
}))

// Premium tier ($1.00)
e.GET("/api/premium", premiumHandler, echox402.PaymentRequired(echox402.PaymentRequiredOptions{
    Amount: "1.00",
}))
```

### Route Groups with Payment

```go
// Basic API group (free)
api := e.Group("/api")
api.GET("/public", publicHandler)
api.GET("/data", dataHandler)

// Premium API group ($0.10)
premium := e.Group("/api/premium", echox402.PaymentRequired(echox402.PaymentRequiredOptions{
    Amount: "0.10",
}))
premium.GET("/data", premiumDataHandler)
premium.POST("/process", processHandler)

// Enterprise group ($5.00)
enterprise := e.Group("/api/enterprise", echox402.PaymentRequired(echox402.PaymentRequiredOptions{
    Amount: "5.00",
}))
enterprise.GET("/analytics", analyticsHandler)
enterprise.GET("/export", exportHandler)
```

### Dynamic Pricing

```go
func dynamicPricingHandler(c echo.Context) error {
    // Determine price based on request
    tier := c.QueryParam("tier")
    var price string

    switch tier {
    case "basic":
        price = "0.05"
    case "standard":
        price = "0.10"
    case "premium":
        price = "1.00"
    default:
        price = "0.05"
    }

    // Would need to apply middleware with dynamic amount
    // This shows how you'd handle it in the handler
    auth := echox402.GetPaymentAuthorization(c)
    if auth != nil {
        c.Logger().Infof("Tier: %s, Price: %s", tier, price)
    }

    return c.JSON(http.StatusOK, map[string]string{"tier": tier})
}

// For dynamic pricing, apply appropriate middleware:
e.GET("/api/data", dynamicPricingHandler,
    echox402.PaymentRequired(echox402.PaymentRequiredOptions{
        Amount: "0.10",  // Use highest expected amount
    }))
```

### Logging and Analytics

```go
func analyticsHandler(c echo.Context) error {
    auth := echox402.GetPaymentAuthorization(c)
    if auth != nil {
        // Log payment for analytics
        logPayment(PaymentLog{
            PaymentID:    auth.PaymentID,
            Amount:       auth.ActualAmount,
            Payer:        auth.PublicKey,
            Endpoint:     c.Request().URL.Path,
            Timestamp:    auth.Timestamp,
            Transaction:  auth.TransactionHash,
        })
    }

    return c.JSON(http.StatusOK, analyticsData)
}

e.GET("/api/analytics", analyticsHandler, echox402.PaymentRequired(echox402.PaymentRequiredOptions{
    Amount: "0.50",
}))
```

### Rate Limiting by Payment

```go
func rateLimitedByPayment(c echo.Context) error {
    auth := echox402.GetPaymentAuthorization(c)
    if auth != nil {
        amount, _ := strconv.ParseFloat(auth.ActualAmount, 64)
        // Allow 100 requests per $1 paid
        requestsAllowed := int(amount * 100)
        c.Set("requests_allowed", requestsAllowed)
    }

    return c.JSON(http.StatusOK, data)
}

e.GET("/api/data", rateLimitedByPayment, echox402.PaymentRequired(echox402.PaymentRequiredOptions{
    Amount: "0.10",
}))
```

### JWT with Payment

```go
import "github.com/golang-jwt/jwt"

func tokenWithPayment(c echo.Context) error {
    auth := echox402.GetPaymentAuthorization(c)

    claims := jwt.MapClaims{
        "payment_id": auth.PaymentID,
        "payer":      auth.PublicKey,
        "amount":     auth.ActualAmount,
        "exp":        time.Now().Add(24 * time.Hour).Unix(),
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    t, _ := token.SignedString([]byte("secret"))

    return c.JSON(http.StatusOK, map[string]string{"token": t})
}

e.GET("/api/token", tokenWithPayment, echox402.PaymentRequired(echox402.PaymentRequiredOptions{
    Amount: "0.10",
}))
```

## Middleware Composition

### Custom Middleware + Payment

```go
func customMiddleware() echo.MiddlewareFunc {
    return func(next echo.HandlerFunc) echo.HandlerFunc {
        return func(c echo.Context) error {
            // Custom logic before
            c.Set("request_id", uuid.New().String())

            err := next(c)

            // Custom logic after
            return err
        }
    }
}

e.GET("/api/data", handler,
    customMiddleware(),
    echox402.PaymentRequired(echox402.PaymentRequiredOptions{
        Amount: "0.10",
    }))
```

### Logging Middleware

```go
e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
    Format: "${time_rfc3339} ${method} ${uri} ${status}\n",
}))

e.GET("/api/data", handler, echox402.PaymentRequired(echox402.PaymentRequiredOptions{
    Amount: "0.10",
}))
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

### Per-Route Override

```go
echox402.InitX402(&echox402.Config{
    PaymentAddress: "default_address",
    TokenMint:      "default_mint",
})

// Override for specific route
e.GET("/premium",
    handler,
    echox402.PaymentRequired(echox402.PaymentRequiredOptions{
        Amount:         "0.10",
        PaymentAddress: "different_address",
    }))
```

### Environment-Based Configuration

```go
config := &echox402.Config{
    PaymentAddress: os.Getenv("X402_PAYMENT_ADDRESS"),
    TokenMint:      os.Getenv("X402_TOKEN_MINT"),
}

if os.Getenv("ENVIRONMENT") == "production" {
    config.Network = "solana-mainnet"
    config.RPCURL = "https://api.mainnet-beta.solana.com"
    config.AutoVerify = true
} else {
    config.Network = "solana-devnet"
    config.RPCURL = "https://api.devnet.solana.com"
    config.AutoVerify = false
}

echox402.InitX402(config)
```

## Production Setup

### Configuration

```bash
# Environment variables
X402_PAYMENT_ADDRESS="YOUR_MAINNET_WALLET"
X402_TOKEN_MINT="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
X402_NETWORK="solana-mainnet"
X402_RPC_URL="https://api.mainnet-beta.solana.com"
```

### HTTPS

```go
e.StartTLS(":443", "cert.pem", "key.pem")
```

### Graceful Shutdown

```go
e.Use(middleware.Logger())
e.Use(middleware.Recover())

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

## Testing

### Unit Test

```go
func TestPremiumHandler(t *testing.T) {
    e := echo.New()

    echox402.InitX402(&echox402.Config{
        PaymentAddress: "test_address",
        TokenMint:      "test_mint",
    })

    e.GET("/api/premium", premiumHandler, echox402.PaymentRequired(echox402.PaymentRequiredOptions{
        Amount: "0.10",
    }))

    req := httptest.NewRequest(echo.GET, "/api/premium", nil)
    rec := httptest.NewRecorder()
    c := e.NewContext(req, rec)

    // Should return 402 without payment
    assert.Equal(t, http.StatusPaymentRequired, rec.Code)
}
```

## Troubleshooting

### "X402 not initialized"

**Solution**: Call `InitX402()` before defining routes.

```go
echox402.InitX402(&echox402.Config{...})
e := echo.New()
e.GET("/api", handler)
```

### Payment not recognized

**Solution**: Ensure middleware is in correct position.

```go
// Correct: middleware last
e.GET("/api/data", handler, echox402.PaymentRequired(opts))

// Incorrect: middleware first
e.GET("/api/data", echox402.PaymentRequired(opts), handler)
```

## See Also

- [net/http Middleware](nethttp.md) - Alternative for standard library
- [Server Quick Start](../getting-started/server-quickstart.md)
- [Core Library](../libraries/core.md)
- [Error Reference](../reference/errors.md)
