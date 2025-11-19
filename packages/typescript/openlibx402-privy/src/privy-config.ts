import { PrivyX402ConfigOptions } from './types';

/**
 * Configuration class for Privy x402 integration
 */
export class PrivyX402Config {
  /** Privy App ID */
  readonly appId: string;
  /** Privy App Secret */
  readonly appSecret: string;
  /** Server wallet ID */
  readonly walletId: string;
  /** Solana network */
  readonly network: string;
  /** Custom RPC URL */
  readonly rpcUrl?: string;
  /** Maximum payment amount allowed */
  readonly maxPaymentAmount: string;

  constructor(options: PrivyX402ConfigOptions) {
    if (!options.appId) {
      throw new Error('Privy appId is required');
    }
    if (!options.appSecret) {
      throw new Error('Privy appSecret is required');
    }
    if (!options.walletId) {
      throw new Error('Privy walletId is required');
    }

    this.appId = options.appId;
    this.appSecret = options.appSecret;
    this.walletId = options.walletId;
    this.network = options.network || 'solana-devnet';
    this.rpcUrl = options.rpcUrl;
    this.maxPaymentAmount = options.maxPaymentAmount || '10.0';
  }

  /**
   * Get the RPC URL for the configured network
   */
  getRpcUrl(): string {
    if (this.rpcUrl) {
      return this.rpcUrl;
    }

    const urls: Record<string, string> = {
      'solana-mainnet': 'https://api.mainnet-beta.solana.com',
      'solana-devnet': 'https://api.devnet.solana.com',
      'solana-testnet': 'https://api.testnet.solana.com',
    };

    return urls[this.network] || 'https://api.devnet.solana.com';
  }

  /**
   * Check if running on mainnet
   */
  isMainnet(): boolean {
    return this.network === 'solana-mainnet';
  }
}
