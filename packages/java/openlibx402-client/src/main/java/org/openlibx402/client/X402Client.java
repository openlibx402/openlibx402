package org.openlibx402.client;

import okhttp3.*;
import org.openlibx402.core.blockchain.SolanaPaymentProcessor;
import org.openlibx402.core.errors.InvalidPaymentRequestError;
import org.openlibx402.core.errors.PaymentExpiredError;
import org.openlibx402.core.errors.PaymentRequiredError;
import org.openlibx402.core.errors.X402Error;
import org.openlibx402.core.models.PaymentAuthorization;
import org.openlibx402.core.models.PaymentRequest;
import org.p2p.solanaj.core.Account;

import java.io.IOException;
import java.net.InetAddress;
import java.net.URL;
import java.util.concurrent.TimeUnit;

/**
 * HTTP client with manual X402 payment control.
 * <p>
 * This client provides explicit control over the payment flow. When a 402 response
 * is received, the developer must manually parse the payment request, create a payment,
 * and retry the request with authorization.
 * </p>
 *
 * <p><strong>Security Warning:</strong> By default, this client blocks requests to
 * localhost and private IP addresses to prevent SSRF attacks. Set {@code allowLocal=true}
 * only for development and testing. Never use {@code allowLocal=true} in production.</p>
 *
 * <p><strong>Example Usage:</strong></p>
 * <pre>{@code
 * Account account = new Account(secretKey);
 * X402Client client = new X402Client(account, "https://api.devnet.solana.com", true);
 *
 * try {
 *     Response response = client.get("https://api.example.com/data");
 *     System.out.println(response.body().string());
 * } catch (PaymentRequiredError e) {
 *     PaymentRequest request = e.getPaymentRequest();
 *     PaymentAuthorization auth = client.createPayment(request, null);
 *     Response retryResponse = client.get("https://api.example.com/data", auth);
 *     System.out.println(retryResponse.body().string());
 * } finally {
 *     client.close();
 * }
 * }</pre>
 */
public class X402Client implements AutoCloseable {
    private static final String PAYMENT_AUTH_HEADER = "X-Payment-Authorization";
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");

    private final Account walletAccount;
    private final SolanaPaymentProcessor processor;
    private final OkHttpClient httpClient;
    private final boolean allowLocal;
    private boolean closed = false;

    /**
     * Creates a new X402Client with default settings.
     *
     * @param walletAccount Solana account for signing transactions
     */
    public X402Client(Account walletAccount) {
        this(walletAccount, null, null, false);
    }

    /**
     * Creates a new X402Client with custom RPC URL.
     *
     * @param walletAccount Solana account for signing transactions
     * @param rpcUrl Solana RPC endpoint (null for default devnet)
     * @param allowLocal Allow localhost URLs for development (default: false)
     */
    public X402Client(Account walletAccount, String rpcUrl, boolean allowLocal) {
        this(walletAccount, rpcUrl, null, allowLocal);
    }

    /**
     * Creates a new X402Client with all custom settings.
     *
     * @param walletAccount Solana account for signing transactions
     * @param rpcUrl Solana RPC endpoint (null for default devnet)
     * @param httpClient Custom OkHttp client (null for default)
     * @param allowLocal Allow localhost URLs for development (default: false)
     */
    public X402Client(Account walletAccount, String rpcUrl, OkHttpClient httpClient, boolean allowLocal) {
        this.walletAccount = walletAccount;
        this.processor = new SolanaPaymentProcessor(rpcUrl);
        this.httpClient = httpClient != null ? httpClient : createDefaultHttpClient();
        this.allowLocal = allowLocal;
    }

    /**
     * Performs a GET request.
     *
     * @param url Target URL
     * @return HTTP response
     * @throws IOException if request fails
     * @throws PaymentRequiredError if 402 response received
     * @throws X402Error if other payment-related errors occur
     */
    public Response get(String url) throws IOException, X402Error {
        return get(url, null);
    }

