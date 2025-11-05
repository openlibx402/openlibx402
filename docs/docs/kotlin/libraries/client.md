# Kotlin Client Library

The `openlibx402-client` package provides coroutine-based HTTP client implementations for making X402 payment-enabled requests in Kotlin applications.

## Overview

The client library offers two main classes:

- **X402Client**: Manual payment control with suspend functions for maximum flexibility
- **X402AutoClient**: Automatic payment handling with DSL builder pattern for convenience

Both clients use Kotlin coroutines for non-blocking I/O operations on `Dispatchers.IO`.

## Installation

Add to your `build.gradle.kts`:

```kotlin
dependencies {
    implementation("org.openlibx402:openlibx402-core:0.1.0")
    implementation("org.openlibx402:openlibx402-client:0.1.0")

    // Required dependencies
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")
    implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.4.1")
}
```

Or with Gradle (Groovy):

```groovy
dependencies {
    implementation 'org.openlibx402:openlibx402-core:0.1.0'
    implementation 'org.openlibx402:openlibx402-client:0.1.0'

    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3'
    implementation 'org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0'
    implementation 'org.jetbrains.kotlinx:kotlinx-datetime:0.4.1'
}
```

## X402Client

Manual payment control client using Kotlin coroutines with suspend functions.

### Features

- Suspend functions for non-blocking I/O operations
- Manual payment request handling
- Full control over payment decisions
- Support for GET, POST, PUT, DELETE methods
- SSRF protection (blocks localhost and private IPs)
- Resource management with `Closeable` interface
- Internal visibility for processor

### Basic Usage

```kotlin
import kotlinx.coroutines.runBlocking
import org.openlibx402.client.X402Client
import org.openlibx402.core.errors.X402Error
import org.openlibx402.core.models.PaymentAuthorization
import org.p2p.solanaj.core.Account

suspend fun main() {
    // Initialize client
    val account = Account(secretKey)
    val client = X402Client(
        walletAccount = account,
        rpcUrl = "https://api.devnet.solana.com",
        allowLocal = true  // Development only
    )

    client.use {
        try {
            // Make request (suspend function)
            val response = it.get("https://api.example.com/premium-data")
            println(response.body?.string())

        } catch (e: X402Error.PaymentRequired) {
            // Handle 402 Payment Required
            val request = e.paymentRequest

            // Create payment (suspend function)
            val auth = it.createPayment(request)

            // Retry with payment
            val retryResponse = it.get("https://api.example.com/premium-data", auth)
            println(retryResponse.body?.string())
        }
    }
}
```

### Constructor Parameters

```kotlin
class X402Client(
    walletAccount: Account,
    rpcUrl: String? = null,
    httpClient: OkHttpClient = createDefaultHttpClient(),
    allowLocal: Boolean = false
)
```

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `walletAccount` | `Account` | Solana account for signing transactions | Required |
| `rpcUrl` | `String?` | Solana RPC endpoint URL | `null` (devnet) |
| `httpClient` | `OkHttpClient` | Custom HTTP client | Default client |
| `allowLocal` | `Boolean` | Allow localhost URLs (development only) | `false` |

### HTTP Methods

All HTTP methods are suspend functions that run on `Dispatchers.IO`:

#### GET Request

```kotlin
suspend fun get(url: String, payment: PaymentAuthorization? = null): Response
```

```kotlin
val response = client.get(url)
val response = client.get(url, paymentAuth)
```

#### POST Request

```kotlin
suspend fun post(url: String, body: String? = null, payment: PaymentAuthorization? = null): Response
```

```kotlin
val jsonBody = """{"key": "value"}"""
val response = client.post(url, jsonBody)
val response = client.post(url, jsonBody, paymentAuth)
```

#### PUT Request

```kotlin
suspend fun put(url: String, body: String? = null, payment: PaymentAuthorization? = null): Response
```

```kotlin
val jsonBody = """{"key": "updated"}"""
val response = client.put(url, jsonBody)
val response = client.put(url, jsonBody, paymentAuth)
```

#### DELETE Request

```kotlin
suspend fun delete(url: String, payment: PaymentAuthorization? = null): Response
```

```kotlin
val response = client.delete(url)
val response = client.delete(url, paymentAuth)
```

### Payment Methods

#### Create Payment

```kotlin
suspend fun createPayment(
    request: PaymentRequest,
    amount: String? = null
): PaymentAuthorization
```

```kotlin
val auth = client.createPayment(paymentRequest)
val auth = client.createPayment(paymentRequest, "0.05") // specific amount
```

#### Parse Payment Request

```kotlin
fun parsePaymentRequest(response: Response): PaymentRequest
```

