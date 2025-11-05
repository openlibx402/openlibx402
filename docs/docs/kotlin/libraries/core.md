# OpenLibX402 Core Library (Kotlin)

The `openlibx402-core` package provides the fundamental payment protocol components for Kotlin applications with full coroutine support.

## Installation

```kotlin
dependencies {
    implementation("org.openlibx402:openlibx402-core:0.1.0")
}
```

## Package Structure

```
org.openlibx402.core/
├── models/
│   ├── PaymentRequest (data class)
│   └── PaymentAuthorization (data class)
├── errors/
│   └── X402Error (sealed class)
├── blockchain/
│   └── SolanaPaymentProcessor (suspend functions)
└── util/
    └── Extension functions
```

## Models

### PaymentRequest

Immutable data class representing a 402 payment request.

```kotlin
import org.openlibx402.core.models.PaymentRequest

// Parse from JSON
val request = PaymentRequest.fromJson(jsonString)

// Access fields
val amount = request.maxAmountRequired
val paymentAddress = request.paymentAddress
val expiresAt = request.expiresAt

// Check expiration
val expired = request.isExpired()

// Convert to JSON
val json = request.toJson()

// Convert to Map
val map = request.toMap()

// Copy with changes (immutable)
val updated = request.copy(maxAmountRequired = "0.20")
```

**Properties:**
- `maxAmountRequired: String` - Maximum payment amount
- `assetType: String` - Asset type (e.g., "SPL")
- `assetAddress: String` - Token mint address
- `paymentAddress: String` - Recipient wallet address
- `network: String` - Blockchain network
- `expiresAt: Instant` - Expiration timestamp
- `nonce: String` - Unique nonce
- `paymentId: String` - Unique payment identifier
- `resource: String` - API resource endpoint
- `description: String?` - Optional description

### PaymentAuthorization

Immutable data class representing proof of payment.

```kotlin
import org.openlibx402.core.models.PaymentAuthorization

// Create authorization
val auth = PaymentAuthorization(
    paymentId = paymentId,
    actualAmount = actualAmount,
    paymentAddress = paymentAddress,
    assetAddress = assetAddress,
    network = network,
    timestamp = Clock.System.now(),
    signature = signature,
    publicKey = publicKey,
    transactionHash = transactionHash
)

// Convert to header value (base64-encoded JSON)
val headerValue = auth.toHeaderValue()

// Parse from header
val parsed = PaymentAuthorization.fromHeader(headerValue)

// Parse from JSON
val fromJson = PaymentAuthorization.fromJson(jsonString)
```

**Properties:**
- `paymentId: String` - Payment identifier
- `actualAmount: String` - Amount paid
- `paymentAddress: String` - Recipient address
- `assetAddress: String` - Token mint address
- `network: String` - Network identifier
- `timestamp: Instant` - Authorization timestamp
- `signature: String` - Transaction signature
- `publicKey: String` - Payer's public key
- `transactionHash: String` - Transaction hash

## Error Handling

### X402Error (Sealed Class)

Type-safe exhaustive error handling with sealed class hierarchy.

```kotlin
import org.openlibx402.core.errors.X402Error

try {
    // Payment operation
} catch (e: X402Error) {
    when (e) {
        is X402Error.PaymentRequired -> {
            val request = e.paymentRequest
            // Code: PAYMENT_REQUIRED, Retry: true
        }
        is X402Error.InsufficientFunds -> {
            val required = e.requiredAmount
            val available = e.availableAmount
            // Code: INSUFFICIENT_FUNDS, Retry: false
        }
        is X402Error.PaymentExpired -> {
            val request = e.paymentRequest
            // Code: PAYMENT_EXPIRED, Retry: true
        }
        is X402Error.PaymentVerificationFailed -> {
            val reason = e.reason
            // Code: PAYMENT_VERIFICATION_FAILED, Retry: true
        }
        is X402Error.TransactionBroadcastFailed -> {
            val reason = e.reason
            // Code: TRANSACTION_BROADCAST_FAILED, Retry: true
        }
        is X402Error.InvalidPaymentRequest -> {
            val reason = e.reason
            // Code: INVALID_PAYMENT_REQUEST, Retry: false
        }
        is X402Error.Generic -> {
            val code = e.customCode
            // Custom error
        }
    }
}
```

