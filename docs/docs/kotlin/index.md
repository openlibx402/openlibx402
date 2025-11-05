# OpenLibX402 Kotlin SDK

Welcome to the OpenLibX402 Kotlin SDK documentation. This SDK provides a coroutine-first implementation of the X402 payment protocol for Kotlin applications.

## Overview

The Kotlin SDK consists of two main packages:

- **`openlibx402-core`**: Core payment protocol with suspend functions and sealed classes
- **`openlibx402-client`**: HTTP client libraries with coroutine support

## Key Features

- 🎯 **Coroutine-First API**: All I/O operations use suspend functions
- 🔒 **Sealed Class Errors**: Type-safe exhaustive error handling
- 🏗️ **DSL Builders**: Idiomatic Kotlin configuration
- 📦 **Data Classes**: Immutable models with kotlinx.serialization
- 🚀 **Extension Functions**: Fluent, expressive API
- 🛡️ **SSRF Protection**: Built-in security features
- 📚 **KDoc Documentation**: Complete API documentation

## Quick Start

### Installation

Add to your `build.gradle.kts`:

```kotlin
dependencies {
    implementation("org.openlibx402:openlibx402-core:0.1.0")
    implementation("org.openlibx402:openlibx402-client:0.1.0")
}
```

### Simple Example

```kotlin
import kotlinx.coroutines.runBlocking
import org.openlibx402.client.X402AutoClient
import org.p2p.solanaj.core.Account

suspend fun main() {
    val account = Account(secretKeyBytes)

    val client = X402AutoClient(account) {
        rpcUrl = "https://api.devnet.solana.com"
        maxPaymentAmount = "1.0"
        allowLocal = true
    }

    client.use {
        val response = it.get("https://api.example.com/data")
        println(response.body?.string())
    }
}
```

## Architecture

### Two-Package Design

The Kotlin SDK follows a modular coroutine-based architecture:

```
openlibx402-core/
├── models/           # PaymentRequest, PaymentAuthorization (data classes)
├── errors/           # X402Error (sealed class)
├── blockchain/       # SolanaPaymentProcessor (suspend functions)
└── util/             # Extension functions

openlibx402-client/
├── X402Client        # Manual control with suspend functions
└── X402AutoClient    # Automatic handling with coroutines
```

### Payment Flow

```
Suspend Call → 402 Response → Coroutine Payment Creation →
Async Transaction Broadcast → Payment Verification → Retry with Auth →
200 Response
```

## Client Types

### X402Client (Explicit Control)

For applications that need manual control with suspend functions:

```kotlin
val client = X402Client(
    walletAccount = account,
    rpcUrl = "https://api.devnet.solana.com",
    allowLocal = true
)

try {
    val response = client.get(url)
} catch (e: X402Error.PaymentRequired) {
    val request = e.paymentRequest
    val auth = client.createPayment(request)
    val retryResponse = client.get(url, auth)
}
```

### X402AutoClient (Automatic Handling)

For seamless automatic payment processing with coroutines:

```kotlin
val client = X402AutoClient(account) {
    maxPaymentAmount = "5.0"
    maxRetries = 2
}

val response = client.get(url)  // Automatically handles payments
```

## Coroutines

All I/O operations are suspend functions running on the IO dispatcher:

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
suspend fun fetchMultiple() = coroutineScope {
    val client = X402AutoClient(account)

    client.use {
        val deferred1 = async { it.get("https://api.example.com/data1") }
        val deferred2 = async { it.get("https://api.example.com/data2") }

        val response1 = deferred1.await()
        val response2 = deferred2.await()
    }
}
```

## Error Handling

Type-safe exhaustive error handling with sealed classes:

```kotlin
try {
    val response = client.get(url)
} catch (e: X402Error) {
    when (e) {
        is X402Error.PaymentRequired -> {
            // Handle 402
            val request = e.paymentRequest
        }
        is X402Error.InsufficientFunds -> {
            // Handle low balance
            println("Need: ${e.requiredAmount}")
        }
        is X402Error.PaymentExpired -> {
            // Handle expired payment
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

## Kotlin Features

### DSL Builder Pattern

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

```kotlin
// Use .use for automatic resource management
X402Client(account).use { client ->
    val response = client.get(url)
    // client automatically closed
}
```

### Data Classes

```kotlin
val request = PaymentRequest(
    maxAmountRequired = "0.10",
    assetType = "SPL",
    assetAddress = "...",
    paymentAddress = "...",
    network = "solana-devnet",
    expiresAt = Clock.System.now() + 5.minutes,
    nonce = "unique-nonce",
    paymentId = "pay_123",
    resource = "/api/data"
)

// Immutable with copy()
val updated = request.copy(maxAmountRequired = "0.20")
```

## Security

- **SSRF Protection**: Blocks localhost and private IP addresses by default
- **Payment Limits**: Set maximum payment amounts to prevent overspending
- **Coroutine Safety**: Thread-safe operations with structured concurrency
- **Resource Cleanup**: Closeable ensures proper resource release

## Next Steps

- [Installation Guide](getting-started/installation.md)
- [Core Library Reference](libraries/core.md)
- [Client Library Reference](libraries/client.md)
- [Examples](examples/basic-usage.md)
- [API Reference](reference/api-reference.md)
