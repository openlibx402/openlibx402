"""
OpenLibx402 FastAPI Package

FastAPI middleware and decorators for X402 payment protocol.
"""

__version__ = "0.1.0"

from .config import X402Config, init_x402, get_config, is_initialized
from .decorator import payment_required
from .dependencies import verify_payment, verify_payment_factory
from .responses import build_402_response

__all__ = [
    # Configuration
    "X402Config",
    "init_x402",
    "get_config",
    "is_initialized",
    # Decorator
    "payment_required",
    # Dependencies
    "verify_payment",
    "verify_payment_factory",
    # Response builders
    "build_402_response",
]
