"""
Response Builders for X402

Utilities for building properly formatted 402 Payment Required responses.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
import secrets

from fastapi.responses import JSONResponse
from openlibx402_core import PaymentRequest


def build_402_response(
    amount: str,
    payment_address: str,
    token_mint: str,
    network: str,
    resource: str,
    description: Optional[str] = None,
    expires_in: int = 300,
) -> JSONResponse:
    """
    Build a properly formatted 402 Payment Required response

    Args:
        amount: Payment amount required
        payment_address: Recipient wallet address
        token_mint: Token mint address (e.g., USDC)
        network: Network identifier (e.g., "solana-devnet")
        resource: API endpoint being accessed
        description: Human-readable description
        expires_in: Payment validity in seconds

    Returns:
        JSONResponse with 402 status code and payment details
    """
    payment_request = PaymentRequest(
        max_amount_required=amount,
        asset_type="SPL",
        asset_address=token_mint,
        payment_address=payment_address,
        network=network,
        expires_at=datetime.now(timezone.utc) + timedelta(seconds=expires_in),
        nonce=secrets.token_urlsafe(32),
        payment_id=secrets.token_urlsafe(16),
        resource=resource,
        description=description,
    )

    return JSONResponse(
        status_code=402,
        content=payment_request.to_dict(),
        headers={
            "X-Payment-Required": "true",
            "X-Payment-Protocol": "x402",
            "X-Payment-Amount": amount,
            "X-Payment-Asset": token_mint,
        }
    )
