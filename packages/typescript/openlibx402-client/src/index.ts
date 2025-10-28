/**
 * OpenLibX402 Client Package
 *
 * TypeScript HTTP client library for X402 payment protocol.
 */

export const VERSION = '0.1.0';

// Explicit client (manual payment control)
export { X402Client } from './explicit-client';

// Auto client (automatic payment handling)
export { X402AutoClient } from './auto-client';

// Re-export core types for convenience
export type {
  PaymentRequest,
  PaymentAuthorization,
  PaymentRequestData,
  PaymentAuthorizationData,
} from '@openlibx402/core';
