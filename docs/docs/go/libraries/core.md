# Core Library

The core library provides the fundamental data structures and Solana blockchain operations for the X402 protocol.

## Overview

The `openlibx402-core` package contains:

- **Models**: `PaymentRequest`, `PaymentAuthorization`
- **Errors**: Complete error hierarchy
- **SolanaPaymentProcessor**: Blockchain operations
- **Utilities**: Helper functions and types

## Installation

```bash
go get github.com/openlibx402/go/openlibx402-core
```

## PaymentRequest

Represents a 402 payment request from a server.

### Structure

```go
type PaymentRequest struct {
    MaxAmountRequired string    // Amount in token units (e.g., "0.10")
    AssetType         string    // "SPL" for Solana tokens
    AssetAddress      string    // Token mint address
    PaymentAddress    string    // Recipient's wallet address
    Network           string    // "solana-devnet" | "solana-mainnet"
    ExpiresAt         time.Time // Expiration timestamp
    Nonce             string    // Unique identifier for replay protection
    PaymentID         string    // Unique payment request ID
    Resource          string    // API endpoint being accessed
    Description       string    // Human-readable description (optional)
}
```

### Methods

#### IsExpired()

Check if the payment request has expired.

```go
if paymentRequest.IsExpired() {
    return core.NewPaymentExpiredError(paymentRequest, "")
}
```

#### ToJSON()

Convert to JSON string.

```go
jsonStr, err := paymentRequest.ToJSON()
```

#### PaymentRequestFromJSON()

Parse from JSON string.

```go
paymentReq, err := core.PaymentRequestFromJSON(jsonStr)
if err != nil {
    log.Fatal(err)
}
```

## PaymentAuthorization

Represents a signed payment authorization to include in retry requests.

### Structure

```go
type PaymentAuthorization struct {
    PaymentID       string    // From payment request
    ActualAmount    string    // Amount being paid (≤ max_amount_required)
    PaymentAddress  string    // Recipient address
    AssetAddress    string    // Token mint address
    Network         string    // Blockchain network
    Timestamp       time.Time // Authorization timestamp
    Signature       string    // Solana signature
    PublicKey       string    // Payer's public key
    TransactionHash string    // On-chain tx hash (after broadcast)
}
```

### Methods

#### ToHeaderValue()

Encode as base64 JSON for HTTP header.

```go
headerValue, err := authorization.ToHeaderValue()
// Use in X-Payment-Authorization header
```

#### FromHeader()

Parse from HTTP header.

```go
auth, err := core.PaymentAuthorizationFromHeader(headerValue)
```

#### ToJSON()

Convert to JSON string.

```go
jsonStr, err := authorization.ToJSON()
```

## SolanaPaymentProcessor

Handles Solana blockchain operations.

### Constructor

```go
processor := core.NewSolanaPaymentProcessor(
    "https://api.devnet.solana.com",  // RPC endpoint
    &walletKeypair,                    // Optional keypair
)
defer processor.Close()
```

### Methods

#### CreatePaymentTransaction()

Create a Solana transaction for payment.

```go
tx, err := processor.CreatePaymentTransaction(
    ctx,                    // context
    paymentRequest,         // PaymentRequest
    "0.10",                // amount
    walletKeypair,         // payer keypair
)
if err != nil {
    log.Fatal(err)
}
```

#### SignAndSendTransaction()

Sign and broadcast transaction to Solana.

```go
txHash, err := processor.SignAndSendTransaction(ctx, tx, walletKeypair)
if err != nil {
    log.Fatal(err)
}
log.Printf("Sent: %s", txHash)
```

#### VerifyTransaction()

Verify that a transaction exists on-chain and matches parameters.

```go
verified, err := processor.VerifyTransaction(
    ctx,
    "transaction_hash",
    "expected_recipient",
    "0.10",
    "token_mint_address",
)
if err != nil || !verified {
    log.Fatal("Verification failed")
}
```

#### GetTokenBalance()

Get SPL token balance for a wallet.

```go
balance, err := processor.GetTokenBalance(
    ctx,
    "wallet_address",
    "token_mint",
)
if err != nil {
    log.Fatal(err)
}
log.Printf("Balance: %f", balance)
```

#### GetDefaultRPCURL()

Get the default RPC URL for a network.

```go
rpcURL := core.GetDefaultRPCURL("solana-devnet")
// Returns: "https://api.devnet.solana.com"
```

## Error Types

### X402Error

Base error type with code and details.

```go
type X402Error struct {
    Message string
    Code    string
    Details map[string]interface{}
}

// Use
if err := someFunction(); err != nil {
    if x402Err, ok := err.(*core.X402Error); ok {
        log.Printf("Code: %s", x402Err.Code)
        log.Printf("Message: %s", x402Err.Message)
    }
}
```

