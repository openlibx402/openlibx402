# Client Library

HTTP client with automatic and explicit payment handling for accessing X402-protected APIs.

## Overview

The `openlibx402-client` package provides two client types:

- **X402Client**: Explicit, manual payment control
- **X402AutoClient**: Automatic payment handling

## Installation

```bash
go get github.com/openlibx402/go/openlibx402-client
```

## X402Client (Explicit Mode)

Manual control over the payment flow.

### Constructor

```go
client := client.NewX402Client(
    walletKeypair,  // solana.PrivateKey
    rpcURL,         // Optional: defaults to devnet
    httpClient,     // Optional: custom *http.Client
    allowLocal,     // bool: allow localhost URLs
)
defer client.Close()
```

### Methods

#### Get()

Execute a GET request.

```go
resp, err := client.Get(ctx, url, nil)
if err != nil {
    log.Fatal(err)
}
defer resp.Body.Close()
```

With payment authorization:

```go
resp, err := client.Get(ctx, url, paymentAuth)
```

#### Post()

Execute a POST request.

```go
body := []byte(`{"data": "value"}`)
resp, err := client.Post(ctx, url, body, nil)
```

#### Put()

Execute a PUT request.

```go
body := []byte(`{"update": "value"}`)
resp, err := client.Put(ctx, url, body, nil)
```

#### Delete()

Execute a DELETE request.

```go
resp, err := client.Delete(ctx, url, nil)
```

#### Do()

Execute any HTTP request.

```go
req, _ := http.NewRequest("PATCH", url, body)
resp, err := client.Do(ctx, req, nil)
```

#### PaymentRequired()

Check if response is 402 Payment Required.

```go
if client.PaymentRequired(resp) {
    // Handle payment
}
```

#### ParsePaymentRequest()

Parse PaymentRequest from 402 response.

```go
paymentReq, err := client.ParsePaymentRequest(resp)
if err != nil {
    log.Fatal(err)
}

log.Printf("Amount: %s", paymentReq.MaxAmountRequired)
```

#### CreatePayment()

Create and broadcast a payment transaction.

```go
auth, err := client.CreatePayment(ctx, paymentReq, "")
if err != nil {
    log.Fatal(err)
}

log.Printf("Sent: %s", auth.TransactionHash)
```

Optional custom amount:

```go
auth, err := client.CreatePayment(ctx, paymentReq, "0.05")
```

#### Close()

Close client and cleanup resources.

```go
defer client.Close()
```

## X402AutoClient (Automatic Mode)

Automatically handles payment flow.

### Constructor

```go
client := client.NewAutoClient(
    walletKeypair,  // solana.PrivateKey
    rpcURL,         // Optional: defaults to devnet
    options,        // Optional: *client.AutoClientOptions
)
defer client.Close()
```

### Options

```go
&client.AutoClientOptions{
    MaxPaymentAmount: "10.0",  // Safety limit
    AutoRetry:        true,    // Auto-pay on 402
    AllowLocal:       false,   // Allow localhost URLs
}
```

### Methods

#### Get()

Execute GET request (auto-pays if needed).

```go
resp, err := client.Get(ctx, url)
if err != nil {
    log.Fatal(err)
}
defer resp.Body.Close()
// Payment was handled automatically if needed
```

#### Post()

Execute POST request (auto-pays if needed).

```go
body := []byte(`{"data": "value"}`)
resp, err := client.Post(ctx, url, body)
```

#### Put()

Execute PUT request (auto-pays if needed).

```go
body := []byte(`{"update": "value"}`)
resp, err := client.Put(ctx, url, body)
```

#### Delete()

Execute DELETE request (auto-pays if needed).

```go
resp, err := client.Delete(ctx, url)
```

#### Close()

Close client and cleanup.

```go
defer client.Close()
```

## Usage Patterns

### Simple Auto-Payment

```go
client := client.NewAutoClient(keypair, "", &client.AutoClientOptions{
    MaxPaymentAmount: "10.0",
})
defer client.Close()

// Just call the endpoint - payment handled automatically
resp, err := client.Get(ctx, "https://api.example.com/premium")
if err != nil {
    log.Fatal(err)
}

data, _ := io.ReadAll(resp.Body)
resp.Body.Close()
log.Println(string(data))
```

### Explicit Payment Flow

```go
client := client.NewX402Client(keypair, "", nil, false)
defer client.Close()

// Step 1: Initial request
resp, err := client.Get(ctx, url, nil)
if err != nil {
    log.Fatal(err)
}

// Step 2: Check if payment needed
if client.PaymentRequired(resp) {
    // Step 3: Parse request
    paymentReq, err := client.ParsePaymentRequest(resp)
    if err != nil {
        log.Fatal(err)
    }

    // Step 4: User confirmation (optional)
    if !userConfirms(paymentReq) {
        log.Fatal("Payment declined")
    }

    // Step 5: Create payment
    auth, err := client.CreatePayment(ctx, paymentReq, "")
    if err != nil {
        log.Fatal(err)
    }

    // Step 6: Retry with payment
    resp, err = client.Get(ctx, url, auth)
    if err != nil {
        log.Fatal(err)
    }
}

// Step 7: Process response
data, _ := io.ReadAll(resp.Body)
resp.Body.Close()
```

### Multiple Endpoints

