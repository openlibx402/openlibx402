"""
Tests for OpenLibX402 core models
"""
import pytest
from datetime import datetime, timedelta, timezone

from openlibx402_core.models import PaymentRequest, PaymentAuthorization
from openlibx402_core.errors import InvalidPaymentRequestError


class TestPaymentRequest:
    """Tests for PaymentRequest model"""

    def test_create_payment_request(self):
        """Test creating a payment request"""
        request = PaymentRequest(
            max_amount_required="0.10",
            asset_type="SPL",
            asset_address="token_mint_address",
            payment_address="recipient_address",
            network="solana-devnet",
            expires_at=datetime.now(timezone.utc) + timedelta(seconds=300),
            nonce="test_nonce",
            payment_id="test_payment_id",
            resource="/api/data",
            description="Test payment"
        )

        assert request.max_amount_required == "0.10"
        assert request.asset_type == "SPL"
        assert request.payment_address == "recipient_address"

    def test_to_dict(self):
        """Test converting payment request to dict"""
        request = PaymentRequest(
            max_amount_required="0.10",
            asset_type="SPL",
            asset_address="token_mint",
            payment_address="recipient",
            network="solana-devnet",
            expires_at=datetime.now(timezone.utc) + timedelta(seconds=300),
            nonce="nonce",
            payment_id="payment_id",
            resource="/api/data",
        )

        data = request.to_dict()
        assert isinstance(data, dict)
        assert data["max_amount_required"] == "0.10"
        assert "expires_at" in data
        assert isinstance(data["expires_at"], str)

    def test_from_dict(self):
        """Test creating payment request from dict"""
        data = {
            "max_amount_required": "0.10",
            "asset_type": "SPL",
            "asset_address": "token_mint",
            "payment_address": "recipient",
            "network": "solana-devnet",
            "expires_at": datetime.now(timezone.utc).isoformat(),
            "nonce": "nonce",
            "payment_id": "payment_id",
            "resource": "/api/data",
        }

        request = PaymentRequest.from_dict(data)
        assert request.max_amount_required == "0.10"
        assert isinstance(request.expires_at, datetime)

    def test_is_expired(self):
        """Test checking if payment request is expired"""
        # Not expired
        request = PaymentRequest(
            max_amount_required="0.10",
            asset_type="SPL",
            asset_address="token_mint",
            payment_address="recipient",
            network="solana-devnet",
            expires_at=datetime.now(timezone.utc) + timedelta(seconds=300),
            nonce="nonce",
            payment_id="payment_id",
            resource="/api/data",
        )
        assert not request.is_expired()

        # Expired
        expired_request = PaymentRequest(
            max_amount_required="0.10",
            asset_type="SPL",
            asset_address="token_mint",
            payment_address="recipient",
            network="solana-devnet",
            expires_at=datetime.now(timezone.utc) - timedelta(seconds=60),
            nonce="nonce",
            payment_id="payment_id",
            resource="/api/data",
        )
        assert expired_request.is_expired()


class TestPaymentAuthorization:
    """Tests for PaymentAuthorization model"""

    def test_create_authorization(self):
        """Test creating payment authorization"""
        auth = PaymentAuthorization(
            payment_id="test_id",
            actual_amount="0.10",
            payment_address="recipient",
            asset_address="token_mint",
            network="solana-devnet",
            timestamp=datetime.now(timezone.utc),
            signature="test_signature",
            public_key="test_pubkey",
            transaction_hash="test_tx_hash",
        )

        assert auth.payment_id == "test_id"
        assert auth.actual_amount == "0.10"
        assert auth.transaction_hash == "test_tx_hash"

    def test_to_header_value(self):
        """Test encoding authorization as header value"""
        auth = PaymentAuthorization(
            payment_id="test_id",
            actual_amount="0.10",
            payment_address="recipient",
            asset_address="token_mint",
            network="solana-devnet",
            timestamp=datetime.now(timezone.utc),
            signature="sig",
            public_key="pubkey",
            transaction_hash="tx_hash",
        )

        header = auth.to_header_value()
        assert isinstance(header, str)
        assert len(header) > 0

    def test_from_header(self):
        """Test parsing authorization from header"""
        auth = PaymentAuthorization(
            payment_id="test_id",
            actual_amount="0.10",
            payment_address="recipient",
            asset_address="token_mint",
            network="solana-devnet",
            timestamp=datetime.now(timezone.utc),
            signature="sig",
            public_key="pubkey",
            transaction_hash="tx_hash",
        )

        header = auth.to_header_value()
        parsed = PaymentAuthorization.from_header(header)

        assert parsed.payment_id == auth.payment_id
        assert parsed.actual_amount == auth.actual_amount
        assert parsed.transaction_hash == auth.transaction_hash


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
