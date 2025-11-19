export const VERSION = '0.1.0';

// Configuration
export { PrivyX402Config } from './privy-config';

// Signer
export { PrivySigner } from './privy-signer';

// Processor
export { PrivySolanaPaymentProcessor } from './privy-processor';

// Client
export { PrivyX402Client } from './privy-client';

// Types
export type {
  PrivyX402ConfigOptions,
  SignerInterface,
  PrivyWalletInfo,
  PrivyRequestOptions,
} from './types';

// Re-export core types for convenience
export type {
  PaymentRequest,
  PaymentAuthorization,
} from '@openlibx402/core';
