# OpenLibx402 Go Examples

Example implementations demonstrating how to use the X402 protocol with Go.

## Examples

### 1. net/http Server Example

Located in `nethttp-server/`

A complete example using Go's standard `net/http` package:

- Free public endpoints
- Payment-protected premium endpoints
- Multiple pricing tiers
- Client example with automatic payment handling

**Run the server:**

```bash
cd nethttp-server

# Set environment variables
export X402_PAYMENT_ADDRESS="YOUR_SOLANA_WALLET_ADDRESS"
export X402_TOKEN_MINT="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
export X402_NETWORK="solana-devnet"

# Run
go run main.go
```

**Available endpoints:**

- `GET /api/free-data` - Free access (no payment)
- `GET /api/premium-data` - $0.10 USDC
- `GET /api/expensive-data` - $1.00 USDC
- `POST /api/process` - $0.50 USDC

**Run the client:**

```bash
cd nethttp-server

# Set your wallet private key
export X402_PRIVATE_KEY="your-base58-private-key"

# Run client example
go run client_example.go
```

### 2. Echo Server Example

Located in `echo-server/`

A complete example using the Echo web framework:

- Free public endpoints
- Payment-protected endpoints
- Dynamic pricing based on tiers
- Echo-specific middleware integration

**Run the server:**

```bash
cd echo-server

# Set environment variables
export X402_PAYMENT_ADDRESS="YOUR_SOLANA_WALLET_ADDRESS"
export X402_TOKEN_MINT="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
export X402_NETWORK="solana-devnet"

# Run
go run main.go
```

**Available endpoints:**

- `GET /api/free-data` - Free access (no payment)
- `GET /api/premium-data` - $0.10 USDC
- `GET /api/expensive-data` - $1.00 USDC
- `POST /api/process` - $0.50 USDC
- `GET /api/tiered/:tier` - Dynamic pricing by tier
  - `basic` - $0.05
  - `standard` - $0.10
  - `premium` - $0.25
  - `ultimate` - $1.00

## Setup

### Prerequisites

1. Go 1.21 or later
2. A Solana wallet with devnet USDC tokens
3. Solana CLI (optional, for wallet management)

### Get Devnet USDC

1. Create or use an existing Solana wallet
2. Get devnet SOL from the faucet:
   ```bash
   solana airdrop 2 YOUR_WALLET_ADDRESS --url devnet
   ```
3. Swap for devnet USDC or use a devnet USDC faucet

### Environment Variables

**Server:**
```bash
export X402_PAYMENT_ADDRESS="YOUR_SOLANA_WALLET_ADDRESS"
export X402_TOKEN_MINT="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
export X402_NETWORK="solana-devnet"
export PORT="8080"
```

**Client:**
```bash
export X402_PRIVATE_KEY="your-base58-private-key"
```

## Testing Locally

### 1. Start the Server

```bash
cd nethttp-server  # or echo-server
export X402_PAYMENT_ADDRESS="YOUR_WALLET_ADDRESS"
export X402_TOKEN_MINT="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
export X402_NETWORK="solana-devnet"
go run main.go
```

### 2. Test Free Endpoint

```bash
curl http://localhost:8080/api/free-data
```

### 3. Test Payment-Protected Endpoint

```bash
# This will return a 402 Payment Required response
curl http://localhost:8080/api/premium-data
```

Response:
```json
{
  "max_amount_required": "0.10",
  "asset_type": "SPL",
  "asset_address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "payment_address": "YOUR_WALLET_ADDRESS",
  "network": "solana-devnet",
  "expires_at": "2024-01-01T00:05:00Z",
  "nonce": "abc123...",
  "payment_id": "def456...",
  "resource": "/api/premium-data",
  "description": "Premium market data access"
}
```

### 4. Use the Auto Client

```bash
cd nethttp-server
export X402_PRIVATE_KEY="your-base58-private-key"
go run client_example.go
```

The client will:
1. Make a request to the premium endpoint
2. Receive a 402 Payment Required response
3. Automatically create and broadcast a payment transaction
4. Retry the request with payment authorization
5. Receive the premium data

## Code Examples

### Server Implementation (net/http)

