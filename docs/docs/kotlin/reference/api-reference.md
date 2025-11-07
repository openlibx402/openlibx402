# Kotlin API Reference

Complete API reference for the OpenLibX402 Kotlin SDK with coroutines support.

## Package: org.openlibx402.client

### X402Client

Manual payment control HTTP client using Kotlin coroutines with suspend functions.

#### Constructor

```kotlin
class X402Client(
    private val walletAccount: Account,
    rpcUrl: String? = null,
    private val httpClient: OkHttpClient = createDefaultHttpClient(),
    private val allowLocal: Boolean = false
) : Closeable
```

**Parameters:**
- `walletAccount` (Account): Solana account for signing transactions
- `rpcUrl` (String?): Solana RPC endpoint URL (null for devnet default)
- `httpClient` (OkHttpClient): Custom OkHttp client (default client if not provided)
- `allowLocal` (Boolean): Allow localhost URLs (false for production)

**Example:**
```kotlin
val client = X402Client(
    walletAccount = account,
    rpcUrl = "https://api.devnet.solana.com",
    allowLocal = true
)
```

#### HTTP Methods (Suspend Functions)

All HTTP methods are suspend functions that must be called from a coroutine.

##### get()

```kotlin
suspend fun get(url: String, payment: PaymentAuthorization? = null): Response
```

Performs a GET request. Runs on `Dispatchers.IO`.

**Parameters:**
- `url` (String): Target URL
- `payment` (PaymentAuthorization?): Optional payment authorization

**Returns:** OkHttp Response object

**Throws:**
- `X402Error.PaymentRequired` - 402 response received
- `IOException` - Network error

**Example:**
```kotlin
val response = client.get("https://api.example.com/data")
val response = client.get("https://api.example.com/data", paymentAuth)
```

##### post()

```kotlin
suspend fun post(url: String, body: String? = null, payment: PaymentAuthorization? = null): Response
```

Performs a POST request with JSON body.

**Parameters:**
- `url` (String): Target URL
- `body` (String?): Request body (JSON string, can be null)
- `payment` (PaymentAuthorization?): Optional payment authorization

**Example:**
```kotlin
val jsonBody = """{"key": "value"}"""
val response = client.post(url, jsonBody)
```

##### put()

```kotlin
suspend fun put(url: String, body: String? = null, payment: PaymentAuthorization? = null): Response
```

Performs a PUT request with JSON body.

##### delete()

```kotlin
suspend fun delete(url: String, payment: PaymentAuthorization? = null): Response
```

Performs a DELETE request.

##### request()

```kotlin
suspend fun request(
    method: String,
    url: String,
    body: String? = null,
    payment: PaymentAuthorization? = null
): Response
```

Generic HTTP request method. All other HTTP methods delegate to this.

#### Payment Methods

##### createPayment()

```kotlin
suspend fun createPayment(
    request: PaymentRequest,
    amount: String? = null
): PaymentAuthorization
```

Creates a payment for a payment request. This is a suspend function.

**Parameters:**
- `request` (PaymentRequest): The payment request
- `amount` (String?): Specific amount (null for max amount)

**Returns:** PaymentAuthorization to include in retry request

**Throws:**
- `X402Error.InsufficientFunds` - Not enough funds
- `X402Error.PaymentExpired` - Request expired
- `X402Error.TransactionBroadcastFailed` - Broadcast failed

**Example:**
```kotlin
val auth = client.createPayment(request)
val auth = client.createPayment(request, "0.05")
```

##### parsePaymentRequest()

```kotlin
fun parsePaymentRequest(response: Response): PaymentRequest
```

Parses payment request from 402 response.

**Throws:**
- `X402Error.InvalidPaymentRequest` - Invalid response format
- `X402Error.PaymentExpired` - Request already expired

##### paymentRequired()

```kotlin
fun paymentRequired(response: Response): Boolean
```

Checks if response indicates payment is required.

**Returns:** true if 402 status code, false otherwise

#### Resource Management

##### close()

```kotlin
override fun close()
```

Closes the client and releases resources. Implements `Closeable`.

##### isClosed()

```kotlin
fun isClosed(): Boolean
```

Checks if client has been closed.

#### Properties

```kotlin
internal val processor: SolanaPaymentProcessor
```

The payment processor. Has `internal` visibility - not accessible from external code.

---

### X402AutoClient

Automatic payment handling HTTP client with DSL builder pattern and coroutines.

#### DSL Constructor (Primary)

```kotlin
companion object {
    operator fun invoke(
        walletAccount: Account,
        builderAction: Builder.() -> Unit = {}
    ): X402AutoClient
}
```

Creates a client using Kotlin DSL pattern.

