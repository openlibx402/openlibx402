"""
OpenLibx402 Core Package

Core implementation of the X402 payment protocol for autonomous AI agent payments.
"""

__version__ = "0.1.1"

from .models import PaymentRequest, PaymentAuthorization
from .errors import (
    X402Error,
    PaymentRequiredError,
    PaymentExpiredError,
    InsufficientFundsError,
    PaymentVerificationError,
    TransactionBroadcastError,
    InvalidPaymentRequestError,
    ERROR_CODES,
)
from .solana_processor import SolanaPaymentProcessor

__all__ = [
    # Models
    "PaymentRequest",
    "PaymentAuthorization",
    # Errors
    "X402Error",
    "PaymentRequiredError",
    "PaymentExpiredError",
    "InsufficientFundsError",
    "PaymentVerificationError",
    "TransactionBroadcastError",
    "InvalidPaymentRequestError",
    "ERROR_CODES",
    # Solana
    "SolanaPaymentProcessor",
]