```kotlin
val response = client.get(url)
if (client.paymentRequired(response)) {
    val request = client.parsePaymentRequest(response)
    // ... handle payment
}
```

### Error Handling with Sealed Classes

Kotlin's sealed classes provide type-safe, exhaustive error handling:

```kotlin
suspend fun makeRequest(client: X402Client, url: String) {
    try {
        val response = client.get(url)
        println(response.body?.string())

    } catch (e: X402Error) {
        when (e) {
            is X402Error.PaymentRequired -> {
                val request = e.paymentRequest
                val auth = client.createPayment(request)
                val retry = client.get(url, auth)
            }
            is X402Error.InsufficientFunds -> {
                println("Need: ${e.requiredAmount}")
                println("Have: ${e.availableAmount}")
            }
            is X402Error.PaymentExpired -> {
                println("Request expired at: ${e.paymentRequest.expiresAt}")
            }
            is X402Error.PaymentVerificationFailed -> {
                println("Verification failed: ${e.reason}")
            }
            is X402Error.TransactionBroadcastFailed -> {
                println("Broadcast failed: ${e.reason}")
            }
            is X402Error.InvalidPaymentRequest -> {
                println("Invalid request: ${e.reason}")
            }
            is X402Error.Generic -> {
                println("Error ${e.code}: ${e.message}")
            }
        }
    }
}
```

### SSRF Protection

By default, the client blocks requests to:
- `localhost`, `127.0.0.1`, `::1`
- Private IP ranges (10.x.x.x, 172.16.x.x, 192.168.x.x)

```kotlin
// Development mode - allows local URLs
val devClient = X402Client(account, allowLocal = true)

// Production mode - blocks local URLs (default)
val prodClient = X402Client(account, allowLocal = false)
```

!!! warning "Security"
    Never use `allowLocal=true` in production environments. This protection prevents Server-Side Request Forgery (SSRF) attacks.

## X402AutoClient

Automatic payment handling client with DSL builder pattern and retry logic.

### Features

- Automatic 402 detection and payment
- Configurable payment limits
- Automatic retry on payment
- Kotlin DSL builder pattern
- Suspend functions for non-blocking I/O
- Built on top of X402Client

### Basic Usage

```kotlin
import org.openlibx402.client.X402AutoClient

suspend fun main() {
    // Build client with DSL configuration
    val client = X402AutoClient(account) {
        rpcUrl = "https://api.devnet.solana.com"
        maxPaymentAmount = "1.0"      // Max 1 USDC per request
        maxRetries = 2                // Retry up to 2 times
        allowLocal = true             // Development only
    }

    client.use {
        // Automatically handles 402 and retries (suspend function)
        val response = it.get("https://api.example.com/premium-data")
        println(response.body?.string())
    }
}
```

### DSL Builder Configuration

```kotlin
val client = X402AutoClient(account) {
    rpcUrl = "https://api.devnet.solana.com"
    httpClient = customOkHttpClient
    maxPaymentAmount = "5.0"
    maxRetries = 2
    allowLocal = false
    autoRetry = true
}
```

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `rpcUrl` | `String?` | Solana RPC endpoint | Devnet |
| `httpClient` | `OkHttpClient?` | Custom HTTP client | Default |
| `maxPaymentAmount` | `String?` | Maximum payment per request | `null` (no limit) |
| `maxRetries` | `Int` | Maximum retry attempts | `1` |
| `allowLocal` | `Boolean` | Allow localhost URLs | `false` |
| `autoRetry` | `Boolean` | Enable automatic retry | `true` |

### Alternative Builder Pattern

You can also use the traditional builder pattern:

```kotlin
val client = X402AutoClient.Builder(account).apply {
    rpcUrl = "https://api.devnet.solana.com"
    maxPaymentAmount = "5.0"
    maxRetries = 2
    allowLocal = true
}.build()
```

### Example: Custom Configuration

```kotlin
import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit

suspend fun customClientExample() {
    // Custom HTTP client
    val httpClient = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .build()

    // Build auto client with custom configuration
    val client = X402AutoClient(account) {
        rpcUrl = "https://api.mainnet-beta.solana.com"
        httpClient = httpClient
        maxPaymentAmount = "10.0"
        maxRetries = 2
    }

    client.use {
        val response = it.get("https://api.example.com/data")
        println(response.body?.string())
    }
}
```

### Automatic Payment Flow

