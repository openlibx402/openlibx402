package org.openlibx402.examples

import kotlinx.coroutines.runBlocking
import okhttp3.Response
import org.openlibx402.client.X402AutoClient
import org.openlibx402.client.X402Client
import org.openlibx402.core.errors.X402Error
import org.p2p.solanaj.core.Account

/**
 * Simple example demonstrating OpenLibX402 Kotlin SDK usage.
 *
 * This example shows both manual (X402Client) and automatic (X402AutoClient)
 * payment handling approaches using Kotlin coroutines.
 */

fun main() = runBlocking {
    println("OpenLibX402 Kotlin SDK Example")
    println("==============================\n")

    // Example 1: Manual Payment Handling
    println("Example 1: Manual Payment Handling (X402Client)")
    manualPaymentExample()

    println("\n" + "=".repeat(50) + "\n")

    // Example 2: Automatic Payment Handling
    println("Example 2: Automatic Payment Handling (X402AutoClient)")
    automaticPaymentExample()
}

/**
 * Demonstrates manual payment control with X402Client using suspend functions.
 * Developer explicitly handles 402 responses and creates payments.
 */
suspend fun manualPaymentExample() {
    // Create Solana account (in production, load from secure storage)
    val secretKey = loadSecretKey()
    val account = Account(secretKey)

    // Create X402Client with manual payment control
    val client = X402Client(
        walletAccount = account,
        rpcUrl = "https://api.devnet.solana.com",
        allowLocal = true  // Allow localhost for development
    )

    client.use {
        val url = "https://api.example.com/premium-data"
        println("Making initial request to: $url")

        try {
            // Make initial request (suspend function)
            val response = it.get(url)
            println("Response: ${response.code}")
            println("Body: ${response.body?.string()}")

        } catch (e: X402Error.PaymentRequired) {
            println("Payment required!")

            // Get payment request details
            val request = e.paymentRequest
            println("Amount required: ${request.maxAmountRequired}")
            println("Payment address: ${request.paymentAddress}")
            println("Asset: ${request.assetType}")
            println("Expires at: ${request.expiresAt}")

            try {
                // Create payment (suspend function)
                println("\nCreating payment...")
                val auth = it.createPayment(request)
                println("Payment created!")
                println("Transaction signature: ${auth.signature}")

                // Retry request with payment authorization
                println("\nRetrying request with payment...")
                val retryResponse = it.get(url, auth)
                println("Success! Response: ${retryResponse.code}")
                println("Body: ${retryResponse.body?.string()}")

            } catch (ex: X402Error) {
                System.err.println("Payment failed: ${ex.message}")
            }

        } catch (e: X402Error) {
            System.err.println("Request failed: ${e.message}")
        }
    }
}

/**
 * Demonstrates automatic payment handling with X402AutoClient using coroutines.
 * Client automatically detects 402 responses and handles payments.
 */
suspend fun automaticPaymentExample() {
    // Create Solana account
    val secretKey = loadSecretKey()
    val account = Account(secretKey)

    // Build auto client with DSL configuration
    val client = X402AutoClient(account) {
        rpcUrl = "https://api.devnet.solana.com"
        maxPaymentAmount = "5.0"  // Safety limit: max 5 tokens per payment
        maxRetries = 2            // Retry up to 2 times
        allowLocal = true         // Allow localhost for development
    }

    client.use {
        val url = "https://api.example.com/premium-data"
        println("Making request to: $url")
        println("(Payments will be handled automatically)")

        try {
            // Make request - payments handled automatically! (suspend function)
            val response = it.get(url)
            println("\nSuccess! Response: ${response.code}")
            println("Body: ${response.body?.string()}")

        } catch (e: X402Error) {
            System.err.println("Request failed: ${e.message}")
            System.err.println("Error code: ${e.code}")
            System.err.println("Details: ${e.details}")
        }
    }
}

/**
 * Loads Solana secret key from environment or configuration.
 * In production, use secure key management systems.
 *
 * @return Secret key bytes
 */
