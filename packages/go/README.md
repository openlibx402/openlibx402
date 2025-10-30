# OpenLibx402 - Go Implementation

Go implementation of the X402 protocol for enabling AI agents and APIs to autonomously pay for services using HTTP 402 "Payment Required" and Solana blockchain micropayments.

## Packages

### Core Packages

- **openlibx402-core** - Core protocol implementation with models, errors, and Solana payment processing
- **openlibx402-client** - HTTP client with automatic and explicit payment handling

### Framework Integrations

- **openlibx402-nethttp** - Middleware for standard Go `net/http` package
- **openlibx402-echo** - Middleware for Echo web framework

## Quick Start

### Server (net/http)

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

    // Protected endpoint
    http.Handle("/premium-data", nethttp.PaymentRequired(nethttp.PaymentRequiredOptions{
        Amount:      "0.10",
        Description: "Premium market data",
    })(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        json.NewEncoder(w).Encode(map[string]string{"data": "premium content"})
    })))

    http.ListenAndServe(":8080", nil)
}
```

### Server (Echo)

```go
package main

import (
    "net/http"

    "github.com/labstack/echo/v4"
    echox402 "github.com/openlibx402/go/openlibx402-echo"
)

func main() {
    // Initialize X402
    echox402.InitX402(&echox402.Config{
        PaymentAddress: "YOUR_WALLET_ADDRESS",
        TokenMint:      "USDC_MINT_ADDRESS",
        Network:        "solana-devnet",
        AutoVerify:     true,
    })

    e := echo.New()

    // Protected endpoint
    e.GET("/premium-data", func(c echo.Context) error {
        return c.JSON(http.StatusOK, map[string]string{"data": "premium content"})
    }, echox402.PaymentRequired(echox402.PaymentRequiredOptions{
        Amount:      "0.10",
        Description: "Premium market data",
    }))

    e.Start(":8080")
}
```

### Client (Auto-Payment)

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
    // Load your wallet keypair
    walletKeypair := solana.NewWallet()

    // Create auto client
    client := client.NewAutoClient(walletKeypair.PrivateKey, "", &client.AutoClientOptions{
        MaxPaymentAmount: "10.0", // Safety limit
        AutoRetry:        true,
    })
    defer client.Close()

    ctx := context.Background()

    // Automatically handles 402 and pays
    resp, err := client.Get(ctx, "https://api.example.com/premium-data")
    if err != nil {
        log.Fatal(err)
    }
    defer resp.Body.Close()

    data, _ := io.ReadAll(resp.Body)
    log.Println(string(data))
}
```

### Client (Explicit Payment)

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
    walletKeypair := solana.NewWallet()

    client := client.NewX402Client(walletKeypair.PrivateKey, "", nil, false)
    defer client.Close()

    ctx := context.Background()

    // Initial request
    resp, err := client.Get(ctx, "https://api.example.com/premium-data", nil)
    if err != nil {
        log.Fatal(err)
    }

    // Check if payment required
    if client.PaymentRequired(resp) {
        // Parse payment request
        paymentReq, err := client.ParsePaymentRequest(resp)
        if err != nil {
            log.Fatal(err)
        }

        // Create and broadcast payment
        auth, err := client.CreatePayment(ctx, paymentReq, "")
        if err != nil {
            log.Fatal(err)
        }

        // Retry with payment
        resp, err = client.Get(ctx, "https://api.example.com/premium-data", auth)
        if err != nil {
            log.Fatal(err)
        }
    }

    data, _ := io.ReadAll(resp.Body)
    resp.Body.Close()
    log.Println(string(data))
}
```

## Installation

```bash
# Core package
go get github.com/openlibx402/go/openlibx402-core

# Client package
go get github.com/openlibx402/go/openlibx402-client

# net/http middleware
go get github.com/openlibx402/go/openlibx402-nethttp

# Echo middleware
go get github.com/openlibx402/go/openlibx402-echo
```

## Development

### Local Development

For local development, you can enable localhost support in the client:

```go
client := client.NewX402Client(walletKeypair, "", nil, true) // allowLocal = true
```

And in your server configuration:

```bash
export X402_PAYMENT_ADDRESS="YOUR_WALLET_ADDRESS"
export X402_TOKEN_MINT="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
export X402_NETWORK="solana-devnet"
```

### Running Examples

```bash
# Run net/http server example
cd examples/go/nethttp-server
go run main.go

# Run Echo server example
cd examples/go/echo-server
go run main.go

# Run client example
cd examples/go/nethttp-server
export X402_PRIVATE_KEY="your-base58-private-key"
go run client_example.go
```

## Project Structure

```
packages/go/
├── openlibx402-core/           # Core protocol implementation
│   ├── models.go               # PaymentRequest, PaymentAuthorization
│   ├── errors.go               # Error types
│   ├── solana_processor.go    # Solana blockchain operations
│   └── go.mod
├── openlibx402-client/         # HTTP client
│   ├── explicit_client.go      # Manual payment control
│   ├── auto_client.go          # Automatic payment handling
│   └── go.mod
├── openlibx402-nethttp/        # net/http middleware
│   ├── middleware.go
│   └── go.mod
└── openlibx402-echo/           # Echo middleware
    ├── middleware.go
    └── go.mod
```

## Features

- One-line payment integration for API endpoints
- Automatic payment handling for clients
- Instant settlement on Solana (~200ms)
- Support for micropayments ($0.001+)
- No API keys or subscriptions needed
- Built-in payment verification
- Support for net/http and Echo frameworks

## Security

- Private keys never leave the client
- On-chain transaction verification
- Nonce-based replay protection
- Payment expiration timestamps
- SSRF protection in client
- Maximum payment limits

## Environment Variables

```bash
# Server configuration
X402_PAYMENT_ADDRESS=YourSolanaWalletAddress
X402_TOKEN_MINT=USDC_MINT_ADDRESS
X402_NETWORK=solana-devnet
X402_RPC_URL=https://api.devnet.solana.com

# Client configuration
X402_PRIVATE_KEY=YourBase58PrivateKey
```

## Documentation

- [Main README](../../../README.md) - Overview of OpenLibx402
- [Technical Specification](../../../docs/openlibx402-technical-spec.md) - Protocol details
- [Setup Guide](../../../SETUP.md) - Complete setup instructions

## License

MIT License - See [LICENSE](../../../LICENSE) for details

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../../../CONTRIBUTING.md) for guidelines.

## Resources

- [X402 Protocol Website](https://www.x402.org)
- [X402 Whitepaper](https://www.x402.org/x402-whitepaper.pdf)
- [Solana Documentation](https://docs.solana.com)
- [Echo Framework](https://echo.labstack.com)
