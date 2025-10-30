# Client Quick Start

Build a client that automatically pays for API access in minutes.

## 5-Minute Auto-Paying Client

### Step 1: Initialize Your Project

```bash
mkdir x402-client
cd x402-client
go mod init github.com/yourname/x402-client
```

### Step 2: Install Dependencies

```bash
go get github.com/openlibx402/go/openlibx402-client
go get github.com/gagliardetto/solana-go
```

### Step 3: Create Your Client

Create `main.go`:

```go
package main

import (
    "context"
    "io"
    "log"
    "os"

    "github.com/gagliardetto/solana-go"
    "github.com/mr-tron/base58"
    "github.com/openlibx402/go/openlibx402-client"
)

func main() {
    // Load wallet from environment
    privateKeyStr := os.Getenv("X402_PRIVATE_KEY")
    if privateKeyStr == "" {
        log.Fatal("X402_PRIVATE_KEY not set")
    }

    // Decode private key
    privateKeyBytes := base58.Decode(privateKeyStr)
    walletKeypair := solana.PrivateKey(privateKeyBytes)

    // Create auto client (automatically handles 402 and pays)
    client := client.NewAutoClient(walletKeypair, "", &client.AutoClientOptions{
        MaxPaymentAmount: "10.0",  // Safety limit
        AutoRetry:        true,    // Auto-pay on 402
    })
    defer client.Close()

    ctx := context.Background()

    // Access premium endpoint (automatically pays if needed)
    log.Println("Accessing premium endpoint...")
    resp, err := client.Get(ctx, "https://api.example.com/api/premium")
    if err != nil {
        log.Fatal(err)
    }
    defer resp.Body.Close()

    // Read response
    data, _ := io.ReadAll(resp.Body)
    log.Printf("Response: %s", string(data))
}
```

### Step 4: Get Your Wallet Private Key

```bash
# If you have a Solana wallet file
solana-keygen show --private-key

# Output will be base58 encoded private key
# Export it
export X402_PRIVATE_KEY="your-base58-private-key"
```

### Step 5: Run Your Client

```bash
export X402_PRIVATE_KEY="your-private-key-here"
go run main.go
```

## Explicit Control Mode

For applications needing fine-grained control:

```go
package main

import (
    "context"
    "fmt"
    "io"
    "log"

    "github.com/gagliardetto/solana-go"
    "github.com/openlibx402/go/openlibx402-client"
)

func main() {
    walletKeypair := solana.NewWallet().PrivateKey

    // Create explicit client (manual control)
    client := client.NewX402Client(walletKeypair, "", nil, false)
    defer client.Close()

    ctx := context.Background()

    // Step 1: Make initial request
    log.Println("Making request...")
    resp, err := client.Get(ctx, "https://api.example.com/premium", nil)
    if err != nil {
        log.Fatal(err)
    }

    // Step 2: Check if payment required
    if client.PaymentRequired(resp) {
        log.Println("Payment required!")

        // Step 3: Parse payment request
        paymentReq, err := client.ParsePaymentRequest(resp)
        if err != nil {
            log.Fatal(err)
        }

        log.Printf("Amount: %s USDC", paymentReq.MaxAmountRequired)

        // Step 4: User confirmation (optional)
        if !userConfirms() {
            log.Fatal("Payment declined")
        }

        // Step 5: Create and broadcast payment
        log.Println("Creating payment...")
        auth, err := client.CreatePayment(ctx, paymentReq, "")
        if err != nil {
            log.Fatal(err)
        }

        log.Printf("Payment sent: %s", auth.TransactionHash)

        // Step 6: Retry with payment
        log.Println("Retrying with payment...")
        resp, err = client.Get(ctx, "https://api.example.com/premium", auth)
        if err != nil {
            log.Fatal(err)
        }
    }

    // Step 7: Process response
    data, _ := io.ReadAll(resp.Body)
    resp.Body.Close()
    log.Printf("Data: %s", string(data))
}

func userConfirms() bool {
    // Implement your confirmation logic
    return true
}
```

## POST/PUT/DELETE Requests

```go
// POST request
data := []byte(`{"name": "value"}`)
resp, err := client.Post(ctx, "https://api.example.com/data", data)

// PUT request
resp, err := client.Put(ctx, "https://api.example.com/data", data)

// DELETE request
resp, err := client.Delete(ctx, "https://api.example.com/data")
```

## Error Handling

