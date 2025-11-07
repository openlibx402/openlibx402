package org.openlibx402.client;

import okhttp3.OkHttpClient;
import okhttp3.Response;
import org.openlibx402.core.blockchain.SolanaPaymentProcessor;
import org.openlibx402.core.errors.InsufficientFundsError;
import org.openlibx402.core.errors.PaymentRequiredError;
import org.openlibx402.core.errors.X402Error;
import org.openlibx402.core.models.PaymentAuthorization;
import org.openlibx402.core.models.PaymentRequest;
import org.p2p.solanaj.core.Account;

import java.io.IOException;
import java.math.BigDecimal;

/**
 * HTTP client with automatic X402 payment handling.
 * <p>
 * This client automatically detects 402 Payment Required responses, creates and submits
 * payments, and retries the original request. This provides a seamless experience for
 * applications that want to abstract away payment details.
 * </p>
 *
 * <p><strong>Security Warning:</strong> This client will automatically spend from your wallet
 * when payments are required. Use {@code maxPaymentAmount} to set a spending limit.
 * By default, requests to localhost and private IPs are blocked. Set {@code allowLocal=true}
 * only for development.</p>
 *
 * <p><strong>Example Usage:</strong></p>
 * <pre>{@code
 * Account account = new Account(secretKey);
 * X402AutoClient client = new X402AutoClient.Builder(account)
 *     .rpcUrl("https://api.devnet.solana.com")
 *     .maxPaymentAmount("1.0")
 *     .maxRetries(2)
 *     .allowLocal(true)
 *     .build();
 *
 * try {
 *     Response response = client.get("https://api.example.com/data");
 *     System.out.println(response.body().string());
 * } finally {
 *     client.close();
 * }
 * }</pre>
 */
public class X402AutoClient implements AutoCloseable {
    private final X402Client baseClient;
    private final int maxRetries;
    private final boolean autoRetry;
    private final String maxPaymentAmount;
    private boolean closed = false;

    /**
     * Private constructor - use Builder instead.
     */
    private X402AutoClient(
            Account walletAccount,
            String rpcUrl,
            OkHttpClient httpClient,
            boolean allowLocal,
            int maxRetries,
            boolean autoRetry,
            String maxPaymentAmount
    ) {
        this.baseClient = new X402Client(walletAccount, rpcUrl, httpClient, allowLocal);
        this.maxRetries = maxRetries;
        this.autoRetry = autoRetry;
        this.maxPaymentAmount = maxPaymentAmount;
    }

    /**
     * Performs a GET request with automatic payment handling.
     *
     * @param url Target URL
     * @return HTTP response (after auto-payment if needed)
     * @throws IOException if request fails
     * @throws X402Error if payment fails or exceeds limits
     */
    public Response get(String url) throws IOException, X402Error {
        return requestWithAutoPayment("GET", url, null);
    }

    /**
     * Performs a POST request with automatic payment handling.
     *
     * @param url Target URL
     * @param body Request body (JSON string, can be null)
     * @return HTTP response (after auto-payment if needed)
     * @throws IOException if request fails
     * @throws X402Error if payment fails or exceeds limits
     */
    public Response post(String url, String body) throws IOException, X402Error {
        return requestWithAutoPayment("POST", url, body);
    }

    /**
     * Performs a PUT request with automatic payment handling.
     *
     * @param url Target URL
     * @param body Request body (JSON string, can be null)
     * @return HTTP response (after auto-payment if needed)
     * @throws IOException if request fails
     * @throws X402Error if payment fails or exceeds limits
     */
    public Response put(String url, String body) throws IOException, X402Error {
        return requestWithAutoPayment("PUT", url, body);
    }

    /**
     * Performs a DELETE request with automatic payment handling.
     *
     * @param url Target URL
     * @return HTTP response (after auto-payment if needed)
     * @throws IOException if request fails
     * @throws X402Error if payment fails or exceeds limits
     */
    public Response delete(String url) throws IOException, X402Error {
        return requestWithAutoPayment("DELETE", url, null);
    }

    /**
     * Performs an HTTP request with automatic payment and retry logic.
     *
     * @param method HTTP method
     * @param url Target URL
     * @param body Request body (for POST/PUT)
     * @return HTTP response
     * @throws IOException if request fails
     * @throws X402Error if payment fails or exceeds limits
     */
    private Response requestWithAutoPayment(String method, String url, String body)
            throws IOException, X402Error {
        checkNotClosed();

        int attempts = 0;
        PaymentAuthorization payment = null;

        while (attempts <= maxRetries) {
            try {
                // Make request
                Response response = baseClient.request(method, url, body, payment);
                return response;

            } catch (PaymentRequiredError e) {
                // Check if auto-retry is enabled
                if (!autoRetry || attempts >= maxRetries) {
                    throw e;
                }

                // Get payment request
                PaymentRequest request = e.getPaymentRequest();

                // Check against max payment amount limit
                if (maxPaymentAmount != null) {
                    checkPaymentLimit(request.getMaxAmountRequired(), maxPaymentAmount);
                }

                // Create payment
                payment = baseClient.createPayment(request, null);

                // Increment attempts and retry
                attempts++;
            }
        }

        throw new X402Error("Max retries exceeded", "MAX_RETRIES_EXCEEDED");
    }