    /**
     * Performs a GET request with payment authorization.
     *
     * @param url Target URL
     * @param payment Optional payment authorization
     * @return HTTP response
     * @throws IOException if request fails
     * @throws PaymentRequiredError if 402 response received
     * @throws X402Error if other payment-related errors occur
     */
    public Response get(String url, PaymentAuthorization payment) throws IOException, X402Error {
        return request("GET", url, null, payment);
    }

    /**
     * Performs a POST request.
     *
     * @param url Target URL
     * @param body Request body (JSON string, can be null)
     * @return HTTP response
     * @throws IOException if request fails
     * @throws PaymentRequiredError if 402 response received
     * @throws X402Error if other payment-related errors occur
     */
    public Response post(String url, String body) throws IOException, X402Error {
        return post(url, body, null);
    }

    /**
     * Performs a POST request with payment authorization.
     *
     * @param url Target URL
     * @param body Request body (JSON string, can be null)
     * @param payment Optional payment authorization
     * @return HTTP response
     * @throws IOException if request fails
     * @throws PaymentRequiredError if 402 response received
     * @throws X402Error if other payment-related errors occur
     */
    public Response post(String url, String body, PaymentAuthorization payment) throws IOException, X402Error {
        return request("POST", url, body, payment);
    }

    /**
     * Performs a PUT request.
     *
     * @param url Target URL
     * @param body Request body (JSON string, can be null)
     * @return HTTP response
     * @throws IOException if request fails
     * @throws PaymentRequiredError if 402 response received
     * @throws X402Error if other payment-related errors occur
     */
    public Response put(String url, String body) throws IOException, X402Error {
        return put(url, body, null);
    }

    /**
     * Performs a PUT request with payment authorization.
     *
     * @param url Target URL
     * @param body Request body (JSON string, can be null)
     * @param payment Optional payment authorization
     * @return HTTP response
     * @throws IOException if request fails
     * @throws PaymentRequiredError if 402 response received
     * @throws X402Error if other payment-related errors occur
     */
    public Response put(String url, String body, PaymentAuthorization payment) throws IOException, X402Error {
        return request("PUT", url, body, payment);
    }

    /**
     * Performs a DELETE request.
     *
     * @param url Target URL
     * @return HTTP response
     * @throws IOException if request fails
     * @throws PaymentRequiredError if 402 response received
     * @throws X402Error if other payment-related errors occur
     */
    public Response delete(String url) throws IOException, X402Error {
        return delete(url, null);
    }

    /**
     * Performs a DELETE request with payment authorization.
     *
     * @param url Target URL
     * @param payment Optional payment authorization
     * @return HTTP response
     * @throws IOException if request fails
     * @throws PaymentRequiredError if 402 response received
     * @throws X402Error if other payment-related errors occur
     */
    public Response delete(String url, PaymentAuthorization payment) throws IOException, X402Error {
        return request("DELETE", url, null, payment);
    }

    /**
     * Performs an HTTP request.
     *
     * @param method HTTP method
     * @param url Target URL
     * @param body Request body (for POST/PUT)
     * @param payment Optional payment authorization
     * @return HTTP response
     * @throws IOException if request fails
     * @throws PaymentRequiredError if 402 response received
     * @throws X402Error if other payment-related errors occur
     */
    public Response request(String method, String url, String body, PaymentAuthorization payment)
            throws IOException, X402Error {
        checkNotClosed();
        validateUrl(url);

        Request.Builder requestBuilder = new Request.Builder().url(url);

        // Add payment authorization header if provided
        if (payment != null) {
            requestBuilder.addHeader(PAYMENT_AUTH_HEADER, payment.toHeaderValue());
        }

        // Build request body
        RequestBody requestBody = null;
        if (body != null && (method.equals("POST") || method.equals("PUT"))) {
            requestBody = RequestBody.create(body, JSON);
        } else if (method.equals("POST") || method.equals("PUT")) {
            requestBody = RequestBody.create("", null);
        }

        requestBuilder.method(method, requestBody);

        Request request = requestBuilder.build();
        Response response = httpClient.newCall(request).execute();

        // Check for 402 Payment Required
        if (response.code() == 402) {
            PaymentRequest paymentRequest = parsePaymentRequest(response);
            throw new PaymentRequiredError(paymentRequest);
        }

        return response;
    }

