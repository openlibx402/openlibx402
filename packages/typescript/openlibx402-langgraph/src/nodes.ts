/**
 * Payment Nodes for LangGraph.js
 *
 * Reusable nodes for handling X402 payments in LangGraph workflows.
 */

import { Keypair } from '@solana/web3.js';
import { X402AutoClient } from '@openlibx402/client';
import { X402Error } from '@openlibx402/core';

export interface PaymentState {
  wallet_keypair?: Keypair;
  api_url?: string;
  api_response?: string;
  payment_completed?: boolean;
  payment_error?: string | null;
  payment_required?: boolean;
  max_payment_amount?: string;
  http_method?: string;
  [key: string]: any;
}

/**
 * LangGraph node that handles X402 payment
 *
 * Usage in graph:
 *   const workflow = new StateGraph<PaymentState>({ ... });
 *   workflow.addNode("fetch_api", fetchApiNode);
 *   workflow.addNode("make_payment", paymentNode);
 *   workflow.addNode("process_response", processResponseNode);
 *
 *   workflow.addConditionalEdges(
 *     "fetch_api",
 *     checkPaymentRequired,
 *     {
 *       payment_required: "make_payment",
 *       success: "process_response"
 *     }
 *   );
 *
 * Expected state keys:
 *   - wallet_keypair: Keypair for payments
 *   - api_url: URL to fetch
 *   - payment_required: bool indicating payment is needed
 *
 * Returns state with:
 *   - api_response: API response text
 *   - payment_completed: bool
 *   - payment_error: Optional error message
 */
export async function paymentNode(state: PaymentState): Promise<PaymentState> {
  if (!state.wallet_keypair) {
    return {
      ...state,
      payment_error: 'wallet_keypair is required',
      payment_completed: false,
    };
  }

  if (!state.api_url) {
    return {
      ...state,
      payment_error: 'api_url is required',
      payment_completed: false,
    };
  }

  const client = new X402AutoClient(state.wallet_keypair, undefined, {
    autoRetry: true,
  });

  try {
    const response = await client.fetch(state.api_url);
    return {
      ...state,
      api_response:
        typeof response.data === 'string'
          ? response.data
          : JSON.stringify(response.data),
      payment_completed: true,
      payment_error: null,
    };
  } catch (error) {
    if (error instanceof X402Error) {
      return {
        ...state,
        payment_error: `${error.code}: ${error.message}`,
        payment_completed: false,
      };
    }
    return {
      ...state,
      payment_error: (error as Error).message,
      payment_completed: false,
    };
  } finally {
    await client.close();
  }
}

/**
 * Combined node that fetches API and handles payment automatically
 *
 * This is simpler than separate nodes but gives less control.
 *
 * Expected state keys:
 *   - wallet_keypair: Keypair for payments
 *   - api_url: URL to fetch
 *   - max_payment_amount: Optional maximum payment limit
 *   - http_method: Optional HTTP method (default: GET)
 *
 * Returns state with:
 *   - api_response: API response text
 *   - payment_completed: bool
 *   - payment_error: Optional error message
 */
export async function fetchWithPaymentNode(
  state: PaymentState
): Promise<PaymentState> {
  if (!state.wallet_keypair) {
    return {
      ...state,
      payment_error: 'wallet_keypair is required',
      payment_completed: false,
      api_response: undefined,
    };
  }

  if (!state.api_url) {
    return {
      ...state,
      payment_error: 'api_url is required',
      payment_completed: false,
      api_response: undefined,
    };
  }

  const maxPayment = state.max_payment_amount || '1.0';

  const client = new X402AutoClient(state.wallet_keypair, undefined, {
    maxPaymentAmount: maxPayment,
  });

  try {
    const response = await client.fetch(state.api_url, {
      method: state.http_method || 'GET',
    });

    return {
      ...state,
      api_response:
        typeof response.data === 'string'
          ? response.data
          : JSON.stringify(response.data),
      payment_completed: true,
      payment_error: null,
    };
  } catch (error) {
    if (error instanceof X402Error) {
      return {
        ...state,
        payment_error: `[${error.code}] ${error.message}`,
        payment_completed: false,
        api_response: undefined,
      };
    }
    return {
      ...state,
      payment_error: (error as Error).message,
      payment_completed: false,
      api_response: undefined,
    };
  } finally {
    await client.close();
  }
}

/**
 * Conditional edge function for routing based on payment status
 *
 * Usage:
 *   workflow.addConditionalEdges(
 *     "fetch_api",
 *     checkPaymentRequired,
 *     {
 *       payment_required: "make_payment",
 *       success: "process_response",
 *       error: END
 *     }
 *   );
 *
 * Returns:
 *   - "payment_required" if payment is needed
 *   - "success" if request succeeded
 *   - "error" if there was an error
 */
export function checkPaymentRequired(state: PaymentState): string {
  if (state.payment_required) {
    return 'payment_required';
  } else if (state.api_response) {
    return 'success';
  } else if (state.payment_error) {
    return 'error';
  } else {
    return 'error';
  }
}

/**
 * Conditional edge function for checking payment completion
 *
 * Returns:
 *   - "completed" if payment succeeded
 *   - "failed" if payment failed
 */
export function checkPaymentCompleted(state: PaymentState): string {
  if (state.payment_completed) {
    return 'completed';
  } else {
    return 'failed';
  }
}
