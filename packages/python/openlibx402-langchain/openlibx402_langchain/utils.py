"""
Utility Functions for X402 LangChain Integration

Convenience functions for creating X402-enabled agents.
"""

from typing import Optional, Any, List

try:
    from langchain_openai import ChatOpenAI
    from langchain.agents import create_agent
    from solders.keypair import Keypair

    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False
    ChatOpenAI = None  # type: ignore
    Keypair = None  # type: ignore
    create_agent = None  # type: ignore

from .requests_wrapper import X402RequestsWrapper
from .payment_tool import X402PaymentTool


def create_x402_agent(
    wallet_keypair,
    llm: Optional[Any] = None,
    tools: Optional[List[Any]] = None,
    rpc_url: Optional[str] = None,
    max_payment: str = "1.0",
    allow_local: bool = False,
    system_prompt: Optional[str] = None,
    **agent_kwargs,
):
    """
    Convenience function to create LangChain agent with X402 support

    Usage:
        agent = create_x402_agent(
            wallet_keypair=my_keypair,
            llm=ChatOpenAI(),
            tools=[custom_tool_1, custom_tool_2],
            max_payment="5.0"
        )

        # New invocation pattern for LangChain 1.0+
        inputs = {"messages": [{"role": "user", "content": "Get me premium market data"}]}
        for chunk in agent.stream(inputs, stream_mode="updates"):
            print(chunk)

    Args:
        wallet_keypair: Solana keypair for payments
        llm: Language model (defaults to ChatOpenAI)
        tools: Additional tools to include
        rpc_url: Solana RPC URL
        max_payment: Maximum payment amount
        allow_local: Allow localhost requests for development (default: False)
        system_prompt: Optional system prompt for the agent
        **agent_kwargs: Additional kwargs for create_agent (e.g., debug, checkpointer)

    Returns:
        A compiled StateGraph agent with X402 payment capabilities
    """
    if not LANGCHAIN_AVAILABLE:
        raise ImportError(
            "LangChain not installed. Install with: pip install langchain"
        )

    # Create X402 payment tool
    payment_tool = X402PaymentTool(
        wallet_keypair=wallet_keypair,
        rpc_url=rpc_url,
        max_payment=max_payment,
        allow_local=allow_local,
    )

    # Build tool list
    x402_tools = [payment_tool]
    if tools:
        x402_tools.extend(tools)

    # Default system prompt
    if system_prompt is None:
        system_prompt = (
            "You are a helpful AI assistant with the ability to autonomously "
            "make payments to access premium APIs using the X402 payment protocol. "
            "When you need to access paid API endpoints, use the available payment tools."
        )

    # Create agent using the new LangChain 1.0 API
    agent = create_agent(
        model=llm or ChatOpenAI(),
        tools=x402_tools,
        system_prompt=system_prompt,
        **agent_kwargs,
    )

    return agent
