"""
Payment Required Decorator for FastAPI

Decorator for adding X402 payment requirements to endpoints.
"""
from typing import Optional, Callable, Any
from functools import wraps

from fastapi import Request, Response
from openlibx402_core import (
    PaymentAuthorization,
    SolanaPaymentProcessor,
    PaymentVerificationError,
)

from .responses import build_402_response
from .config import get_config, is_initialized


def payment_required(
    amount: str,
    payment_address: Optional[str] = None,
    token_mint: Optional[str] = None,
    network: Optional[str] = None,
    description: Optional[str] = None,
    expires_in: int = 300,
    auto_verify: bool = True,
):
    """
    Decorator for FastAPI endpoints requiring payment

    Usage:
        @app.get("/premium-data")
        @payment_required(
            amount="0.10",
            payment_address="YOUR_WALLET_ADDRESS",
            token_mint="USDC_MINT_ADDRESS"
        )
        async def get_premium_data():
            return {"data": "Premium content"}

    Args:
        amount: Payment amount required
        payment_address: Recipient wallet (uses config if not provided)
        token_mint: Token mint address (uses config if not provided)
        network: Network identifier (uses config if not provided)
        description: Human-readable description
        expires_in: Payment validity in seconds
        auto_verify: Automatically verify payment on-chain
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            # Extract request from args/kwargs
            request: Optional[Request] = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break

            if not request:
                request = kwargs.get('request')

            if not request:
                raise ValueError(
                    "payment_required decorator requires Request parameter. "
                    "Add 'request: Request' to your endpoint signature."
                )

            # Get configuration
            config = None
            if is_initialized():
                config = get_config()

            # Determine parameters (use provided values or config)
            _payment_address = payment_address or (config.payment_address if config else None)
            _token_mint = token_mint or (config.token_mint if config else None)
            _network = network or (config.network if config else "solana-devnet")

            if not _payment_address or not _token_mint:
                raise ValueError(
                    "payment_address and token_mint must be provided "
                    "either as decorator arguments or via init_x402()"
                )

            # Check for payment authorization header
            auth_header = request.headers.get("X-Payment-Authorization")

            if not auth_header:
                # No payment provided, return 402
                return build_402_response(
                    amount=amount,
                    payment_address=_payment_address,
                    token_mint=_token_mint,
                    network=_network,
                    resource=str(request.url.path),
                    description=description,
                    expires_in=expires_in,
                )

            # Payment authorization provided, verify it
            try:
                authorization = PaymentAuthorization.from_header(auth_header)

                # Verify payment if auto_verify is enabled
                if auto_verify and authorization.transaction_hash:
                    rpc_url = config.get_rpc_url() if config else None
                    if not rpc_url:
                        raise ValueError("RPC URL not configured for payment verification")

                    processor = SolanaPaymentProcessor(rpc_url)

                    try:
                        verified = await processor.verify_transaction(
                            authorization.transaction_hash,
                            _payment_address,
                            authorization.actual_amount,
                            _token_mint,
                        )

                        if not verified:
                            raise PaymentVerificationError("Transaction verification failed")
                    finally:
                        await processor.close()

                # Payment verified, call original function
                return await func(*args, **kwargs)

            except Exception as e:
                # Payment verification failed
                from fastapi.responses import JSONResponse
                return JSONResponse(
                    status_code=403,
                    content={
                        "error": "Payment verification failed",
                        "message": str(e)
                    }
                )

        return wrapper

    return decorator
