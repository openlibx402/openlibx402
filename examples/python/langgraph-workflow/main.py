"""
Example LangGraph Workflow with X402 Payment Support

This example demonstrates how to build workflows that include payment nodes
for accessing paid APIs.
"""

from typing import TypedDict, Optional
from langgraph.graph import StateGraph, END
from openlibx402_langgraph import (
    payment_node,
    fetch_with_payment_node,
    check_payment_required,
    create_simple_payment_workflow,
)
from openlibx402_client import X402AutoClient
from solders.keypair import Keypair
import json
import os
import asyncio
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
        return keypair

    # Load existing wallet
    with open(wallet_path) as f:
        wallet_data = json.load(f)
        keypair = Keypair.from_bytes(bytes(wallet_data))

    print(f"✅ Wallet loaded from {wallet_path}")
    print(f"📍 Wallet address: {keypair.pubkey()}")
    return keypair


def example_1_simple_workflow():
    """
    Example 1: Simple workflow using helper function

    This is the easiest way to create a payment-enabled workflow.
    """
    print("\n" + "=" * 60)
    print("📝 Example 1: Simple Payment Workflow")
    print("=" * 60)

    # Load wallet
    keypair = load_wallet_keypair()

    # Create simple workflow
    workflow = create_simple_payment_workflow(
        wallet_keypair=keypair,
        api_url="http://localhost:8000/premium-data",
        max_payment="1.0",
    )

    print("\n🔄 Running workflow...")
    try:
        result = workflow()
        print(f"\n✅ Workflow completed!")
        print(f"   Payment completed: {result.get('payment_completed', False)}")
        if result.get("payment_error"):
            print(f"   Payment error: {result.get('payment_error')}")
        if result.get("api_response"):
            print(f"   Response: {result.get('api_response', '')[:100]}...")
        else:
            print(f"   Response: No response received")
    except Exception as e:
        print(f"\n❌ Error: {e}")


def example_2_custom_workflow():
    """
    Example 2: Custom workflow with separate fetch and payment nodes

    This shows how to build a workflow with explicit payment handling.
    """
    print("\n" + "=" * 60)
    print("📝 Example 2: Custom Workflow with Separate Nodes")
    print("=" * 60)

    # Define state
    class ResearchState(TypedDict):
        api_url: str
        api_response: Optional[str]
        payment_required: bool
        payment_completed: bool
        payment_error: Optional[str]
        wallet_keypair: Keypair
        summary: Optional[str]

    # Load wallet
    keypair = load_wallet_keypair()

    # Helper for running async code
    def _run_async_helper(coro):
        """Helper to run async code in sync context"""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_closed():
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        return loop.run_until_complete(coro)

    # Define custom nodes
    def fetch_api_node(state: ResearchState) -> ResearchState:
        """Fetch from API without payment first"""
        print("   🌐 Fetching API...")

        # Initialize state fields
        state.setdefault("api_response", None)
        state.setdefault("payment_required", False)
        state.setdefault("payment_error", None)
        state.setdefault("payment_completed", False)

        client = X402AutoClient(
            wallet_keypair=state["wallet_keypair"],
            auto_retry=False,  # Don't auto-pay, let workflow handle it
        )

        try:
            response = _run_async_helper(client.fetch(state["api_url"]))
            state["api_response"] = response.text
            state["payment_required"] = False
            print("   ✅ API fetch successful (no payment needed)")
        except Exception as e:
            error_str = str(e)
            if "PAYMENT_REQUIRED" in error_str or "402" in error_str:
                state["payment_required"] = True
                state["api_response"] = None
                print("   💳 Payment required, routing to payment node")
            else:
                state["payment_error"] = error_str
                state["api_response"] = None
                print(f"   ❌ Error: {e}")
        finally:
            _run_async_helper(client.close())

        return state

    def process_node(state: ResearchState) -> ResearchState:
        """Process API response"""
        print("   📊 Processing response...")
        if state["api_response"]:
            # In a real workflow, you might parse and analyze the data
            state["summary"] = f"Received data from {state['api_url']}"
            print(f"   ✅ Processing complete")
        return state

    # Build workflow
    workflow = StateGraph(ResearchState)

    workflow.add_node("fetch", fetch_api_node)
    workflow.add_node("payment", payment_node)
    workflow.add_node("process", process_node)

    workflow.set_entry_point("fetch")

    workflow.add_conditional_edges(
        "fetch",
        check_payment_required,
        {"payment_required": "payment", "success": "process", "error": END},
    )

    workflow.add_edge("payment", "process")  # Process response after payment
    workflow.add_edge("process", END)

    app = workflow.compile()

    # Run workflow
    print("\n🔄 Running workflow...")
    try:
        result = app.invoke(
            {
                "api_url": "http://localhost:8000/premium-data",
                "wallet_keypair": keypair,
                "payment_required": False,
                "payment_completed": False,
            }
        )

        print(f"\n✅ Workflow completed!")
        print(f"   Summary: {result.get('summary')}")
        print(f"   Payment completed: {result.get('payment_completed', False)}")
        if result.get("payment_error"):
            print(f"   Payment error: {result.get('payment_error')}")
    except Exception as e:
        print(f"\n❌ Error: {e}")