**Example:**
```kotlin
val client = X402AutoClient(account) {
    rpcUrl = "https://api.devnet.solana.com"
    maxPaymentAmount = "1.0"
    maxRetries = 2
    allowLocal = true
}
```

#### Builder Class

```kotlin
class Builder(private val walletAccount: Account) {
    var rpcUrl: String? = null
    var httpClient: OkHttpClient? = null
    var allowLocal: Boolean = false
    var maxRetries: Int = 1
    var autoRetry: Boolean = true
    var maxPaymentAmount: String? = null

    fun build(): X402AutoClient
}
```

**Properties:**

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `rpcUrl` | `String?` | Solana RPC endpoint | `null` (devnet) |
| `httpClient` | `OkHttpClient?` | Custom HTTP client | Default client |
| `maxPaymentAmount` | `String?` | Maximum payment per request | `null` (no limit) |
| `maxRetries` | `Int` | Maximum retry attempts | `1` |
| `allowLocal` | `Boolean` | Allow localhost URLs | `false` |
| `autoRetry` | `Boolean` | Enable automatic retry | `true` |

**Traditional Builder Example:**
```kotlin
val client = X402AutoClient.Builder(account).apply {
    rpcUrl = "https://api.devnet.solana.com"
    maxPaymentAmount = "5.0"
    maxRetries = 2
}.build()
```

#### HTTP Methods (Suspend Functions)

All methods are suspend functions that automatically handle 402 responses.

```kotlin
suspend fun get(url: String): Response
suspend fun post(url: String, body: String? = null): Response
suspend fun put(url: String, body: String? = null): Response
suspend fun delete(url: String): Response
```

**Example:**
```kotlin
val response = client.get(url)  // Automatically handles payment
```

#### Access Methods

##### getProcessor()

```kotlin
fun getProcessor(): SolanaPaymentProcessor
```

Gets the underlying payment processor.

##### close()

```kotlin
override fun close()
```

Closes the client and releases resources.

##### isClosed()

```kotlin
fun isClosed(): Boolean
```

Checks if client is closed.

---

## Package: org.openlibx402.core.models

### PaymentRequest

Payment request data class with kotlinx.serialization support.

#### Data Class

```kotlin
@Serializable
data class PaymentRequest(
    @SerialName("max_amount_required")
    val maxAmountRequired: String,

    @SerialName("asset_type")
    val assetType: String,

    @SerialName("asset_address")
    val assetAddress: String,

    @SerialName("payment_address")
    val paymentAddress: String,

    @SerialName("network")
    val network: String,

    @SerialName("expires_at")
    val expiresAt: Instant,

    @SerialName("nonce")
    val nonce: String,

    @SerialName("payment_id")
    val paymentId: String,

    @SerialName("resource")
    val resource: String,

    @SerialName("description")
    val description: String? = null
)
```

#### Companion Object Methods

##### fromJson()

```kotlin
companion object {
    fun fromJson(jsonString: String): PaymentRequest
}
```

Parses PaymentRequest from JSON string using kotlinx.serialization.

**Throws:** IllegalArgumentException if JSON is invalid

##### Example with kotlinx.serialization

```kotlin
import kotlinx.serialization.json.Json

val json = """{"max_amount_required":"0.10", ...}"""
val request = PaymentRequest.fromJson(json)
```

#### Instance Methods

##### toJson()

```kotlin
fun toJson(): String
```

Serializes to JSON string using kotlinx.serialization.

##### toMap()

```kotlin
fun toMap(): Map<String, Any?>
```

Converts to Map with snake_case keys.

##### isExpired()

```kotlin
fun isExpired(): Boolean
```

Checks if payment request has expired using kotlinx.datetime.

#### Data Class Features

```kotlin
// Destructuring
val (amount, assetType, address) = paymentRequest

// Immutable copy
val updated = paymentRequest.copy(maxAmountRequired = "0.20")

// Equality
val isEqual = request1 == request2

// toString()
println(paymentRequest)  // Auto-generated toString()
```

---

### PaymentAuthorization

Payment authorization data class with kotlinx.serialization support.

#### Data Class

```kotlin
@Serializable
data class PaymentAuthorization(
    @SerialName("payment_id")
    val paymentId: String,

    @SerialName("actual_amount")
    val actualAmount: String,

    @SerialName("payment_address")
    val paymentAddress: String,

    @SerialName("asset_address")
    val assetAddress: String,

    @SerialName("network")
    val network: String,

    @SerialName("timestamp")
    val timestamp: Instant,

    @SerialName("signature")
    val signature: String,

    @SerialName("public_key")
    val publicKey: String,

    @SerialName("transaction_hash")
    val transactionHash: String = signature
)
```

#### Companion Object Methods

##### fromJson()

