"""
Configuration Management for OpenLibX402 FastAPI

Global configuration and settings management.
"""
from typing import Optional
from pydantic import BaseModel


class X402Config(BaseModel):
    """Global X402 configuration"""

    payment_address: str
    token_mint: str
    network: str = "solana-devnet"
    rpc_url: Optional[str] = None
    default_amount: str = "0.01"
    payment_timeout: int = 300  # seconds
    auto_verify: bool = True

    class Config:
        env_prefix = "X402_"  # Load from X402_* environment variables

    def get_rpc_url(self) -> str:
        """Get RPC URL with default fallback"""
        if self.rpc_url:
            return self.rpc_url

        # Default URLs by network
        urls = {
            "solana-mainnet": "https://api.mainnet-beta.solana.com",
            "solana-devnet": "https://api.devnet.solana.com",
            "solana-testnet": "https://api.testnet.solana.com",
        }
        return urls.get(self.network, "https://api.devnet.solana.com")


# Singleton configuration
_config: Optional[X402Config] = None


def init_x402(config: X402Config):
    """Initialize global X402 configuration"""
    global _config
    _config = config


def get_config() -> X402Config:
    """Get global X402 configuration"""
    if _config is None:
        raise RuntimeError("X402 not initialized. Call init_x402() first.")
    return _config


def is_initialized() -> bool:
    """Check if X402 has been initialized"""
    return _config is not None
