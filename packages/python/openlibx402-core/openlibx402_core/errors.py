"""
OpenLibx402 Error Classes

Defines all exception types for the X402 payment protocol.
"""

from typing import Optional, Dict, Any


class X402Error(Exception):
    """Base exception for X402 protocol errors"""

    def __init__(
        self, message: str, code: str, details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(message)

    def __str__(self) -> str:
        return f"[{self.code}] {self.message}"


class PaymentRequiredError(X402Error):
    """Raised when 402 response received"""

    def __init__(self, payment_request, message: Optional[str] = None):
        self.payment_request = payment_request
        super().__init__(
            message or "Payment is required to access this resource",
            "PAYMENT_REQUIRED",
            {"payment_request": payment_request},
        )


class PaymentExpiredError(X402Error):
    """Payment request has expired"""

    def __init__(self, payment_request, message: Optional[str] = None):
        self.payment_request = payment_request
        super().__init__(
            message or "Payment request has expired",
            "PAYMENT_EXPIRED",
            {"payment_request": payment_request},
        )


class InsufficientFundsError(X402Error):
    """Wallet has insufficient funds"""

    def __init__(self, required_amount: str, available_amount: str):
        self.required_amount = required_amount
        self.available_amount = available_amount
        super().__init__(
            f"Insufficient funds: need {required_amount}, have {available_amount}",
            "INSUFFICIENT_FUNDS",
            {"required_amount": required_amount, "available_amount": available_amount},
        )


class PaymentVerificationError(X402Error):
    """Payment verification failed"""

    def __init__(self, reason: str):
        super().__init__(
            f"Payment verification failed: {reason}",
            "PAYMENT_VERIFICATION_FAILED",
            {"reason": reason},
        )


class TransactionBroadcastError(X402Error):
    """Failed to broadcast transaction"""

    def __init__(self, reason: str):
        super().__init__(
            f"Failed to broadcast transaction: {reason}",
            "TRANSACTION_BROADCAST_FAILED",
            {"reason": reason},
        )


class InvalidPaymentRequestError(X402Error):
    """Payment request format is invalid"""

    def __init__(self, reason: str):
        super().__init__(
            f"Invalid payment request: {reason}",
            "INVALID_PAYMENT_REQUEST",
            {"reason": reason},
        )


# Error code reference for documentation and tooling
ERROR_CODES = {
    "PAYMENT_REQUIRED": {
        "code": "PAYMENT_REQUIRED",
        "message": "Payment is required to access this resource",
        "retry": True,
        "user_action": "Ensure wallet has sufficient funds and retry",
    },
    "PAYMENT_EXPIRED": {
        "code": "PAYMENT_EXPIRED",
        "message": "Payment request has expired",
        "retry": True,
        "user_action": "Request a new payment authorization",
    },
    "INSUFFICIENT_FUNDS": {
        "code": "INSUFFICIENT_FUNDS",
        "message": "Wallet has insufficient token balance",
        "retry": False,
        "user_action": "Add funds to wallet",
    },
    "PAYMENT_VERIFICATION_FAILED": {
        "code": "PAYMENT_VERIFICATION_FAILED",
        "message": "Server could not verify payment",
        "retry": True,
        "user_action": "Contact API provider if issue persists",
    },
    "TRANSACTION_BROADCAST_FAILED": {
        "code": "TRANSACTION_BROADCAST_FAILED",
        "message": "Failed to broadcast transaction to blockchain",
        "retry": True,
        "user_action": "Check network connection and RPC endpoint",
    },
    "INVALID_PAYMENT_REQUEST": {
        "code": "INVALID_PAYMENT_REQUEST",
        "message": "Payment request format is invalid",
        "retry": False,
        "user_action": "Contact API provider",
    },
}
