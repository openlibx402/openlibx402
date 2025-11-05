package org.openlibx402.core.util;

import java.util.HashMap;
import java.util.Map;

/**
 * Registry of X402 error codes with metadata.
 * <p>
 * Provides error code information including human-readable messages,
 * retry recommendations, and suggested user actions.
 * </p>
 */
public class ErrorCodes {

    /**
     * Metadata for an error code.
     */
    public static class ErrorCodeInfo {
        private final String code;
        private final String message;
        private final boolean retry;
        private final String userAction;

        public ErrorCodeInfo(String code, String message, boolean retry, String userAction) {
            this.code = code;
            this.message = message;
            this.retry = retry;
            this.userAction = userAction;
        }

        public String getCode() {
            return code;
        }

        public String getMessage() {
            return message;
        }

        public boolean isRetry() {
            return retry;
        }

        public String getUserAction() {
            return userAction;
        }

        @Override
        public String toString() {
            return "ErrorCodeInfo{" +
                    "code='" + code + '\'' +
                    ", message='" + message + '\'' +
                    ", retry=" + retry +
                    ", userAction='" + userAction + '\'' +
                    '}';
        }
    }

    private static final Map<String, ErrorCodeInfo> ERROR_CODES = new HashMap<>();

    static {
        ERROR_CODES.put("PAYMENT_REQUIRED", new ErrorCodeInfo(
                "PAYMENT_REQUIRED",
                "Payment is required to access this resource",
                true,
                "Submit a payment using the provided payment request"
        ));

        ERROR_CODES.put("PAYMENT_EXPIRED", new ErrorCodeInfo(
                "PAYMENT_EXPIRED",
                "The payment request has expired",
                true,
                "Request a new payment request and try again"
        ));

        ERROR_CODES.put("INSUFFICIENT_FUNDS", new ErrorCodeInfo(
                "INSUFFICIENT_FUNDS",
                "Wallet has insufficient funds for the payment",
                false,
                "Add funds to your wallet and try again"
        ));

        ERROR_CODES.put("PAYMENT_VERIFICATION_FAILED", new ErrorCodeInfo(
                "PAYMENT_VERIFICATION_FAILED",
                "Server failed to verify the payment",
                true,
                "Check transaction status and retry if payment was not processed"
        ));

        ERROR_CODES.put("TRANSACTION_BROADCAST_FAILED", new ErrorCodeInfo(
                "TRANSACTION_BROADCAST_FAILED",
                "Failed to broadcast transaction to the blockchain",
                true,
                "Check network connection and blockchain status, then retry"
        ));

        ERROR_CODES.put("INVALID_PAYMENT_REQUEST", new ErrorCodeInfo(
                "INVALID_PAYMENT_REQUEST",
                "The payment request is malformed or invalid",
                false,
                "Contact the service provider for a valid payment request"
        ));
    }

    /**
     * Gets error code information.
     *
     * @param code Error code
     * @return ErrorCodeInfo object, or null if code is unknown
     */
    public static ErrorCodeInfo getInfo(String code) {
        return ERROR_CODES.get(code);
    }

    /**
     * Checks if an error code is retryable.
     *
     * @param code Error code
     * @return true if the error is retryable, false otherwise
     */
    public static boolean isRetryable(String code) {
        ErrorCodeInfo info = ERROR_CODES.get(code);
        return info != null && info.isRetry();
    }

    /**
     * Gets the human-readable message for an error code.
     *
     * @param code Error code
     * @return Error message, or null if code is unknown
     */
    public static String getMessage(String code) {
        ErrorCodeInfo info = ERROR_CODES.get(code);
        return info != null ? info.getMessage() : null;
    }

    /**
     * Gets the suggested user action for an error code.
     *
     * @param code Error code
     * @return Suggested user action, or null if code is unknown
     */
    public static String getUserAction(String code) {
        ErrorCodeInfo info = ERROR_CODES.get(code);
        return info != null ? info.getUserAction() : null;
    }

    /**
     * Gets all error codes.
     *
     * @return Immutable map of all error codes
     */
    public static Map<String, ErrorCodeInfo> getAllCodes() {
        return new HashMap<>(ERROR_CODES);
    }
}
