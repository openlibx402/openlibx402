/**
 * OpenLibx402 Next.js Package
 *
 * Next.js middleware and utilities for X402 payment protocol.
 */

export const VERSION = "0.1.0";

// Configuration
export { X402Config, initX402, getConfig, isInitialized } from "./config";
export type { X402ConfigOptions } from "./config";

// Middleware
export { withPayment } from "./middleware";
export type {
  PaymentRequiredOptions,
  X402Handler,
  X402HandlerContext,
} from "./middleware";

// Response builders
export { build402Response } from "./responses";
export type { Build402ResponseOptions } from "./responses";

// Re-export core types for convenience
export type {
  PaymentRequestData,
  PaymentAuthorizationData,
} from "@openlibx402/core";
export { PaymentRequest, PaymentAuthorization } from "@openlibx402/core";
