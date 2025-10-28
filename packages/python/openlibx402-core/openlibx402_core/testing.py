"""
Testing Utilities for OpenLibx402

Mock implementations for testing without real blockchain transactions.
"""

from typing import List, Optional
from datetime import datetime, timedelta, timezone
import secrets

from .models import PaymentRequest, PaymentAuthorization
from .solana_processor import SolanaPaymentProcessor


class MockSolanaPaymentProcessor(SolanaPaymentProcessor):
    """Mock processor for testing without real blockchain"""

    def __init__(self, *args, **kwargs):
        # Don't call super().__init__ to avoid requiring Solana libraries
        self.rpc_url = kwargs.get("rpc_url", "http://mock")
        self.keypair = kwargs.get("keypair")
        self.transactions: List[str] = []
        self.balance = 100.0  # Mock balance in tokens
        self.should_fail = False  # For testing error scenarios

    async def close(self):
        """Mock close"""
        pass

    async def create_payment_transaction(self, *args, **kwargs):
        """Return mock transaction"""
        if self.should_fail:
            raise Exception("Mock transaction creation failed")
        return MockTransaction()

    async def sign_and_send_transaction(self, *args, **kwargs):
        """Return mock tx hash"""
        if self.should_fail:
            raise Exception("Mock transaction broadcast failed")

        tx_hash = f"mock_tx_{secrets.token_hex(32)}"
        self.transactions.append(tx_hash)
        return tx_hash

    async def verify_transaction(self, *args, **kwargs):
        """Always verify successfully unless configured to fail"""
        if self.should_fail:
            return False
        return True

    async def get_token_balance(self, *args, **kwargs):
        """Return mock balance"""
        return self.balance


class MockTransaction:
    """Mock Solana transaction"""

    def __init__(self):
        self.recent_blockhash = "mock_blockhash"
        self.fee_payer = None
        self.instructions = []

    def add(self, instruction):
        """Add instruction"""
        self.instructions.append(instruction)

    def sign(self, *signers):
        """Mock sign"""
        pass


class MockPaymentServer:
    """Mock X402 payment server for testing"""

    def __init__(
        self, payment_address: str, token_mint: str, network: str = "solana-devnet"
    ):
        self.payment_address = payment_address
        self.token_mint = token_mint
        self.network = network
        self.payments_received: List[PaymentAuthorization] = []
        self.payment_requests: List[PaymentRequest] = []

    def create_payment_request(
        self,
        amount: str,
        resource: str,
        description: Optional[str] = None,
        expires_in_seconds: int = 300,
    ) -> PaymentRequest:
        """Create a payment request"""
        request = PaymentRequest(
            max_amount_required=amount,
            asset_type="SPL",
            asset_address=self.token_mint,
            payment_address=self.payment_address,
            network=self.network,
            expires_at=datetime.now(timezone.utc)
            + timedelta(seconds=expires_in_seconds),
            nonce=secrets.token_urlsafe(32),
            payment_id=secrets.token_urlsafe(16),
            resource=resource,
            description=description,
        )
        self.payment_requests.append(request)
        return request

    def verify_payment(self, authorization: PaymentAuthorization) -> bool:
        """Verify a payment authorization"""
        # Check if payment_id matches any request
        for request in self.payment_requests:
            if request.payment_id == authorization.payment_id:
                # In real implementation, verify signature and transaction
                self.payments_received.append(authorization)
                return True
        return False

    def get_402_response(self, request: PaymentRequest) -> dict:
        """Get 402 response dict"""
        return {
            "status_code": 402,
            "headers": {
                "X-Payment-Required": "true",
                "X-Payment-Protocol": "x402",
            },
            "body": request.to_dict(),
        }


def create_mock_payment_request(
    amount: str = "0.10",
    payment_address: str = "mock_address",
    token_mint: str = "mock_usdc",
    resource: str = "/api/data",
    expires_in_seconds: int = 300,
) -> PaymentRequest:
    """Helper to create mock payment request"""
    return PaymentRequest(
        max_amount_required=amount,
        asset_type="SPL",
        asset_address=token_mint,
        payment_address=payment_address,
        network="solana-devnet",
        expires_at=datetime.now(timezone.utc) + timedelta(seconds=expires_in_seconds),
        nonce=secrets.token_urlsafe(32),
        payment_id=secrets.token_urlsafe(16),
        resource=resource,
        description="Mock payment request",
    )


def create_mock_payment_authorization(
    payment_request: PaymentRequest,
    actual_amount: Optional[str] = None,
    public_key: str = "mock_pubkey",
) -> PaymentAuthorization:
    """Helper to create mock payment authorization"""
    return PaymentAuthorization(
        payment_id=payment_request.payment_id,
        actual_amount=actual_amount or payment_request.max_amount_required,
        payment_address=payment_request.payment_address,
        asset_address=payment_request.asset_address,
        network=payment_request.network,
        timestamp=datetime.now(timezone.utc),
        signature="mock_signature",
        public_key=public_key,
        transaction_hash=f"mock_tx_{secrets.token_hex(32)}",
    )
