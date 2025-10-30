# API Reference

Complete API reference for all X402 Go packages.

## Core Package (`openlibx402-core`)

### PaymentRequest

Represents a 402 payment request from a server.

#### Structure

```go
type PaymentRequest struct {
    MaxAmountRequired string
    AssetType         string
    AssetAddress      string
    PaymentAddress    string
    Network           string
    ExpiresAt         time.Time
    Nonce             string
    PaymentID         string
    Resource          string
    Description       string
}
```

#### Methods

| Method | Signature | Returns | Description |
|--------|-----------|---------|-------------|
| `IsExpired()` | `IsExpired() bool` | `bool` | Check if payment request has expired |
| `ToJSON()` | `ToJSON() (string, error)` | `(string, error)` | Convert to JSON string |

#### Functions

| Function | Signature | Returns | Description |
|----------|-----------|---------|-------------|
| `PaymentRequestFromJSON()` | `PaymentRequestFromJSON(jsonStr string) (*PaymentRequest, error)` | `(*PaymentRequest, error)` | Parse from JSON string |

---

### PaymentAuthorization

Represents a signed payment authorization for retry requests.

#### Structure

```go
type PaymentAuthorization struct {
    PaymentID       string
    ActualAmount    string
    PaymentAddress  string
    AssetAddress    string
    Network         string
    Timestamp       time.Time
    Signature       string
    PublicKey       string
    TransactionHash string
}
```

#### Methods

| Method | Signature | Returns | Description |
|--------|-----------|---------|-------------|
| `ToHeaderValue()` | `ToHeaderValue() (string, error)` | `(string, error)` | Encode as base64 JSON for HTTP header |
| `ToJSON()` | `ToJSON() (string, error)` | `(string, error)` | Convert to JSON string |

#### Functions

| Function | Signature | Returns | Description |
|----------|-----------|---------|-------------|
| `PaymentAuthorizationFromHeader()` | `PaymentAuthorizationFromHeader(headerValue string) (*PaymentAuthorization, error)` | `(*PaymentAuthorization, error)` | Parse from HTTP header |

---

### SolanaPaymentProcessor

Handles Solana blockchain operations.

#### Constructor

```go
func NewSolanaPaymentProcessor(
    rpcURL string,
    keypair *solana.PrivateKey,
) *SolanaPaymentProcessor
```

#### Methods

| Method | Signature | Returns | Description |
|--------|-----------|---------|-------------|
| `CreatePaymentTransaction()` | `CreatePaymentTransaction(ctx context.Context, paymentReq *PaymentRequest, amount string, keypair solana.PrivateKey) (*solana.Transaction, error)` | `(*solana.Transaction, error)` | Create payment transaction |
| `SignAndSendTransaction()` | `SignAndSendTransaction(ctx context.Context, tx *solana.Transaction, keypair solana.PrivateKey) (string, error)` | `(string, error)` | Sign and broadcast transaction |
| `VerifyTransaction()` | `VerifyTransaction(ctx context.Context, txHash string, recipient string, amount string, tokenMint string) (bool, error)` | `(bool, error)` | Verify transaction on-chain |
| `GetTokenBalance()` | `GetTokenBalance(ctx context.Context, walletAddress string, tokenMint string) (float64, error)` | `(float64, error)` | Get SPL token balance |
| `Close()` | `Close()` | - | Close processor and cleanup resources |

#### Functions

| Function | Signature | Returns | Description |
|----------|-----------|---------|-------------|
| `GetDefaultRPCURL()` | `GetDefaultRPCURL(network string) string` | `string` | Get default RPC URL for network |

---

### Error Types

#### X402Error

Base error type.

```go
type X402Error struct {
    Message string
    Code    string
    Details map[string]interface{}
}
```

#### PaymentRequiredError

Raised when 402 response is received.

```go
func NewPaymentRequiredError(paymentReq *PaymentRequest, message string) error
```

#### PaymentExpiredError

Payment request has expired.

```go
func NewPaymentExpiredError(paymentReq *PaymentRequest, message string) error
```

#### InsufficientFundsError

Wallet lacks sufficient funds.

```go
func NewInsufficientFundsError(required string, available string) error
```

#### PaymentVerificationError

Payment verification failed.

```go
func NewPaymentVerificationError(message string) error
```

#### TransactionBroadcastError

Failed to broadcast transaction.

```go
func NewTransactionBroadcastError(message string) error
```

#### InvalidPaymentRequestError

Invalid payment request format.

```go
func NewInvalidPaymentRequestError(message string) error
```

---

## Client Package (`openlibx402-client`)

### X402Client (Explicit Mode)

Manual payment control HTTP client.

#### Constructor

```go
func NewX402Client(
    walletKeypair solana.PrivateKey,
    rpcURL string,
    httpClient *http.Client,
    allowLocal bool,
) *X402Client
```