```go
client := client.NewAutoClient(keypair, "", &client.AutoClientOptions{
    MaxPaymentAmount: "10.0",
})
defer client.Close()

endpoints := map[string]string{
    "users":   "https://api.example.com/users",
    "posts":   "https://api.example.com/posts",
    "premium": "https://api.example.com/premium",
}

for name, endpoint := range endpoints {
    resp, err := client.Get(ctx, endpoint)
    if err != nil {
        log.Printf("Error accessing %s: %v", name, err)
        continue
    }

    data, _ := io.ReadAll(resp.Body)
    resp.Body.Close()
    log.Printf("%s: %s", name, string(data))
}
```

### With Payment Tracking

```go
type PaymentTracker struct {
    totalSpent float64
    maxSpend   float64
    payments   []string
}

func (pt *PaymentTracker) trackPayment(auth *core.PaymentAuthorization) {
    amount, _ := strconv.ParseFloat(auth.ActualAmount, 64)
    pt.totalSpent += amount
    pt.payments = append(pt.payments, auth.TransactionHash)
    log.Printf("Total spent: %.2f / %.2f", pt.totalSpent, pt.maxSpend)
}

// Usage
tracker := &PaymentTracker{
    totalSpent: 0,
    maxSpend:   10.0,
}

client := client.NewAutoClient(keypair, "", &client.AutoClientOptions{
    MaxPaymentAmount: "5.0",  // Prevent individual payments over $5
})

// Track payments by monitoring response
// Note: Auto client doesn't expose auth, so you'd need explicit mode for tracking
```

### Custom HTTP Client

```go
httpClient := &http.Client{
    Timeout: 30 * time.Second,
    Transport: &http.Transport{
        MaxIdleConns: 10,
    },
}

client := client.NewX402Client(keypair, "", httpClient, false)
```

### Context with Timeout

```go
ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
defer cancel()

resp, err := client.Get(ctx, url, nil)
if errors.Is(err, context.DeadlineExceeded) {
    log.Println("Request timeout")
}
```

## Error Handling

```go
import "github.com/openlibx402/go/openlibx402-core"

resp, err := client.Get(ctx, url, nil)
if err != nil {
    switch e := err.(type) {
    case *core.PaymentExpiredError:
        log.Println("Payment request expired")
        // Retry or request new payment

    case *core.InsufficientFundsError:
        log.Printf("Insufficient balance: %s", e.RequiredAmount)
        // Cannot proceed - need funds

    case *core.PaymentVerificationError:
        log.Println("Payment verification failed")
        // Retry - might be temporary

    case *core.InvalidPaymentRequestError:
        log.Println("Invalid payment request")
        // Contact API provider

    default:
        log.Println("Unknown error:", err)
    }
}
```

## Configuration

### Environment Variables

```go
import "os"

rpcURL := os.Getenv("X402_RPC_URL")
if rpcURL == "" {
    rpcURL = "https://api.devnet.solana.com"
}

maxPayment := os.Getenv("X402_MAX_PAYMENT")
if maxPayment == "" {
    maxPayment = "10.0"
}
```

### From Config File

```go
type ClientConfig struct {
    WalletPrivateKey string
    RPCURL          string
    MaxPaymentAmount string
    AutoRetry       bool
    AllowLocal      bool
}

// Load from JSON, YAML, TOML, etc
config := loadConfig("config.yaml")

privateKeyBytes := base58.Decode(config.WalletPrivateKey)
keypair := solana.PrivateKey(privateKeyBytes)

client := client.NewAutoClient(
    keypair,
    config.RPCURL,
    &client.AutoClientOptions{
        MaxPaymentAmount: config.MaxPaymentAmount,
        AutoRetry:        config.AutoRetry,
        AllowLocal:       config.AllowLocal,
    },
)
```

## Security Best Practices

### ✅ Do

```go
// Use payment limits
client := client.NewAutoClient(keypair, "", &client.AutoClientOptions{
    MaxPaymentAmount: "10.0",  // Prevent overspending
})

// Use context timeout
ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
defer cancel()

// Close client when done
defer client.Close()

// Validate URLs in explicit mode
// Client validates URLs automatically
```

### ❌ Don't

```go
// Don't use without payment limit
client := client.NewAutoClient(keypair, "", nil)

// Don't allow local in production
client := client.NewAutoClient(keypair, "", &client.AutoClientOptions{
    AllowLocal: true,  // Only for dev!
})

// Don't forget to close
client := client.NewAutoClient(keypair, "", nil)
// Missing: defer client.Close()

// Don't hardcode URLs
client.Get(ctx, "http://192.168.1.1/api")  // SSRF risk
```

## Performance Tips

### Connection Reuse

```go
// Good: Reuse client for multiple requests
client := client.NewAutoClient(keypair, "", nil)
defer client.Close()

for _, url := range urls {
    resp, _ := client.Get(ctx, url)
    // Use response
}
```

### Timeout Configuration

```go
// Different timeouts for different needs
shortTimeout := 10 * time.Second
longTimeout := 60 * time.Second

for _, url := range urls {
    ctx, cancel := context.WithTimeout(context.Background(), shortTimeout)
    resp, _ := client.Get(ctx, url)
    cancel()
}
```

### Batch Processing

```go
// Process multiple endpoints efficiently
results := make(chan string)
for _, url := range urls {
    go func(u string) {
        resp, _ := client.Get(ctx, u)
        data, _ := io.ReadAll(resp.Body)
        results <- string(data)
        resp.Body.Close()
    }(url)
}

for range urls {
    log.Println(<-results)
}
```

## See Also

- [Core Library](core.md) - Underlying payment types
- [Server Quick Start](../getting-started/server-quickstart.md)
- [Client Quick Start](../getting-started/client-quickstart.md)
- [Error Reference](../reference/errors.md)
