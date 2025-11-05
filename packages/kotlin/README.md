# OpenLibX402 Kotlin SDK

Kotlin implementation of the X402 payment protocol with Solana blockchain integration and full coroutine support.

## Features

- **Coroutine-first API**: All I/O operations use suspend functions
- **Two-package architecture**: Separate `core` and `client` packages for flexibility
- **Explicit and automatic payment modes**: Choose manual control or automatic payment handling
- **Type-safe with sealed classes**: Exhaustive error handling with Kotlin sealed classes
- **Idiomatic Kotlin**: DSL builders, extension functions, and data classes
- **SSRF protection**: Built-in security against server-side request forgery
- **Blockchain integration**: Full Solana transaction support

## Installation

### Gradle (Kotlin DSL)

Add to your `build.gradle.kts`:

```kotlin
dependencies {
    // Core package
    implementation("org.openlibx402:openlibx402-core:0.1.0")

    // Client package
    implementation("org.openlibx402:openlibx402-client:0.1.0")
}
```

### Gradle (Groovy)

Add to your `build.gradle`:

```groovy
dependencies {
    implementation 'org.openlibx402:openlibx402-core:0.1.0'
    implementation 'org.openlibx402:openlibx402-client:0.1.0'
}
```

### Maven

Add to your `pom.xml`:

```xml
<dependencies>
    <dependency>
        <groupId>org.openlibx402</groupId>
        <artifactId>openlibx402-core</artifactId>
        <version>0.1.0</version>
    </dependency>

    <dependency>
        <groupId>org.openlibx402</groupId>
        <artifactId>openlibx402-client</artifactId>
        <version>0.1.0</version>
    </dependency>
</dependencies>
```

## Quick Start

### Automatic Payment Client (Recommended)

The `X402AutoClient` automatically handles payment requests using coroutines:

```kotlin
import kotlinx.coroutines.runBlocking
import org.openlibx402.client.X402AutoClient
import org.p2p.solanaj.core.Account

suspend fun main() {
    // Create account from private key
    val account = Account(secretKeyBytes)

    // Build auto client with DSL
    val client = X402AutoClient(account) {
        rpcUrl = "https://api.devnet.solana.com"
        maxPaymentAmount = "1.0"  // Safety limit
        maxRetries = 2
        allowLocal = true  // Development only!
    }

    client.use {
        // Make request - payments handled automatically
        val response = it.get("https://api.example.com/premium-data")
        println(response.body?.string())
    }
}
```

### Manual Payment Client

The `X402Client` gives you full control over payments with suspend functions:

```kotlin
import kotlinx.coroutines.runBlocking
import org.openlibx402.client.X402Client
import org.openlibx402.core.errors.X402Error
import org.p2p.solanaj.core.Account

suspend fun main() {
    val account = Account(secretKeyBytes)
    val client = X402Client(
        walletAccount = account,
        rpcUrl = "https://api.devnet.solana.com",
        allowLocal = true
    )

    client.use {
        try {
            // Initial request
            val response = it.get("https://api.example.com/premium-data")
            println(response.body?.string())

        } catch (e: X402Error.PaymentRequired) {
            // Get payment request details
            val request = e.paymentRequest
            println("Payment required: ${request.maxAmountRequired}")

            // Create and submit payment
            val auth = it.createPayment(request)

            // Retry request with payment
            val retryResponse = it.get("https://api.example.com/premium-data", auth)
            println(retryResponse.body?.string())
        }
    }
}
```

## Architecture

### Core Package (`openlibx402-core`)

Contains the fundamental payment protocol components:

- **Models**: `PaymentRequest`, `PaymentAuthorization` (data classes with serialization)
- **Errors**: Sealed class hierarchy (`X402Error` with all variants)
- **Blockchain**: `SolanaPaymentProcessor` with suspend functions
- **Utilities**: Error codes and helper functions

### Client Package (`openlibx402-client`)

Provides HTTP clients with payment integration:

- **X402Client**: Manual payment control with suspend functions
- **X402AutoClient**: Automatic payment handling with coroutines