fun loadSecretKey(): ByteArray {
    // For demo purposes, return dummy key
    // In production:
    // - Load from environment variable
    // - Use hardware wallet
    // - Load from secure key vault
    // - Use key derivation from mnemonic

    val secretKeyEnv = System.getenv("SOLANA_SECRET_KEY")
    if (secretKeyEnv != null) {
        // Parse from base58 or JSON array format
        // return Base58.decode(secretKeyEnv)
    }

    // Demo: Create new random account
    println("⚠️  Using random account for demo purposes")
    println("⚠️  In production, load from secure storage!\n")
    val demoAccount = Account()
    return demoAccount.secretKey
}

/**
 * Additional example: Type-safe error handling with sealed classes
 */
@Suppress("unused")
suspend fun errorHandlingExample() {
    val secretKey = loadSecretKey()
    val account = Account(secretKey)
    val client = X402Client(account, allowLocal = true)

    client.use {
        try {
            val response = it.get("https://api.example.com/data")
            // Process response
        } catch (e: X402Error) {
            // Exhaustive when expression with sealed class
            when (e) {
                is X402Error.PaymentRequired -> {
                    println("Payment required")
                    val request = e.paymentRequest
                    // Process payment...
                }
                is X402Error.InsufficientFunds -> {
                    println("Insufficient funds!")
                    println("Required: ${e.requiredAmount}")
                    println("Available: ${e.availableAmount}")
                }
                is X402Error.PaymentExpired -> {
                    println("Payment request expired")
                    val request = e.paymentRequest
                }
                is X402Error.PaymentVerificationFailed -> {
                    println("Payment verification failed: ${e.reason}")
                }
                is X402Error.TransactionBroadcastFailed -> {
                    println("Transaction broadcast failed: ${e.reason}")
                }
                is X402Error.InvalidPaymentRequest -> {
                    println("Invalid payment request: ${e.reason}")
                }
                is X402Error.Generic -> {
                    println("Payment error: ${e.code}")
                }
            }
        }
    }
}

/**
 * Example: Using coroutine scope for concurrent requests
 */
@Suppress("unused")
suspend fun concurrentRequestsExample() {
    val account = Account(loadSecretKey())
    val client = X402AutoClient(account) {
        rpcUrl = "https://api.devnet.solana.com"
        maxPaymentAmount = "5.0"
    }

    client.use {
        kotlinx.coroutines.coroutineScope {
            // Launch multiple requests concurrently
            val deferred1 = kotlinx.coroutines.async {
                it.get("https://api.example.com/data1")
            }

            val deferred2 = kotlinx.coroutines.async {
                it.get("https://api.example.com/data2")
            }

            // Wait for all requests to complete
            val response1 = deferred1.await()
            val response2 = deferred2.await()

            println("Response 1: ${response1.code}")
            println("Response 2: ${response2.code}")
        }
    }
}

/**
 * Example: Extension function for payment requests
 */
fun org.openlibx402.core.models.PaymentRequest.isAffordable(balance: Double): Boolean =
    balance >= maxAmountRequired.toDouble()

/**
 * Example: Using data class destructuring
 */
@Suppress("unused")
fun paymentRequestExample() {
    val request = org.openlibx402.core.models.PaymentRequest(
        maxAmountRequired = "0.10",
        assetType = "SPL",
        assetAddress = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        paymentAddress = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
        network = "solana-devnet",
        expiresAt = kotlinx.datetime.Clock.System.now() + kotlin.time.Duration.parse("5m"),
        nonce = "unique-nonce",
        paymentId = "pay_123",
        resource = "/api/data"
    )

    // Data class destructuring
    val (amount, assetType, address) = request
    println("Amount: $amount, Asset: $assetType, Address: $address")

    // Immutable copy with changes
    val updated = request.copy(maxAmountRequired = "0.20")
    println("Updated amount: ${updated.maxAmountRequired}")
}