```go
import "github.com/openlibx402/go/openlibx402-core"

resp, err := client.Get(ctx, url)
if err != nil {
    switch err := err.(type) {
    case *core.PaymentExpiredError:
        log.Println("Payment request expired")
    case *core.InsufficientFundsError:
        log.Printf("Need: %s, Have: %s",
            err.RequiredAmount,
            err.AvailableAmount)
    case *core.PaymentVerificationError:
        log.Println("Payment verification failed")
    default:
        log.Println("Other error:", err)
    }
}
```

## Accessing Payment Details

```go
auth, err := client.CreatePayment(ctx, paymentReq, "")
if err != nil {
    log.Fatal(err)
}

log.Printf("Payment ID: %s", auth.PaymentID)
log.Printf("Amount: %s", auth.ActualAmount)
log.Printf("Payment Address: %s", auth.PaymentAddress)
log.Printf("Network: %s", auth.Network)
log.Printf("Signature: %s", auth.Signature)
log.Printf("Transaction: %s", auth.TransactionHash)
```

## Auto Client Options

```go
client := client.NewAutoClient(walletKeypair, rpcURL, &client.AutoClientOptions{
    MaxPaymentAmount: "10.0",   // Safety limit - reject payments over this
    AutoRetry:        true,     // Auto-retry on 402 with payment
    AllowLocal:       false,    // Allow localhost URLs (dev only!)
})
```

## Handling Multiple Payment Types

```go
// Different endpoints with different pricing
endpoints := map[string]string{
    "basic":    "https://api.example.com/basic",
    "premium":  "https://api.example.com/premium",
    "ultimate": "https://api.example.com/ultimate",
}

for name, endpoint := range endpoints {
    log.Printf("Accessing %s endpoint...", name)
    resp, err := client.Get(ctx, endpoint)
    if err != nil {
        log.Printf("Error accessing %s: %v", name, err)
        continue
    }

    data, _ := io.ReadAll(resp.Body)
    resp.Body.Close()
    log.Printf("%s response: %s", name, string(data))
}
```

## Testing with Local Server

For local development, enable local URLs:

```go
// Development: allow localhost
client := client.NewAutoClient(walletKeypair, "", &client.AutoClientOptions{
    AllowLocal: true,  // Enable for http://localhost:8080
})

resp, err := client.Get(ctx, "http://localhost:8080/api/premium")
```

## Configuration

```go
// Custom RPC endpoint
rpcURL := "https://api.mainnet-beta.solana.com"
client := client.NewAutoClient(walletKeypair, rpcURL, nil)

// Custom options
client := client.NewAutoClient(walletKeypair, rpcURL, &client.AutoClientOptions{
    MaxPaymentAmount: "100.0",  // Higher limit for expensive APIs
    AutoRetry:        true,
    AllowLocal:       false,
})
```

## Safety Best Practices

```go
// ✅ Good: Always use payment limit
client := client.NewAutoClient(walletKeypair, "", &client.AutoClientOptions{
    MaxPaymentAmount: "10.0",  // Prevent accidental overpayment
})

// ✅ Good: Always close
defer client.Close()

// ✅ Good: Use context with timeout
ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
defer cancel()

// ❌ Bad: No safety limits
client := client.NewAutoClient(walletKeypair, "", nil)

// ❌ Bad: AllowLocal in production
client := client.NewAutoClient(walletKeypair, "", &client.AutoClientOptions{
    AllowLocal: true,  // Only for development!
})
```

## Rate Limiting Payments

```go
// Track payments to avoid excessive spending
type PaymentTracker struct {
    totalSpent float64
    maxSpend   float64
}

func (pt *PaymentTracker) canPay(amount string) bool {
    amountFloat, _ := strconv.ParseFloat(amount, 64)
    return (pt.totalSpent + amountFloat) <= pt.maxSpend
}

// Usage
tracker := &PaymentTracker{
    totalSpent: 0,
    maxSpend:   10.0,
}

resp, err := client.Get(ctx, url)
if err != nil {
    if paymentErr, ok := err.(*core.PaymentRequiredError); ok {
        if !tracker.canPay(paymentErr.PaymentRequest.MaxAmountRequired) {
            log.Fatal("Would exceed spending limit")
        }
    }
}
```

## Next Steps

- **Full Example**: See [net/http Client Example](../examples/nethttp-server.md)
- **Error Handling**: [Error Reference](../reference/errors.md)
- **API Details**: [Client Library Documentation](../libraries/client.md)
- **Building a Server**: [Server Quick Start](server-quickstart.md)

## Support

- [Client Library Docs](../libraries/client.md)
- [API Reference](../reference/api-reference.md)
- [Error Handling](../reference/errors.md)
