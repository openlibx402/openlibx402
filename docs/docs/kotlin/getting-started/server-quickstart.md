# Server Quickstart (Kotlin)

This guide will help you build a payment-protected REST API server using Kotlin and OpenLibx402 with coroutines.

## Prerequisites

- Kotlin 1.9+ with JDK 11 or higher
- Gradle 7+ or Maven 3.6+
- Basic understanding of Kotlin coroutines
- Solana wallet with some SOL (for transaction fees)

## Overview

Build modern, asynchronous payment-protected API servers with Kotlin's coroutines and popular frameworks like Ktor or Spring Boot. This guide shows you how to integrate X402 payment verification with idiomatic Kotlin code.

## Project Setup

### Using Gradle (Kotlin DSL)

```kotlin
// build.gradle.kts
plugins {
    kotlin("jvm") version "1.9.20"
    id("io.ktor.plugin") version "2.3.6"
    application
}

group = "com.example"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
}

dependencies {
    // OpenLibx402 Core
    implementation("xyz.openlib:openlibx402-core-kotlin:0.1.0")
    implementation("xyz.openlib:openlibx402-client-kotlin:0.1.0")

    // Ktor Server
    implementation("io.ktor:ktor-server-core:2.3.6")
    implementation("io.ktor:ktor-server-netty:2.3.6")
    implementation("io.ktor:ktor-server-content-negotiation:2.3.6")
    implementation("io.ktor:ktor-serialization-kotlinx-json:2.3.6")

    // Ktor Client (for RPC calls)
    implementation("io.ktor:ktor-client-core:2.3.6")
    implementation("io.ktor:ktor-client-cio:2.3.6")
    implementation("io.ktor:ktor-client-content-negotiation:2.3.6")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")

    // Serialization
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")

    // Logging
    implementation("ch.qos.logback:logback-classic:1.4.11")
}

kotlin {
    jvmToolchain(11)
}

application {
    mainClass.set("com.example.ApplicationKt")
}
```

## Ktor Server Implementation

### 1. Payment Models

```kotlin
// src/main/kotlin/com/example/model/PaymentModels.kt
package com.example.model

import kotlinx.serialization.Serializable
import java.time.Instant
import java.util.UUID

@Serializable
data class PaymentRequest(
    val maxAmountRequired: String,
    val assetType: String = "SPL",
    val assetAddress: String,
    val paymentAddress: String,
    val network: String,
    val expiresAt: String,
    val nonce: String = UUID.randomUUID().toString(),
    val paymentId: String = UUID.randomUUID().toString(),
    val resource: String,
    val description: String? = null
) {
    companion object {
        fun create(
            amount: String,
            paymentAddress: String,
            tokenMint: String,
            network: String,
            resource: String,
            description: String? = null,
            expiresIn: Long = 300
        ): PaymentRequest {
            val expiresAt = Instant.now().plusSeconds(expiresIn).toString()
            return PaymentRequest(
                maxAmountRequired = amount,
                assetAddress = tokenMint,
                paymentAddress = paymentAddress,
                network = network,
                expiresAt = expiresAt,
                resource = resource,
                description = description
            )
        }
    }

    fun isExpired(): Boolean {
        return Instant.parse(expiresAt).isBefore(Instant.now())
    }
}

@Serializable
data class PaymentAuthorization(
    val paymentId: String,
    val actualAmount: String,
    val paymentAddress: String,
    val assetAddress: String,
    val network: String,
    val timestamp: String,
    val signature: String,
    val publicKey: String,
    val transactionHash: String? = null
)

@Serializable
data class PremiumData(
    val data: String,
    val price: Double,
    val timestamp: Long,
    val paymentVerified: Boolean = false
)

@Serializable
data class ErrorResponse(
    val error: String,
    val code: String? = null
)
```

### 2. Payment Verification Service

