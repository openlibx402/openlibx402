package org.openlibx402.examples

import okhttp3.Response
import org.openlibx402.client.X402Client
import org.openlibx402.core.errors.PaymentRequiredError
import org.openlibx402.core.errors.X402Error
import org.openlibx402.core.models.PaymentAuthorization
import org.openlibx402.core.models.PaymentRequest
import org.p2p.solanaj.core.Account
import java.io.IOException

/**
 * Simple example demonstrating OpenLibX402 Kotlin SDK usage.
 *
 * This example shows manual payment handling with X402Client from Kotlin.
 * The SDK is Java-based with full Kotlin compatibility.
 */

fun main() {
    println("OpenLibX402 Kotlin SDK Example")
    println("==============================\n")

    // Example: Manual Payment Handling
    println("Example: Manual Payment Handling (X402Client)")
    manualPaymentExample()
}

/**
 * Demonstrates manual payment control with X402Client.
 * Developer explicitly handles 402 responses and creates payments.
 */
fun manualPaymentExample() {
    // Create Solana account (in production, load from secure storage)
    val secretKey = loadSecretKey()
    val account = Account(secretKey)

    // Create X402Client with manual payment control
    val client = X402Client(
        account,
        "https://api.devnet.solana.com",  // Solana RPC URL
        true  // allowLocal = true for development
    )

    val url = "https://api.example.com/premium-data"

    try {
        println("Making initial request to: $url")

        // Make initial request
        val response: Response = client.get(url)
        println("Response: ${response.code}")
        println("Body: ${response.body?.string()}")

    } catch (e: PaymentRequiredError) {
        println("Payment required!")

        // Get payment request details
        val request: PaymentRequest = e.paymentRequest
        println("Amount required: ${request.maxAmountRequired}")
        println("Payment address: ${request.paymentAddress}")
        println("Asset: ${request.assetType}")
        println("Expires at: ${request.expiresAt}")

        try {
            // Create payment
            println("\nCreating payment...")
            val auth: PaymentAuthorization = client.createPayment(request, null)
            println("Payment created!")
            println("Transaction signature: ${auth.signature}")

            // Retry request with payment authorization
            println("\nRetrying request with payment...")
            val paidResponse: Response = client.get(url, auth)
            println("Response: ${paidResponse.code}")
            println("Body: ${paidResponse.body?.string()}")

        } catch (ex: X402Error) {
            println("Error processing payment: ${ex.message}")
            ex.printStackTrace()
        } catch (ex: IOException) {
            println("Network error: ${ex.message}")
            ex.printStackTrace()
        }

    } catch (e: X402Error) {
        println("X402 Error: ${e.message}")
        e.printStackTrace()
    } catch (e: IOException) {
        println("Network error: ${e.message}")
        e.printStackTrace()
    } finally {
        try {
            client.close()
        } catch (e: IOException) {
            println("Error closing client: ${e.message}")
        }
    }

    println("\nExample completed!")
}

/**
 * Loads secret key for demonstration purposes.
 * In production, load from secure key storage!
 */
fun loadSecretKey(): ByteArray {
    // Example: Generate random key for demo
    // In production: Load from environment, key vault, or secure storage
    println("⚠️  WARNING: Using random key for demonstration!")
    println("⚠️  In production, load your actual Solana account key securely.\n")

    // Return a dummy 64-byte secret key
    return ByteArray(64) { it.toByte() }
}

/**
 * Additional Kotlin-friendly extensions and helpers
 */

/**
 * Extension function to make X402Client usage more Kotlin-idiomatic
 */
inline fun <T> X402Client.use(block: (X402Client) -> T): T {
    return try {
        block(this)
    } finally {
        this.close()
    }
}

/**
 * Example of Kotlin-style usage with extension
 */
fun kotlinStyleExample() {
    val account = Account(loadSecretKey())

    X402Client(account, "https://api.devnet.solana.com", true).use { client ->
        try {
            val response = client.get("https://api.example.com/data")
            println("Status: ${response.code}")
            println("Data: ${response.body?.string()}")
        } catch (e: PaymentRequiredError) {
            println("Payment required: ${e.paymentRequest.maxAmountRequired}")

            // Handle payment
            val auth = client.createPayment(e.paymentRequest, null)
            val paidResponse = client.get("https://api.example.com/data", auth)
            println("Paid response: ${paidResponse.body?.string()}")
        }
    }
}
