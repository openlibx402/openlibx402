/**
 * OpenLibx402 LangGraph Package
 *
 * LangGraph.js integration for X402 payment protocol.
 */

export const VERSION = "0.1.1";

// Payment nodes
export {
  paymentNode,
  fetchWithPaymentNode,
  checkPaymentRequired,
  checkPaymentCompleted,
} from "./nodes";

export type { PaymentState } from "./nodes";

// Re-export client for convenience
export { X402AutoClient } from "@openlibx402/client";