```kotlin
companion object {
    fun fromJson(jsonString: String): PaymentAuthorization
}
```

Parses from JSON string.

##### fromHeader()

```kotlin
companion object {
    fun fromHeader(headerValue: String): PaymentAuthorization
}
```

Parses from base64-encoded authorization header.

#### Instance Methods

##### toJson()

```kotlin
fun toJson(): String
```

Serializes to JSON string.

##### toHeaderValue()

```kotlin
fun toHeaderValue(): String
```

Converts to base64-encoded header value for `X-Payment-Authorization`.

##### toMap()

```kotlin
fun toMap(): Map<String, Any>
```

Converts to Map with snake_case keys.

---

## Package: org.openlibx402.core.blockchain

### SolanaPaymentProcessor

Handles Solana blockchain payment operations.

#### Constructor

```kotlin
class SolanaPaymentProcessor(rpcUrl: String) : Closeable
```

**Parameters:**
- `rpcUrl` (String): Solana RPC endpoint URL

#### Methods

##### createPayment()

```kotlin
suspend fun createPayment(
    request: PaymentRequest,
    payerAccount: Account,
    amount: String?
): PaymentAuthorization
```

Creates and broadcasts a payment transaction. This is a suspend function.

**Returns:** PaymentAuthorization with transaction signature

**Throws:**
- `X402Error.InsufficientFunds` - Not enough funds
- `X402Error.TransactionBroadcastFailed` - Broadcast failed
- `X402Error.PaymentVerificationFailed` - Verification failed

##### getBalance()

```kotlin
fun getBalance(publicKey: PublicKey): String
```

Gets USDC balance for a public key. This is a blocking operation.

**Returns:** Balance as string (e.g., "10.50")

##### verifyTransaction()

```kotlin
fun verifyTransaction(signature: String): Boolean
```

Verifies a transaction has been confirmed. Blocking operation.

**Returns:** true if confirmed, false otherwise

##### close()

```kotlin
override fun close()
```

Closes RPC connection and releases resources.

---

## Package: org.openlibx402.core.errors

### X402Error (Sealed Class)

Base sealed class for all X402 protocol errors. Enables exhaustive when expressions.

```kotlin
sealed class X402Error(
    override val message: String,
    val code: String,
    val details: Map<String, Any> = emptyMap()
) : Exception(message)
```

**Properties:**
- `message` (String): Error message
- `code` (String): Error code
- `details` (Map<String, Any>): Additional error details

### Error Types

#### PaymentRequired

```kotlin
data class PaymentRequired(
    val paymentRequest: PaymentRequest,
    override val message: String = "Payment required to access this resource"
) : X402Error(
    message = message,
    code = "PAYMENT_REQUIRED",
    details = mapOf("payment_request" to paymentRequest.toMap())
)
```

**Error Code:** `PAYMENT_REQUIRED`

**Example:**
```kotlin
catch (e: X402Error.PaymentRequired) {
    val request = e.paymentRequest
    println("Amount: ${request.maxAmountRequired}")
}
```

#### InsufficientFunds

```kotlin
data class InsufficientFunds(
    val requiredAmount: String,
    val availableAmount: String,
    override val message: String = "Insufficient funds: required $requiredAmount, available $availableAmount"
) : X402Error(...)
```

**Error Code:** `INSUFFICIENT_FUNDS`

#### PaymentExpired

```kotlin
data class PaymentExpired(
    val paymentRequest: PaymentRequest,
    override val message: String = "Payment request has expired"
) : X402Error(...)
```

**Error Code:** `PAYMENT_EXPIRED`

#### PaymentVerificationFailed

```kotlin
data class PaymentVerificationFailed(
    val reason: String,
    override val message: String = "Payment verification failed: $reason"
) : X402Error(...)
```

**Error Code:** `PAYMENT_VERIFICATION_FAILED`

#### TransactionBroadcastFailed

```kotlin
data class TransactionBroadcastFailed(
    val reason: String,
    override val message: String = "Transaction broadcast failed: $reason",
    override val cause: Throwable? = null
) : X402Error(...)
```

**Error Code:** `TRANSACTION_BROADCAST_FAILED`

#### InvalidPaymentRequest

```kotlin
data class InvalidPaymentRequest(
    val reason: String,
    override val message: String = "Invalid payment request: $reason",
    override val cause: Throwable? = null
) : X402Error(...)
```

**Error Code:** `INVALID_PAYMENT_REQUEST`

#### Generic

```kotlin
data class Generic(
    val customCode: String,
    override val message: String,
    val customDetails: Map<String, Any> = emptyMap()
) : X402Error(
    message = message,
    code = customCode,
    details = customDetails
)
```

For cases not covered by specific error types.

### Companion Object Methods

#### getInfo()

