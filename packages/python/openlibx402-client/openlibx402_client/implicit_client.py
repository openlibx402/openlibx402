"""
Implicit X402 Client

Automatic payment handling - client automatically pays when receiving 402 response.
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
    PaymentRequiredError,
)
from .explicit_client import X402Client


class X402AutoClient:
    """
    Implicit X402 client - automatically handles payment flow

    Usage:
        client = X402AutoClient(wallet_keypair)

        # Automatically detects 402 and pays
        response = await client.fetch("https://api.example.com/data")
        data = response.json()
    """

    def __init__(
        self,
        wallet_keypair: Keypair,
        rpc_url: Optional[str] = None,
        max_retries: int = 1,
        auto_retry: bool = True,
        max_payment_amount: Optional[str] = None,  # Safety limit
    ):
        if not SOLDERS_AVAILABLE:
            raise ImportError(
                "solders library not installed. "
                "Install with: pip install solders"
            )

        self.client = X402Client(wallet_keypair, rpc_url)
        self.max_retries = max_retries
        self.auto_retry = auto_retry
        self.max_payment_amount = max_payment_amount

    async def close(self):
        """Close client connections"""
        await self.client.close()

    async def fetch(
        self,
        url: str,
        method: str = "GET",
        auto_retry: Optional[bool] = None,
        **kwargs
    ) -> httpx.Response:
        """
        Make HTTP request with automatic payment handling

        Args:
            url: Request URL
            method: HTTP method
            auto_retry: Override instance auto_retry setting
            **kwargs: Additional arguments for httpx request

        Returns:
            Response after payment (if required)

        Raises:
            PaymentRequiredError: If auto_retry is False and 402 received
            InsufficientFundsError: If wallet lacks funds
            PaymentExpiredError: If payment request expired
        """
        should_retry = auto_retry if auto_retry is not None else self.auto_retry

        # Initial request
        response = await self._make_request(method, url, **kwargs)

        # Check if payment required
        if self.client.payment_required(response):
            if not should_retry:
                payment_request = self.client.parse_payment_request(response)
                raise PaymentRequiredError(payment_request)

            # Parse payment request
            payment_request = self.client.parse_payment_request(response)

            # Safety check
            if self.max_payment_amount:
                if float(payment_request.max_amount_required) > float(self.max_payment_amount):
                    raise ValueError(
                        f"Payment amount {payment_request.max_amount_required} "
                        f"exceeds max allowed {self.max_payment_amount}"
                    )

            # Create payment
            authorization = await self.client.create_payment(payment_request)

            # Retry with payment
            response = await self._make_request(
                method, url, payment=authorization, **kwargs
            )

        return response

    async def _make_request(
        self,
        method: str,
        url: str,
        payment: Optional[PaymentAuthorization] = None,
        **kwargs
    ) -> httpx.Response:
        """Internal method to make HTTP request"""
        return await self.client.request(method, url, payment=payment, **kwargs)

    async def get(self, url: str, auto_retry: Optional[bool] = None, **kwargs) -> httpx.Response:
        """GET request with auto-payment"""
        return await self.fetch(url, method="GET", auto_retry=auto_retry, **kwargs)

    async def post(self, url: str, auto_retry: Optional[bool] = None, **kwargs) -> httpx.Response:
        """POST request with auto-payment"""
        return await self.fetch(url, method="POST", auto_retry=auto_retry, **kwargs)

    async def put(self, url: str, auto_retry: Optional[bool] = None, **kwargs) -> httpx.Response:
        """PUT request with auto-payment"""
        return await self.fetch(url, method="PUT", auto_retry=auto_retry, **kwargs)

    async def delete(self, url: str, auto_retry: Optional[bool] = None, **kwargs) -> httpx.Response:
        """DELETE request with auto-payment"""
        return await self.fetch(url, method="DELETE", auto_retry=auto_retry, **kwargs)
