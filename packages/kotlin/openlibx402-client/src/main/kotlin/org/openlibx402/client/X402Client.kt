package org.openlibx402.client

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.openlibx402.core.blockchain.SolanaPaymentProcessor
import org.openlibx402.core.errors.X402Error
import org.openlibx402.core.models.PaymentAuthorization
import org.openlibx402.core.models.PaymentRequest
import org.p2p.solanaj.core.Account
import java.io.Closeable
import java.io.IOException
import java.net.InetAddress
import java.net.URL
import java.util.concurrent.TimeUnit

/**
 * HTTP client with manual X402 payment control using coroutines.
 *
 * This client provides explicit control over the payment flow. When a 402 response
 * is received, the developer must manually parse the payment request, create a payment,
 * and retry the request with authorization.
 *
 * All HTTP operations are suspend functions that run on the IO dispatcher.
 *
 * **Security Warning:** By default, this client blocks requests to localhost and
 * private IP addresses to prevent SSRF attacks. Set [allowLocal] to true only for
 * development and testing. Never use `allowLocal=true` in production.
 *
 * **Example Usage:**
 * ```kotlin
 * val account = Account(secretKey)
 * val client = X402Client(account, "https://api.devnet.solana.com", allowLocal = true)
 *
 * try {
 *     val response = client.get("https://api.example.com/data")
 *     println(response.body?.string())
 * } catch (e: X402Error.PaymentRequired) {
 *     val request = e.paymentRequest
 *     val auth = client.createPayment(request)
 *     val retryResponse = client.get("https://api.example.com/data", auth)
 *     println(retryResponse.body?.string())
 * } finally {
 *     client.close()
 * }
 * ```
 *
 * @property walletAccount Solana account for signing transactions
 * @property rpcUrl Solana RPC endpoint (null for default devnet)
 * @property httpClient Custom OkHttp client (null for default)
 * @property allowLocal Allow localhost URLs for development (default: false)
 */
