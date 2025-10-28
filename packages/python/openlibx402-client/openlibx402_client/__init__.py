"""
OpenLibX402 Client Package

HTTP client libraries for making X402-enabled API calls with automatic payment handling.
"""

__version__ = "0.1.0"

from .explicit_client import X402Client
from .implicit_client import X402AutoClient

__all__ = [
    "X402Client",
    "X402AutoClient",
]
