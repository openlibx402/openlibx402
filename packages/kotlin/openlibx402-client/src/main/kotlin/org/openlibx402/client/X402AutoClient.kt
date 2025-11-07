package org.openlibx402.client

import okhttp3.OkHttpClient
import okhttp3.Response
import org.openlibx402.core.blockchain.SolanaPaymentProcessor
import org.openlibx402.core.errors.X402Error
import org.openlibx402.core.models.PaymentAuthorization
import org.openlibx402.core.models.PaymentRequest
import org.p2p.solanaj.core.Account
import java.io.Closeable
import java.math.BigDecimal

/**
 * HTTP client with automatic X402 payment handling using coroutines.
 *
 * This client automatically detects 402 Payment Required responses, creates and submits
 * payments, and retries the original request. This provides a seamless experience for
 * applications that want to abstract away payment details.
 *
 * All HTTP operations are suspend functions that run on the IO dispatcher.
 *
 * **Security Warning:** This client will automatically spend from your wallet when
 * payments are required. Use [maxPaymentAmount] to set a spending limit. By default,
 * requests to localhost and private IPs are blocked. Set [allowLocal] to true only
 * for development.
 *
 * **Example Usage:**
 * ```kotlin
 * val account = Account(secretKey)
 * val client = X402AutoClient(
 *     walletAccount = account,
 *     rpcUrl = "https://api.devnet.solana.com",
 *     maxPaymentAmount = "1.0",
 *     maxRetries = 2,
 *     allowLocal = true
 * )
 *
 * try {
 *     val response = client.get("https://api.example.com/data")
 *     println(response.body?.string())
 * } finally {
 *     client.close()
 * }
 * ```
 *
 * @property baseClient Underlying X402Client
 * @property maxRetries Maximum number of retry attempts
 * @property autoRetry Enable automatic retry on payment required
 * @property maxPaymentAmount Safety spending limit (null for no limit)
 */
