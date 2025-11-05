# Kotlin Client Quickstart

Get started with the OpenLibX402 Kotlin client using coroutines in 5 minutes.

## Prerequisites

- Kotlin 1.9.0 or higher installed
- Gradle or Maven configured
- OpenLibX402 packages added to your project

See [Installation Guide](installation.md) if you haven't set these up yet.

## Step 1: Create a Solana Account

```kotlin
import org.p2p.solanaj.core.Account
import java.util.Base64

// For development: generate a new account
val account = Account()
println("Public Key: ${account.publicKey}")
println("Secret Key (save this!): ${
    Base64.getEncoder().encodeToString(account.secretKey)
}")
```

For production, load from secure storage:

```kotlin
// Load from environment variable
val keyString = System.getenv("SOLANA_SECRET_KEY")
val secretKey = Base64.getDecoder().decode(keyString)
val account = Account(secretKey)
```

## Step 2: Choose Your Client Type

### Option A: Automatic Client (Recommended for Beginners)

Best for quick integration with automatic payment handling using Kotlin DSL.

```kotlin
import kotlinx.coroutines.runBlocking
import org.openlibx402.client.X402AutoClient

suspend fun main() {
    // Create client with DSL builder
    val client = X402AutoClient(account) {
        rpcUrl = "https://api.devnet.solana.com"
        maxPaymentAmount = "1.0"      // Max 1 USDC per request
        maxRetries = 2                // Retry up to 2 times
        allowLocal = true             // Development only
    }

    client.use {
        // Automatically handles 402 and retries with payment
        val response = it.get("https://api.example.com/premium-data")
        println(response.body?.string())
    }
}

// For gradle run compatibility
fun main() = runBlocking {
    main()
}
```

### Option B: Manual Client

Best when you need explicit control over payments with suspend functions.

```kotlin
import kotlinx.coroutines.runBlocking
import org.openlibx402.client.X402Client
import org.openlibx402.core.errors.X402Error

suspend fun main() {
    // Create client with manual payment control
    val client = X402Client(
        walletAccount = account,
        rpcUrl = "https://api.devnet.solana.com",
        allowLocal = true  // Development only
    )

    client.use {
        try {
            // Make initial request (suspend function)
            val response = it.get("https://api.example.com/premium-data")
            println(response.body?.string())

        } catch (e: X402Error.PaymentRequired) {
            // Handle 402: create payment manually (suspend function)
            val auth = it.createPayment(e.paymentRequest)

            // Retry with payment
            val retryResponse = it.get("https://api.example.com/premium-data", auth)
            println(retryResponse.body?.string())
        }
    }
}

fun main() = runBlocking {
    main()
}
```

## Step 3: Make Payment-Enabled Requests

All HTTP methods are suspend functions that must be called from a coroutine:

### GET Request

```kotlin
suspend fun getExample() {
    client.use {
        val response = it.get("https://api.example.com/data")
        println(response.body?.string())
    }
}
```

### POST Request with JSON

```kotlin
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

@Serializable
data class QueryRequest(val query: String)

suspend fun postExample() {
    client.use {
        val requestData = QueryRequest("process this")
        val jsonBody = Json.encodeToString(requestData)

        val response = it.post("https://api.example.com/process", jsonBody)
        println(response.body?.string())
    }
}
```

### PUT Request

```kotlin
suspend fun putExample() {
    client.use {
        val jsonBody = """{"id": 123, "data": "updated"}"""
        val response = it.put("https://api.example.com/update", jsonBody)
    }
}
```

### DELETE Request

```kotlin
suspend fun deleteExample() {
    client.use {
        val response = it.delete("https://api.example.com/resource/123")
    }
}
```

## Step 4: Handle Errors with Sealed Classes

Kotlin's sealed classes enable type-safe, exhaustive error handling:

```kotlin
import org.openlibx402.core.errors.X402Error

suspend fun handleErrors() {
    client.use {
        try {
            val response = it.get(url)
            println(response.body?.string())

        } catch (e: X402Error) {
            // Exhaustive when expression
            when (e) {
                is X402Error.InsufficientFunds -> {
                    println("Not enough funds!")
                    println("Required: ${e.requiredAmount}")
                    println("Available: ${e.availableAmount}")
                }
                is X402Error.PaymentExpired -> {
                    println("Payment request expired, retry...")
                }
                is X402Error.PaymentVerificationFailed -> {
                    println("Payment not accepted: ${e.reason}")
                }
                is X402Error.PaymentRequired -> {
                    println("Payment required: ${e.paymentRequest.maxAmountRequired}")
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
}
```

