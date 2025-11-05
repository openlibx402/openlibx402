package org.openlibx402.core.errors;

import java.util.HashMap;
import java.util.Map;

/**
 * Exception thrown when server payment verification fails.
 */
public class PaymentVerificationError extends X402Error {
    private final String reason;

    /**
     * Creates a new PaymentVerificationError.
     *
     * @param reason Verification failure reason
     */
    public PaymentVerificationError(String reason) {
        super("Payment verification failed: " + reason, "PAYMENT_VERIFICATION_FAILED", createDetails(reason));
        this.reason = reason;
    }

    /**
     * Creates a new PaymentVerificationError with a custom message.
     *
     * @param message Custom error message
     * @param reason Verification failure reason
     */
    public PaymentVerificationError(String message, String reason) {
        super(message, "PAYMENT_VERIFICATION_FAILED", createDetails(reason));
        this.reason = reason;
    }

    private static Map<String, Object> createDetails(String reason) {
        Map<String, Object> details = new HashMap<>();
        details.put("reason", reason);
        return details;
    }

    /**
     * Gets the failure reason.
     *
     * @return Verification failure reason
     */
    public String getReason() {
        return reason;
    }
}
