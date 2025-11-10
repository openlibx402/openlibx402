"""
Example LangChain Agent with X402 Payment Support

This example demonstrates how to create an AI agent that can autonomously
pay for API access using the X402 protocol.
"""

from langchain_openai import ChatOpenAI
from langchain.agents import create_agent
from openlibx402_langchain import (
    X402PaymentTool,
    X402RequestsWrapper,
    create_x402_agent,
)
from solders.keypair import Keypair
import json
import os
import argparse
from dotenv import load_dotenv
from typing import Any

load_dotenv()

# Global verbosity flag
VERBOSE = False


def show_payment_activity(tool_name: str, tool_input: Any) -> None:
    """Display X402 payment activity in simple mode"""
    if not VERBOSE and "x402" in tool_name.lower():
        # Extract URL from tool input
        if isinstance(tool_input, dict):
            url = tool_input.get("url", tool_input.get("input", "API"))
        else:
            url = str(tool_input)

        if isinstance(url, str) and len(url) > 50:
            # Shorten long URLs
            url = url[:47] + "..."
        print(f"  💳 Making X402 payment to access: {url}")


def show_tool_response(content: str, max_length: int = 100) -> None:
    """Display preview of tool response in simple mode"""
    if not VERBOSE and content:
        # Clean and truncate response
        preview = content.strip()
        if len(preview) > max_length:
            preview = preview[:max_length] + "..."
        # Only show if it looks like actual data (not error messages)
        if (
            preview
            and not preview.startswith("Error:")
            and not preview.startswith("Payment error:")
        ):
            print(f"  📊 Received data: {preview}")


def load_wallet_keypair(wallet_path: str = "wallet.json") -> Keypair:
    """Load wallet keypair from JSON file"""
    if not os.path.exists(wallet_path):
        print(f"\n⚠️  Wallet file not found at {wallet_path}")
        print("Creating a new wallet...")
        keypair = Keypair()

        # Save wallet
        wallet_data = list(bytes(keypair))
        with open(wallet_path, "w") as f:
            json.dump(wallet_data, f)

        print(f"✅ New wallet created: {wallet_path}")
        if VERBOSE:
            print(f"📍 Wallet address: {keypair.pubkey()}")
            print("\n⚠️  Important: Fund this wallet with SOL and USDC on devnet!")
            print("   Run: solana airdrop 1 {} --url devnet".format(keypair.pubkey()))
        return keypair

    # Load existing wallet
    with open(wallet_path) as f:
        wallet_data = json.load(f)
        keypair = Keypair.from_bytes(bytes(wallet_data))

    if VERBOSE:
        print(f"✅ Wallet loaded from {wallet_path}")
        print(f"📍 Wallet address: {keypair.pubkey()}")
    return keypair


def example_1_simple_agent():
    """
    Example 1: Simple agent using create_x402_agent helper

    This is the easiest way to create an X402-enabled agent.
    """
    if VERBOSE:
        print("\n" + "=" * 60)
        print("📝 Example 1: Simple X402 Agent")
        print("=" * 60)
    else:
        print("\n[Example 1: Simple X402 Agent]")

    # Load wallet
    keypair = load_wallet_keypair()

    # Create agent with X402 support (one function call!)
    agent = create_x402_agent(
        wallet_keypair=keypair,
        llm=ChatOpenAI(temperature=0),
        max_payment="5.0",  # Safety limit
        allow_local=True,  # Allow localhost for development
        debug=VERBOSE,
    )

    # The agent can now autonomously pay for API access
    if VERBOSE:
        print("\n🤖 Running agent with autonomous payment capability...")
        print(
            "   Asking: 'Get the premium data from http://localhost:8000/premium-data'"
        )
    else:
        print("Running agent...")

    try:
        inputs = {
            "messages": [
                {
                    "role": "user",
                    "content": "Get the premium data from http://localhost:8000/premium-data and tell me what the market price is",
                }
            ]
        }
        result = None
        for chunk in agent.stream(inputs, stream_mode="updates"):
            if "agent" in chunk:
                result = chunk["agent"]
                # Show payment activity and tool responses in simple mode
                if not VERBOSE and "messages" in result:
                    for msg in result["messages"]:
                        # Show when tools are called (payments)
                        if hasattr(msg, "tool_calls") and msg.tool_calls:
                            for tool_call in msg.tool_calls:
                                show_payment_activity(
                                    tool_call.get("name", ""), tool_call.get("args", {})
                                )
                        # Show tool responses (API data received)
                        if (
                            hasattr(msg, "content")
                            and msg.content
                            and hasattr(msg, "type")
                        ):
                            if getattr(msg, "type", None) == "tool":
                                show_tool_response(msg.content)

        if result and "messages" in result:
            final_message = result["messages"][-1]
            print(f"\n✅ Agent response: {final_message.content}")
        else:
            print("\n✅ Agent completed")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        if VERBOSE:
            print(
                "   Make sure the FastAPI server is running (see fastapi-server example)"
            )


