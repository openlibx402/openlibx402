"""
Explicit X402 Client

Manual payment control - developer explicitly handles payment flow.
"""
from typing import Optional
import httpx

try:
    from solders.keypair import Keypair
    SOLDERS_AVAILABLE = True
except ImportError:
    SOLDERS_AVAILABLE = False
    Keypair = None  # type: ignore

from openlibx402_core import (
    PaymentRequest,
    PaymentAuthorization,
    SolanaPaymentProcessor,
    PaymentExpiredError,
    InsufficientFundsError,
)


class X402Client:
    """
    Explicit X402 client - developer controls payment flow

    Usage:
        client = X402Client(wallet_keypair)

        # Check if payment required
        response = await client.get("https://api.example.com/data")

        if client.payment_required(response):
            payment_request = client.parse_payment_request(response)

            # Make payment
            authorization = await client.create_payment(payment_request)

            # Retry with payment
            response = await client.get(
                "https://api.example.com/data",
                payment=authorization
            )
    """

    def __init__(
        self,
        wallet_keypair: Keypair,
        rpc_url: Optional[str] = None,
        http_client: Optional[httpx.AsyncClient] = None,
    ):
        if not SOLDERS_AVAILABLE:
            raise ImportError(
                "solders library not installed. "
                "Install with: pip install solders"
            )

        self.wallet_keypair = wallet_keypair
        self.http_client = http_client or httpx.AsyncClient()
        self.processor = SolanaPaymentProcessor(
            rpc_url or "https://api.devnet.solana.com",
            keypair=wallet_keypair
        )

    async def close(self):
        """Close HTTP and RPC connections"""
        await self.http_client.aclose()
        await self.processor.close()

    async def get(
        self,
        url: str,
        payment: Optional[PaymentAuthorization] = None,
        **kwargs
    ) -> httpx.Response:
        """Make GET request with optional payment"""
        headers = kwargs.get("headers", {})
        if payment:
            headers["X-Payment-Authorization"] = payment.to_header_value()
        kwargs["headers"] = headers
        return await self.http_client.get(url, **kwargs)

    async def post(
        self,
        url: str,
        payment: Optional[PaymentAuthorization] = None,
        **kwargs
    ) -> httpx.Response:
        """Make POST request with optional payment"""
        headers = kwargs.get("headers", {})
        if payment:
            headers["X-Payment-Authorization"] = payment.to_header_value()
        kwargs["headers"] = headers
        return await self.http_client.post(url, **kwargs)

    async def put(
        self,
        url: str,
        payment: Optional[PaymentAuthorization] = None,
        **kwargs
    ) -> httpx.Response:
        """Make PUT request with optional payment"""
        headers = kwargs.get("headers", {})
        if payment:
            headers["X-Payment-Authorization"] = payment.to_header_value()
        kwargs["headers"] = headers
        return await self.http_client.put(url, **kwargs)

    async def delete(
        self,
        url: str,
        payment: Optional[PaymentAuthorization] = None,
        **kwargs
    ) -> httpx.Response:
        """Make DELETE request with optional payment"""
        headers = kwargs.get("headers", {})
        if payment:
            headers["X-Payment-Authorization"] = payment.to_header_value()
        kwargs["headers"] = headers
        return await self.http_client.delete(url, **kwargs)

    def payment_required(self, response: httpx.Response) -> bool:
        """Check if response requires payment"""
        return response.status_code == 402

    def parse_payment_request(
        self,
        response: httpx.Response
    ) -> PaymentRequest:
        """Parse payment request from 402 response"""
        if not self.payment_required(response):
            raise ValueError("Response does not require payment (status != 402)")

        try:
            data = response.json()
            return PaymentRequest.from_dict(data)
        except Exception as e:
            raise ValueError(f"Failed to parse payment request: {e}")

    async def create_payment(
        self,
        request: PaymentRequest,
        amount: Optional[str] = None,
    ) -> PaymentAuthorization:
        """
        Create and broadcast payment for a payment request

        Args:
            request: Payment request from 402 response
            amount: Optional custom amount (defaults to max_amount_required)

        Returns:
            PaymentAuthorization with transaction hash
        """
        from datetime import datetime, timezone

        # Validate request not expired
        if request.is_expired():
            raise PaymentExpiredError(request)

        # Use provided amount or max required
        pay_amount = amount or request.max_amount_required

        # Check sufficient balance
        balance = await self.processor.get_token_balance(
            str(self.wallet_keypair.pubkey()),
            request.asset_address
        )
        if balance < float(pay_amount):
            raise InsufficientFundsError(pay_amount, str(balance))

        # Create transaction
        tx = await self.processor.create_payment_transaction(
            request, pay_amount, self.wallet_keypair
        )

        # Sign and broadcast
        tx_hash = await self.processor.sign_and_send_transaction(
            tx, self.wallet_keypair
        )

        # Create authorization
        return PaymentAuthorization(
            payment_id=request.payment_id,
            actual_amount=pay_amount,
            payment_address=request.payment_address,
            asset_address=request.asset_address,
            network=request.network,
            timestamp=datetime.now(timezone.utc),
            signature="",  # Solana signature
            public_key=str(self.wallet_keypair.pubkey()),
            transaction_hash=tx_hash,
        )

    async def request(
        self,
        method: str,
        url: str,
        payment: Optional[PaymentAuthorization] = None,
        **kwargs
    ) -> httpx.Response:
        """Make HTTP request with optional payment"""
        method_map = {
            "GET": self.get,
            "POST": self.post,
            "PUT": self.put,
            "DELETE": self.delete,
        }

        method_func = method_map.get(method.upper())
        if not method_func:
            raise ValueError(f"Unsupported HTTP method: {method}")

        return await method_func(url, payment=payment, **kwargs)
