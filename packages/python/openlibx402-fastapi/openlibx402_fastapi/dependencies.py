"""
Dependency Injection for X402 Payments

FastAPI dependencies for payment verification.
"""

import json
from typing import Optional, Callable

from fastapi import Request, HTTPException, Depends
from openlibx402_core import (
    PaymentAuthorization,
    SolanaPaymentProcessor,
    PaymentVerificationError,
    InvalidPaymentRequestError,
)

from .responses import build_402_response
from .config import get_config, is_initialized


async def verify_payment(
    request: Request,
    required_amount: str,
    payment_address: str,
    token_mint: str,
    network: str = "solana-devnet",
    auto_verify: bool = True,
    description: Optional[str] = None,
    expires_in: int = 300,
) -> PaymentAuthorization:
    """
    FastAPI dependency for payment verification

    Usage:
        @app.get("/premium-data")
        async def get_premium_data(
            payment: PaymentAuthorization = Depends(
                verify_payment_factory("0.10", WALLET, TOKEN)
            )
        ):
            return {"data": "Premium content"}

    Args:
        request: FastAPI request object
        required_amount: Payment amount required
        payment_address: Recipient wallet address
        token_mint: Token mint address
        network: Network identifier
        auto_verify: Automatically verify payment on-chain
        description: Human-readable description for the 402 response
        expires_in: Payment validity in seconds

    Returns:
        PaymentAuthorization if payment is valid

    Raises:
        HTTPException: If payment is missing or invalid (returns 402 or 403)
    """
    # Check for payment authorization header
    auth_header = request.headers.get("X-Payment-Authorization")

    if not auth_header:
        # No payment provided, return 402
        response_402 = build_402_response(
            amount=required_amount,
            payment_address=payment_address,
            token_mint=token_mint,
            network=network,
            resource=str(request.url.path),
            description=description,
            expires_in=expires_in,
        )
        raise HTTPException(
            status_code=402,
            detail=json.loads(response_402.body.decode()),
        )

    # Payment authorization provided, parse and verify
    try:
        authorization = PaymentAuthorization.from_header(auth_header)

        # Verify payment amount is sufficient
        if float(authorization.actual_amount) < float(required_amount):
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "Insufficient payment",
                    "required": required_amount,
                    "provided": authorization.actual_amount,
                },
            )

        # Verify payment addresses match
        if authorization.payment_address != payment_address:
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "Payment address mismatch",
                    "expected": payment_address,
                    "provided": authorization.payment_address,
                },
            )

        # Verify token mint matches
        if authorization.asset_address != token_mint:
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "Token mint mismatch",
                    "expected": token_mint,
                    "provided": authorization.asset_address,
                },
            )

        # Verify on-chain if auto_verify is enabled
        if auto_verify and authorization.transaction_hash:
            config = get_config() if is_initialized() else None
            rpc_url = config.get_rpc_url() if config else None

            if not rpc_url:
                # Fall back to network default
                from openlibx402_core.solana_processor import SolanaPaymentProcessor

                processor = SolanaPaymentProcessor("", None)
                rpc_url = processor.get_default_rpc_url(network)

            processor = SolanaPaymentProcessor(rpc_url)

            try:
                verified = await processor.verify_transaction(
                    authorization.transaction_hash,
                    payment_address,
                    authorization.actual_amount,
                    token_mint,
                )

                if not verified:
                    raise PaymentVerificationError("Transaction verification failed")
            finally:
                await processor.close()

        # Payment verified successfully
        return authorization

    except InvalidPaymentRequestError as e:
        raise HTTPException(
            status_code=400,
            detail={"error": "Invalid payment authorization", "message": str(e)},
        )
    except PaymentVerificationError as e:
        raise HTTPException(
            status_code=403,
            detail={"error": "Payment verification failed", "message": str(e)},
        )
    except Exception as e:
        raise HTTPException(
            status_code=403,
            detail={"error": "Payment verification failed", "message": str(e)},
        )


def verify_payment_factory(
    amount: str,
    payment_address: Optional[str] = None,
    token_mint: Optional[str] = None,
    network: Optional[str] = None,
    auto_verify: bool = True,
    description: Optional[str] = None,
    expires_in: int = 300,
) -> Callable:
    """
    Factory for creating payment verification dependency

    Usage:
        @app.get("/premium-data")
        async def get_premium_data(
            payment: PaymentAuthorization = Depends(
                verify_payment_factory(
                    amount="0.10",
                    payment_address=WALLET,
                    token_mint=TOKEN
                )
            )
        ):
            return {"data": "Premium content"}

    Args:
        amount: Payment amount required
        payment_address: Recipient wallet (uses config if not provided)
        token_mint: Token mint address (uses config if not provided)
        network: Network identifier (uses config if not provided)
        auto_verify: Automatically verify payment on-chain
        description: Human-readable description for the 402 response
        expires_in: Payment validity window in seconds

    Returns:
        FastAPI dependency function
    """

    async def _verify(request: Request) -> PaymentAuthorization:
        # Get configuration
        config = None
        if is_initialized():
            config = get_config()

        # Determine parameters (use provided values or config)
        _payment_address = payment_address or (
            config.payment_address if config else None
        )
        _token_mint = token_mint or (config.token_mint if config else None)
        _network = network or (config.network if config else "solana-devnet")

        if not _payment_address or not _token_mint:
            raise ValueError(
                "payment_address and token_mint must be provided "
                "either as factory arguments or via init_x402()"
            )

        return await verify_payment(
            request=request,
            required_amount=amount,
            payment_address=_payment_address,
            token_mint=_token_mint,
            network=_network,
            auto_verify=auto_verify,
            description=description,
            expires_in=expires_in,
        )

    return _verify