def example_2_custom_tools():
    """
    Example 2: Agent with custom tools and X402 payment tool

    This shows how to combine X402 payment capabilities with other tools.
    """
    if VERBOSE:
        print("\n" + "=" * 60)
        print("📝 Example 2: Agent with Custom Tools")
        print("=" * 60)
    else:
        print("\n[Example 2: Agent with Custom Tools]")

    # Load wallet
    keypair = load_wallet_keypair()

    # Create X402 payment tool
    payment_tool = X402PaymentTool(
        wallet_keypair=keypair,
        max_payment="5.0",
        allow_local=True,  # Allow localhost for development
        name="pay_for_api",
        description="Make payment to access premium API data that requires X402 payment",
    )

    # Create agent with X402 payment tool
    agent = create_agent(
        model=ChatOpenAI(temperature=0),
        tools=[payment_tool],
        system_prompt="You are a helpful assistant that can make payments to access premium APIs using the X402 protocol.",
        debug=VERBOSE,
    )

    if VERBOSE:
        print("\n🤖 Running agent with custom tools...")
    else:
        print("Running agent...")

    try:
        inputs = {
            "messages": [
                {
                    "role": "user",
                    "content": "Use the pay_for_api tool to get data from http://localhost:8000/premium-data",
                }
            ]
        }
        result = None
        for chunk in agent.stream(inputs, stream_mode="updates"):
            if "agent" in chunk:
                result = chunk["agent"]
                # Show payment activity and tool responses in simple mode
                if not VERBOSE and "messages" in result:
                    for msg in result["messages"]:
                        # Show when tools are called (payments)
                        if hasattr(msg, "tool_calls") and msg.tool_calls:
                            for tool_call in msg.tool_calls:
                                show_payment_activity(
                                    tool_call.get("name", ""), tool_call.get("args", {})
                                )
                        # Show tool responses (API data received)
                        if (
                            hasattr(msg, "content")
                            and msg.content
                            and hasattr(msg, "type")
                        ):
                            if getattr(msg, "type", None) == "tool":
                                show_tool_response(msg.content)

        if result and "messages" in result:
            final_message = result["messages"][-1]
            print(f"\n✅ Agent response: {final_message.content}")
        else:
            print("\n✅ Agent completed")
    except Exception as e:
        print(f"\n❌ Error: {e}")


def example_3_multi_api():
    """
    Example 3: Agent accessing multiple paid APIs

    This demonstrates how an agent can make multiple payments
    to different APIs in a single workflow.
    """
    if VERBOSE:
        print("\n" + "=" * 60)
        print("📝 Example 3: Multi-API Agent")
        print("=" * 60)
    else:
        print("\n[Example 3: Multi-API Agent]")

    # Load wallet
    keypair = load_wallet_keypair()

    # Create agent with higher payment limit for multiple APIs
    agent = create_x402_agent(
        wallet_keypair=keypair,
        llm=ChatOpenAI(temperature=0),
        max_payment="10.0",  # Higher limit for multiple payments
        allow_local=True,  # Allow localhost for development
        debug=VERBOSE,
    )

    if VERBOSE:
        print("\n🤖 Running agent with multi-API access...")
    else:
        print("Running agent...")

    try:
        inputs = {
            "messages": [
                {
                    "role": "user",
                    "content": "Get data from both http://localhost:8000/premium-data and http://localhost:8000/tiered-data/premium, then compare the results",
                }
            ]
        }
        result = None
        for chunk in agent.stream(inputs, stream_mode="updates"):
            if "agent" in chunk:
                result = chunk["agent"]
                # Show payment activity and tool responses in simple mode
                if not VERBOSE and "messages" in result:
                    for msg in result["messages"]:
                        # Show when tools are called (payments)
                        if hasattr(msg, "tool_calls") and msg.tool_calls:
                            for tool_call in msg.tool_calls:
                                show_payment_activity(
                                    tool_call.get("name", ""), tool_call.get("args", {})
                                )
                        # Show tool responses (API data received)
                        if (
                            hasattr(msg, "content")
                            and msg.content
                            and hasattr(msg, "type")
                        ):
                            if getattr(msg, "type", None) == "tool":
                                show_tool_response(msg.content)

        if result and "messages" in result:
            final_message = result["messages"][-1]
            print(f"\n✅ Agent response: {final_message.content}")
        else:
            print("\n✅ Agent completed")
    except Exception as e:
        print(f"\n❌ Error: {e}")


def main():
    """Run all examples"""
    global VERBOSE

    # Parse command line arguments
    parser = argparse.ArgumentParser(
        description="OpenLibx402 LangChain Agent Examples",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py              # Run with minimal output
  python main.py -v           # Run with verbose output
  python main.py --verbose    # Run with verbose output
        """,
    )
    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="Enable verbose output with detailed logging",
    )
    args = parser.parse_args()
    VERBOSE = args.verbose

    if VERBOSE:
        print("\n" + "=" * 70)
        print("🚀 OpenLibx402 LangChain Agent Examples")
        print("=" * 70)
        print("\nThese examples demonstrate how AI agents can autonomously")
        print("pay for API access using the X402 payment protocol.")
        print("\n⚠️  Prerequisites:")
        print("   1. FastAPI server running (see fastapi-server example)")
        print("   2. Wallet funded with SOL and USDC on Solana devnet")
        print("   3. OpenAI API key set in environment (OPENAI_API_KEY)")
        print("=" * 70)
    else:
        print("\n🚀 OpenLibx402 LangChain Agent Examples")
        print("   (Run with -v or --verbose for detailed output)")

    # Check for OpenAI API key
    if not os.getenv("OPENAI_API_KEY"):
        print("\n❌ Error: OPENAI_API_KEY not found in environment")
        if VERBOSE:
            print("   Set it with: export OPENAI_API_KEY='your-key-here'")
        return

    # Run examples
    try:
        example_1_simple_agent()
        if VERBOSE:
            input("\n\nPress Enter to continue to Example 2...")
        example_2_custom_tools()
        if VERBOSE:
            input("\n\nPress Enter to continue to Example 3...")
        example_3_multi_api()
    except KeyboardInterrupt:
        print("\n\n👋 Examples interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")

    if VERBOSE:
        print("\n" + "=" * 70)
        print("✅ Examples completed!")
        print("=" * 70 + "\n")
    else:
        print("\n✅ All examples completed!\n")


if __name__ == "__main__":
    main()