```kotlin
suspend fun automaticPaymentExample() {
    val client = X402AutoClient(account) {
        rpcUrl = "https://api.devnet.solana.com"
        maxPaymentAmount = "5.0"
        maxRetries = 2
    }

    client.use {
        try {
            // 1. Makes initial request
            // 2. Receives 402 Payment Required
            // 3. Automatically creates payment
            // 4. Retries request with authorization
            // 5. Returns successful response
            val response = it.post(
                "https://api.example.com/data",
                """{"query": "process this"}"""
            )

            println("Success: ${response.body?.string()}")

        } catch (e: X402Error.InsufficientFunds) {
            println("Payment failed: not enough funds")
        } catch (e: X402Error.PaymentRequired) {
            // Only thrown if max retries exceeded
            println("Payment required but max retries exceeded")
        }
    }
}
```

### Payment Limits

The client enforces payment limits to prevent excessive charges:

```kotlin
// This will throw an error if payment exceeds 1.0 USDC
val client = X402AutoClient(account) {
    maxPaymentAmount = "1.0"
}

client.use {
    try {
        val response = it.get(url)
    } catch (e: X402Error.Generic) {
        if (e.code == "PAYMENT_LIMIT_EXCEEDED") {
            println("Payment exceeds configured limit")
        }
    }
}
```

### Access Underlying Components

```kotlin
// Access the payment processor
val processor = client.getProcessor()
val balance = processor.getBalance(account.publicKey)
```

## Comparison: Manual vs Automatic

| Feature | X402Client | X402AutoClient |
|---------|------------|----------------|
| Payment Control | Manual | Automatic |
| Retry Logic | Manual | Automatic |
| Payment Limits | Manual | Built-in |
| Configuration | Constructor | DSL Builder |
| Use Case | Maximum control | Convenience |
| Error Handling | Explicit | Simplified |
| Coroutines | Suspend functions | Suspend functions |

### When to Use Each

**Use X402Client when you need:**
- Fine-grained control over payments
- Custom payment decision logic
- Explicit user approval for payments
- Complex payment workflows
- Integration with existing payment systems
- Type-safe error handling with when expressions

**Use X402AutoClient when you need:**
- Quick integration with automatic payments
- Simplified error handling
- Built-in retry logic
- Payment limit enforcement
- Reduced boilerplate code
- DSL-based configuration

## Coroutine Best Practices

### Proper Coroutine Scope Management

```kotlin
import kotlinx.coroutines.*

// Application-level coroutine scope
class PaymentService {
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val client = X402AutoClient(account) {
        rpcUrl = "https://api.devnet.solana.com"
    }

    fun makePaymentRequest(url: String) {
        scope.launch {
            try {
                val response = client.get(url)
                // Process response
            } catch (e: X402Error) {
                // Handle error
            }
        }
    }

    fun shutdown() {
        scope.cancel()
        client.close()
    }
}
```

### Concurrent Requests with Async

```kotlin
import kotlinx.coroutines.*

suspend fun concurrentRequests() = coroutineScope {
    val client = X402AutoClient(account) {
        maxPaymentAmount = "5.0"
    }

    client.use {
        // Launch multiple requests concurrently
        val deferred1 = async { it.get("https://api.example.com/data1") }
        val deferred2 = async { it.get("https://api.example.com/data2") }
        val deferred3 = async { it.get("https://api.example.com/data3") }

        // Wait for all to complete
        val responses = awaitAll(deferred1, deferred2, deferred3)

        responses.forEach { response ->
            println("Response: ${response.code}")
        }
    }
}
```

### Timeout and Cancellation

```kotlin
import kotlinx.coroutines.*

suspend fun requestWithTimeout() {
    val client = X402Client(account, allowLocal = true)

    client.use {
        try {
            withTimeout(5000) {
                val response = it.get("https://api.example.com/data")
                println(response.body?.string())
            }
        } catch (e: TimeoutCancellationException) {
            println("Request timed out")
        } catch (e: X402Error) {
            println("Payment error: ${e.message}")
        }
    }
}
```

### Structured Concurrency

```kotlin
suspend fun structuredPaymentFlow() = coroutineScope {
    val client = X402Client(account, allowLocal = true)

    client.use {
        try {
            // All child coroutines are cancelled if any fails
            val response = it.get("https://api.example.com/data")

            // Process in parallel
            val job1 = launch { processData(response) }
            val job2 = launch { saveToDatabase(response) }

            // Wait for both to complete
            job1.join()
            job2.join()

        } catch (e: X402Error) {
            // All child coroutines are automatically cancelled
            println("Error: ${e.message}")
        }
    }
}
```

## Data Classes and kotlinx.serialization

The Kotlin SDK uses data classes with kotlinx.serialization for type-safe JSON handling:

