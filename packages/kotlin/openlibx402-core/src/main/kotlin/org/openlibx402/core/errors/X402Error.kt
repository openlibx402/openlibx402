package org.openlibx402.core.errors

import org.openlibx402.core.models.PaymentRequest

/**
 * Base sealed class for all X402 protocol errors.
 *
 * All errors include an error code, message, and optional details map.
 * Using a sealed class allows for exhaustive when expressions and type-safe error handling.
 *
 * @property message Error message
 * @property code Error code
 * @property details Additional error details
 */
sealed class X402Error(
    override val message: String,
    val code: String,
    val details: Map<String, Any> = emptyMap()
) : Exception(message) {

    /**
     * Exception thrown when a 402 Payment Required response is received.
     *
     * This error contains the payment request details that can be used to
     * create and submit a payment.
     *
     * @property paymentRequest The payment request from the server
     */
    data class PaymentRequired(
        val paymentRequest: PaymentRequest,
        override val message: String = "Payment required to access this resource"
    ) : X402Error(
        message = message,
        code = "PAYMENT_REQUIRED",
        details = mapOf("payment_request" to paymentRequest.toMap())
    )

    /**
     * Exception thrown when a payment request has expired.
     *
     * @property paymentRequest The expired payment request
     */
    data class PaymentExpired(
        val paymentRequest: PaymentRequest,
        override val message: String = "Payment request has expired"
    ) : X402Error(
        message = message,
        code = "PAYMENT_EXPIRED",
        details = mapOf(
            "payment_request" to paymentRequest.toMap(),
            "expires_at" to paymentRequest.expiresAt.toString()
        )
    )

    /**
     * Exception thrown when the wallet has insufficient funds for a payment.
     *
     * @property requiredAmount Required payment amount
     * @property availableAmount Available wallet balance
     */
    data class InsufficientFunds(
        val requiredAmount: String,
        val availableAmount: String,
        override val message: String = "Insufficient funds: required $requiredAmount, available $availableAmount"
    ) : X402Error(
        message = message,
        code = "INSUFFICIENT_FUNDS",
        details = mapOf(
            "required_amount" to requiredAmount,
            "available_amount" to availableAmount
        )
    )

    /**
     * Exception thrown when server payment verification fails.
     *
     * @property reason Verification failure reason
     */
    data class PaymentVerificationFailed(
        val reason: String,
        override val message: String = "Payment verification failed: $reason"
    ) : X402Error(
        message = message,
        code = "PAYMENT_VERIFICATION_FAILED",
        details = mapOf("reason" to reason)
    )

    /**
     * Exception thrown when transaction broadcast to blockchain fails.
     *
     * @property reason Broadcast failure reason
     */
    data class TransactionBroadcastFailed(
        val reason: String,
        override val message: String = "Transaction broadcast failed: $reason",
        override val cause: Throwable? = null
    ) : X402Error(
        message = message,
        code = "TRANSACTION_BROADCAST_FAILED",
        details = mapOf("reason" to reason)
    ) {
        init {
            cause?.let { initCause(it) }
        }
    }

    /**
     * Exception thrown when a payment request is malformed or invalid.
     *
     * @property reason Reason why the payment request is invalid
     */
    data class InvalidPaymentRequest(
        val reason: String,
        override val message: String = "Invalid payment request: $reason",
        override val cause: Throwable? = null
    ) : X402Error(
        message = message,
        code = "INVALID_PAYMENT_REQUEST",
        details = mapOf("reason" to reason)
    ) {
        init {
            cause?.let { initCause(it) }
        }
    }

    /**
     * Generic X402 error for cases not covered by specific error types.
     *
     * @property customCode Custom error code
     * @property customDetails Custom error details
     */
    data class Generic(
        val customCode: String,
        override val message: String,
        val customDetails: Map<String, Any> = emptyMap()
    ) : X402Error(
        message = message,
        code = customCode,
        details = customDetails
    )

    companion object {
        /**
         * Error code metadata.
         */
        data class ErrorCodeInfo(
            val code: String,
            val message: String,
            val retry: Boolean,
            val userAction: String
        )

        private val errorCodes = mapOf(
            "PAYMENT_REQUIRED" to ErrorCodeInfo(
                code = "PAYMENT_REQUIRED",
                message = "Payment is required to access this resource",
                retry = true,
                userAction = "Submit a payment using the provided payment request"
            ),
            "PAYMENT_EXPIRED" to ErrorCodeInfo(
                code = "PAYMENT_EXPIRED",
                message = "The payment request has expired",
                retry = true,
                userAction = "Request a new payment request and try again"
            ),
            "INSUFFICIENT_FUNDS" to ErrorCodeInfo(
                code = "INSUFFICIENT_FUNDS",
                message = "Wallet has insufficient funds for the payment",
                retry = false,
                userAction = "Add funds to your wallet and try again"
            ),
            "PAYMENT_VERIFICATION_FAILED" to ErrorCodeInfo(
                code = "PAYMENT_VERIFICATION_FAILED",
                message = "Server failed to verify the payment",
                retry = true,
                userAction = "Check transaction status and retry if payment was not processed"
            ),
            "TRANSACTION_BROADCAST_FAILED" to ErrorCodeInfo(
                code = "TRANSACTION_BROADCAST_FAILED",
                message = "Failed to broadcast transaction to the blockchain",
                retry = true,
                userAction = "Check network connection and blockchain status, then retry"
            ),
            "INVALID_PAYMENT_REQUEST" to ErrorCodeInfo(
                code = "INVALID_PAYMENT_REQUEST",
                message = "The payment request is malformed or invalid",
                retry = false,
                userAction = "Contact the service provider for a valid payment request"
            )
        )

        /**
         * Gets error code information.
         *
         * @param code Error code
         * @return ErrorCodeInfo object, or null if code is unknown
         */
        fun getInfo(code: String): ErrorCodeInfo? = errorCodes[code]

        /**
         * Checks if an error code is retryable.
         *
         * @param code Error code
         * @return true if the error is retryable, false otherwise
         */
        fun isRetryable(code: String): Boolean = errorCodes[code]?.retry ?: false

        /**
         * Gets the human-readable message for an error code.
         *
         * @param code Error code
         * @return Error message, or null if code is unknown
         */
        fun getMessage(code: String): String? = errorCodes[code]?.message

        /**
         * Gets the suggested user action for an error code.
         *
         * @param code Error code
         * @return Suggested user action, or null if code is unknown
         */
        fun getUserAction(code: String): String? = errorCodes[code]?.userAction

        /**
         * Gets all error codes.
         *
         * @return Map of all error codes
         */
        fun getAllCodes(): Map<String, ErrorCodeInfo> = errorCodes.toMap()
    }
}
