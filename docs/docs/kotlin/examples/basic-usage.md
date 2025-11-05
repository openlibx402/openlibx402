# Kotlin Basic Usage Examples

This guide provides practical examples of using the OpenLibX402 Kotlin SDK with coroutines.

## Prerequisites

```kotlin
// build.gradle.kts
dependencies {
    implementation("org.openlibx402:openlibx402-core:0.1.0")
    implementation("org.openlibx402:openlibx402-client:0.1.0")

    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")
    implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.4.1")
}
```

## Example 1: Manual Payment Handling with Coroutines

This example demonstrates explicit control over the payment flow using `X402Client` with suspend functions.

```kotlin
import kotlinx.coroutines.runBlocking
import org.openlibx402.client.X402Client
import org.openlibx402.core.errors.X402Error
import org.openlibx402.core.models.PaymentAuthorization
import org.p2p.solanaj.core.Account

suspend fun manualPaymentExample() {
    // Load Solana account (securely in production!)
    val secretKey = loadSecretKey()
    val account = Account(secretKey)

    // Create client
    val client = X402Client(
        walletAccount = account,
        rpcUrl = "https://api.devnet.solana.com",
        allowLocal = true  // Development only
    )

    client.use {
        val url = "https://api.example.com/premium-data"

        try {
            // Make initial request (suspend function)
            val response = it.get(url)
            println("Success: ${response.body?.string()}")

        } catch (e: X402Error.PaymentRequired) {
            println("Payment required!")

            // Get payment request details
            val request = e.paymentRequest
            println("Amount: ${request.maxAmountRequired}")
            println("Asset: ${request.assetType}")
            println("Description: ${request.description}")

            // Create payment (suspend function)
            val auth = it.createPayment(request)
            println("Payment created: ${auth.signature}")

            // Retry request with payment authorization
            val retryResponse = it.get(url, auth)
            println("Success: ${retryResponse.body?.string()}")
        }
    }
}

fun main() = runBlocking {
    try {
        manualPaymentExample()
    } catch (e: X402Error) {
        when (e) {
            is X402Error.InsufficientFunds -> {
                println("Insufficient funds!")
                println("Required: ${e.requiredAmount}")
                println("Available: ${e.availableAmount}")
            }
            else -> {
                println("Error: ${e.message}")
            }
        }
    } catch (e: Exception) {
        e.printStackTrace()
    }
}

private fun loadSecretKey(): ByteArray {
    // In production, load from secure storage
    val keyEnv = System.getenv("SOLANA_SECRET_KEY")
    if (keyEnv != null) {
        return java.util.Base64.getDecoder().decode(keyEnv)
    }

    // For demo: generate random account
    println("Warning: Using random account for demo")
    return Account().secretKey
}
```

## Example 2: Automatic Payment with DSL Builder

This example shows automatic payment handling using `X402AutoClient` with Kotlin DSL.

```kotlin
import kotlinx.coroutines.runBlocking
import org.openlibx402.client.X402AutoClient
import org.openlibx402.core.errors.X402Error
import org.p2p.solanaj.core.Account

suspend fun autoPaymentExample() {
    val secretKey = loadSecretKey()
    val account = Account(secretKey)

    // Build auto-client with DSL
    val client = X402AutoClient(account) {
        rpcUrl = "https://api.devnet.solana.com"
        maxPaymentAmount = "1.0"      // Max 1 USDC per request
        maxRetries = 2                // Retry up to 2 times
        allowLocal = true             // Development only
    }

    client.use {
        // Client automatically handles 402 and retries
        val url = "https://api.example.com/premium-data"
        val response = it.get(url)

        println("Success: ${response.body?.string()}")
    }
}

fun main() = runBlocking {
    try {
        autoPaymentExample()
    } catch (e: X402Error.InsufficientFunds) {
        println("Insufficient funds for payment")
    } catch (e: X402Error.PaymentRequired) {
        println("Payment required but max retries exceeded")
    } catch (e: X402Error) {
        println("Error: ${e.message}")
    } catch (e: Exception) {
        e.printStackTrace()
    }
}

private fun loadSecretKey(): ByteArray {
    val keyEnv = System.getenv("SOLANA_SECRET_KEY")
    return keyEnv?.let { java.util.Base64.getDecoder().decode(it) }
        ?: Account().secretKey
}
```

## Example 3: POST Requests with JSON

Making POST requests with JSON body using suspend functions.

