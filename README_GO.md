# OpenLibx402 - Go Implementation Guide

Complete guide for using OpenLibx402 with Go to build payment-enabled APIs and clients.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Packages](#packages)
- [Server Implementation](#server-implementation)
- [Client Implementation](#client-implementation)
- [Examples](#examples)
- [Configuration](#configuration)
- [Security](#security)
- [Testing](#testing)

## Overview

OpenLibx402 for Go provides a complete implementation of the X402 protocol, enabling:

- AI agents to autonomously pay for API access
- API providers to monetize endpoints with micropayments
- Instant settlement on Solana blockchain (~200ms)
- No API keys, subscriptions, or manual billing

### Key Features

- **One-Line Integration**: Add payment requirements with a single middleware
- **Automatic Payment Handling**: Clients automatically pay when receiving 402 responses
- **Multiple Frameworks**: Support for `net/http` and Echo
- **Type-Safe**: Leverages Go's type system for reliable code
- **Production-Ready**: Includes verification, error handling, and security features

## Installation

The Go packages are published in a single repository: [github.com/openlibx402/go](https://github.com/openlibx402/go)

```bash
# Install core package
go get github.com/openlibx402/go/openlibx402-core

# Install client
go get github.com/openlibx402/go/openlibx402-client

# Install net/http middleware
go get github.com/openlibx402/go/openlibx402-nethttp

# Install Echo middleware
go get github.com/openlibx402/go/openlibx402-echo
```

All packages are managed in a single Git repository with separate Go modules for each package, enabling flexible import paths like `github.com/openlibx402/go/openlibx402-core`.

## Quick Start

### Server (5 minutes)

```go
package main

import (
    "encoding/json"
    "net/http"

    nethttp "github.com/openlibx402/go/openlibx402-nethttp"
)

func main() {
    // Initialize X402
    nethttp.InitX402(&nethttp.Config{
        PaymentAddress: "YOUR_WALLET_ADDRESS",
        TokenMint:      "USDC_MINT_ADDRESS",
        Network:        "solana-devnet",
        AutoVerify:     true,
    })

    // Free endpoint
    http.HandleFunc("/api/free", func(w http.ResponseWriter, r *http.Request) {
        json.NewEncoder(w).Encode(map[string]string{"data": "free content"})
    })

    // Paid endpoint ($0.10 USDC)
    http.Handle("/api/premium", nethttp.PaymentRequired(nethttp.PaymentRequiredOptions{
        Amount: "0.10",
    })(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        json.NewEncoder(w).Encode(map[string]string{"data": "premium content"})
    })))

    http.ListenAndServe(":8080", nil)
}
```

### Client (5 minutes)

```go
package main

import (
    "context"
    "io"
    "log"

    "github.com/gagliardetto/solana-go"
    "github.com/openlibx402/go/openlibx402-client"
)

func main() {
    // Load wallet keypair
    keypair := loadYourKeypair()

    // Create auto client
    client := client.NewAutoClient(keypair, "", &client.AutoClientOptions{
        MaxPaymentAmount: "10.0",
        AutoRetry:        true,
    })
    defer client.Close()

    // Automatically handles 402 and pays
    resp, err := client.Get(context.Background(), "https://api.example.com/api/premium")
    if err != nil {
        log.Fatal(err)
    }
    defer resp.Body.Close()

    data, _ := io.ReadAll(resp.Body)
    log.Println(string(data))
}
```

## Packages

### Core Package (`openlibx402-core`)

Core protocol implementation with models, errors, and Solana payment processing.

**Key Types:**

- `PaymentRequest` - Payment request from 402 response
- `PaymentAuthorization` - Payment authorization for retry request
- `SolanaPaymentProcessor` - Handles blockchain operations

**Example:**

```go
import "github.com/openlibx402/openlibx402/go/openlibx402-core"

processor := core.NewSolanaPaymentProcessor("https://api.devnet.solana.com", &keypair)
defer processor.Close()

balance, err := processor.GetTokenBalance(ctx, walletAddress, tokenMint)
```

### Client Package (`openlibx402-client`)

HTTP client with automatic and explicit payment handling.

**X402Client (Explicit):**

```go
client := client.NewX402Client(keypair, "", nil, false)
defer client.Close()

resp, err := client.Get(ctx, url, nil)
if client.PaymentRequired(resp) {
    paymentReq, _ := client.ParsePaymentRequest(resp)
    auth, _ := client.CreatePayment(ctx, paymentReq, "")
    resp, err = client.Get(ctx, url, auth)
}
```

**X402AutoClient (Automatic):**

```go
client := client.NewAutoClient(keypair, "", &client.AutoClientOptions{
    MaxPaymentAmount: "10.0",
    AutoRetry:        true,
})
defer client.Close()

// Automatically handles payment flow
resp, err := client.Get(ctx, url)
```

### net/http Middleware (`openlibx402-nethttp`)

Middleware for standard Go `net/http` package.

**Example:**

```go
import nethttp "github.com/openlibx402/openlibx402/go/openlibx402-nethttp"

nethttp.InitX402(&nethttp.Config{
    PaymentAddress: "YOUR_WALLET_ADDRESS",
    TokenMint:      "USDC_MINT_ADDRESS",
    Network:        "solana-devnet",
    AutoVerify:     true,
})

http.Handle("/premium", nethttp.PaymentRequired(nethttp.PaymentRequiredOptions{
    Amount:      "0.10",
    Description: "Premium data access",
})(handler))
```

### Echo Middleware (`openlibx402-echo`)

Middleware for Echo web framework.

**Example:**

```go
import echox402 "github.com/openlibx402/openlibx402/go/openlibx402-echo"

echox402.InitX402(&echox402.Config{
    PaymentAddress: "YOUR_WALLET_ADDRESS",
    TokenMint:      "USDC_MINT_ADDRESS",
    Network:        "solana-devnet",
    AutoVerify:     true,
})

e.GET("/premium", handler, echox402.PaymentRequired(echox402.PaymentRequiredOptions{
    Amount:      "0.10",
    Description: "Premium data access",
}))
```

## Server Implementation

### Using net/http

```go
package main

import (
    "encoding/json"
    "net/http"

    nethttp "github.com/openlibx402/go/openlibx402-nethttp"
)

func main() {
    nethttp.InitX402(&nethttp.Config{
        PaymentAddress: "YOUR_WALLET_ADDRESS",
        TokenMint:      "USDC_MINT_ADDRESS",
        Network:        "solana-devnet",
        AutoVerify:     true,
    })

    // Multiple pricing tiers
    http.Handle("/api/basic", nethttp.PaymentRequired(nethttp.PaymentRequiredOptions{
        Amount: "0.05",
    })(basicHandler))

    http.Handle("/api/premium", nethttp.PaymentRequired(nethttp.PaymentRequiredOptions{
        Amount: "0.10",
    })(premiumHandler))

    http.Handle("/api/ultimate", nethttp.PaymentRequired(nethttp.PaymentRequiredOptions{
        Amount: "1.00",
    })(ultimateHandler))

    http.ListenAndServe(":8080", nil)
}

func premiumHandler(w http.ResponseWriter, r *http.Request) {
    // Access payment details
    auth := nethttp.GetPaymentAuthorization(r)
    if auth != nil {
        log.Printf("Received payment: %s from %s", auth.ActualAmount, auth.PublicKey)
    }

    json.NewEncoder(w).Encode(map[string]string{"data": "premium content"})
}
```

### Using Echo

```go
package main

import (
    "net/http"

    "github.com/labstack/echo/v4"
    echox402 "github.com/openlibx402/go/openlibx402-echo"
)

func main() {
    echox402.InitX402(&echox402.Config{
        PaymentAddress: "YOUR_WALLET_ADDRESS",
        TokenMint:      "USDC_MINT_ADDRESS",
        Network:        "solana-devnet",
        AutoVerify:     true,
    })

    e := echo.New()

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
        log.Printf("Received payment: %s from %s", auth.ActualAmount, auth.PublicKey)
    }

    return c.JSON(http.StatusOK, map[string]string{"data": "premium content"})
}
```

## Client Implementation

### Automatic Payment Handling

Best for AI agents and autonomous systems.

```go
package main

import (
    "context"
    "io"
    "log"

    "github.com/gagliardetto/solana-go"
    "github.com/openlibx402/go/openlibx402-client"
)

func main() {
    keypair := loadKeypair()

    client := client.NewAutoClient(keypair, "", &client.AutoClientOptions{
        MaxPaymentAmount: "10.0",  // Safety limit
        AutoRetry:        true,    // Automatically pay on 402
        AllowLocal:       false,   // Disable for production
    })
    defer client.Close()

    ctx := context.Background()

    // Client automatically:
    // 1. Makes request
    // 2. Receives 402 response
    // 3. Creates and broadcasts payment
    // 4. Retries with payment authorization
    // 5. Returns successful response
    resp, err := client.Get(ctx, "https://api.example.com/premium")
    if err != nil {
        log.Fatal(err)
    }
    defer resp.Body.Close()

    data, _ := io.ReadAll(resp.Body)
    log.Println(string(data))
}
```

### Explicit Payment Handling

Best for applications that need fine-grained control.

```go
package main

import (
    "context"
    "io"
    "log"

    "github.com/gagliardetto/solana-go"
    "github.com/openlibx402/go/openlibx402-client"
)

func main() {
    keypair := loadKeypair()

    client := client.NewX402Client(keypair, "", nil, false)
    defer client.Close()

    ctx := context.Background()

    // 1. Make initial request
    resp, err := client.Get(ctx, "https://api.example.com/premium", nil)
    if err != nil {
        log.Fatal(err)
    }

    // 2. Check if payment required
    if client.PaymentRequired(resp) {
        log.Println("Payment required")

        // 3. Parse payment request
        paymentReq, err := client.ParsePaymentRequest(resp)
        if err != nil {
            log.Fatal(err)
        }

        log.Printf("Amount: %s USDC", paymentReq.MaxAmountRequired)

        // 4. User confirmation (optional)
        if !confirmPayment(paymentReq) {
            log.Fatal("Payment declined")
        }

        // 5. Create and broadcast payment
        auth, err := client.CreatePayment(ctx, paymentReq, "")
        if err != nil {
            log.Fatal(err)
        }

        log.Printf("Payment sent: %s", auth.TransactionHash)

        // 6. Retry with payment authorization
        resp, err = client.Get(ctx, "https://api.example.com/premium", auth)
        if err != nil {
            log.Fatal(err)
        }
    }

    // 7. Process response
    data, _ := io.ReadAll(resp.Body)
    resp.Body.Close()
    log.Println(string(data))
}
```

## Examples

See the [examples/go](examples/go/) directory for complete working examples:

### net/http Server Example

Full-featured server with multiple endpoints and pricing tiers.

```bash
cd examples/go/nethttp-server
export X402_PAYMENT_ADDRESS="YOUR_WALLET_ADDRESS"
export X402_TOKEN_MINT="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
go run main.go
```

### Echo Server Example

Echo framework implementation with dynamic pricing.

```bash
cd examples/go/echo-server
export X402_PAYMENT_ADDRESS="YOUR_WALLET_ADDRESS"
export X402_TOKEN_MINT="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
go run main.go
```

### Client Example

Demonstrates both automatic and explicit payment modes.

```bash
cd examples/go/nethttp-server
export X402_PRIVATE_KEY="your-base58-private-key"
go run client_example.go
```

## Configuration

### Environment Variables

**Server:**
```bash
export X402_PAYMENT_ADDRESS="YOUR_SOLANA_WALLET_ADDRESS"
export X402_TOKEN_MINT="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
export X402_NETWORK="solana-devnet"  # or solana-mainnet
export X402_RPC_URL="https://api.devnet.solana.com"
```

**Client:**
```bash
export X402_PRIVATE_KEY="your-base58-private-key"
```

### Code Configuration

**Server:**
```go
nethttp.InitX402(&nethttp.Config{
    PaymentAddress: "YOUR_WALLET_ADDRESS",
    TokenMint:      "USDC_MINT_ADDRESS",
    Network:        "solana-devnet",
    RPCURL:         "https://api.devnet.solana.com",
    AutoVerify:     true,
})
```

**Client:**
```go
client := client.NewAutoClient(keypair, rpcURL, &client.AutoClientOptions{
    MaxPaymentAmount: "10.0",
    AutoRetry:        true,
    AllowLocal:       false,
})
```

## Security

### Server Security

- **Always verify payments**: Set `AutoVerify: true` in production
- **Use HTTPS**: Required for production deployments
- **Validate amounts**: Check payment amounts match requirements
- **Rate limiting**: Implement rate limiting for endpoints
- **Monitor transactions**: Track all payment transactions

### Client Security

- **Private key management**: Never log or expose private keys
- **URL validation**: Client includes SSRF protection
- **Payment limits**: Always set `MaxPaymentAmount`
- **Local development**: Use `AllowLocal: true` only in development
- **Connection cleanup**: Always call `Close()` when done

### Best Practices

```go
// Good: Safe client usage
client := client.NewAutoClient(keypair, rpcURL, &client.AutoClientOptions{
    MaxPaymentAmount: "10.0",  // Safety limit
    AutoRetry:        true,
    AllowLocal:       false,   // Production setting
})
defer client.Close()  // Always cleanup

// Bad: Unsafe usage
client := client.NewAutoClient(keypair, "", nil)
// Missing Close(), no safety limits, no configuration
```

## Testing

### Unit Tests

```go
package main

import (
    "testing"

    "github.com/openlibx402/openlibx402/go/openlibx402-core"
)

func TestPaymentRequest(t *testing.T) {
    req := &core.PaymentRequest{
        MaxAmountRequired: "0.10",
        PaymentAddress:    "test_address",
        // ... other fields
    }

    if req.IsExpired() {
        t.Error("Fresh request should not be expired")
    }
}
```

### Integration Tests

```go
func TestPaymentFlow(t *testing.T) {
    // Start test server
    server := startTestServer()
    defer server.Close()

    // Create test client
    keypair := createTestKeypair()
    client := client.NewAutoClient(keypair, "", &client.AutoClientOptions{
        AllowLocal: true,
    })
    defer client.Close()

    // Test payment flow
    resp, err := client.Get(context.Background(), server.URL+"/premium")
    if err != nil {
        t.Fatal(err)
    }

    if resp.StatusCode != 200 {
        t.Errorf("Expected 200, got %d", resp.StatusCode)
    }
}
```

## Troubleshooting

### Common Issues

**"X402 not initialized"**
- Call `InitX402()` before setting up routes

**"Insufficient funds"**
- Ensure wallet has enough USDC tokens
- Check token mint address is correct

**"Payment verification failed"**
- Wait for transaction confirmation (~200ms)
- Check Solana network status
- Verify RPC URL is accessible

**"Invalid payment address"**
- Ensure payment address is a valid Solana public key
- Check environment variables are set

## Resources

- [Go Package Documentation](packages/go/README.md)
- [Example Code](examples/go/README.md)
- [X402 Protocol Specification](docs/openlibx402-technical-spec.md)
- [Main README](README.md)
- [Solana Go SDK](https://github.com/gagliardetto/solana-go)

## License

MIT License - See [LICENSE](LICENSE) for details
