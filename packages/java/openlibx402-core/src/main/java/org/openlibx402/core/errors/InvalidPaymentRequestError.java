package org.openlibx402.core.errors;

import java.util.HashMap;
import java.util.Map;

/**
 * Exception thrown when a payment request is malformed or invalid.
 */
public class InvalidPaymentRequestError extends X402Error {
    private final String reason;

    /**
     * Creates a new InvalidPaymentRequestError.
     *
     * @param reason Reason why the payment request is invalid
     */
    public InvalidPaymentRequestError(String reason) {
        super("Invalid payment request: " + reason, "INVALID_PAYMENT_REQUEST", createDetails(reason));
        this.reason = reason;
    }

    /**
     * Creates a new InvalidPaymentRequestError with a custom message.
     *
     * @param message Custom error message
     * @param reason Reason why the payment request is invalid
     */
    public InvalidPaymentRequestError(String message, String reason) {
        super(message, "INVALID_PAYMENT_REQUEST", createDetails(reason));
        this.reason = reason;
    }

    /**
     * Creates a new InvalidPaymentRequestError with a cause.
     *
     * @param reason Reason why the payment request is invalid
     * @param cause Underlying cause
     */
    public InvalidPaymentRequestError(String reason, Throwable cause) {
        super("Invalid payment request: " + reason, "INVALID_PAYMENT_REQUEST", createDetails(reason), cause);
        this.reason = reason;
    }

    private static Map<String, Object> createDetails(String reason) {
        Map<String, Object> details = new HashMap<>();
        details.put("reason", reason);
        return details;
    }

    /**
     * Gets the reason.
     *
     * @return Reason why the payment request is invalid
     */
    public String getReason() {
        return reason;
    }
}