```kotlin
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.openlibx402.client.X402Client
import org.p2p.solanaj.core.Account

@Serializable
data class QueryRequest(
    val query: String,
    val options: Map<String, String> = emptyMap()
)

suspend fun postRequestExample() {
    val account = Account(loadSecretKey())
    val client = X402Client(account, allowLocal = true)

    client.use {
        val url = "https://api.example.com/process"

        // Create request with kotlinx.serialization
        val requestData = QueryRequest(
            query = "Analyze this data",
            options = mapOf("format" to "json")
        )
        val jsonBody = Json.encodeToString(requestData)

        try {
            // Make POST request (suspend function)
            val response = it.post(url, jsonBody)
            println("Result: ${response.body?.string()}")

        } catch (e: X402Error.PaymentRequired) {
            // Handle payment
            val auth = it.createPayment(e.paymentRequest)

            // Retry with payment
            val retryResponse = it.post(url, jsonBody, auth)
            println("Result: ${retryResponse.body?.string()}")
        }
    }
}

fun main() = runBlocking {
    try {
        postRequestExample()
    } catch (e: Exception) {
        e.printStackTrace()
    }
}

private fun loadSecretKey() = Account().secretKey
```

## Example 4: Type-Safe Error Handling with When Expressions

Comprehensive error handling using sealed classes with exhaustive when expressions.

```kotlin
import kotlinx.coroutines.runBlocking
import org.openlibx402.client.X402Client
import org.openlibx402.core.errors.X402Error
import org.p2p.solanaj.core.Account
import okhttp3.Response
import mu.KotlinLogging

private val logger = KotlinLogging.logger {}

suspend fun errorHandlingExample() {
    val account = Account(loadSecretKey())
    val client = X402Client(account, allowLocal = false)

    client.use {
        val response = makePaymentEnabledRequest(it, "https://api.example.com/data")
        logger.info { "Success: ${response.body?.string()}" }
    }
}

private suspend fun makePaymentEnabledRequest(
    client: X402Client,
    url: String
): Response {
    try {
        return client.get(url)

    } catch (e: X402Error) {
        // Exhaustive when expression with sealed class
        when (e) {
            is X402Error.PaymentRequired -> {
                logger.info { "Payment required, creating payment..." }
                return handlePayment(client, url, e.paymentRequest)
            }
            is X402Error.InsufficientFunds -> {
                logger.error { "Insufficient funds!" }
                logger.error { "Required: ${e.requiredAmount}" }
                logger.error { "Available: ${e.availableAmount}" }
                throw RuntimeException("Cannot complete payment", e)
            }
            is X402Error.PaymentExpired -> {
                logger.warn { "Payment request expired, retrying..." }
                // Retry to get new payment request
                return makePaymentEnabledRequest(client, url)
            }
            is X402Error.PaymentVerificationFailed -> {
                logger.error { "Payment verification failed: ${e.reason}" }
                throw RuntimeException("Payment not accepted", e)
            }
            is X402Error.TransactionBroadcastFailed -> {
                logger.error { "Transaction broadcast failed: ${e.reason}" }
                throw RuntimeException("Cannot broadcast payment", e)
            }
            is X402Error.InvalidPaymentRequest -> {
                logger.error { "Invalid payment request: ${e.reason}" }
                throw RuntimeException("Server sent invalid payment request", e)
            }
            is X402Error.Generic -> {
                logger.error { "Generic error: ${e.code} - ${e.message}" }
                throw RuntimeException("X402 error", e)
            }
        }
    }
}

private suspend fun handlePayment(
    client: X402Client,
    url: String,
    request: org.openlibx402.core.models.PaymentRequest
): Response {
    // Check if expired
    if (request.isExpired()) {
        logger.warn { "Payment request already expired" }
        throw X402Error.PaymentExpired(request)
    }

    // Validate amount
    val amount = request.maxAmountRequired.toDouble()
    if (amount > 10.0) {
        logger.warn { "Payment exceeds maximum allowed amount" }
        throw RuntimeException("Payment too high: $amount")
    }

    // Create payment
    val auth = client.createPayment(request)
    logger.info { "Payment created: ${auth.signature}" }

    // Retry request
    return client.get(url, auth)
}

fun main() = runBlocking {
    try {
        errorHandlingExample()
    } catch (e: Exception) {
        logger.error(e) { "Fatal error" }
    }
}

private fun loadSecretKey() = Account().secretKey
```

## Example 5: Custom HTTP Configuration

Using a custom OkHttp client with specific configuration.

```kotlin
import kotlinx.coroutines.runBlocking
import okhttp3.OkHttpClient
import org.openlibx402.client.X402AutoClient
import org.p2p.solanaj.core.Account
import java.util.concurrent.TimeUnit

suspend fun customHttpExample() {
    val account = Account(loadSecretKey())

    // Custom HTTP client with longer timeouts
    val httpClient = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(120, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()

    // Use custom client with DSL
    val client = X402AutoClient(account) {
        rpcUrl = "https://api.mainnet-beta.solana.com"
        maxPaymentAmount = "5.0"
        this.httpClient = httpClient
    }

    client.use {
        val response = it.get("https://api.example.com/slow-endpoint")
        println("Success: ${response.body?.string()}")
    }
}

fun main() = runBlocking {
    try {
        customHttpExample()
    } catch (e: Exception) {
        e.printStackTrace()
    }
}

private fun loadSecretKey() = Account().secretKey
```

