import { PublicKey, Transaction } from '@solana/web3.js';

/**
 * Configuration options for Privy x402 integration
 */
export interface PrivyX402ConfigOptions {
  /** Privy App ID from dashboard */
  appId: string;
  /** Privy App Secret from dashboard */
  appSecret: string;
  /** Server wallet ID from Privy */
  walletId: string;
  /** Solana network (solana-mainnet, solana-devnet) */
  network?: string;
  /** Custom RPC URL */
  rpcUrl?: string;
  /** Maximum payment amount allowed (safety limit) */
  maxPaymentAmount?: string;
}

/**
 * Interface for signers that can sign Solana transactions
 */
export interface SignerInterface {
  /** Public key of the signer */
  publicKey: PublicKey;
  /** Sign a transaction */
  signTransaction(transaction: Transaction): Promise<Transaction>;
  /** Get the wallet address as string */
  getAddress(): Promise<string>;
}

/**
 * Privy wallet information returned from API
 */
export interface PrivyWalletInfo {
  id: string;
  address: string;
  chainType: string;
}

/**
 * Options for making HTTP requests with the Privy x402 client
 */
export interface PrivyRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  data?: unknown;
  timeout?: number;
}
