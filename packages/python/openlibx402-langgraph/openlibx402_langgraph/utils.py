"""
Utility Functions for X402 LangGraph Integration

Helper functions for creating payment-enabled workflows.
"""
from typing import TypedDict, Optional, Any

try:
    from langgraph.graph import StateGraph
    from solders.keypair import Keypair
    LANGGRAPH_AVAILABLE = True
except ImportError:
    LANGGRAPH_AVAILABLE = False
    StateGraph = None  # type: ignore
    Keypair = None  # type: ignore


class PaymentState(TypedDict, total=False):
    """
    Base state schema for payment-enabled workflows

    Usage:
        class MyAgentState(PaymentState):
            # Add your custom fields
            messages: list
            other_data: str

        workflow = StateGraph(MyAgentState)
    """
    wallet_keypair: Any  # Keypair
    api_url: str
    api_response: Optional[str]
    http_method: str
    payment_required: bool
    payment_completed: bool
    payment_error: Optional[str]
    max_payment_amount: Optional[str]


def create_payment_capable_state(base_state: type) -> type:
    """
    Create a new state class with payment capabilities

    Usage:
        class MyState(TypedDict):
            messages: list
            data: str

        PaymentCapableState = create_payment_capable_state(MyState)
        workflow = StateGraph(PaymentCapableState)

    Args:
        base_state: Base state TypedDict class

    Returns:
        New state class with payment fields
    """
    class PaymentCapableState(base_state, PaymentState):
        pass

    return PaymentCapableState


def add_payment_workflow(
    graph: StateGraph,
    fetch_node_name: str,
    payment_node_name: str = "x402_payment",
    process_node_name: Optional[str] = None,
) -> StateGraph:
    """
    Add payment nodes and edges to an existing workflow

    Usage:
        workflow = StateGraph(AgentState)
        workflow.add_node("fetch_api", my_fetch_node)
        workflow.add_node("process", my_process_node)

        # Add payment capability
        add_payment_workflow(
            workflow,
            fetch_node_name="fetch_api",
            process_node_name="process"
        )

    Args:
        graph: StateGraph to modify
        fetch_node_name: Name of the node that fetches API
        payment_node_name: Name to give the payment node
        process_node_name: Name of the node to call after success

    Returns:
        Modified graph
    """
    if not LANGGRAPH_AVAILABLE:
        raise ImportError(
            "LangGraph not installed. Install with: pip install langgraph"
        )

    from .nodes import payment_node, check_payment_required

    # Add payment node
    graph.add_node(payment_node_name, payment_node)

    # Add conditional edges from fetch node
    if process_node_name:
        graph.add_conditional_edges(
            fetch_node_name,
            check_payment_required,
            {
                "payment_required": payment_node_name,
                "success": process_node_name,
                "error": "__end__"  # LangGraph END marker
            }
        )

        # Retry fetch after payment
        graph.add_edge(payment_node_name, fetch_node_name)
    else:
        graph.add_conditional_edges(
            fetch_node_name,
            check_payment_required,
            {
                "payment_required": payment_node_name,
                "success": "__end__",
                "error": "__end__"
            }
        )

    return graph


def create_simple_payment_workflow(
    wallet_keypair,
    api_url: str,
    process_node: Optional[Any] = None,
    max_payment: str = "1.0",
):
    """
    Create a simple payment workflow for quick testing

    Usage:
        workflow = create_simple_payment_workflow(
            wallet_keypair=keypair,
            api_url="https://api.example.com/data"
        )

        result = workflow.invoke({})

    Args:
        wallet_keypair: Solana keypair for payments
        api_url: API URL to fetch
        process_node: Optional processing node
        max_payment: Maximum payment amount

    Returns:
        Compiled workflow
    """
    if not LANGGRAPH_AVAILABLE:
        raise ImportError(
            "LangGraph not installed. Install with: pip install langgraph"
        )

    from .nodes import fetch_with_payment_node

    # Define simple state
    class SimpleState(PaymentState):
        pass

    workflow = StateGraph(SimpleState)

    # Add fetch+payment node
    workflow.add_node("fetch", fetch_with_payment_node)

    # Set entry point
    workflow.set_entry_point("fetch")

    # Add process node if provided
    if process_node:
        workflow.add_node("process", process_node)
        workflow.add_edge("fetch", "process")
        workflow.add_edge("process", "__end__")
    else:
        workflow.add_edge("fetch", "__end__")

    # Compile with initial state
    compiled = workflow.compile()

    # Wrap to inject wallet and url
    def invoke_wrapper(state: Optional[dict] = None):
        state = state or {}
        state["wallet_keypair"] = wallet_keypair
        state["api_url"] = api_url
        state["max_payment_amount"] = max_payment
        return compiled.invoke(state)

    return invoke_wrapper
