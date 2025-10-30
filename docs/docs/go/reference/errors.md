# Error Reference

Complete guide to X402 errors, error codes, and error handling patterns.

## Error Types

### X402Error (Base Type)

The base error type for all X402 errors.

```go
type X402Error struct {
    Message string
    Code    string
    Details map[string]interface{}
}

func (e *X402Error) Error() string
```

#### Example

```go
resp, err := client.Get(ctx, url, nil)
if err != nil {
    if x402Err, ok := err.(*core.X402Error); ok {
        log.Printf("Error Code: %s", x402Err.Code)
        log.Printf("Error Message: %s", x402Err.Message)
        log.Printf("Details: %v", x402Err.Details)
    }
}
```

---

### PaymentRequiredError

Raised when a server responds with HTTP 402 Payment Required.

```go
type PaymentRequiredError struct {
    X402Error
    PaymentRequest *PaymentRequest
}

func NewPaymentRequiredError(paymentReq *PaymentRequest, message string) error
```

#### Error Code

```
PAYMENT_REQUIRED
```

#### HTTP Status

```
402 Payment Required
```

#### Causes

- Endpoint requires payment but no authorization header provided
- Payment authorization missing or invalid
- First request to paid endpoint

#### User Action

- Make payment using client
- Include payment authorization in retry request

#### Example

```go
resp, err := client.Get(ctx, url, nil)
if err != nil {
    if x402Err, ok := err.(*core.PaymentRequiredError); ok {
        log.Printf("Amount Required: %s", x402Err.PaymentRequest.MaxAmountRequired)
        log.Printf("Recipient: %s", x402Err.PaymentRequest.PaymentAddress)

        // Create payment
        auth, _ := client.CreatePayment(ctx, x402Err.PaymentRequest, "")

        // Retry with payment
        resp, _ = client.Get(ctx, url, auth)
    }
}
```

---

### PaymentExpiredError

Raised when a payment request has expired.

```go
type PaymentExpiredError struct {
    X402Error
    PaymentRequest *PaymentRequest
}

func NewPaymentExpiredError(paymentReq *PaymentRequest, message string) error
```

#### Error Code

```
PAYMENT_EXPIRED
```

#### HTTP Status

```
402 Payment Required (during validation)
```

#### Causes

- Payment request timestamp has passed expiration time
- Server took too long to process payment
- Default expiration is 5 minutes (300 seconds)

#### User Action

- Request new payment from server
- Reduce payment processing time
- Check system clock accuracy

#### Example

```go
paymentReq, err := client.ParsePaymentRequest(resp)
if err != nil {
    log.Fatal(err)
}

if paymentReq.IsExpired() {
    log.Println("Payment request expired")
    // Request new payment
    resp, _ = client.Get(ctx, url, nil)
    paymentReq, _ = client.ParsePaymentRequest(resp)
}
```

#### Prevention

```go
// Check expiration before creating payment
if paymentReq.IsExpired() {
    return core.NewPaymentExpiredError(paymentReq, "")
}

// Request with longer expiration
nethttp.PaymentRequired(nethttp.PaymentRequiredOptions{
    Amount:   "0.10",
    ExpiresIn: 600,  // 10 minutes
})
```

---

### InsufficientFundsError

Raised when wallet lacks sufficient token balance.

```go
type InsufficientFundsError struct {
    X402Error
    RequiredAmount  string
    AvailableAmount string
}

func NewInsufficientFundsError(required string, available string) error
```

#### Error Code

```
INSUFFICIENT_FUNDS
```

#### HTTP Status

```
400 Bad Request
```

#### Causes

- Wallet balance is less than payment amount
- Token account doesn't exist
- Token account is empty

#### User Action

- Add funds to wallet
- Use different wallet with sufficient balance
- Request smaller payment amount (if allowed)

#### Example

```go
resp, err := client.Get(ctx, url, nil)
if err != nil {
    if insuffErr, ok := err.(*core.InsufficientFundsError); ok {
        log.Printf("Required: %s", insuffErr.RequiredAmount)
        log.Printf("Available: %s", insuffErr.AvailableAmount)
        log.Println("Please add more funds to your wallet")
    }
}
```

#### Prevention