#### Methods

| Method | Signature | Returns | Description |
|--------|-----------|---------|-------------|
| `Get()` | `Get(ctx context.Context, url string, auth *core.PaymentAuthorization) (*http.Response, error)` | `(*http.Response, error)` | Execute GET request |
| `Post()` | `Post(ctx context.Context, url string, body []byte, auth *core.PaymentAuthorization) (*http.Response, error)` | `(*http.Response, error)` | Execute POST request |
| `Put()` | `Put(ctx context.Context, url string, body []byte, auth *core.PaymentAuthorization) (*http.Response, error)` | `(*http.Response, error)` | Execute PUT request |
| `Delete()` | `Delete(ctx context.Context, url string, auth *core.PaymentAuthorization) (*http.Response, error)` | `(*http.Response, error)` | Execute DELETE request |
| `Do()` | `Do(ctx context.Context, req *http.Request, auth *core.PaymentAuthorization) (*http.Response, error)` | `(*http.Response, error)` | Execute any HTTP request |
| `PaymentRequired()` | `PaymentRequired(resp *http.Response) bool` | `bool` | Check if response is 402 Payment Required |
| `ParsePaymentRequest()` | `ParsePaymentRequest(resp *http.Response) (*core.PaymentRequest, error)` | `(*core.PaymentRequest, error)` | Parse PaymentRequest from 402 response |
| `CreatePayment()` | `CreatePayment(ctx context.Context, paymentReq *core.PaymentRequest, customAmount string) (*core.PaymentAuthorization, error)` | `(*core.PaymentAuthorization, error)` | Create and broadcast payment |
| `Close()` | `Close()` | - | Close client and cleanup |

---

### X402AutoClient (Automatic Mode)

Automatic payment handling HTTP client.

#### Constructor

```go
func NewAutoClient(
    walletKeypair solana.PrivateKey,
    rpcURL string,
    options *AutoClientOptions,
) *X402AutoClient
```

#### Options

```go
type AutoClientOptions struct {
    MaxPaymentAmount string // e.g., "10.0"
    AutoRetry        bool
    AllowLocal       bool
}
```

#### Methods

| Method | Signature | Returns | Description |
|--------|-----------|---------|-------------|
| `Get()` | `Get(ctx context.Context, url string) (*http.Response, error)` | `(*http.Response, error)` | GET (auto-pays if needed) |
| `Post()` | `Post(ctx context.Context, url string, body []byte) (*http.Response, error)` | `(*http.Response, error)` | POST (auto-pays if needed) |
| `Put()` | `Put(ctx context.Context, url string, body []byte) (*http.Response, error)` | `(*http.Response, error)` | PUT (auto-pays if needed) |
| `Delete()` | `Delete(ctx context.Context, url string) (*http.Response, error)` | `(*http.Response, error)` | DELETE (auto-pays if needed) |
| `Close()` | `Close()` | - | Close client and cleanup |

---

## net/http Middleware (`openlibx402-nethttp`)

### Initialization

```go
func InitX402(config *Config)
```

#### Config

```go
type Config struct {
    PaymentAddress string // Required
    TokenMint      string // Required
    Network        string // Optional, default: "solana-devnet"
    RPCURL         string // Optional
    AutoVerify     bool   // Optional, default: false
}
```

### Middleware

```go
func PaymentRequired(options PaymentRequiredOptions) func(http.Handler) http.Handler
```

#### PaymentRequiredOptions

```go
type PaymentRequiredOptions struct {
    Amount         string // Required
    PaymentAddress string // Optional
    TokenMint      string // Optional
    Network        string // Optional
    Description    string // Optional
    ExpiresIn      int    // Optional, default: 300 seconds
    AutoVerify     bool   // Optional
}
```

### Helper Functions

```go
// Get payment authorization from request
func GetPaymentAuthorization(r *http.Request) *core.PaymentAuthorization
```

---

## Echo Middleware (`openlibx402-echo`)

### Initialization

```go
func InitX402(config *Config)
```

#### Config

```go
type Config struct {
    PaymentAddress string // Required
    TokenMint      string // Required
    Network        string // Optional, default: "solana-devnet"
    RPCURL         string // Optional
    AutoVerify     bool   // Optional, default: false
}
```

### Middleware

```go
func PaymentRequired(options PaymentRequiredOptions) echo.MiddlewareFunc
```

#### PaymentRequiredOptions

```go
type PaymentRequiredOptions struct {
    Amount         string // Required
    PaymentAddress string // Optional
    TokenMint      string // Optional
    Network        string // Optional
    Description    string // Optional
    ExpiresIn      int    // Optional, default: 300 seconds
    AutoVerify     bool   // Optional
}
```

### Helper Functions

```go
// Get payment authorization from Echo context
func GetPaymentAuthorization(c echo.Context) *core.PaymentAuthorization
```