### Error Properties

All errors have:
- `message: String` - Error message
- `code: String` - Error code
- `details: Map<String, Any>` - Additional details

## Blockchain Integration

### SolanaPaymentProcessor

Handles Solana blockchain operations with suspend functions.

```kotlin
import org.openlibx402.core.blockchain.SolanaPaymentProcessor
import org.p2p.solanaj.core.Account
import kotlinx.coroutines.runBlocking

suspend fun processPayment() {
    val processor = SolanaPaymentProcessor(
        rpcUrl = "https://api.devnet.solana.com"
    )

    processor.use {
        // Create payment (suspend function)
        val account = Account(secretKey)
        val auth = it.createPayment(
            request = paymentRequest,
            payerAccount = account,
            amount = "0.10"  // Optional
        )

        // Check balance (suspend function)
        val pubkey = PublicKey("...")
        val balance = it.getBalance(pubkey)

        // Verify transaction (suspend function)
        val valid = it.verifyTransaction(
            txHash = txHash,
            expectedRecipient = recipientAddress,
            expectedAmount = amount,
            expectedMint = tokenMint
        )
    }
}
```

**Suspend Functions:**
- `suspend fun createPayment(request, account, amount)` - Create and broadcast payment
- `suspend fun getBalance(publicKey)` - Get SOL balance
- `suspend fun getTokenBalance(address, mint)` - Get SPL token balance
- `suspend fun verifyTransaction(hash, recipient, amount, mint)` - Verify on-chain

All I/O operations run on `Dispatchers.IO`.

## Error Code Utilities

Access error metadata using companion object:

```kotlin
// Get error info
val info = X402Error.getInfo("PAYMENT_REQUIRED")
val message = info?.message
val retryable = info?.retry
val userAction = info?.userAction

// Check if retryable
val canRetry = X402Error.isRetryable("INSUFFICIENT_FUNDS")  // false

// Get all codes
val allCodes = X402Error.getAllCodes()
```

## Coroutine Safety

All operations are coroutine-safe:
- Models are immutable data classes
- SolanaPaymentProcessor uses structured concurrency
- All suspend functions use appropriate dispatchers

## Resource Management

Use `.use` extension function for automatic cleanup:

```kotlin
SolanaPaymentProcessor(rpcUrl).use { processor ->
    // Use processor
}  // Automatically closed
```

## Serialization

Models use `kotlinx.serialization`:

```kotlin
import kotlinx.serialization.json.Json

// Serialize
val json = Json.encodeToString(PaymentRequest.serializer(), request)

// Deserialize
val request = Json.decodeFromString(PaymentRequest.serializer(), json)

// Or use convenience methods
val request = PaymentRequest.fromJson(json)
val json = request.toJson()
```

## Kotlin Features

### Data Classes

```kotlin
// Immutable with structural equality
val request1 = PaymentRequest(...)
val request2 = request1.copy(maxAmountRequired = "0.20")

// Destructuring
val (amount, assetType, address) = request
```

### Extension Functions

```kotlin
// Check if payment is affordable
fun PaymentRequest.isAffordable(balance: Double): Boolean =
    balance >= maxAmountRequired.toDouble()

// Get payment amount in smallest units
fun PaymentRequest.getAmountLamports(): Long =
    (maxAmountRequired.toDouble() * 1_000_000_000).toLong()
```

### Type-Safe Builders

```kotlin
// Use companion object factories
val request = PaymentRequest.fromJson(json)
val auth = PaymentAuthorization.fromHeader(headerValue)
```

## Next Steps

- [Client Library](client.md)
- [Getting Started](../getting-started/installation.md)
- [Examples](../examples/basic-usage.md)