```go
// Check balance before payment
processor := core.NewSolanaPaymentProcessor(rpcURL, nil)
defer processor.Close()

balance, err := processor.GetTokenBalance(ctx, walletAddress, tokenMint)
if err != nil {
    log.Fatal(err)
}

amount, _ := strconv.ParseFloat(paymentReq.MaxAmountRequired, 64)
if balance < amount {
    return core.NewInsufficientFundsError(
        paymentReq.MaxAmountRequired,
        fmt.Sprintf("%.2f", balance),
    )
}
```

---

### PaymentVerificationError

Raised when payment verification fails.

```go
type PaymentVerificationError struct {
    X402Error
}

func NewPaymentVerificationError(message string) error
```

#### Error Code

```
PAYMENT_VERIFICATION_FAILED
```

#### HTTP Status

```
403 Forbidden
```

#### Causes

- Transaction not found on-chain
- Payment amount doesn't match request
- Recipient address doesn't match
- Token mint doesn't match
- Transaction not yet confirmed
- RPC endpoint is unavailable

#### User Action

- Retry the payment (transaction may be confirming)
- Check network connectivity
- Verify wallet address and token mint
- Contact API support if persistent

#### Example

```go
resp, err := client.Get(ctx, url, auth)
if err != nil {
    if verifyErr, ok := err.(*core.PaymentVerificationError); ok {
        log.Printf("Verification failed: %s", verifyErr.Message)
        log.Println("Transaction may still be confirming, retry in a few seconds")

        // Retry logic
        time.Sleep(3 * time.Second)
        resp, _ = client.Get(ctx, url, auth)
    }
}
```

#### Prevention

```go
// Verify before sending request
verified, err := processor.VerifyTransaction(
    ctx,
    txHash,
    paymentReq.PaymentAddress,
    amount,
    paymentReq.AssetAddress,
)
if err != nil || !verified {
    return core.NewPaymentVerificationError("verification failed")
}
```

---

### TransactionBroadcastError

Raised when transaction broadcasting fails.

```go
type TransactionBroadcastError struct {
    X402Error
}

func NewTransactionBroadcastError(message string) error
```

#### Error Code

```
TRANSACTION_BROADCAST_FAILED
```

#### HTTP Status

```
500 Internal Server Error
```

#### Causes

- Network connectivity issue
- RPC endpoint is unavailable
- Solana network congestion
- Invalid transaction
- Node is not responding

#### User Action

- Retry after a delay
- Check internet connectivity
- Verify RPC endpoint
- Try different RPC endpoint
- Wait for network to stabilize

#### Example

```go
resp, err := client.Get(ctx, url, nil)
if err != nil {
    if broadcastErr, ok := err.(*core.TransactionBroadcastError); ok {
        log.Printf("Broadcast failed: %s", broadcastErr.Message)
        log.Println("Retrying...")

        // Exponential backoff retry
        for attempt := 1; attempt <= 3; attempt++ {
            time.Sleep(time.Duration(math.Pow(2, float64(attempt-1))) * time.Second)
            resp, err = client.Get(ctx, url, nil)
            if err == nil {
                break
            }
        }
    }
}
```

---

### InvalidPaymentRequestError

Raised when payment request format is invalid.

```go
type InvalidPaymentRequestError struct {
    X402Error
}

func NewInvalidPaymentRequestError(message string) error
```

#### Error Code

```
INVALID_PAYMENT_REQUEST
```

#### HTTP Status

```
400 Bad Request
```

#### Causes

- Missing required fields in payment request
- Invalid JSON format
- Malformed payment request structure
- Server returned unexpected format

#### User Action

- Contact API provider
- Check API documentation
- Verify server is responding correctly
- Report issue to API maintainer

#### Example

```go
paymentReq, err := client.ParsePaymentRequest(resp)
if err != nil {
    if invalidErr, ok := err.(*core.InvalidPaymentRequestError); ok {
        log.Printf("Invalid payment request: %s", invalidErr.Message)
        log.Println("Please contact API support")
    }
}
```

---

## Error Handling Patterns

### Basic Error Handling

```go
resp, err := client.Get(ctx, url, nil)
if err != nil {
    log.Printf("Error: %v", err)
    return err
}
```

### Type-Based Error Handling

```go
resp, err := client.Get(ctx, url, nil)
if err != nil {
    switch e := err.(type) {
    case *core.PaymentRequiredError:
        log.Println("Payment needed")

    case *core.InsufficientFundsError:
        log.Printf("Need more funds: %s", e.RequiredAmount)

    case *core.PaymentExpiredError:
        log.Println("Payment request expired, retrying...")

    case *core.PaymentVerificationError:
        log.Println("Verification failed, retrying...")

    case *core.TransactionBroadcastError:
        log.Println("Network error, retrying...")

    default:
        log.Printf("Unknown error: %v", err)
    }
    return err
}
```

