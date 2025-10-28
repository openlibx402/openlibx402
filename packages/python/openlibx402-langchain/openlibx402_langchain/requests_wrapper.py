"""
X402 Requests Wrapper for LangChain

Drop-in replacement for LangChain's RequestsWrapper with X402 support.
"""
from typing import Optional
import asyncio

try:
    from langchain.requests import RequestsWrapper
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False
    RequestsWrapper = object  # type: ignore

try:
    from solders.keypair import Keypair
    SOLDERS_AVAILABLE = True
except ImportError:
    SOLDERS_AVAILABLE = False
    Keypair = None  # type: ignore

from openlibx402_client import X402AutoClient


class X402RequestsWrapper(RequestsWrapper):
    """
    Drop-in replacement for LangChain's RequestsWrapper with X402 support

    Usage:
        from langchain.agents import load_tools

        wallet_keypair = load_keypair()

        requests_wrapper = X402RequestsWrapper(
            wallet_keypair=wallet_keypair
        )

        # Use with LangChain tools that make HTTP requests
        tools = load_tools(
            ["requests_all"],
            llm=llm,
            requests_wrapper=requests_wrapper
        )
    """

    def __init__(
        self,
        wallet_keypair: Keypair,
        rpc_url: Optional[str] = None,
        max_payment: Optional[str] = "1.0",
        **kwargs
    ):
        if not LANGCHAIN_AVAILABLE:
            raise ImportError(
                "LangChain not installed. Install with: pip install langchain"
            )
        if not SOLDERS_AVAILABLE:
            raise ImportError(
                "solders not installed. Install with: pip install solders"
            )

        super().__init__(**kwargs)
        self.client = X402AutoClient(
            wallet_keypair=wallet_keypair,
            rpc_url=rpc_url,
            max_payment_amount=max_payment,
        )

    async def aget(self, url: str, **kwargs) -> str:
        """Async GET with X402 support"""
        response = await self.client.get(url, **kwargs)
        return response.text

    async def apost(self, url: str, **kwargs) -> str:
        """Async POST with X402 support"""
        response = await self.client.post(url, **kwargs)
        return response.text

    async def aput(self, url: str, **kwargs) -> str:
        """Async PUT with X402 support"""
        response = await self.client.put(url, **kwargs)
        return response.text

    async def adelete(self, url: str, **kwargs) -> str:
        """Async DELETE with X402 support"""
        response = await self.client.delete(url, **kwargs)
        return response.text

    def get(self, url: str, **kwargs) -> str:
        """Sync GET with X402 support"""
        return asyncio.run(self.aget(url, **kwargs))

    def post(self, url: str, **kwargs) -> str:
        """Sync POST with X402 support"""
        return asyncio.run(self.apost(url, **kwargs))

    def put(self, url: str, **kwargs) -> str:
        """Sync PUT with X402 support"""
        return asyncio.run(self.aput(url, **kwargs))

    def delete(self, url: str, **kwargs) -> str:
        """Sync DELETE with X402 support"""
        return asyncio.run(self.adelete(url, **kwargs))