```kotlin
// src/main/kotlin/com/example/service/PaymentVerificationService.kt
package com.example.service

import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

class PaymentVerificationService(
    private val rpcUrl: String,
    private val paymentAddress: String,
    private val tokenMint: String,
    private val httpClient: HttpClient
) {
    private val json = Json { ignoreUnknownKeys = true }

    suspend fun verifyPayment(
        transactionHash: String,
        expectedAmount: String,
        expectedRecipient: String
    ): Boolean = withContext(Dispatchers.IO) {
        try {
            // Get transaction from Solana RPC
            val requestBody = """
                {
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "getTransaction",
                    "params": [
                        "$transactionHash",
                        {
                            "encoding": "json",
                            "maxSupportedTransactionVersion": 0
                        }
                    ]
                }
            """.trimIndent()

            val response: HttpResponse = httpClient.post(rpcUrl) {
                contentType(ContentType.Application.Json)
                setBody(requestBody)
            }

            val responseBody = response.bodyAsText()
            val txResponse = json.decodeFromString<TransactionResponse>(responseBody)

            // Verify transaction details
            verifyTransactionDetails(txResponse, expectedAmount, expectedRecipient)
        } catch (e: Exception) {
            println("Payment verification failed: ${e.message}")
            false
        }
    }

    private fun verifyTransactionDetails(
        tx: TransactionResponse,
        expectedAmount: String,
        expectedRecipient: String
    ): Boolean {
        val result = tx.result ?: return false
        val meta = result.meta ?: return false

        // Check transaction succeeded
        if (meta.err != null) return false

        // Additional verification logic:
        // - Check recipient address
        // - Verify amount transferred
        // - Confirm token mint address
        return true
    }

    @Serializable
    data class TransactionResponse(
        val result: Result? = null
    ) {
        @Serializable
        data class Result(
            val meta: Meta? = null
        ) {
            @Serializable
            data class Meta(
                val err: String? = null,
                val fee: Long? = null
            )
        }
    }
}
```

### 3. X402 Plugin

```kotlin
// src/main/kotlin/com/example/plugins/X402Plugin.kt
package com.example.plugins

import com.example.model.PaymentRequest
import com.example.service.PaymentVerificationService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.util.*

val X402PaymentKey = AttributeKey<PaymentRequest>("X402Payment")

class X402Config {
    var paymentAddress: String = ""
    var tokenMint: String = ""
    var network: String = "solana-devnet"
    var rpcUrl: String = "https://api.devnet.solana.com"
}

val X402Plugin = createApplicationPlugin(
    name = "X402Plugin",
    createConfiguration = ::X402Config
) {
    val config = pluginConfig

    onCall { call ->
        val paymentRequired = call.attributes.getOrNull(X402PaymentKey)

        if (paymentRequired != null) {
            val paymentAuth = call.request.headers["X-Payment-Authorization"]

            if (paymentAuth.isNullOrEmpty()) {
                // Return 402 Payment Required
                call.response.headers.append("X-Payment-Required", "true")
                call.response.headers.append("X-Payment-Protocol", "x402")
                call.respond(HttpStatusCode.PaymentRequired, paymentRequired)
                finish()
            } else {
                // Verify payment
                // Implementation depends on PaymentVerificationService
            }
        }
    }
}
```

### 4. Routing with Payment Protection

```kotlin
// src/main/kotlin/com/example/plugins/Routing.kt
package com.example.plugins

import com.example.model.PaymentRequest
import com.example.model.PremiumData
import com.example.model.ErrorResponse
import com.example.service.PaymentVerificationService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Application.configureRouting(
    paymentService: PaymentVerificationService,
    config: X402Config
) {
    routing {
        // Free endpoint
        get("/api/free-data") {
            call.respond(
                mapOf(
                    "message" to "This is free data",
                    "timestamp" to System.currentTimeMillis()
                )
            )
        }

        // Premium endpoint with payment requirement
        get("/api/premium-data") {
            val paymentAuth = call.request.headers["X-Payment-Authorization"]

            if (paymentAuth.isNullOrEmpty()) {
                // Return 402 Payment Required
                val paymentRequest = PaymentRequest.create(
                    amount = "0.10",
                    paymentAddress = config.paymentAddress,
                    tokenMint = config.tokenMint,
                    network = config.network,
                    resource = "/api/premium-data",
                    description = "Access to premium market data"
                )

                call.response.headers.append("X-Payment-Required", "true")
                call.response.headers.append("X-Payment-Protocol", "x402")
                call.respond(HttpStatusCode.PaymentRequired, paymentRequest)
                return@get
            }

            // Extract transaction hash from authorization header
            val txHash = try {
                extractTransactionHash(paymentAuth)
            } catch (e: Exception) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    ErrorResponse("Invalid payment authorization")
                )
                return@get
            }

            // Verify payment
            val isValid = paymentService.verifyPayment(
                txHash,
                "0.10",
                config.paymentAddress
            )

            if (!isValid) {
                call.respond(
                    HttpStatusCode.PaymentRequired,
                    ErrorResponse("Payment verification failed", "PAYMENT_VERIFICATION_FAILED")
                )
                return@get
            }

            // Payment verified - return premium data
            call.respond(
                PremiumData(
                    data = "Premium content",
                    price = 100.50,
                    timestamp = System.currentTimeMillis(),
                    paymentVerified = true
                )
            )
        }

        // Health check
        get("/api/health") {
            call.respond(
                mapOf(
                    "status" to "ok",
                    "timestamp" to System.currentTimeMillis()
                )
            )
        }
    }
}

private fun extractTransactionHash(paymentAuth: String): String {
    // Parse payment authorization header
    // Format: "transactionHash=<tx-hash>;..."
    val parts = paymentAuth.split(";")
    for (part in parts) {
        if (part.startsWith("transactionHash=")) {
            return part.substringAfter("transactionHash=")
        }
    }
    throw IllegalArgumentException("No transaction hash found in payment authorization")
}
```