```kotlin
companion object {
    fun getInfo(code: String): ErrorCodeInfo?
}
```

Gets error code information.

#### isRetryable()

```kotlin
companion object {
    fun isRetryable(code: String): Boolean
}
```

Checks if an error code is retryable.

#### getMessage()

```kotlin
companion object {
    fun getMessage(code: String): String?
}
```

Gets the human-readable message for an error code.

#### getUserAction()

```kotlin
companion object {
    fun getUserAction(code: String): String?
}
```

Gets the suggested user action for an error code.

#### getAllCodes()

```kotlin
companion object {
    fun getAllCodes(): Map<String, ErrorCodeInfo>
}
```

Gets all error codes and their metadata.

### ErrorCodeInfo Data Class

```kotlin
data class ErrorCodeInfo(
    val code: String,
    val message: String,
    val retry: Boolean,
    val userAction: String
)
```

---

## Usage Examples

### Creating a Client

```kotlin
import kotlinx.coroutines.runBlocking

suspend fun main() {
    val account = Account(secretKey)
    val client = X402Client(
        walletAccount = account,
        rpcUrl = "https://api.devnet.solana.com",
        allowLocal = false
    )

    client.use {
        // Use client
    }
}

fun main() = runBlocking { main() }
```

### Making a Request with Coroutines

```kotlin
suspend fun makeRequest() {
    client.use {
        try {
            val response = it.get("https://api.example.com/data")
            println(response.body?.string())
        } catch (e: X402Error.PaymentRequired) {
            val request = e.paymentRequest
            val auth = it.createPayment(request)
            val retry = it.get("https://api.example.com/data", auth)
        }
    }
}
```

### Using Auto Client with DSL

```kotlin
suspend fun autoClientExample() {
    val client = X402AutoClient(account) {
        rpcUrl = "https://api.devnet.solana.com"
        maxPaymentAmount = "5.0"
        maxRetries = 2
    }

    client.use {
        val response = it.get("https://api.example.com/data")
    }
}
```

### Exhaustive When Expression

```kotlin
try {
    val response = client.get(url)
} catch (e: X402Error) {
    when (e) {
        is X402Error.PaymentRequired -> { /* handle */ }
        is X402Error.InsufficientFunds -> { /* handle */ }
        is X402Error.PaymentExpired -> { /* handle */ }
        is X402Error.PaymentVerificationFailed -> { /* handle */ }
        is X402Error.TransactionBroadcastFailed -> { /* handle */ }
        is X402Error.InvalidPaymentRequest -> { /* handle */ }
        is X402Error.Generic -> { /* handle */ }
    }
}
```

### Data Class Operations

```kotlin
// Create with named parameters
val request = PaymentRequest(
    maxAmountRequired = "0.10",
    assetType = "SPL",
    // ... other fields
)

// Destructuring
val (amount, asset, address) = request

// Copy with changes
val updated = request.copy(maxAmountRequired = "0.20")

// Serialization
val json = request.toJson()
val parsed = PaymentRequest.fromJson(json)
```

### Concurrent Requests

```kotlin
import kotlinx.coroutines.*

suspend fun concurrentRequests() = coroutineScope {
    val urls = listOf("url1", "url2", "url3")

    val responses = urls.map { url ->
        async { client.get(url) }
    }.awaitAll()

    responses.forEach { println(it.code) }
}
```

---

## Coroutine Support

All HTTP operations are suspend functions that run on `Dispatchers.IO`:

```kotlin
// Internal implementation
suspend fun get(url: String): Response = withContext(Dispatchers.IO) {
    // HTTP request
}
```

**Best Practices:**
- Always call from a coroutine scope
- Use structured concurrency
- Support cancellation
- Handle timeouts with `withTimeout`
- Use proper dispatchers

---

## Thread Safety

- **X402Client**: Not thread-safe. Create separate instances per coroutine.
- **X402AutoClient**: Not thread-safe. Create separate instances per coroutine.
- **SolanaPaymentProcessor**: Not thread-safe.
- **PaymentRequest**: Immutable data class, thread-safe.
- **PaymentAuthorization**: Immutable data class, thread-safe.

**Recommendation:** Use coroutines instead of threads. Each coroutine can safely use the same client instance.

---

## Resource Management

All client classes implement `Closeable`. Use Kotlin's `use` function:

```kotlin
client.use {
    // Use client
} // Automatically closed
```

Or manual cleanup:

```kotlin
val client = X402Client(account)
try {
    // Use client
} finally {
    client.close()
}
```

---

## Related Documentation

- [Client Library Guide](../libraries/client.md)
- [Error Handling](errors.md)
- [Examples](../examples/basic-usage.md)
- [Installation](../getting-started/installation.md)
