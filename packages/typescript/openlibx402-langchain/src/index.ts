/**
 * OpenLibx402 LangChain Package
 *
 * LangChain.js integration for X402 payment protocol.
 */

export const VERSION = "0.1.0";

// Payment tool
export { X402PaymentTool, createX402PaymentTool } from "./payment-tool";
export type { X402PaymentToolOptions } from "./payment-tool";

// Re-export client for convenience
export { X402AutoClient } from "@openlibx402/client";
