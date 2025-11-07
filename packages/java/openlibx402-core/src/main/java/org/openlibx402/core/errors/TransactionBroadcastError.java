package org.openlibx402.core.errors;

import java.util.HashMap;
import java.util.Map;

/**
 * Exception thrown when transaction broadcast to blockchain fails.
 */
public class TransactionBroadcastError extends X402Error {
    private final String reason;

    /**
     * Creates a new TransactionBroadcastError.
     *
     * @param reason Broadcast failure reason
     */
    public TransactionBroadcastError(String reason) {
        super("Transaction broadcast failed: " + reason, "TRANSACTION_BROADCAST_FAILED", createDetails(reason));
        this.reason = reason;
    }

    /**
     * Creates a new TransactionBroadcastError with a custom message.
     *
     * @param message Custom error message
     * @param reason Broadcast failure reason
     */
    public TransactionBroadcastError(String message, String reason) {
        super(message, "TRANSACTION_BROADCAST_FAILED", createDetails(reason));
        this.reason = reason;
    }

    /**
     * Creates a new TransactionBroadcastError with a cause.
     *
     * @param reason Broadcast failure reason
     * @param cause Underlying cause
     */
    public TransactionBroadcastError(String reason, Throwable cause) {
        super("Transaction broadcast failed: " + reason, "TRANSACTION_BROADCAST_FAILED", createDetails(reason), cause);
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
     * @return Broadcast failure reason
     */
    public String getReason() {
        return reason;
    }
}
