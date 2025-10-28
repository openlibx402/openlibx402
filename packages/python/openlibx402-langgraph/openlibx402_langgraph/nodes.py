"""
Payment Nodes for LangGraph

Reusable nodes for handling X402 payments in LangGraph workflows.
"""
from typing import TypedDict, Optional
import asyncio

try:
    from solders.keypair import Keypair
    SOLDERS_AVAILABLE = True
except ImportError:
    SOLDERS_AVAILABLE = False
    Keypair = None  # type: ignore

from openlibx402_client import X402AutoClient
from openlibx402_core import X402Error


def _run_async(coro):
    """Helper to run async code in sync context, handling event loop properly"""
    # Try to get or create event loop
    try:
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            # Loop exists but is closed, create new one
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
    except RuntimeError:
        # No event loop exists, create one
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    return loop.run_until_complete(coro)


def payment_node(state: dict) -> dict:
    """
    LangGraph node that handles X402 payment

    Usage in graph:
        workflow = StateGraph(AgentState)
        workflow.add_node("fetch_api", fetch_api_node)
        workflow.add_node("make_payment", payment_node)
        workflow.add_node("process_response", process_response_node)

        workflow.add_conditional_edges(
            "fetch_api",
            check_payment_required,
            {
                "payment_required": "make_payment",
                "success": "process_response"
            }
        )

    Expected state keys:
        - wallet_keypair: Keypair for payments
        - api_url: URL to fetch
        - payment_required: bool indicating payment is needed

    Returns state with:
        - api_response: API response text
        - payment_completed: bool
        - payment_error: Optional error message
    """
    client = X402AutoClient(
        wallet_keypair=state["wallet_keypair"],
        auto_retry=True,
    )

    try:
        response = _run_async(client.fetch(state["api_url"]))
        state["api_response"] = response.text
        state["payment_completed"] = True
        state["payment_error"] = None
    except X402Error as e:
        state["payment_error"] = f"{e.code}: {e.message}"
        state["payment_completed"] = False
    except Exception as e:
        state["payment_error"] = str(e)
        state["payment_completed"] = False
    finally:
        _run_async(client.close())

    return state


async def async_payment_node(state: dict) -> dict:
    """
    Async version of payment node

    Use this when your LangGraph workflow uses async nodes.
    """
    client = X402AutoClient(
        wallet_keypair=state["wallet_keypair"],
        auto_retry=True,
    )

    try:
        response = await client.fetch(state["api_url"])
        state["api_response"] = response.text
        state["payment_completed"] = True
        state["payment_error"] = None
    except X402Error as e:
        state["payment_error"] = f"{e.code}: {e.message}"
        state["payment_completed"] = False
    except Exception as e:
        state["payment_error"] = str(e)
        state["payment_completed"] = False
    finally:
        await client.close()

    return state


def fetch_with_payment_node(state: dict) -> dict:
    """
    Combined node that fetches API and handles payment automatically

    This is simpler than separate nodes but gives less control.

    Expected state keys:
        - wallet_keypair: Keypair for payments
        - api_url: URL to fetch
        - max_payment_amount: Optional maximum payment limit

    Returns state with:
        - api_response: API response text
        - payment_completed: bool
        - payment_error: Optional error message
    """
    max_payment = state.get("max_payment_amount", "1.0")

    # Initialize response fields
    state.setdefault("api_response", None)
    state.setdefault("payment_completed", False)
    state.setdefault("payment_error", None)

    client = X402AutoClient(
        wallet_keypair=state["wallet_keypair"],
        max_payment_amount=max_payment,
    )

    try:
        response = _run_async(
            client.fetch(
                state["api_url"],
                method=state.get("http_method", "GET")
            )
        )
        state["api_response"] = response.text
        state["payment_completed"] = True
        state["payment_error"] = None
    except X402Error as e:
        state["payment_error"] = f"[{e.code}] {e.message}"
        state["payment_completed"] = False
        state["api_response"] = None
    except Exception as e:
        state["payment_error"] = str(e)
        state["payment_completed"] = False
        state["api_response"] = None
    finally:
        _run_async(client.close())

    return state


async def async_fetch_with_payment_node(state: dict) -> dict:
    """Async version of fetch_with_payment_node"""
    max_payment = state.get("max_payment_amount", "1.0")

    client = X402AutoClient(
        wallet_keypair=state["wallet_keypair"],
        max_payment_amount=max_payment,
    )

    try:
        response = await client.fetch(
            state["api_url"],
            method=state.get("http_method", "GET")
        )
        state["api_response"] = response.text
        state["payment_completed"] = True
        state["payment_error"] = None
    except X402Error as e:
        state["payment_error"] = f"{e.code}: {e.message}"
        state["payment_completed"] = False
    except Exception as e:
        state["payment_error"] = str(e)
        state["payment_completed"] = False
    finally:
        await client.close()

    return state


def check_payment_required(state: dict) -> str:
    """
    Conditional edge function for routing based on payment status

    Usage:
        workflow.add_conditional_edges(
            "fetch_api",
            check_payment_required,
            {
                "payment_required": "make_payment",
                "success": "process_response",
                "error": END
            }
        )

    Returns:
        - "payment_required" if payment is needed
        - "success" if request succeeded
        - "error" if there was an error
    """
    if state.get("payment_required"):
        return "payment_required"
    elif state.get("api_response"):
        return "success"
    elif state.get("payment_error"):
        return "error"
    else:
        return "error"


def check_payment_completed(state: dict) -> str:
    """
    Conditional edge function for checking payment completion

    Returns:
        - "completed" if payment succeeded
        - "failed" if payment failed
    """
    if state.get("payment_completed"):
        return "completed"
    else:
        return "failed"
