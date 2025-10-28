"""
Tests for OpenLibX402 error classes
"""
import pytest
from openlibx402_core.errors import (
    X402Error,
    PaymentRequiredError,
    PaymentExpiredError,
    InsufficientFundsError,
    PaymentVerificationError,
    TransactionBroadcastError,
    InvalidPaymentRequestError,
)


class TestErrors:
    """Tests for error classes"""

    def test_base_error(self):
        """Test base X402Error"""
        error = X402Error("Test message", "TEST_CODE", {"key": "value"})
        assert error.message == "Test message"
        assert error.code == "TEST_CODE"
        assert error.details == {"key": "value"}
        assert "TEST_CODE" in str(error)

    def test_payment_required_error(self):
        """Test PaymentRequiredError"""
        request = {"payment_id": "test"}
        error = PaymentRequiredError(request)
        assert error.code == "PAYMENT_REQUIRED"
        assert error.payment_request == request

    def test_payment_expired_error(self):
        """Test PaymentExpiredError"""
        request = {"payment_id": "test"}
        error = PaymentExpiredError(request)
        assert error.code == "PAYMENT_EXPIRED"
        assert error.payment_request == request

    def test_insufficient_funds_error(self):
        """Test InsufficientFundsError"""
        error = InsufficientFundsError("1.0", "0.5")
        assert error.code == "INSUFFICIENT_FUNDS"
        assert error.required_amount == "1.0"
        assert error.available_amount == "0.5"
        assert "1.0" in error.message
        assert "0.5" in error.message

    def test_payment_verification_error(self):
        """Test PaymentVerificationError"""
        error = PaymentVerificationError("Invalid signature")
        assert error.code == "PAYMENT_VERIFICATION_FAILED"
        assert "Invalid signature" in error.message

    def test_transaction_broadcast_error(self):
        """Test TransactionBroadcastError"""
        error = TransactionBroadcastError("Network error")
        assert error.code == "TRANSACTION_BROADCAST_FAILED"
        assert "Network error" in error.message

    def test_invalid_payment_request_error(self):
        """Test InvalidPaymentRequestError"""
        error = InvalidPaymentRequestError("Missing field")
        assert error.code == "INVALID_PAYMENT_REQUEST"
        assert "Missing field" in error.message


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