def example_3_multi_step_workflow():
    """
    Example 3: Multi-step workflow with multiple API calls

    This demonstrates a workflow that accesses multiple paid APIs.
    """
    print("\n" + "=" * 60)
    print("📝 Example 3: Multi-Step Research Workflow")
    print("=" * 60)

    # Define state
    class MultiStepState(TypedDict):
        wallet_keypair: Keypair
        apis: list
        current_api_index: int
        api_url: str
        api_response: Optional[str]
        payment_required: bool
        payment_completed: bool
        results: list
        max_payment_amount: str

    # Load wallet
    keypair = load_wallet_keypair()

    # Define nodes
    def plan_node(state: MultiStepState) -> MultiStepState:
        """Initialize the research plan"""
        print("   📋 Planning research...")
        state["apis"] = [
            "http://localhost:8000/premium-data",
            "http://localhost:8000/tiered-data/premium",
        ]
        state["current_api_index"] = 0
        state["api_url"] = state["apis"][0]
        state["results"] = []
        print(f"   ✅ Plan: Access {len(state['apis'])} APIs")
        return state

    def collect_result_node(state: MultiStepState) -> MultiStepState:
        """Collect result and move to next API"""
        print(f"   📝 Collecting result from API {state['current_api_index'] + 1}...")

        # Initialize results list if needed
        if "results" not in state:
            state["results"] = []

        # Collect result if available
        if state.get("api_response"):
            state["results"].append(
                {
                    "api": state["api_url"],
                    "response": state["api_response"][:100] + "...",
                }
            )
            print(f"   ✅ Collected response from {state['api_url']}")
        elif state.get("payment_error"):
            print(
                f"   ⚠️  Failed to get response: {state.get('payment_error', 'Unknown error')}"
            )

        # Move to next API
        state["current_api_index"] += 1
        if state["current_api_index"] < len(state["apis"]):
            state["api_url"] = state["apis"][state["current_api_index"]]
            state["api_response"] = None
            state["payment_completed"] = False
            state["payment_error"] = None
            print(f"   ➡️  Moving to API {state['current_api_index'] + 1}")
        else:
            print("   ✅ All APIs processed")

        return state

    def check_more_apis(state: MultiStepState) -> str:
        """Check if there are more APIs to access"""
        if state["current_api_index"] < len(state["apis"]):
            return "fetch_next"
        else:
            return "complete"

    # Build workflow
    workflow = StateGraph(MultiStepState)

    workflow.add_node("plan", plan_node)
    workflow.add_node("fetch", fetch_with_payment_node)
    workflow.add_node("collect", collect_result_node)

    workflow.set_entry_point("plan")
    workflow.add_edge("plan", "fetch")
    workflow.add_edge("fetch", "collect")

    workflow.add_conditional_edges(
        "collect", check_more_apis, {"fetch_next": "fetch", "complete": END}
    )

    app = workflow.compile()

    # Run workflow
    print("\n🔄 Running multi-step workflow...")
    try:
        result = app.invoke({"wallet_keypair": keypair, "max_payment_amount": "5.0"})

        print(f"\n✅ Workflow completed!")
        results = result.get("results", [])
        print(f"   APIs processed: {len(results)}")
        for i, res in enumerate(results, 1):
            print(f"   {i}. {res['api']}: {len(res.get('response', ''))} chars")
        if result.get("payment_error"):
            print(f"   Final payment error: {result.get('payment_error')}")
    except Exception as e:
        print(f"\n❌ Error: {e}")


def main():
    """Run all examples"""
    print("\n" + "=" * 70)
    print("🚀 OpenLibx402 LangGraph Workflow Examples")
    print("=" * 70)
    print("\nThese examples demonstrate how to build workflows that include")
    print("payment nodes for accessing paid APIs.")
    print("\n⚠️  Prerequisites:")
    print("   1. FastAPI server running (see fastapi-server example)")
    print("   2. Wallet funded with SOL and USDC on Solana devnet")
    print("\n💡 Note: If you see payment errors, make sure your wallet is funded:")
    print("   - SOL for transaction fees: solana airdrop 1 <ADDRESS> --url devnet")
    print("   - USDC for payments (you'll need devnet USDC tokens)")
    print("=" * 70)

    # Run examples
    try:
        example_1_simple_workflow()
        input("\n\nPress Enter to continue to Example 2...")
        example_2_custom_workflow()
        input("\n\nPress Enter to continue to Example 3...")
        example_3_multi_step_workflow()
    except KeyboardInterrupt:
        print("\n\n👋 Examples interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")

    print("\n" + "=" * 70)
    print("✅ Examples completed!")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()