### 5. Main Application

```kotlin
// src/main/kotlin/com/example/Application.kt
package com.example

import com.example.plugins.X402Config
import com.example.plugins.configureRouting
import com.example.service.PaymentVerificationService
import io.ktor.client.*
import io.ktor.client.engine.cio.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.contentnegotiation.*
import kotlinx.serialization.json.Json

fun main() {
    embeddedServer(
        Netty,
        port = 8080,
        host = "0.0.0.0",
        module = Application::module
    ).start(wait = true)
}

fun Application.module() {
    // Configure JSON serialization
    install(ContentNegotiation) {
        json(Json {
            prettyPrint = true
            isLenient = true
            ignoreUnknownKeys = true
        })
    }

    // Load configuration from environment
    val config = X402Config().apply {
        paymentAddress = environment.config.property("x402.payment.address").getString()
        tokenMint = environment.config.property("x402.token.mint").getString()
        network = environment.config.propertyOrNull("x402.network")?.getString()
            ?: "solana-devnet"
        rpcUrl = environment.config.propertyOrNull("solana.rpc.url")?.getString()
            ?: "https://api.devnet.solana.com"
    }

    // Create HTTP client for RPC calls
    val httpClient = HttpClient(CIO) {
        install(io.ktor.client.plugins.contentnegotiation.ContentNegotiation) {
            json()
        }
    }

    // Create payment verification service
    val paymentService = PaymentVerificationService(
        rpcUrl = config.rpcUrl,
        paymentAddress = config.paymentAddress,
        tokenMint = config.tokenMint,
        httpClient = httpClient
    )

    // Configure routing
    configureRouting(paymentService, config)
}
```

### 6. Application Configuration

```hocon
# src/main/resources/application.conf
ktor {
    deployment {
        port = 8080
        host = "0.0.0.0"
    }

    application {
        modules = [ com.example.ApplicationKt.module ]
    }
}

# Solana Configuration
solana {
    rpc {
        url = "https://api.devnet.solana.com"
        url = ${?SOLANA_RPC_URL}
    }
}

# X402 Configuration
x402 {
    payment {
        address = "YOUR_WALLET_ADDRESS"
        address = ${?X402_PAYMENT_ADDRESS}
    }

    token {
        mint = "USDC_MINT_ADDRESS_DEVNET"
        mint = ${?X402_TOKEN_MINT}
    }

    network = "solana-devnet"
    network = ${?X402_NETWORK}
}
```

## Running the Server

```bash
# Using Gradle
./gradlew run

# Or build and run JAR
./gradlew shadowJar
java -jar build/libs/x402-server-all.jar
```

The server will start on `http://localhost:8080`.

## Testing the Server

### Test Free Endpoint

```bash
curl http://localhost:8080/api/free-data
```

**Response:**
```json
{
  "message": "This is free data",
  "timestamp": 1699545600000
}
```

### Test Premium Endpoint (No Payment)

```bash
curl -i http://localhost:8080/api/premium-data
```