```go
package main

import (
    "encoding/json"
    "net/http"

    nethttp "github.com/openlibx402/openlibx402/go/openlibx402-nethttp"
)

func main() {
    nethttp.InitX402(&nethttp.Config{
        PaymentAddress: "YOUR_WALLET_ADDRESS",
        TokenMint:      "USDC_MINT_ADDRESS",
        Network:        "solana-devnet",
        AutoVerify:     true,
    })

    http.Handle("/premium-data", nethttp.PaymentRequired(nethttp.PaymentRequiredOptions{
        Amount:      "0.10",
        Description: "Premium data access",
    })(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        json.NewEncoder(w).Encode(map[string]string{"data": "premium content"})
    })))

    http.ListenAndServe(":8080", nil)
}
```

### Server Implementation (Echo)

```go
package main

import (
    "net/http"

    "github.com/labstack/echo/v4"
    echox402 "github.com/openlibx402/openlibx402/go/openlibx402-echo"
)

func main() {
    echox402.InitX402(&echox402.Config{
        PaymentAddress: "YOUR_WALLET_ADDRESS",
        TokenMint:      "USDC_MINT_ADDRESS",
        Network:        "solana-devnet",
        AutoVerify:     true,
    })

    e := echo.New()

    e.GET("/premium-data", func(c echo.Context) error {
        return c.JSON(http.StatusOK, map[string]string{"data": "premium content"})
    }, echox402.PaymentRequired(echox402.PaymentRequiredOptions{
        Amount:      "0.10",
        Description: "Premium data access",
    }))

    e.Start(":8080")
}
```

### Auto Client Implementation

```go
package main

import (
    "context"
    "io"
    "log"

    "github.com/gagliardetto/solana-go"
    "github.com/openlibx402/openlibx402/go/openlibx402-client"
)

func main() {
    walletKeypair := loadKeypair()

    client := client.NewAutoClient(walletKeypair, "", &client.AutoClientOptions{
        MaxPaymentAmount: "10.0",
        AutoRetry:        true,
        AllowLocal:       true, // For local development
    })
    defer client.Close()

    resp, err := client.Get(context.Background(), "http://localhost:8080/api/premium-data")
    if err != nil {
        log.Fatal(err)
    }
    defer resp.Body.Close()

    data, _ := io.ReadAll(resp.Body)
    log.Println(string(data))
}
```

### Explicit Client Implementation

```go
package main

import (
    "context"
    "io"
    "log"

    "github.com/gagliardetto/solana-go"
    "github.com/openlibx402/openlibx402/go/openlibx402-client"
)

func main() {
    walletKeypair := loadKeypair()

    client := client.NewX402Client(walletKeypair, "", nil, true)
    defer client.Close()

    ctx := context.Background()

    // Initial request
    resp, err := client.Get(ctx, "http://localhost:8080/api/premium-data", nil)
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

        log.Printf("Payment required: %s USDC", paymentReq.MaxAmountRequired)

        // Create and broadcast payment
        auth, err := client.CreatePayment(ctx, paymentReq, "")
        if err != nil {
            log.Fatal(err)
        }

        log.Printf("Payment sent: %s", auth.TransactionHash)

        // Retry with payment
        resp, err = client.Get(ctx, "http://localhost:8080/api/premium-data", auth)
        if err != nil {
            log.Fatal(err)
        }
    }

    data, _ := io.ReadAll(resp.Body)
    resp.Body.Close()
    log.Println(string(data))
}
```

## Troubleshooting

### Common Issues

1. **"X402 not initialized" error**
   - Make sure to call `InitX402()` before setting up routes

2. **"Insufficient funds" error**
   - Ensure your wallet has enough USDC tokens
   - Check that you're using the correct token mint address

3. **"Payment verification failed" error**
   - Wait a few seconds for transaction confirmation
   - Check Solana network status (devnet can be slow)
   - Verify RPC URL is accessible

4. **"Invalid payment address" error**
   - Ensure the payment address is a valid Solana public key
   - Check that environment variables are set correctly

## Next Steps

- Deploy your server to production (use mainnet configuration)
- Implement custom pricing logic
- Add analytics and monitoring
- Create multi-tier pricing models
- Integrate with AI agents and autonomous systems

## Resources

- [Go Package Documentation](../../packages/go/README.md)
- [X402 Protocol Specification](../../docs/openlibx402-technical-spec.md)
- [Main README](../../README.md)
- [Solana Documentation](https://docs.solana.com)