### Retry with Exponential Backoff

```go
func retryWithBackoff(fn func() error, maxAttempts int) error {
    for attempt := 1; attempt <= maxAttempts; attempt++ {
        err := fn()
        if err == nil {
            return nil
        }

        // Don't retry for non-retriable errors
        if x402Err, ok := err.(*core.X402Error); ok {
            if !shouldRetry(x402Err.Code) {
                return err
            }
        }

        if attempt < maxAttempts {
            backoff := time.Duration(math.Pow(2, float64(attempt-1))) * time.Second
            time.Sleep(backoff)
        }
    }
    return fmt.Errorf("max retry attempts exceeded")
}

func shouldRetry(code string) bool {
    switch code {
    case "PAYMENT_EXPIRED", "PAYMENT_VERIFICATION_FAILED", "TRANSACTION_BROADCAST_FAILED":
        return true
    default:
        return false
    }
}
```

### Explicit Payment Flow with Error Handling

```go
func paymentFlow(ctx context.Context, client *client.X402Client, url string) (*http.Response, error) {
    // Step 1: Initial request
    resp, err := client.Get(ctx, url, nil)
    if err != nil {
        return nil, err
    }

    // Step 2: Check if payment needed
    if !client.PaymentRequired(resp) {
        return resp, nil
    }

    // Step 3: Parse payment request
    paymentReq, err := client.ParsePaymentRequest(resp)
    if err != nil {
        if invalidErr, ok := err.(*core.InvalidPaymentRequestError); ok {
            return nil, fmt.Errorf("invalid payment request: %w", invalidErr)
        }
        return nil, err
    }

    // Step 4: Check expiration
    if paymentReq.IsExpired() {
        return nil, core.NewPaymentExpiredError(paymentReq, "")
    }

    // Step 5: User confirmation (optional)
    if !userConfirms(paymentReq) {
        return nil, fmt.Errorf("user declined payment")
    }

    // Step 6: Create payment
    auth, err := client.CreatePayment(ctx, paymentReq, "")
    if err != nil {
        switch e := err.(type) {
        case *core.InsufficientFundsError:
            return nil, fmt.Errorf("insufficient funds: need %s, have %s",
                e.RequiredAmount, e.AvailableAmount)
        case *core.TransactionBroadcastError:
            return nil, fmt.Errorf("network error: %w", e)
        default:
            return nil, err
        }
    }

    // Step 7: Retry with payment
    resp, err = client.Get(ctx, url, auth)
    if err != nil {
        if verifyErr, ok := err.(*core.PaymentVerificationError); ok {
            // Transaction may still be confirming
            return nil, fmt.Errorf("payment verification failed: %w", verifyErr)
        }
        return nil, err
    }

    return resp, nil
}
```

### Automatic Client Error Handling

```go
func autoClientFlow(ctx context.Context, client *client.X402AutoClient, url string) (*http.Response, error) {
    resp, err := client.Get(ctx, url)
    if err != nil {
        // Auto client handles most cases, but still check for errors
        if x402Err, ok := err.(*core.X402Error); ok {
            switch x402Err.Code {
            case "INSUFFICIENT_FUNDS":
                log.Println("Cannot make payment: insufficient funds")
            case "PAYMENT_EXPIRED":
                log.Println("Payment request expired")
            default:
                log.Printf("Payment error: %s", x402Err.Code)
            }
        }
        return nil, err
    }
    return resp, nil
}
```

---

## Middleware Error Handling

### net/http Middleware Errors

The middleware automatically returns appropriate HTTP status codes:

```go
// No payment header provided
// Returns: 402 Payment Required

// Invalid payment format
// Returns: 400 Bad Request

// Payment verification failed
// Returns: 403 Forbidden

// Amount insufficient
// Returns: 403 Forbidden

// Address mismatch
// Returns: 403 Forbidden
```

### Echo Middleware Errors

Echo middleware follows the same pattern:

```go
// Handler won't be called if payment fails
// Appropriate error response is sent automatically
e.GET("/api/premium", handler, echox402.PaymentRequired(opts))
```

---

## Error Code Reference