class X402Client(
    private val walletAccount: Account,
    rpcUrl: String? = null,
    private val httpClient: OkHttpClient = createDefaultHttpClient(),
    private val allowLocal: Boolean = false
) : Closeable {

    internal val processor = SolanaPaymentProcessor(rpcUrl ?: "https://api.devnet.solana.com")
    private var closed = false

    /**
     * Performs a GET request.
     *
     * @param url Target URL
     * @param payment Optional payment authorization
     * @return HTTP response
     * @throws IOException if request fails
     * @throws X402Error.PaymentRequired if 402 response received
     */
    suspend fun get(url: String, payment: PaymentAuthorization? = null): Response =
        request("GET", url, null, payment)

    /**
     * Performs a POST request.
     *
     * @param url Target URL
     * @param body Request body (JSON string, can be null)
     * @param payment Optional payment authorization
     * @return HTTP response
     * @throws IOException if request fails
     * @throws X402Error.PaymentRequired if 402 response received
     */
    suspend fun post(url: String, body: String? = null, payment: PaymentAuthorization? = null): Response =
        request("POST", url, body, payment)

    /**
     * Performs a PUT request.
     *
     * @param url Target URL
     * @param body Request body (JSON string, can be null)
     * @param payment Optional payment authorization
     * @return HTTP response
     * @throws IOException if request fails
     * @throws X402Error.PaymentRequired if 402 response received
     */
    suspend fun put(url: String, body: String? = null, payment: PaymentAuthorization? = null): Response =
        request("PUT", url, body, payment)

    /**
     * Performs a DELETE request.
     *
     * @param url Target URL
     * @param payment Optional payment authorization
     * @return HTTP response
     * @throws IOException if request fails
     * @throws X402Error.PaymentRequired if 402 response received
     */
    suspend fun delete(url: String, payment: PaymentAuthorization? = null): Response =
        request("DELETE", url, null, payment)

    /**
     * Performs an HTTP request.
     *
     * @param method HTTP method
     * @param url Target URL
     * @param body Request body (for POST/PUT)
     * @param payment Optional payment authorization
     * @return HTTP response
     * @throws IOException if request fails
     * @throws X402Error.PaymentRequired if 402 response received
     */
    suspend fun request(
        method: String,
        url: String,
        body: String? = null,
        payment: PaymentAuthorization? = null
    ): Response = withContext(Dispatchers.IO) {
        checkNotClosed()
        validateUrl(url)

        val requestBuilder = Request.Builder().url(url)

        // Add payment authorization header if provided
        payment?.let {
            requestBuilder.addHeader(PAYMENT_AUTH_HEADER, it.toHeaderValue())
        }

        // Build request body
        val requestBody = when {
            body != null && (method == "POST" || method == "PUT") ->
                body.toRequestBody(JSON)
            method == "POST" || method == "PUT" ->
                "".toRequestBody(null)
            else -> null
        }

        requestBuilder.method(method, requestBody)

        val request = requestBuilder.build()
        val response = httpClient.newCall(request).execute()

        // Check for 402 Payment Required
        if (response.code == 402) {
            val paymentRequest = parsePaymentRequest(response)
            throw X402Error.PaymentRequired(paymentRequest)
        }

        response
    }

    /**
     * Checks if a response indicates payment is required.
     *
     * @param response HTTP response
     * @return true if 402 status code, false otherwise
     */
    fun paymentRequired(response: Response): Boolean = response.code == 402

    /**
     * Parses a payment request from a 402 response.
     *
     * @param response 402 HTTP response
     * @return Parsed PaymentRequest
     * @throws X402Error.InvalidPaymentRequest if response body is invalid
     */
    fun parsePaymentRequest(response: Response): PaymentRequest {
        val responseBody = response.body
            ?: throw X402Error.InvalidPaymentRequest("Response body is empty")

        val json = responseBody.string()
        val request = try {
            PaymentRequest.fromJson(json)
        } catch (e: IllegalArgumentException) {
            throw X402Error.InvalidPaymentRequest("Invalid JSON format", cause = e)
        }

        // Check if expired
        if (request.isExpired()) {
            throw X402Error.PaymentExpired(request)
        }

        return request
    }

    /**
     * Creates a payment for a payment request.
     *
     * @param request Payment request
     * @param amount Optional specific amount (uses max if null)
     * @return Payment authorization
     * @throws X402Error if payment creation fails
     */
    suspend fun createPayment(
        request: PaymentRequest,
        amount: String? = null
    ): PaymentAuthorization {
        checkNotClosed()

        // Check if expired
        if (request.isExpired()) {
            throw X402Error.PaymentExpired(request)
        }

        return processor.createPayment(request, walletAccount, amount)
    }

    /**
     * Validates a URL for SSRF protection.
     *
     * @param urlString URL to validate
     * @throws IllegalArgumentException if URL is invalid or blocked
     */
    private fun validateUrl(urlString: String) {
        val url = try {
            URL(urlString)
        } catch (e: Exception) {
            throw IllegalArgumentException("Invalid URL: ${e.message}", e)
        }

        // Only allow http/https
        val protocol = url.protocol.lowercase()
        require(protocol == "http" || protocol == "https") {
            "Only HTTP and HTTPS protocols are allowed"
        }

        // Block localhost and private IPs if allowLocal is false
        if (!allowLocal) {
            val host = url.host.lowercase()

            // Block localhost
            require(host !in setOf("localhost", "127.0.0.1", "::1")) {
                "Requests to localhost are blocked for security. Set allowLocal=true for development."
            }

            // Block private IP ranges
            val address = try {
                InetAddress.getByName(host)
            } catch (e: Exception) {
                throw IllegalArgumentException("Could not resolve host: ${e.message}", e)
            }

            require(!address.isSiteLocalAddress && !address.isLoopbackAddress) {
                "Requests to private IP addresses are blocked for security. Set allowLocal=true for development."
            }
        }
    }

    /**
     * Checks if this client has been closed.
     */
    private fun checkNotClosed() {
        check(!closed) { "X402Client has been closed" }
    }

    override fun close() {
        if (!closed) {
            processor.close()
            // Note: OkHttpClient doesn't need explicit closing in most cases
            closed = true
        }
    }

    /**
     * Checks if this client is closed.
     *
     * @return true if closed, false otherwise
     */
    fun isClosed(): Boolean = closed

    companion object {
        private const val PAYMENT_AUTH_HEADER = "X-Payment-Authorization"
        private val JSON = "application/json; charset=utf-8".toMediaType()

        /**
         * Creates a default OkHttp client with reasonable timeouts.
         *
         * @return Configured OkHttpClient
         */
        private fun createDefaultHttpClient(): OkHttpClient =
            OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .build()
    }
}