**Response:**
```
HTTP/1.1 402 Payment Required
X-Payment-Required: true
X-Payment-Protocol: x402

{
  "maxAmountRequired": "0.10",
  "assetType": "SPL",
  "assetAddress": "USDC_MINT_ADDRESS",
  "paymentAddress": "YOUR_WALLET_ADDRESS",
  "network": "solana-devnet",
  "expiresAt": "2025-11-10T17:00:00Z",
  "nonce": "...",
  "paymentId": "...",
  "resource": "/api/premium-data",
  "description": "Access to premium market data"
}
```

### Test Premium Endpoint (With Payment)

```bash
curl -H "X-Payment-Authorization: transactionHash=TX_HASH_HERE" \
  http://localhost:8080/api/premium-data
```

**Response:**
```json
{
  "data": "Premium content",
  "price": 100.50,
  "timestamp": 1699545600000,
  "paymentVerified": true
}
```

## Spring Boot Alternative

### Build Configuration

```kotlin
// build.gradle.kts
plugins {
    kotlin("jvm") version "1.9.20"
    kotlin("plugin.spring") version "1.9.20"
    id("org.springframework.boot") version "3.1.5"
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-webflux")
    implementation("xyz.openlib:openlibx402-core-kotlin:0.1.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-reactor")
}
```

### Controller Example

```kotlin
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api")
class PremiumDataController(
    private val paymentService: PaymentVerificationService,
    private val config: X402Config
) {

    @GetMapping("/premium-data")
    suspend fun getPremiumData(
        @RequestHeader("X-Payment-Authorization", required = false)
        paymentAuth: String?
    ): ResponseEntity<Any> {

        if (paymentAuth.isNullOrEmpty()) {
            val paymentRequest = PaymentRequest.create(
                amount = "0.10",
                paymentAddress = config.paymentAddress,
                tokenMint = config.tokenMint,
                network = config.network,
                resource = "/api/premium-data",
                description = "Access to premium market data"
            )

            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED)
                .header("X-Payment-Required", "true")
                .header("X-Payment-Protocol", "x402")
                .body(paymentRequest)
        }

        val txHash = extractTransactionHash(paymentAuth)
        val isValid = paymentService.verifyPayment(txHash, "0.10", config.paymentAddress)

        return if (isValid) {
            ResponseEntity.ok(
                PremiumData(
                    data = "Premium content",
                    price = 100.50,
                    timestamp = System.currentTimeMillis(),
                    paymentVerified = true
                )
            )
        } else {
            ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED)
                .body(ErrorResponse("Payment verification failed"))
        }
    }
}
```

## Best Practices

### 1. Use Coroutines for Async Operations

```kotlin
// Good: Suspending function for payment verification
suspend fun verifyPayment(txHash: String): Boolean = withContext(Dispatchers.IO) {
    httpClient.post(rpcUrl) {
        // ...
    }
}

// Bad: Blocking call
fun verifyPayment(txHash: String): Boolean {
    runBlocking {
        // ...
    }
}
```

### 2. Implement Payment Caching

```kotlin
class CachedPaymentService(
    private val paymentService: PaymentVerificationService
) {
    private val cache = mutableMapOf<String, Boolean>()

    suspend fun verifyPayment(txHash: String): Boolean {
        return cache.getOrPut(txHash) {
            paymentService.verifyPayment(txHash, "0.10", paymentAddress)
        }
    }
}
```

### 3. Handle Errors Gracefully

```kotlin
try {
    val isValid = paymentService.verifyPayment(txHash, amount, address)
    if (!isValid) {
        call.respond(HttpStatusCode.PaymentRequired, ErrorResponse("Payment verification failed"))
    }
} catch (e: Exception) {
    logger.error("Payment verification error", e)
    call.respond(HttpStatusCode.InternalServerError, ErrorResponse("Internal error"))
}
```

## Next Steps

- **Learn about client usage:** [Client Quickstart](client-quickstart.md)
- **Explore API reference:** [API Reference](../reference/api-reference.md)
- **Understand error handling:** [Error Reference](../reference/errors.md)
- **See complete examples:** [Examples](../examples/basic-usage.md)

## See Also

- [Java Server Quickstart](../../java/getting-started/server-quickstart.md) - Java implementation
- [Go Server Quickstart](../../go/getting-started/server-quickstart.md) - Go implementation with middleware
- [Python FastAPI Guide](../../packages/python/openlibx402-fastapi.md) - Python server implementation
- [TypeScript Express Guide](../../packages/typescript/openlibx402-express.md) - TypeScript server implementation
