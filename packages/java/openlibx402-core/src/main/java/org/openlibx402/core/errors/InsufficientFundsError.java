package org.openlibx402.core.errors;

import java.util.HashMap;
import java.util.Map;

/**
 * Exception thrown when the wallet has insufficient funds for a payment.
 */
public class InsufficientFundsError extends X402Error {
    private final String requiredAmount;
    private final String availableAmount;

    /**
     * Creates a new InsufficientFundsError.
     *
     * @param requiredAmount Required payment amount
     * @param availableAmount Available wallet balance
     */
    public InsufficientFundsError(String requiredAmount, String availableAmount) {
        super(
                String.format("Insufficient funds: required %s, available %s", requiredAmount, availableAmount),
                "INSUFFICIENT_FUNDS",
                createDetails(requiredAmount, availableAmount)
        );
        this.requiredAmount = requiredAmount;
        this.availableAmount = availableAmount;
    }

    /**
     * Creates a new InsufficientFundsError with a custom message.
     *
     * @param message Custom error message
     * @param requiredAmount Required payment amount
     * @param availableAmount Available wallet balance
     */
    public InsufficientFundsError(String message, String requiredAmount, String availableAmount) {
        super(message, "INSUFFICIENT_FUNDS", createDetails(requiredAmount, availableAmount));
        this.requiredAmount = requiredAmount;
        this.availableAmount = availableAmount;
    }

    private static Map<String, Object> createDetails(String requiredAmount, String availableAmount) {
        Map<String, Object> details = new HashMap<>();
        details.put("required_amount", requiredAmount);
        details.put("available_amount", availableAmount);
        return details;
    }

    /**
     * Gets the required amount.
     *
     * @return Required payment amount
     */
    public String getRequiredAmount() {
        return requiredAmount;
    }

    /**
     * Gets the available amount.
     *
     * @return Available wallet balance
     */
    public String getAvailableAmount() {
        return availableAmount;
    }
}
