"""
Tests for OpenLibX402 testing utilities
"""
import pytest
from openlibx402_core.testing import (
    MockSolanaPaymentProcessor,
    MockPaymentServer,
    create_mock_payment_request,
    create_mock_payment_authorization,
)


class TestMockProcessor:
    """Tests for MockSolanaPaymentProcessor"""

    @pytest.mark.asyncio
    async def test_create_transaction(self):
        """Test creating mock transaction"""
        processor = MockSolanaPaymentProcessor()
        request = create_mock_payment_request()

        tx = await processor.create_payment_transaction(request, "0.10", None)
        assert tx is not None

    @pytest.mark.asyncio
    async def test_sign_and_send(self):
        """Test signing and sending mock transaction"""
        processor = MockSolanaPaymentProcessor()

        tx_hash = await processor.sign_and_send_transaction(None, None)
        assert tx_hash.startswith("mock_tx_")
        assert len(processor.transactions) == 1

    @pytest.mark.asyncio
    async def test_verify_transaction(self):
        """Test verifying mock transaction"""
        processor = MockSolanaPaymentProcessor()

        verified = await processor.verify_transaction("tx_hash", "addr", "0.10", "mint")
        assert verified is True

    @pytest.mark.asyncio
    async def test_get_balance(self):
        """Test getting mock balance"""
        processor = MockSolanaPaymentProcessor()
        processor.balance = 50.0

        balance = await processor.get_token_balance("wallet", "mint")
        assert balance == 50.0

    @pytest.mark.asyncio
    async def test_failure_mode(self):
        """Test mock processor failure mode"""
        processor = MockSolanaPaymentProcessor()
        processor.should_fail = True

        with pytest.raises(Exception):
            await processor.create_payment_transaction(None, None, None)


class TestMockServer:
    """Tests for MockPaymentServer"""

    def test_create_payment_request(self):
        """Test creating payment request"""
        server = MockPaymentServer("payment_addr", "token_mint")

        request = server.create_payment_request(
            amount="0.10",
            resource="/api/data"
        )

        assert request.max_amount_required == "0.10"
        assert request.payment_address == "payment_addr"
        assert request.asset_address == "token_mint"
        assert len(server.payment_requests) == 1

    def test_verify_payment(self):
        """Test verifying payment"""
        server = MockPaymentServer("payment_addr", "token_mint")

        request = server.create_payment_request("0.10", "/api/data")
        auth = create_mock_payment_authorization(request)

        verified = server.verify_payment(auth)
        assert verified is True
        assert len(server.payments_received) == 1

    def test_get_402_response(self):
        """Test getting 402 response"""
        server = MockPaymentServer("payment_addr", "token_mint")
        request = server.create_payment_request("0.10", "/api/data")

        response = server.get_402_response(request)
        assert response["status_code"] == 402
        assert "headers" in response
        assert "body" in response


class TestHelpers:
    """Tests for helper functions"""

    def test_create_mock_payment_request(self):
        """Test creating mock payment request"""
        request = create_mock_payment_request(amount="0.50")

        assert request.max_amount_required == "0.50"
        assert request.asset_type == "SPL"
        assert not request.is_expired()

    def test_create_mock_payment_authorization(self):
        """Test creating mock payment authorization"""
        request = create_mock_payment_request()
        auth = create_mock_payment_authorization(request, actual_amount="0.05")

        assert auth.payment_id == request.payment_id
        assert auth.actual_amount == "0.05"
        assert auth.payment_address == request.payment_address
        assert auth.transaction_hash.startswith("mock_tx_")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