    /**
     * Checks if a payment amount exceeds the configured limit.
     *
     * @param requestedAmount Amount requested
     * @param limit Maximum allowed amount
     * @throws X402Error if limit exceeded
     */
    private void checkPaymentLimit(String requestedAmount, String limit) throws X402Error {
        try {
            BigDecimal requested = new BigDecimal(requestedAmount);
            BigDecimal max = new BigDecimal(limit);

            if (requested.compareTo(max) > 0) {
                throw new X402Error(
                        String.format("Payment amount %s exceeds limit %s", requestedAmount, limit),
                        "PAYMENT_LIMIT_EXCEEDED"
                );
            }
        } catch (NumberFormatException e) {
            throw new X402Error("Invalid payment amount format", "INVALID_AMOUNT");
        }
    }

    /**
     * Gets the underlying base client.
     *
     * @return X402Client instance
     */
    public X402Client getBaseClient() {
        return baseClient;
    }

    /**
     * Gets the payment processor.
     *
     * @return SolanaPaymentProcessor instance
     */
    public SolanaPaymentProcessor getProcessor() {
        return baseClient.getProcessor();
    }

    /**
     * Gets the max retries setting.
     *
     * @return Maximum number of retries
     */
    public int getMaxRetries() {
        return maxRetries;
    }

    /**
     * Gets the auto-retry setting.
     *
     * @return true if auto-retry is enabled
     */
    public boolean isAutoRetry() {
        return autoRetry;
    }

    /**
     * Gets the max payment amount limit.
     *
     * @return Maximum payment amount, or null if no limit
     */
    public String getMaxPaymentAmount() {
        return maxPaymentAmount;
    }

    /**
     * Checks if this client has been closed.
     */
    private void checkNotClosed() {
        if (closed) {
            throw new IllegalStateException("X402AutoClient has been closed");
        }
    }

    @Override
    public void close() {
        if (!closed) {
            baseClient.close();
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

    /**
     * Builder for creating X402AutoClient instances.
     */
    public static class Builder {
        private final Account walletAccount;
        private String rpcUrl;
        private OkHttpClient httpClient;
        private boolean allowLocal = false;
        private int maxRetries = 1;
        private boolean autoRetry = true;
        private String maxPaymentAmount;

        /**
         * Creates a new Builder.
         *
         * @param walletAccount Solana account for signing transactions
         */
        public Builder(Account walletAccount) {
            this.walletAccount = walletAccount;
        }

        /**
         * Sets the Solana RPC URL.
         *
         * @param rpcUrl RPC endpoint URL
         * @return this Builder
         */
        public Builder rpcUrl(String rpcUrl) {
            this.rpcUrl = rpcUrl;
            return this;
        }

        /**
         * Sets a custom HTTP client.
         *
         * @param httpClient OkHttpClient instance
         * @return this Builder
         */
        public Builder httpClient(OkHttpClient httpClient) {
            this.httpClient = httpClient;
            return this;
        }

        /**
         * Sets whether localhost requests are allowed.
         *
         * @param allowLocal true to allow localhost (development only)
         * @return this Builder
         */
        public Builder allowLocal(boolean allowLocal) {
            this.allowLocal = allowLocal;
            return this;
        }

        /**
         * Sets the maximum number of retry attempts.
         *
         * @param maxRetries Maximum retries (default: 1)
         * @return this Builder
         */
        public Builder maxRetries(int maxRetries) {
            this.maxRetries = maxRetries;
            return this;
        }

        /**
         * Sets whether automatic retry is enabled.
         *
         * @param autoRetry true to enable auto-retry (default: true)
         * @return this Builder
         */
        public Builder autoRetry(boolean autoRetry) {
            this.autoRetry = autoRetry;
            return this;
        }

        /**
         * Sets the maximum payment amount limit.
         *
         * @param maxPaymentAmount Maximum amount to spend automatically
         * @return this Builder
         */
        public Builder maxPaymentAmount(String maxPaymentAmount) {
            this.maxPaymentAmount = maxPaymentAmount;
            return this;
        }

        /**
         * Builds the X402AutoClient.
         *
         * @return Configured X402AutoClient
         */
        public X402AutoClient build() {
            return new X402AutoClient(
                    walletAccount,
                    rpcUrl,
                    httpClient,
                    allowLocal,
                    maxRetries,
                    autoRetry,
                    maxPaymentAmount
            );
        }
    }
}