### PaymentRequiredError

Raised when a 402 response is received.

```go
return core.NewPaymentRequiredError(paymentRequest, "")

// With custom message
return core.NewPaymentRequiredError(
    paymentRequest,
    "Payment required for premium access",
)
```

### PaymentExpiredError

Payment request has expired.

```go
return core.NewPaymentExpiredError(paymentRequest, "")
```

### InsufficientFundsError

Wallet lacks sufficient funds.

```go
return core.NewInsufficientFundsError("0.10", "0.05")
```

### PaymentVerificationError

Payment verification failed.

```go
return core.NewPaymentVerificationError("transaction not found")
```

### TransactionBroadcastError

Failed to broadcast transaction.

```go
return core.NewTransactionBroadcastError("network error")
```

### InvalidPaymentRequestError

Invalid payment request format.

```go
return core.NewInvalidPaymentRequestError("missing payment_id")
```

## Error Codes Reference

```go
core.ErrorCodes["PAYMENT_REQUIRED"]
core.ErrorCodes["PAYMENT_EXPIRED"]
core.ErrorCodes["INSUFFICIENT_FUNDS"]
core.ErrorCodes["PAYMENT_VERIFICATION_FAILED"]
core.ErrorCodes["TRANSACTION_BROADCAST_FAILED"]
core.ErrorCodes["INVALID_PAYMENT_REQUEST"]
```

Each error code includes:
- `Code`: Error code string
- `Message`: Default message
- `Retry`: Whether to retry
- `UserAction`: What user should do

## Usage Examples

### Parse and Validate Payment Request

```go
// From 402 response
jsonStr := `{...}`
paymentReq, err := core.PaymentRequestFromJSON(jsonStr)
if err != nil {
    return err
}

// Check if expired
if paymentReq.IsExpired() {
    return core.NewPaymentExpiredError(paymentReq, "")
}

// Use details
log.Printf("Pay %s to %s", paymentReq.MaxAmountRequired, paymentReq.PaymentAddress)
```

### Create and Verify Payment

```go
// Create transaction
processor := core.NewSolanaPaymentProcessor(rpcURL, nil)
defer processor.Close()

tx, err := processor.CreatePaymentTransaction(ctx, paymentReq, amount, keypair)
if err != nil {
    return err
}

// Broadcast
txHash, err := processor.SignAndSendTransaction(ctx, tx, keypair)
if err != nil {
    return err
}

// Verify
verified, err := processor.VerifyTransaction(
    ctx,
    txHash,
    paymentReq.PaymentAddress,
    amount,
    paymentReq.AssetAddress,
)
if !verified {
    return core.NewPaymentVerificationError("verification failed")
}
```

### Handle Errors

```go
resp, err := client.Get(ctx, url)
if err != nil {
    switch e := err.(type) {
    case *core.PaymentRequiredError:
        log.Println("Payment needed")
        handlePayment(e.PaymentRequest)

    case *core.InsufficientFundsError:
        log.Printf("Need: %s, Have: %s", e.RequiredAmount, e.AvailableAmount)
        // Direct user to add funds

    case *core.PaymentExpiredError:
        log.Println("Request expired, retrying...")
        // Retry fresh request

    case *core.PaymentVerificationError:
        log.Println("Verification failed")
        // Log and retry

    default:
        log.Println("Unknown error:", err)
    }
}
```

## Network Configuration

### Supported Networks

```go
// Devnet (testing)
core.GetDefaultRPCURL("solana-devnet")
// → "https://api.devnet.solana.com"

// Testnet
core.GetDefaultRPCURL("solana-testnet")
// → "https://api.testnet.solana.com"

// Mainnet (production)
core.GetDefaultRPCURL("solana-mainnet")
// → "https://api.mainnet-beta.solana.com"
```

### Custom RPC Endpoint

```go
processor := core.NewSolanaPaymentProcessor(
    "https://your-rpc-endpoint.com",
    &keypair,
)
```

## Best Practices

### ✅ Do

```go
// Check balance before attempting payment
balance, _ := processor.GetTokenBalance(ctx, wallet, mint)
if balance >= requiredAmount {
    // Safe to proceed
}

// Validate request not expired
if !paymentRequest.IsExpired() {
    // Safe to proceed
}

// Verify payment on-chain
verified, _ := processor.VerifyTransaction(ctx, hash, recipient, amount, mint)
```

### ❌ Don't

```go
// Don't ignore errors
processor.CreatePaymentTransaction(ctx, req, amount, key)

// Don't skip expiration check
_ = paymentRequest.IsExpired()

// Don't trust unverified payments
```

## See Also

- [Client Library](client.md) - HTTP client using core library
- [Middleware](../middleware/nethttp.md) - Server-side payment handling
- [Error Reference](../reference/errors.md) - Complete error documentation
