# OpenLibX402 Kotlin Simple Client Example

This example demonstrates how to use the OpenLibX402 Kotlin SDK with coroutines for making HTTP requests with automatic payment handling.

## Overview

The example shows two approaches using Kotlin coroutines:

1. **Manual Payment Control** (`X402Client`) - Explicitly handle 402 responses with suspend functions
2. **Automatic Payment Handling** (`X402AutoClient`) - Automatically detect and process payments using coroutines

## Prerequisites

- Kotlin 1.9.20 or higher
- JDK 11 or higher
- Gradle 7.0+
- Solana wallet with devnet tokens (for testing)

## Installation

### 1. Build the OpenLibX402 packages

First, build and install the core and client packages:

```bash
# Build all packages
cd ../../../packages/kotlin
./gradlew build publishToMavenLocal
```

### 2. Build the example

```bash
cd examples/kotlin/simple-client
./gradlew build
```

## Running the Example

### Basic Usage

```bash
./gradlew run
```

### With Custom Solana Secret Key

```bash
export SOLANA_SECRET_KEY="your-base58-encoded-secret-key"
./gradlew run
```

## Code Overview

### Manual Payment Handling with Suspend Functions

```kotlin
suspend fun manualExample() {
    val client = X402Client(
        walletAccount = account,
        rpcUrl = "https://api.devnet.solana.com",
        allowLocal = true
    )

    client.use {
        try {
            val response = it.get(url)  // suspend function
            println(response.body?.string())
        } catch (e: X402Error.PaymentRequired) {
            val request = e.paymentRequest
            val auth = it.createPayment(request)  // suspend function
            val retryResponse = it.get(url, auth)
        }
    }
}
```

### Automatic Payment Handling with DSL Builder

```kotlin
suspend fun automaticExample() {
    val client = X402AutoClient(account) {
        rpcUrl = "https://api.devnet.solana.com"
        maxPaymentAmount = "5.0"
        maxRetries = 2
        allowLocal = true
    }

    client.use {
        val response = it.get(url)  // Automatically handles payments!
    }
}
```

### Type-Safe Error Handling with Sealed Classes

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
        }
    }
}
```

## Configuration Options

### X402Client Options

```kotlin
X402Client(
    walletAccount = account,           // Solana account for signing
    rpcUrl = "...",                    // Solana RPC endpoint (optional)
    httpClient = OkHttpClient(),       // Custom HTTP client (optional)
    allowLocal = false                 // Allow localhost URLs
)
```

### X402AutoClient DSL Options

```kotlin
X402AutoClient(account) {
    rpcUrl = "..."                     // Solana RPC endpoint
    maxPaymentAmount = "5.0"           // Safety spending limit
    maxRetries = 2                     // Maximum retry attempts
    autoRetry = true                   // Enable automatic retry
    allowLocal = false                 // Allow localhost URLs
}
```

## Kotlin Features Demonstrated

### Coroutines

```kotlin
suspend fun fetchData() {
    val client = X402AutoClient(account)
    client.use {
        val response = it.get(url)  // Runs on IO dispatcher
    }
}

// Run in coroutine scope
runBlocking {
    fetchData()
}
```

### Parallel Requests with async/await

```kotlin
coroutineScope {
    val deferred1 = async { client.get("https://api.example.com/data1") }
    val deferred2 = async { client.get("https://api.example.com/data2") }

    val response1 = deferred1.await()
    val response2 = deferred2.await()
}
```

### Data Class Features

```kotlin
// Immutable with copy()
val request = PaymentRequest(...)
val updated = request.copy(maxAmountRequired = "0.20")

// Destructuring
val (amount, assetType, address) = request
```

### Extension Functions

```kotlin
fun PaymentRequest.isAffordable(balance: Double): Boolean =
    balance >= maxAmountRequired.toDouble()

if (request.isAffordable(walletBalance)) {
    // Process payment
}
```

## Security Notes

- **Never commit secret keys** to version control
- Use environment variables or secure key vaults for production
- Set `allowLocal = false` in production environments
- Configure `maxPaymentAmount` to prevent excessive spending
- Monitor wallet balance and payment activity
- Use structured concurrency to prevent coroutine leaks

## Testing with Mock Server

For testing without real payments:

```bash
# Start mock server (separate terminal)
cd test-server
npm install
npm start

# Run example against local server
export API_URL=http://localhost:3000
./gradlew run
```

## Troubleshooting

### "Unable to locate a Java Runtime"
Install JDK 11 or higher:
```bash
# macOS
brew install openjdk@11

# Ubuntu/Debian
sudo apt-get install openjdk-11-jdk
```

### "Package org.openlibx402 does not exist"
Build and install the core packages first:
```bash
cd ../../../packages/kotlin
./gradlew publishToMavenLocal
```

### "Insufficient funds" error
Fund your devnet wallet:
```bash
# Get devnet SOL
solana airdrop 2 YOUR_WALLET_ADDRESS --url devnet

# Get devnet USDC (use Solana faucet)
```

### Gradle wrapper not executable
```bash
chmod +x gradlew
```

## Next Steps

- [Full Kotlin SDK Documentation](../../../packages/kotlin/README.md)
- [API Reference](../../../docs/docs/kotlin/reference/api-reference.md)
- [Error Handling Guide](../../../docs/docs/kotlin/reference/errors.md)
- [Coroutine Patterns](../../../docs/docs/kotlin/examples/)

## License

MIT License - see [LICENSE](../../../LICENSE) for details