## Complete Example

Here's a complete working example with coroutines:

```kotlin
package com.example

import kotlinx.coroutines.runBlocking
import org.openlibx402.client.X402AutoClient
import org.openlibx402.core.errors.X402Error
import org.p2p.solanaj.core.Account
import java.util.Base64

suspend fun main() {
    // Load or create account
    val account = getAccount()

    // Create auto client with DSL
    val client = X402AutoClient(account) {
        rpcUrl = "https://api.devnet.solana.com"
        maxPaymentAmount = "1.0"
        maxRetries = 2
        allowLocal = true  // Development only
    }

    client.use {
        try {
            // Make payment-enabled request (suspend function)
            val url = "https://api.example.com/premium-data"
            val response = it.get(url)

            // Process response
            val data = response.body?.string()
            println("Success! Data: $data")

        } catch (e: X402Error) {
            when (e) {
                is X402Error.InsufficientFunds -> {
                    println("Insufficient funds!")
                    println("Please add funds to: ${account.publicKey}")
                }
                is X402Error.PaymentRequired -> {
                    println("Payment required but max retries exceeded")
                }
                else -> {
                    println("Error: ${e.message}")
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}

private fun getAccount(): Account {
    // Try loading from environment
    val keyEnv = System.getenv("SOLANA_SECRET_KEY")
    if (keyEnv != null) {
        val secretKey = Base64.getDecoder().decode(keyEnv)
        return Account(secretKey)
    }

    // Development: generate new account
    println("Warning: Using random account for demo")
    return Account()
}

// For gradle run compatibility
fun main() = runBlocking {
    main()
}
```

## Running the Example

### Gradle

Create `build.gradle.kts`:

```kotlin
plugins {
    kotlin("jvm") version "1.9.20"
    kotlin("plugin.serialization") version "1.9.20"
    application
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.openlibx402:openlibx402-core:0.1.0")
    implementation("org.openlibx402:openlibx402-client:0.1.0")

    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")
    implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.4.1")
}

application {
    mainClass.set("com.example.AppKt")
}

kotlin {
    jvmToolchain(11)
}
```

Run:
```bash
gradle run
```

### With Environment Variable

```bash
export SOLANA_SECRET_KEY="your-base64-encoded-key"
gradle run
```

### As Standalone Script

Create `QuickStart.main.kts`:

```kotlin
#!/usr/bin/env kotlin

@file:Repository("https://repo.maven.apache.org/maven2/")
@file:DependsOn("org.openlibx402:openlibx402-client:0.1.0")
@file:DependsOn("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")

import kotlinx.coroutines.runBlocking
import org.openlibx402.client.X402AutoClient
import org.p2p.solanaj.core.Account

runBlocking {
    val account = Account()
    val client = X402AutoClient(account) {
        rpcUrl = "https://api.devnet.solana.com"
        allowLocal = true
    }

    client.use {
        try {
            val response = it.get("https://api.example.com/data")
            println("Success: ${response.code}")
        } catch (e: Exception) {
            println("Error: ${e.message}")
        }
    }
}
```

Run:
```bash
chmod +x QuickStart.main.kts
./QuickStart.main.kts
```

## Coroutine Best Practices

### Use Proper Coroutine Scopes

```kotlin
import kotlinx.coroutines.*

class PaymentService {
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    fun makeRequest(url: String) {
        scope.launch {
            client.use {
                val response = it.get(url)
                // Process response
            }
        }
    }

    fun shutdown() {
        scope.cancel()
    }
}
```

### Structured Concurrency

```kotlin
suspend fun parallelRequests() = coroutineScope {
    val client = X402AutoClient(account) {
        maxPaymentAmount = "5.0"
    }

    client.use {
        val urls = listOf("url1", "url2", "url3")

        val responses = urls.map { url ->
            async { it.get(url) }
        }.awaitAll()

        responses.forEach { response ->
            println("Response: ${response.code}")
        }
    }
}
```

### Timeout Support

```kotlin
import kotlinx.coroutines.*

suspend fun requestWithTimeout() {
    client.use {
        try {
            withTimeout(5000) {
                val response = it.get("https://api.example.com/data")
                println(response.body?.string())
            }
        } catch (e: TimeoutCancellationException) {
            println("Request timed out")
        }
    }
}
```

## Next Steps

### 1. Learn More Patterns

Explore [Basic Usage Examples](../examples/basic-usage.md) for:
- Advanced error handling with when expressions
- Concurrent requests with coroutines
- Custom HTTP configuration
- Flow-based streaming
- Data class features

