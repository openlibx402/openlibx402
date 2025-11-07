package org.openlibx402.core.errors;

import org.openlibx402.core.models.PaymentRequest;

import java.util.HashMap;
import java.util.Map;

/**
 * Exception thrown when a 402 Payment Required response is received.
 * <p>
 * This error contains the payment request details that can be used to
 * create and submit a payment.
 * </p>
 */
public class PaymentRequiredError extends X402Error {
    private final PaymentRequest paymentRequest;

    /**
     * Creates a new PaymentRequiredError.
     *
     * @param paymentRequest The payment request from the server
     */
    public PaymentRequiredError(PaymentRequest paymentRequest) {
        super("Payment required to access this resource", "PAYMENT_REQUIRED", createDetails(paymentRequest));
        this.paymentRequest = paymentRequest;
    }

    /**
     * Creates a new PaymentRequiredError with a custom message.
     *
     * @param message Custom error message
     * @param paymentRequest The payment request from the server
     */
    public PaymentRequiredError(String message, PaymentRequest paymentRequest) {
        super(message, "PAYMENT_REQUIRED", createDetails(paymentRequest));
        this.paymentRequest = paymentRequest;
    }

    private static Map<String, Object> createDetails(PaymentRequest paymentRequest) {
        Map<String, Object> details = new HashMap<>();
        if (paymentRequest != null) {
            details.put("payment_request", paymentRequest.toMap());
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
