"""
X402 Payment Tool for LangChain

Allows LangChain agents to make payments for API access.
"""

from typing import Optional
import asyncio

try:
    from langchain.tools import BaseTool
    from pydantic import Field

    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False
    BaseTool = object  # type: ignore
    Field = lambda **kwargs: None  # type: ignore

try:
    from solders.keypair import Keypair

    SOLDERS_AVAILABLE = True
except ImportError:
    SOLDERS_AVAILABLE = False
    Keypair = None  # type: ignore

from openlibx402_client import X402AutoClient
from openlibx402_core import X402Error


class X402PaymentTool(BaseTool):
    """
    LangChain tool that allows agents to make payments for API access

    Usage:
        wallet_keypair = load_keypair()

        payment_tool = X402PaymentTool(
            wallet_keypair=wallet_keypair,
            name="pay_for_api",
            description="Make payment to access premium API data"
        )

        agent = initialize_agent(
            tools=[payment_tool, ...],
            llm=llm,
        )
    """

    name: str = "x402_payment"
    description: str = (
        "Make an X402 payment to access a paid API endpoint. "
        "Input should be a URL to the API endpoint. "
        "Returns the API response after successful payment."
    )

    wallet_keypair: Keypair = Field(exclude=True)
    rpc_url: Optional[str] = Field(default=None, exclude=True)
    max_payment: Optional[str] = Field(default="1.0", exclude=True)
    allow_local: bool = Field(default=False, exclude=True)

    def __init__(self, **data):
        if not LANGCHAIN_AVAILABLE:
            raise ImportError(
                "LangChain not installed. Install with: pip install langchain"
            )
        if not SOLDERS_AVAILABLE:
            raise ImportError(
                "solders not installed. Install with: pip install solders"
            )
        super().__init__(**data)

    def _run(self, url: str, method: str = "GET", **kwargs) -> str:
        """Synchronous run (calls async version)"""
        return asyncio.run(self._arun(url, method, **kwargs))

    async def _arun(self, url: str, method: str = "GET", **kwargs) -> str:
        """
        Make paid API request

        Args:
            url: API endpoint URL
            method: HTTP method
            **kwargs: Additional request parameters

        Returns:
            API response as string
        """
        client = X402AutoClient(
            wallet_keypair=self.wallet_keypair,
            rpc_url=self.rpc_url,
            max_payment_amount=self.max_payment,
            allow_local=self.allow_local,
        )

        try:
            response = await client.fetch(url, method=method, **kwargs)
            return response.text
        except X402Error as e:
            return f"Payment error: {e.code} - {e.message}"
        except Exception as e:
            return f"Error: {str(e)}"
        finally:
            await client.close()