### 2. Understand the API

Read the [Client Library Reference](../libraries/client.md) for:
- Complete API documentation
- All available methods with suspend functions
- DSL builder options
- Coroutine best practices

### 3. Set Up for Production

See [Error Handling Guide](../reference/errors.md) for:
- Comprehensive sealed class error handling
- Production deployment with coroutines
- Security considerations
- Monitoring and logging

## Common Issues

### "Suspend function 'get' should be called only from a coroutine"

**Cause:** Calling suspend functions outside a coroutine.

**Solution:** Wrap in `runBlocking` or use proper coroutine scope:
```kotlin
// Main function
fun main() = runBlocking {
    client.get(url)  // Now works
}

// Or use CoroutineScope
val scope = CoroutineScope(Dispatchers.IO)
scope.launch {
    client.get(url)
}
```

### "PaymentRequired: Payment Required"

**Cause:** API requires payment, but automatic payment failed.

**Solutions:**
1. Check balance first
2. Increase `maxRetries` in DSL builder
3. Increase `maxPaymentAmount` if payment exceeds limit

```kotlin
val client = X402AutoClient(account) {
    maxRetries = 3
    maxPaymentAmount = "5.0"
}
```

### "InsufficientFunds"

**Cause:** Not enough USDC in your account.

**Solution:** Add funds to your Solana account:
```kotlin
// Get your public key
println(account.publicKey)

// Fund on devnet (development)
// Use Solana faucet or transfer USDC to this address
```

### "Requests to localhost are blocked"

**Cause:** SSRF protection blocking local URLs.

**Solution:** For development only, use `allowLocal = true`:
```kotlin
val client = X402Client(
    walletAccount = account,
    allowLocal = true  // Only for development!
)
```

### "Unresolved reference: runBlocking"

**Cause:** Missing coroutines dependency.

**Solution:** Add to `build.gradle.kts`:
```kotlin
dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
}
```

### "Plugin [id: 'kotlinx-serialization'] was not found"

**Cause:** Missing serialization plugin.

**Solution:** Add to `build.gradle.kts`:
```kotlin
plugins {
    kotlin("plugin.serialization") version "1.9.20"
}
```

## Tips for Success

1. **Start with AutoClient**: Use `X402AutoClient` with DSL for quick integration
2. **Use suspend functions**: All HTTP operations are suspend functions
3. **Resource management**: Use `use {}` for automatic cleanup
4. **Development mode**: Use `allowLocal = true` and devnet for testing
5. **Production mode**: Use mainnet RPC and `allowLocal = false`
6. **Type-safe errors**: Use when expressions with sealed classes
7. **Set limits**: Configure `maxPaymentAmount` to prevent overspending
8. **Secure keys**: Never hardcode secret keys, use environment variables
9. **Coroutine scopes**: Use structured concurrency patterns
10. **Cancellation**: Support coroutine cancellation in your code

## Advanced Features

### Extension Functions

```kotlin
import org.openlibx402.core.models.PaymentRequest

fun PaymentRequest.isAffordable(balance: Double): Boolean =
    balance >= maxAmountRequired.toDouble()

// Usage
if (paymentRequest.isAffordable(userBalance)) {
    val auth = client.createPayment(paymentRequest)
}
```

### Data Class Destructuring

```kotlin
val (amount, assetType, address) = paymentRequest
println("Amount: $amount, Asset: $assetType")
```

### Immutable Copies

```kotlin
val updated = paymentRequest.copy(maxAmountRequired = "0.20")
```

### Flow-Based Processing

```kotlin
import kotlinx.coroutines.flow.*

suspend fun streamRequests() {
    flowOf("url1", "url2", "url3")
        .map { url -> client.get(url) }
        .collect { response ->
            println(response.code)
        }
}
```

## Resources

- [Full Example Application](https://github.com/openlibx402/openlibx402/tree/main/examples/kotlin/simple-client)
- [Client Library Documentation](../libraries/client.md)
- [API Reference](../reference/api-reference.md)
- [Error Handling](../reference/errors.md)
- [Kotlin Coroutines Guide](https://kotlinlang.org/docs/coroutines-guide.html)
- [kotlinx.serialization](https://github.com/Kotlin/kotlinx.serialization)

## Support

Need help?

- Check [GitHub Issues](https://github.com/openlibx402/openlibx402/issues)
- Read [Full Documentation](https://docs.openlibx402.org)
- See [More Examples](../examples/basic-usage.md)
- Join [Kotlin Slack](https://surveys.jetbrains.com/s3/kotlin-slack-sign-up)
