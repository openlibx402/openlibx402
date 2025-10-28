"""
Explicit X402 Client

Manual payment control - developer explicitly handles payment flow.
"""
from typing import Optional
from decimal import Decimal
from urllib.parse import urlparse
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

    Usage (Production):
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

        # Always cleanup
        await client.close()

    Usage (Local Development):
        # Enable allow_local for localhost URLs
        client = X402Client(wallet_keypair, allow_local=True)

        response = await client.get("http://localhost:3000/api/data")

        if client.payment_required(response):
            payment_request = client.parse_payment_request(response)
            authorization = await client.create_payment(payment_request)
            response = await client.get(
                "http://localhost:3000/api/data",
                payment=authorization
            )

        await client.close()

    Security Notes:
        - Always call close() when done to properly cleanup connections
        - Private keys are held in memory - ensure proper disposal
        - Only use URLs from trusted sources to prevent SSRF attacks
        - Default RPC URL is devnet - use mainnet URL for production
        - Set allow_local=True for local development (localhost URLs)
        - NEVER use allow_local=True in production deployments
    """

    def __init__(
        self,
        wallet_keypair: Keypair,
        rpc_url: Optional[str] = None,
        http_client: Optional[httpx.AsyncClient] = None,
        allow_local: bool = False,
    ):
        """
        Initialize X402 client

        Args:
            wallet_keypair: Solana wallet keypair for payments
            rpc_url: Solana RPC URL (defaults to devnet)
            http_client: Optional custom HTTP client
            allow_local: Allow requests to localhost/private IPs (dev mode)
                        WARNING: Only enable for local development!
        """
        if not SOLDERS_AVAILABLE:
            raise ImportError(
                "solders library not installed. "
                "Install with: pip install solders"
            )

        self.wallet_keypair = wallet_keypair
        self.http_client = http_client or httpx.AsyncClient(verify=True)
        self.processor = SolanaPaymentProcessor(
            rpc_url or "https://api.devnet.solana.com",
            keypair=wallet_keypair
        )
        self._closed = False
        self._allow_local = allow_local

    async def close(self):
        """
        Close HTTP and RPC connections and cleanup sensitive data

        IMPORTANT: Always call this method when done to properly cleanup
        connections and attempt to clear sensitive data from memory.
        """
        if self._closed:
            return

        await self.http_client.aclose()
        await self.processor.close()

        # Attempt to clear sensitive data (best-effort)
        # Note: Python doesn't guarantee immediate memory cleanup
        self.wallet_keypair = None  # type: ignore
        self._closed = True

    def _validate_url(self, url: str) -> None:
        """
        Basic URL validation to prevent common SSRF attacks

        Raises:
            ValueError: If URL is invalid or potentially dangerous
        """
        try:
            parsed = urlparse(url)

            # Require https or http scheme
            if parsed.scheme not in ('http', 'https'):
                raise ValueError(f"Invalid URL scheme: {parsed.scheme}. Only http/https allowed")

            hostname = parsed.hostname
            if not hostname:
                raise ValueError("URL must have a valid hostname")

            # Skip localhost/private IP checks if allow_local is enabled
            if self._allow_local:
                return

            # Reject localhost and private IPs (basic check)
            hostname_lower = hostname.lower()

            # Check for localhost
            if hostname_lower in ('localhost', '127.0.0.1', '::1'):
                raise ValueError(
                    "Requests to localhost are not allowed. "
                    "For local development, set allow_local=True in constructor"
                )

            # Check for private IP ranges (basic check)
            if hostname_lower.startswith(('10.', '192.168.', '172.16.', '172.17.',
                                           '172.18.', '172.19.', '172.20.', '172.21.',
                                           '172.22.', '172.23.', '172.24.', '172.25.',
                                           '172.26.', '172.27.', '172.28.', '172.29.',
                                           '172.30.', '172.31.')):
                raise ValueError(
                    "Requests to private IP addresses are not allowed. "
                    "For local development, set allow_local=True in constructor"
                )

        except Exception as e:
            if isinstance(e, ValueError):
                raise
            raise ValueError(f"Invalid URL: {e}")

    async def get(
        self,
        url: str,
        payment: Optional[PaymentAuthorization] = None,
        **kwargs
    ) -> httpx.Response:
        """Make GET request with optional payment"""
        self._validate_url(url)
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
        self._validate_url(url)
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
        self._validate_url(url)
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
        self._validate_url(url)
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

        Note:
            Balance check is advisory only - the actual transaction may fail
            if balance changes between check and broadcast. Server should also
            validate that payment request hasn't expired.
        """
        from datetime import datetime, timezone

        # Validate request not expired (advisory check)
        if request.is_expired():
            raise PaymentExpiredError(request)

        # Use provided amount or max required
        pay_amount = amount or request.max_amount_required

        # Check sufficient balance using Decimal for precise comparison
        balance = await self.processor.get_token_balance(
            str(self.wallet_keypair.pubkey()),
            request.asset_address
        )

        # Use Decimal for precise currency comparison
        balance_decimal = Decimal(str(balance))
        amount_decimal = Decimal(pay_amount)

        if balance_decimal < amount_decimal:
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
        # Note: In Solana, the transaction signature IS the transaction hash
        return PaymentAuthorization(
            payment_id=request.payment_id,
            actual_amount=pay_amount,
            payment_address=request.payment_address,
            asset_address=request.asset_address,
            network=request.network,
            timestamp=datetime.now(timezone.utc),
            signature=tx_hash,  # Solana transaction signature
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