---

## HTTP Headers

### Request Headers

#### X-Payment-Authorization

Payment authorization header included in requests after 402 response.

```
X-Payment-Authorization: <base64-encoded-json>
```

Format:
```json
{
  "payment_id": "...",
  "actual_amount": "0.10",
  "payment_address": "...",
  "asset_address": "...",
  "network": "solana-devnet",
  "timestamp": "2024-01-01T00:00:00Z",
  "signature": "...",
  "public_key": "...",
  "transaction_hash": "..."
}
```

### Response Headers

#### 402 Payment Required

Status code: `402`

Response body (JSON):
```json
{
  "max_amount_required": "0.10",
  "asset_type": "SPL",
  "asset_address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "payment_address": "YOUR_WALLET_ADDRESS",
  "network": "solana-devnet",
  "expires_at": "2025-01-01T00:05:00Z",
  "nonce": "abc123...",
  "payment_id": "def456...",
  "resource": "/api/endpoint",
  "description": "Endpoint description"
}
```

---

## Error Codes

### Payment Required (402)

```
Code: PAYMENT_REQUIRED
HTTP Status: 402
Retry: Yes
User Action: Make payment and retry with authorization header
```

### Payment Expired

```
Code: PAYMENT_EXPIRED
HTTP Status: 402 or 400
Retry: Yes
User Action: Request new payment
```

### Insufficient Funds

```
Code: INSUFFICIENT_FUNDS
HTTP Status: 400
Retry: No
User Action: Add funds to wallet
```

### Payment Verification Failed

```
Code: PAYMENT_VERIFICATION_FAILED
HTTP Status: 403
Retry: Yes
User Action: Retry or contact support
```

### Transaction Broadcast Failed

```
Code: TRANSACTION_BROADCAST_FAILED
HTTP Status: 500
Retry: Yes
User Action: Check network connectivity and retry
```

### Invalid Payment Request

```
Code: INVALID_PAYMENT_REQUEST
HTTP Status: 400
Retry: No
User Action: Contact API provider
```

---

## Constants and Defaults

### Solana Networks

```go
const (
    NetworkDevnet   = "solana-devnet"
    NetworkTestnet  = "solana-testnet"
    NetworkMainnet  = "solana-mainnet"
)
```

### Default RPC Endpoints

| Network | URL |
|---------|-----|
| devnet | `https://api.devnet.solana.com` |
| testnet | `https://api.testnet.solana.com` |
| mainnet | `https://api.mainnet-beta.solana.com` |

### Default Values

```go
const (
    DefaultNetwork         = "solana-devnet"
    DefaultExpiresIn       = 300  // seconds
    DefaultMaxPaymentLimit = "10.0"
)
```

---

## Type Aliases

```go
// Solana types
type Address = string        // Base58-encoded wallet address
type Signature = string      // Solana transaction signature
type TokenMint = string      // SPL token mint address
type Amount = string         // Token amount as decimal string
```

---

## Common Patterns

### Create Client

**Explicit Mode:**
```go
client := client.NewX402Client(keypair, "", nil, false)
defer client.Close()
```

**Automatic Mode:**
```go
client := client.NewAutoClient(keypair, "", &client.AutoClientOptions{
    MaxPaymentAmount: "10.0",
})
defer client.Close()
```

### Initialize Middleware

**net/http:**
```go
nethttp.InitX402(&nethttp.Config{
    PaymentAddress: os.Getenv("X402_PAYMENT_ADDRESS"),
    TokenMint:      os.Getenv("X402_TOKEN_MINT"),
})
```

**Echo:**
```go
echox402.InitX402(&echox402.Config{
    PaymentAddress: os.Getenv("X402_PAYMENT_ADDRESS"),
    TokenMint:      os.Getenv("X402_TOKEN_MINT"),
})
```

### Protect Endpoint

**net/http:**
```go
http.Handle("/api/premium", nethttp.PaymentRequired(nethttp.PaymentRequiredOptions{
    Amount: "0.10",
})(handler))
```

**Echo:**
```go
e.GET("/api/premium", handler, echox402.PaymentRequired(echox402.PaymentRequiredOptions{
    Amount: "0.10",
}))
```

### Access Payment Info

**net/http:**
```go
auth := nethttp.GetPaymentAuthorization(r)
if auth != nil {
    log.Printf("Payment: %s", auth.ActualAmount)
}
```

**Echo:**
```go
auth := echox402.GetPaymentAuthorization(c)
if auth != nil {
    log.Printf("Payment: %s", auth.ActualAmount)
}
```

---

## See Also

- [Core Library Documentation](../libraries/core.md)
- [Client Library Documentation](../libraries/client.md)
- [net/http Middleware](../middleware/nethttp.md)
- [Echo Middleware](../middleware/echo.md)