## Example 6: Checking Balance Before Payment

Verify sufficient funds before attempting payment using suspend functions.

```kotlin
import kotlinx.coroutines.runBlocking
import org.openlibx402.client.X402Client
import org.openlibx402.core.blockchain.SolanaPaymentProcessor
import org.openlibx402.core.errors.X402Error
import org.p2p.solanaj.core.Account

suspend fun balanceCheckExample() {
    val account = Account(loadSecretKey())
    val client = X402Client(account, allowLocal = true)

    client.use {
        // Access processor (internal visibility)
        val processor = it::class.java
            .getDeclaredField("processor")
            .also { field -> field.isAccessible = true }
            .get(it) as SolanaPaymentProcessor

        // Check balance first (blocking operation)
        val balance = processor.getBalance(account.publicKey)
        println("Current balance: $balance USDC")

        val url = "https://api.example.com/premium-data"

        try {
            // Make request (suspend function)
            val response = it.get(url)
            println("Success: ${response.body?.string()}")

        } catch (e: X402Error.PaymentRequired) {
            val request = e.paymentRequest
            val required = request.maxAmountRequired.toDouble()
            val available = balance.toDouble()

            if (available < required) {
                println("Insufficient funds!")
                println("Required: $required")
                println("Available: $available")
                println("Please add ${required - available} USDC")
                return
            }

            // Create payment (suspend function)
            val auth = it.createPayment(request)

            // Retry
            val retryResponse = it.get(url, auth)
            println("Success: ${retryResponse.body?.string()}")

            // Check new balance
            val newBalance = processor.getBalance(account.publicKey)
            println("New balance: $newBalance USDC")
        }
    }
}

fun main() = runBlocking {
    try {
        balanceCheckExample()
    } catch (e: Exception) {
        e.printStackTrace()
    }
}

private fun loadSecretKey() = Account().secretKey
```

## Example 7: Concurrent Requests with Coroutines

Using coroutines for parallel payment-enabled requests.

```kotlin
import kotlinx.coroutines.*
import org.openlibx402.client.X402AutoClient
import org.p2p.solanaj.core.Account

suspend fun concurrentRequestsExample() {
    val account = Account(loadSecretKey())

    val client = X402AutoClient(account) {
        rpcUrl = "https://api.devnet.solana.com"
        maxPaymentAmount = "5.0"
        maxRetries = 2
    }

    client.use {
        // Launch multiple requests concurrently
        coroutineScope {
            val urls = listOf(
                "https://api.example.com/data1",
                "https://api.example.com/data2",
                "https://api.example.com/data3"
            )

            val responses = urls.map { url ->
                async(Dispatchers.IO) {
                    try {
                        val response = it.get(url)
                        url to response.body?.string()
                    } catch (e: Exception) {
                        url to "Error: ${e.message}"
                    }
                }
            }.awaitAll()

            responses.forEach { (url, data) ->
                println("$url: $data")
            }
        }
    }
}

fun main() = runBlocking {
    concurrentRequestsExample()
}

private fun loadSecretKey() = Account().secretKey
```

## Example 8: Structured Concurrency with Error Handling

Demonstrating structured concurrency patterns with proper error handling.

```kotlin
import kotlinx.coroutines.*
import org.openlibx402.client.X402Client
import org.openlibx402.core.errors.X402Error
import org.p2p.solanaj.core.Account

suspend fun structuredConcurrencyExample() = coroutineScope {
    val account = Account(loadSecretKey())
    val client = X402Client(account, allowLocal = true)

    client.use {
        try {
            // All child coroutines are cancelled if any fails
            val response = it.get("https://api.example.com/data")

            // Process in parallel with structured concurrency
            val job1 = launch(Dispatchers.IO) {
                processData(response.body?.string() ?: "")
            }

            val job2 = launch(Dispatchers.IO) {
                saveToDatabase(response.body?.string() ?: "")
            }

            // Wait for both to complete
            job1.join()
            job2.join()

            println("All processing complete")

        } catch (e: X402Error) {
            // All child coroutines are automatically cancelled
            println("Error: ${e.message}")
            // Cancel parent scope if needed
            throw e
        }
    }
}

private suspend fun processData(data: String) = withContext(Dispatchers.Default) {
    println("Processing data: ${data.take(50)}")
    delay(1000)
    println("Processing complete")
}

private suspend fun saveToDatabase(data: String) = withContext(Dispatchers.IO) {
    println("Saving to database")
    delay(1500)
    println("Save complete")
}

fun main() = runBlocking {
    try {
        structuredConcurrencyExample()
    } catch (e: Exception) {
        println("Fatal error: ${e.message}")
    }
}

private fun loadSecretKey() = Account().secretKey
```

