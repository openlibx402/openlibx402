package org.openlibx402.core.errors;

import org.openlibx402.core.models.PaymentRequest;

import java.util.HashMap;
import java.util.Map;

/**
 * Exception thrown when a payment request has expired.
 */
public class PaymentExpiredError extends X402Error {
    private final PaymentRequest paymentRequest;

    /**
     * Creates a new PaymentExpiredError.
     *
     * @param paymentRequest The expired payment request
     */
    public PaymentExpiredError(PaymentRequest paymentRequest) {
        super("Payment request has expired", "PAYMENT_EXPIRED", createDetails(paymentRequest));
        this.paymentRequest = paymentRequest;
    }

    /**
     * Creates a new PaymentExpiredError with a custom message.
     *
     * @param message Custom error message
     * @param paymentRequest The expired payment request
     */
    public PaymentExpiredError(String message, PaymentRequest paymentRequest) {
        super(message, "PAYMENT_EXPIRED", createDetails(paymentRequest));
        this.paymentRequest = paymentRequest;
    }

    private static Map<String, Object> createDetails(PaymentRequest paymentRequest) {
        Map<String, Object> details = new HashMap<>();
        if (paymentRequest != null) {
            details.put("payment_request", paymentRequest.toMap());
            details.put("expires_at", paymentRequest.getExpiresAt().toString());
        }
        return details;
    }

    /**
     * Gets the payment request.
     *
     * @return PaymentRequest object
     */
    public PaymentRequest getPaymentRequest() {
        return paymentRequest;
    }
}