    /**
     * Checks if a response indicates payment is required.
     *
     * @param response HTTP response
     * @return true if 402 status code, false otherwise
     */
    public boolean paymentRequired(Response response) {
        return response.code() == 402;
    }

    /**
     * Parses a payment request from a 402 response.
     *
     * @param response 402 HTTP response
     * @return Parsed PaymentRequest
     * @throws InvalidPaymentRequestError if response body is invalid
     * @throws PaymentExpiredError if payment request has expired
     */
    public PaymentRequest parsePaymentRequest(Response response) throws InvalidPaymentRequestError, PaymentExpiredError {
        try {
            ResponseBody responseBody = response.body();
            if (responseBody == null) {
                throw new InvalidPaymentRequestError("Response body is empty");
            }

            String json = responseBody.string();
            PaymentRequest request = PaymentRequest.fromJson(json);

            // Check if expired
            if (request.isExpired()) {
                throw new PaymentExpiredError(request);
            }

            return request;
        } catch (IOException e) {
            throw new InvalidPaymentRequestError("Failed to read response body", e);
        } catch (IllegalArgumentException e) {
            throw new InvalidPaymentRequestError("Invalid JSON format", e);
        }
    }

    /**
     * Creates a payment for a payment request.
     *
     * @param request Payment request
     * @param amount Optional specific amount (uses max if null)
     * @return Payment authorization
     * @throws X402Error if payment creation fails
     */
    public PaymentAuthorization createPayment(PaymentRequest request, String amount) throws X402Error {
        checkNotClosed();

        // Check if expired
        if (request.isExpired()) {
            throw new PaymentExpiredError(request);
        }

        return processor.createPayment(request, walletAccount, amount);
    }

    /**
     * Validates a URL for SSRF protection.
     *
     * @param urlString URL to validate
     * @throws IllegalArgumentException if URL is invalid or blocked
     */
    private void validateUrl(String urlString) {
        try {
            URL url = new URL(urlString);

            // Only allow http/https
            String protocol = url.getProtocol().toLowerCase();
            if (!protocol.equals("http") && !protocol.equals("https")) {
                throw new IllegalArgumentException("Only HTTP and HTTPS protocols are allowed");
            }

            // Block localhost and private IPs if allowLocal is false
            if (!allowLocal) {
                String host = url.getHost().toLowerCase();

                // Block localhost
                if (host.equals("localhost") || host.equals("127.0.0.1") || host.equals("::1")) {
                    throw new IllegalArgumentException(
                            "Requests to localhost are blocked for security. Set allowLocal=true for development."
                    );
                }

                // Block private IP ranges
                InetAddress address = InetAddress.getByName(host);
                if (address.isSiteLocalAddress() || address.isLoopbackAddress()) {
                    throw new IllegalArgumentException(
                            "Requests to private IP addresses are blocked for security. Set allowLocal=true for development."
                    );
                }
            }

        } catch (IOException e) {
            throw new IllegalArgumentException("Invalid URL: " + e.getMessage(), e);
        }
    }

    /**
     * Creates a default OkHttp client with reasonable timeouts.
     *
     * @return Configured OkHttpClient
     */
    private static OkHttpClient createDefaultHttpClient() {
        return new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .build();
    }

    /**
     * Gets the Solana payment processor.
     *
     * @return SolanaPaymentProcessor instance
     */
    public SolanaPaymentProcessor getProcessor() {
        return processor;
    }

    /**
     * Checks if allowLocal is enabled.
     *
     * @return true if localhost is allowed, false otherwise
     */
    public boolean isAllowLocal() {
        return allowLocal;
    }

    /**
     * Checks if this client has been closed.
     */
    private void checkNotClosed() {
        if (closed) {
            throw new IllegalStateException("X402Client has been closed");
        }
    }

    @Override
    public void close() {
        if (!closed) {
            processor.close();
            // Note: OkHttpClient doesn't need explicit closing in most cases
            // but you can call shutdown on executor/connection pool if needed
            closed = true;
        }
    }

    /**
     * Checks if this client is closed.
     *
     * @return true if closed, false otherwise
     */
    public boolean isClosed() {
        return closed;
    }
}