## Kotlin Features

### Sealed Class Error Handling

Exhaustive when expressions for type-safe error handling:

```kotlin
try {
    val response = client.get(url)
} catch (e: X402Error) {
    when (e) {
        is X402Error.PaymentRequired -> {
            // Handle 402 payment required
            val request = e.paymentRequest
        }
        is X402Error.InsufficientFunds -> {
            // Handle low balance
            println("Need: ${e.requiredAmount}")
            println("Have: ${e.availableAmount}")
        }
        is X402Error.PaymentExpired -> {
            // Handle expired payment request
        }
        is X402Error.PaymentVerificationFailed -> {
            // Handle verification failure
        }
        is X402Error.TransactionBroadcastFailed -> {
            // Handle broadcast failure
        }
        is X402Error.InvalidPaymentRequest -> {
            // Handle invalid request
        }
        is X402Error.Generic -> {
            // Handle other errors
            println("Error: ${e.code}")
        }
    }
}
```

### DSL Builder Pattern

Idiomatic Kotlin configuration:

```kotlin
val client = X402AutoClient(account) {
    rpcUrl = "https://api.mainnet-beta.solana.com"
    maxPaymentAmount = "5.0"
    maxRetries = 3
    autoRetry = true
    allowLocal = false
}
```

### Extension Functions

Use Kotlin's `.use` for automatic resource management:

```kotlin
X402Client(account).use { client ->
    val response = client.get(url)
    // client automatically closed
}
```

## Security

### SSRF Protection

By default, both clients block requests to:
- `localhost`, `127.0.0.1`, `::1`
- Private IP ranges (10.0.0.0/8, 192.168.0.0/16, 172.16.0.0/12)

**⚠️ Development Mode**: Set `allowLocal = true` only for local testing. Never use in production!

```kotlin
// Development only!
val client = X402Client(account, allowLocal = true)
```

### Payment Safety

Use `maxPaymentAmount` to prevent excessive spending:

```kotlin
val client = X402AutoClient(account) {
    maxPaymentAmount = "5.0"  // Maximum 5 tokens per payment
}
```

## Coroutines

All I/O operations are suspend functions:

```kotlin
import kotlinx.coroutines.*

suspend fun fetchData() {
    val client = X402AutoClient(account)

    client.use {
        // Runs on IO dispatcher
        val response = it.get("https://api.example.com/data")
        println(response.body?.string())
    }
}

// Run in coroutine scope
runBlocking {
    fetchData()
}
```

### Parallel Requests

```kotlin
import kotlinx.coroutines.*

suspend fun fetchMultiple() = coroutineScope {
    val client = X402AutoClient(account)

    client.use {
        val deferred1 = async { it.get("https://api.example.com/data1") }
        val deferred2 = async { it.get("https://api.example.com/data2") }

        val response1 = deferred1.await()
        val response2 = deferred2.await()

        // Process responses
    }
}
```

## Building from Source

```bash
cd sdks/kotlin

# Build all packages
./gradlew build

# Run tests
./gradlew test

# Publish to local Maven
./gradlew publishToMavenLocal
```

## Testing

```bash
# Run all tests
./gradlew test

# Run specific package tests
./gradlew :openlibx402-core:test
./gradlew :openlibx402-client:test
```

## Requirements

- Kotlin 1.9.20 or higher
- JVM 11 or higher
- Gradle 7.0+ or Maven 3.6+
- Solana wallet with devnet/mainnet access

## API Documentation

Generate KDoc:

```bash
./gradlew dokkaHtml
```

View at `build/dokka/html/index.html`

## Examples

See the `examples/` directory for complete working examples:

- Basic usage
- Coroutine patterns
- Error handling
- Custom configuration
- Testing patterns

## License

MIT License - see LICENSE file for details

## Support

- Issues: [GitHub Issues](https://github.com/your-org/openlibx402/issues)
- Documentation: [Full Docs](https://docs.openlibx402.org)

## Contributing

Contributions welcome! Please read CONTRIBUTING.md first.
