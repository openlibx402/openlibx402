/**
 * OpenLibx402 Core Package
 *
 * Core TypeScript implementation of the X402 payment protocol for autonomous AI agent payments.
 */

export const VERSION = "0.1.0";

// Models
export { PaymentRequest, PaymentAuthorization } from "./models";
export type { PaymentRequestData, PaymentAuthorizationData } from "./models";

// Errors
export {
  X402Error,
  PaymentRequiredError,
  PaymentExpiredError,
  InsufficientFundsError,
  PaymentVerificationError,
  TransactionBroadcastError,
  InvalidPaymentRequestError,
  ERROR_CODES,
} from "./errors";
export type { ErrorDetails } from "./errors";

// Solana
export { SolanaPaymentProcessor } from "./solana-processor";