| Code | HTTP Status | Retriable | User Action |
|------|-------------|-----------|-------------|
| `PAYMENT_REQUIRED` | 402 | Yes | Make payment and retry |
| `PAYMENT_EXPIRED` | 402 | Yes | Request new payment |
| `INSUFFICIENT_FUNDS` | 400 | No | Add funds to wallet |
| `PAYMENT_VERIFICATION_FAILED` | 403 | Yes | Retry (wait for confirmation) |
| `TRANSACTION_BROADCAST_FAILED` | 500 | Yes | Retry or check network |
| `INVALID_PAYMENT_REQUEST` | 400 | No | Contact API support |

---

## Common Error Scenarios

### Scenario: "Payment Required" on First Request

**Symptoms:**
```
Error: PAYMENT_REQUIRED
```

**Cause:**
- Endpoint requires payment, first request doesn't include authorization

**Solution:**
```go
if x402Err, ok := err.(*core.PaymentRequiredError); ok {
    auth, _ := client.CreatePayment(ctx, x402Err.PaymentRequest, "")
    resp, _ = client.Get(ctx, url, auth)
}
```

---

### Scenario: "Insufficient Funds" Error

**Symptoms:**
```
Error: INSUFFICIENT_FUNDS
Required: 0.10
Available: 0.05
```

**Cause:**
- Wallet doesn't have enough tokens for payment

**Solution:**
```go
// Option 1: Add funds to wallet
// (Manual: use faucet or transfer tokens)

// Option 2: Use different wallet
client := client.NewX402Client(differentKeypair, "", nil, false)

// Option 3: Request payment plan (if available)
// Contact API provider
```

---

### Scenario: "Payment Expired" Error

**Symptoms:**
```
Error: PAYMENT_EXPIRED
```

**Cause:**
- Too much time passed between receiving and processing payment request
- Default expiration: 5 minutes

**Solution:**
```go
// Request new payment
resp, _ := client.Get(ctx, url, nil)
paymentReq, _ := client.ParsePaymentRequest(resp)

// Increase server-side expiration
echox402.PaymentRequired(echox402.PaymentRequiredOptions{
    Amount:    "0.10",
    ExpiresIn: 600,  // 10 minutes instead of 5
})
```

---

### Scenario: "Verification Failed" Intermittent Error

**Symptoms:**
```
Error: PAYMENT_VERIFICATION_FAILED
```

**Cause:**
- Transaction is still confirming on-chain
- RPC endpoint hasn't received confirmation yet

**Solution:**
```go
// Retry after delay
for attempt := 1; attempt <= 3; attempt++ {
    auth, _ := client.CreatePayment(ctx, paymentReq, "")
    resp, err := client.Get(ctx, url, auth)
    if err == nil {
        break
    }
    time.Sleep(2 * time.Second)
}
```

---

### Scenario: Network Connectivity Issues

**Symptoms:**
```
Error: TRANSACTION_BROADCAST_FAILED
Error: Context deadline exceeded
```

**Cause:**
- No internet connectivity
- RPC endpoint unavailable
- Network timeout

**Solution:**
```go
// Use exponential backoff with timeout
ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
defer cancel()

// Retry with exponential backoff
for attempt := 1; attempt <= 5; attempt++ {
    resp, err := client.Get(ctx, url, nil)
    if err == nil {
        break
    }
    time.Sleep(time.Duration(math.Pow(2, float64(attempt))) * time.Second)
}
```

---

## Best Practices

### ✅ Do

```go
// Check error types
switch e := err.(type) {
case *core.InsufficientFundsError:
    // Handle specific case

// Use context with timeout
ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
defer cancel()

// Retry retriable errors
if shouldRetry(err) {
    resp, _ = client.Get(ctx, url, auth)
}

// Close client
defer client.Close()
```

### ❌ Don't

```go
// Don't ignore errors
client.Get(ctx, url, nil)

// Don't retry non-retriable errors
if err != nil {
    client.Get(ctx, url, nil)  // Infinite loop on INSUFFICIENT_FUNDS
}

// Don't assume payment succeeded
auth, _ := client.CreatePayment(ctx, req, "")

// Don't forget to close
client := client.NewAutoClient(keypair, "", nil)
// Missing: defer client.Close()
```

---

## See Also

- [API Reference](api-reference.md)
- [Core Library Documentation](../libraries/core.md)
- [Client Library Documentation](../libraries/client.md)