## Example 9: Using Flow for Streaming Responses

Demonstrating Flow-based streaming with payment-enabled requests.

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import org.openlibx402.client.X402AutoClient
import org.openlibx402.core.errors.X402Error
import org.p2p.solanaj.core.Account

suspend fun streamingRequestsExample() {
    val account = Account(loadSecretKey())

    val client = X402AutoClient(account) {
        rpcUrl = "https://api.devnet.solana.com"
        maxPaymentAmount = "10.0"
    }

    client.use {
        // Create a flow of URLs to process
        val urls = flowOf(
            "https://api.example.com/stream/1",
            "https://api.example.com/stream/2",
            "https://api.example.com/stream/3",
            "https://api.example.com/stream/4"
        )

        // Process each URL with payment handling
        urls
            .map { url ->
                try {
                    val response = it.get(url)
                    Result.success(url to response.body?.string())
                } catch (e: X402Error) {
                    Result.failure<Pair<String, String?>>(e)
                }
            }
            .collect { result ->
                result.onSuccess { (url, data) ->
                    println("$url: $data")
                }.onFailure { e ->
                    println("Failed: ${e.message}")
                }
            }
    }
}

fun main() = runBlocking {
    streamingRequestsExample()
}

private fun loadSecretKey() = Account().secretKey
```

## Example 10: Data Class Features and Extension Functions

Leveraging Kotlin data classes and extension functions.

```kotlin
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import org.openlibx402.core.models.PaymentRequest
import kotlin.time.Duration.Companion.minutes

// Extension function for PaymentRequest
fun PaymentRequest.isAffordable(balance: Double): Boolean =
    balance >= maxAmountRequired.toDouble()

// Extension function to check if expiring soon
fun PaymentRequest.isExpiringSoon(threshold: kotlin.time.Duration = 5.minutes): Boolean {
    val now = Clock.System.now()
    val timeUntilExpiry = expiresAt - now
    return timeUntilExpiry < threshold
}

fun dataClassExample() {
    // Create payment request with data class
    val request = PaymentRequest(
        maxAmountRequired = "0.10",
        assetType = "SPL",
        assetAddress = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        paymentAddress = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
        network = "solana-devnet",
        expiresAt = Clock.System.now() + 10.minutes,
        nonce = "unique-nonce",
        paymentId = "pay_123",
        resource = "/api/data",
        description = "Premium data access"
    )

    // Data class destructuring
    val (amount, assetType, address) = request
    println("Amount: $amount, Asset: $assetType, Address: $address")

    // Immutable copy with changes
    val updated = request.copy(maxAmountRequired = "0.20")
    println("Updated amount: ${updated.maxAmountRequired}")

    // Extension functions
    val balance = 1.0
    println("Is affordable: ${request.isAffordable(balance)}")
    println("Expiring soon: ${request.isExpiringSoon()}")

    // Serialize to JSON
    val json = request.toJson()
    println("JSON: $json")

    // Deserialize from JSON
    val parsed = PaymentRequest.fromJson(json)
    println("Parsed equals original: ${parsed == request}")
}

fun main() {
    dataClassExample()
}
```

## Complete Example Application

For a complete working example, see the [simple-client example](https://github.com/openlibx402/openlibx402/tree/main/examples/kotlin/simple-client) in the repository.

```bash
# Clone repository
git clone https://github.com/openlibx402/openlibx402.git
cd openlibx402/examples/kotlin/simple-client

# Run example
./gradlew run
```

## Best Practices

1. **Use Suspend Functions**: All HTTP operations are suspend functions - use them in coroutines
2. **Structured Concurrency**: Use `coroutineScope` for proper cancellation propagation
3. **Resource Management**: Use `use {}` for automatic cleanup
4. **Type-Safe Errors**: Use exhaustive when expressions with sealed classes
5. **DSL Builders**: Prefer X402AutoClient DSL for clean configuration
6. **Data Classes**: Leverage immutability, copy(), and destructuring
7. **Extension Functions**: Create domain-specific extensions for cleaner code
8. **Flow for Streams**: Use Flow for processing multiple requests
9. **Proper Dispatchers**: Use `Dispatchers.IO` for network operations
10. **Cancellation Support**: Ensure coroutines are cancellation-aware

## Related Documentation

- [Installation Guide](../getting-started/installation.md)
- [Client Quickstart](../getting-started/client-quickstart.md)
- [Client Library Reference](../libraries/client.md)
- [Error Handling](../reference/errors.md)
