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
from dotenv import load_dotenv

load_dotenv()


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

        print(f"✅ New wallet created and saved to {wallet_path}")
        print(f"📍 Wallet address: {keypair.pubkey()}")
        print("\n⚠️  Important: Fund this wallet with SOL and USDC on devnet!")
        print("   Run: solana airdrop 1 {} --url devnet".format(keypair.pubkey()))
        return keypair

    # Load existing wallet
    with open(wallet_path) as f:
        wallet_data = json.load(f)
        keypair = Keypair.from_bytes(bytes(wallet_data))

    print(f"✅ Wallet loaded from {wallet_path}")
    print(f"📍 Wallet address: {keypair.pubkey()}")
    return keypair


def example_1_simple_agent():
    """
    Example 1: Simple agent using create_x402_agent helper

    This is the easiest way to create an X402-enabled agent.
    """
    print("\n" + "=" * 60)
    print("📝 Example 1: Simple X402 Agent")
    print("=" * 60)

    # Load wallet
    keypair = load_wallet_keypair()

    # Create agent with X402 support (one function call!)
    agent = create_x402_agent(
        wallet_keypair=keypair,
        llm=ChatOpenAI(temperature=0),
        max_payment="5.0",  # Safety limit
        debug=True,
    )

    # The agent can now autonomously pay for API access
    print("\n🤖 Running agent with autonomous payment capability...")
    print("   Asking: 'Get the premium data from http://localhost:8000/premium-data'")

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

        if result and "messages" in result:
            final_message = result["messages"][-1]
            print(f"\n✅ Agent response: {final_message.content}")
        else:
            print("\n✅ Agent completed")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("   Make sure the FastAPI server is running (see fastapi-server example)")


def example_2_custom_tools():
    """
    Example 2: Agent with custom tools and X402 payment tool

    This shows how to combine X402 payment capabilities with other tools.
    """
    print("\n" + "=" * 60)
    print("📝 Example 2: Agent with Custom Tools")
    print("=" * 60)

    # Load wallet
    keypair = load_wallet_keypair()

    # Create X402 payment tool
    payment_tool = X402PaymentTool(
        wallet_keypair=keypair,
        max_payment="5.0",
        name="pay_for_api",
        description="Make payment to access premium API data that requires X402 payment",
    )

    # Create agent with X402 payment tool
    agent = create_agent(
        model=ChatOpenAI(temperature=0),
        tools=[payment_tool],
        system_prompt="You are a helpful assistant that can make payments to access premium APIs using the X402 protocol.",
        debug=True,
    )

    print("\n🤖 Running agent with custom tools...")
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
    print("\n" + "=" * 60)
    print("📝 Example 3: Multi-API Agent")
    print("=" * 60)

    # Load wallet
    keypair = load_wallet_keypair()

    # Create agent with higher payment limit for multiple APIs
    agent = create_x402_agent(
        wallet_keypair=keypair,
        llm=ChatOpenAI(temperature=0),
        max_payment="10.0",  # Higher limit for multiple payments
        debug=True,
    )

    print("\n🤖 Running agent with multi-API access...")
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

        if result and "messages" in result:
            final_message = result["messages"][-1]
            print(f"\n✅ Agent response: {final_message.content}")
        else:
            print("\n✅ Agent completed")
    except Exception as e:
        print(f"\n❌ Error: {e}")


def main():
    """Run all examples"""
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

    # Check for OpenAI API key
    if not os.getenv("OPENAI_API_KEY"):
        print("\n❌ Error: OPENAI_API_KEY not found in environment")
        print("   Set it with: export OPENAI_API_KEY='your-key-here'")
        return

    # Run examples
    try:
        example_1_simple_agent()
        input("\n\nPress Enter to continue to Example 2...")
        example_2_custom_tools()
        input("\n\nPress Enter to continue to Example 3...")
        example_3_multi_api()
    except KeyboardInterrupt:
        print("\n\n👋 Examples interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")

    print("\n" + "=" * 70)
    print("✅ Examples completed!")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()