class X402AutoClient private constructor(
    private val baseClient: X402Client,
    private val maxRetries: Int,
    private val autoRetry: Boolean,
    private val maxPaymentAmount: String?
) : Closeable {

    private var closed = false

    /**
     * Performs a GET request with automatic payment handling.
     *
     * @param url Target URL
     * @return HTTP response (after auto-payment if needed)
     * @throws X402Error if payment fails or exceeds limits
     */
    suspend fun get(url: String): Response =
        requestWithAutoPayment("GET", url, null)

    /**
     * Performs a POST request with automatic payment handling.
     *
     * @param url Target URL
     * @param body Request body (JSON string, can be null)
     * @return HTTP response (after auto-payment if needed)
     * @throws X402Error if payment fails or exceeds limits
     */
    suspend fun post(url: String, body: String? = null): Response =
        requestWithAutoPayment("POST", url, body)

    /**
     * Performs a PUT request with automatic payment handling.
     *
     * @param url Target URL
     * @param body Request body (JSON string, can be null)
     * @return HTTP response (after auto-payment if needed)
     * @throws X402Error if payment fails or exceeds limits
     */
    suspend fun put(url: String, body: String? = null): Response =
        requestWithAutoPayment("PUT", url, body)

    /**
     * Performs a DELETE request with automatic payment handling.
     *
     * @param url Target URL
     * @return HTTP response (after auto-payment if needed)
     * @throws X402Error if payment fails or exceeds limits
     */
    suspend fun delete(url: String): Response =
        requestWithAutoPayment("DELETE", url, null)

    /**
     * Performs an HTTP request with automatic payment and retry logic.
     *
     * @param method HTTP method
     * @param url Target URL
     * @param body Request body (for POST/PUT)
     * @return HTTP response
     * @throws X402Error if payment fails or exceeds limits
     */
    private suspend fun requestWithAutoPayment(
        method: String,
        url: String,
        body: String?
    ): Response {
        checkNotClosed()

        var attempts = 0
        var payment: PaymentAuthorization? = null

        while (attempts <= maxRetries) {
            try {
                // Make request
                return baseClient.request(method, url, body, payment)

            } catch (e: X402Error.PaymentRequired) {
                // Check if auto-retry is enabled
                if (!autoRetry || attempts >= maxRetries) {
                    throw e
                }

                // Get payment request
                val request = e.paymentRequest

                // Check against max payment amount limit
                maxPaymentAmount?.let { limit ->
                    checkPaymentLimit(request.maxAmountRequired, limit)
                }

                // Create payment
                payment = baseClient.createPayment(request)

                // Increment attempts and retry
                attempts++
            }
        }

        throw X402Error.Generic(
            customCode = "MAX_RETRIES_EXCEEDED",
            message = "Max retries exceeded"
        )
    }

    /**
     * Checks if a payment amount exceeds the configured limit.
     *
     * @param requestedAmount Amount requested
     * @param limit Maximum allowed amount
     * @throws X402Error.Generic if limit exceeded
     */
    private fun checkPaymentLimit(requestedAmount: String, limit: String) {
        try {
            val requested = BigDecimal(requestedAmount)
            val max = BigDecimal(limit)

            if (requested > max) {
                throw X402Error.Generic(
                    customCode = "PAYMENT_LIMIT_EXCEEDED",
                    message = "Payment amount $requestedAmount exceeds limit $limit"
                )
            }
        } catch (e: NumberFormatException) {
            throw X402Error.Generic(
                customCode = "INVALID_AMOUNT",
                message = "Invalid payment amount format"
            )
        }
    }

    /**
     * Gets the payment processor.
     *
     * @return SolanaPaymentProcessor instance
     */
    fun getProcessor(): SolanaPaymentProcessor = baseClient.processor

    /**
     * Checks if this client has been closed.
     */
    private fun checkNotClosed() {
        check(!closed) { "X402AutoClient has been closed" }
    }

    override fun close() {
        if (!closed) {
            baseClient.close()
            closed = true
        }
    }

    /**
     * Checks if this client is closed.
     *
     * @return true if closed, false otherwise
     */
    fun isClosed(): Boolean = closed

    /**
     * Builder for creating X402AutoClient instances with idiomatic Kotlin DSL.
     *
     * @param walletAccount Solana account for signing transactions
     * @param builderAction DSL builder action
     * @return Configured X402AutoClient
     */
    companion object {
        /**
         * Creates a new X402AutoClient using DSL builder pattern.
         *
         * Example:
         * ```kotlin
         * val client = X402AutoClient(account) {
         *     rpcUrl = "https://api.devnet.solana.com"
         *     maxPaymentAmount = "1.0"
         *     maxRetries = 2
         *     allowLocal = true
         * }
         * ```
         */
        operator fun invoke(
            walletAccount: Account,
            builderAction: Builder.() -> Unit = {}
        ): X402AutoClient {
            val builder = Builder(walletAccount)
            builder.builderAction()
            return builder.build()
        }
    }

    /**
     * Builder class for creating X402AutoClient instances.
     *
     * @property walletAccount Solana account for signing transactions
     */
    class Builder(private val walletAccount: Account) {
        var rpcUrl: String? = null
        var httpClient: OkHttpClient? = null
        var allowLocal: Boolean = false
        var maxRetries: Int = 1
        var autoRetry: Boolean = true
        var maxPaymentAmount: String? = null

        /**
         * Builds the X402AutoClient.
         *
         * @return Configured X402AutoClient
         */
        fun build(): X402AutoClient {
            val baseClient = X402Client(
                walletAccount = walletAccount,
                rpcUrl = rpcUrl,
                httpClient = httpClient ?: OkHttpClient(),
                allowLocal = allowLocal
            )

            return X402AutoClient(
                baseClient = baseClient,
                maxRetries = maxRetries,
                autoRetry = autoRetry,
                maxPaymentAmount = maxPaymentAmount
            )
        }
    }
}

/**
 * Extension property to access the underlying base client.
 * Marked as internal to prevent external misuse.
 */
internal val X402AutoClient.baseClient: X402Client
    get() = this::class.java.getDeclaredField("baseClient")
        .also { it.isAccessible = true }
        .get(this) as X402Client