```kotlin
import org.openlibx402.core.models.PaymentRequest
import org.openlibx402.core.models.PaymentAuthorization

// PaymentRequest is a data class with kotlinx.serialization
val request = PaymentRequest(
    maxAmountRequired = "0.10",
    assetType = "SPL",
    assetAddress = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    paymentAddress = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    network = "solana-devnet",
    expiresAt = Clock.System.now() + 5.minutes,
    nonce = "unique-nonce",
    paymentId = "pay_123",
    resource = "/api/data",
    description = "Premium data access"
)

// Serialize to JSON
val json = request.toJson()

// Deserialize from JSON
val parsed = PaymentRequest.fromJson(json)

// Data class features
val updated = request.copy(maxAmountRequired = "0.20")
val (amount, assetType, address) = request  // Destructuring
```

## Companion Objects

The SDK uses companion objects for factory methods and constants:

```kotlin
// Parse from JSON
val request = PaymentRequest.fromJson(jsonString)
val auth = PaymentAuthorization.fromHeader(headerValue)

// Get error information
val info = X402Error.getInfo("PAYMENT_REQUIRED")
val isRetryable = X402Error.isRetryable("INSUFFICIENT_FUNDS")
val message = X402Error.getMessage("PAYMENT_EXPIRED")
```

## Resource Management

Both clients implement `Closeable` for proper resource cleanup:

```kotlin
// Try-with-resources pattern (use function)
client.use {
    val response = it.get(url)
    // Client automatically closed
}

// Manual cleanup
val client = X402Client(account)
try {
    val response = client.get(url)
} finally {
    client.close()  // Must call close
}
```

## Best Practices

1. **Use suspend functions**: All HTTP operations are suspend functions
2. **Proper coroutine scope**: Use structured concurrency
3. **Resource management**: Use `use {}` for automatic cleanup
4. **Type-safe errors**: Use when expressions with sealed classes
5. **Never use allowLocal in production**: Security risk
6. **DSL builders**: Prefer X402AutoClient DSL for configuration
7. **Data classes**: Leverage immutability and copy()
8. **Validate payment amounts**: Check before creating payments
9. **Log payment activities**: Track payments for auditing
10. **Handle cancellation**: Support coroutine cancellation

## Example: Production Setup

```kotlin
import kotlinx.coroutines.*
import org.openlibx402.client.X402AutoClient
import org.openlibx402.core.errors.X402Error
import org.p2p.solanaj.core.Account
import mu.KotlinLogging

private val logger = KotlinLogging.logger {}

class ProductionPaymentService(
    private val account: Account,
    private val scope: CoroutineScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
) {
    private val client = X402AutoClient(account) {
        rpcUrl = "https://api.mainnet-beta.solana.com"
        maxPaymentAmount = "10.0"
        maxRetries = 2
        allowLocal = false  // Production security
    }

    suspend fun makeRequest(url: String): Result<String> = withContext(Dispatchers.IO) {
        try {
            logger.info { "Making payment-enabled request to $url" }

            val response = client.get(url)
            val data = response.body?.string() ?: ""

            logger.info { "Request successful" }
            Result.success(data)

        } catch (e: X402Error) {
            when (e) {
                is X402Error.InsufficientFunds -> {
                    logger.error { "Insufficient funds: ${e.requiredAmount}" }
                    // Alert user to add funds
                }
                is X402Error.PaymentRequired -> {
                    logger.error { "Payment failed after retries" }
                    // Escalate to support
                }
                else -> {
                    logger.error(e) { "X402 error: ${e.code}" }
                }
            }
            Result.failure(e)

        } catch (e: Exception) {
            logger.error(e) { "Unexpected error" }
            Result.failure(e)
        }
    }

    fun shutdown() {
        scope.cancel()
        client.close()
    }
}

// Usage
suspend fun main() {
    val account = loadAccountFromSecureStorage()
    val service = ProductionPaymentService(account)

    val result = service.makeRequest("https://api.production.com/premium-data")

    result.onSuccess { data ->
        println("Success: $data")
    }.onFailure { error ->
        println("Failed: ${error.message}")
    }

    service.shutdown()
}

private fun loadAccountFromSecureStorage(): Account {
    // Load from environment, key vault, etc.
    val secretKey = System.getenv("SOLANA_SECRET_KEY")
    return Account(decodeSecretKey(secretKey))
}

private fun decodeSecretKey(key: String): ByteArray {
    // Implement secure key decoding
    return java.util.Base64.getDecoder().decode(key)
}
```

## Related Documentation

- [API Reference](../reference/api-reference.md) - Complete API documentation
- [Error Handling](../reference/errors.md) - Error types and handling
- [Examples](../examples/basic-usage.md) - More usage examples
- [Installation](../getting-started/installation.md) - Installation guide
