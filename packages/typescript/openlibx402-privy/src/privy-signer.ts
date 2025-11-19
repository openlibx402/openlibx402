import { PrivyClient } from '@privy-io/server-auth';
import { Transaction, PublicKey } from '@solana/web3.js';
import { SignerInterface } from './types';

/**
 * Privy-based signer for Solana transactions
 * Uses Privy's server wallet API for signing instead of local keypairs
 */
export class PrivySigner implements SignerInterface {
  private privyClient: PrivyClient;
  private walletId: string;
  public publicKey: PublicKey;

  constructor(
    appId: string,
    appSecret: string,
    walletId: string,
    publicKeyString: string
  ) {
    this.privyClient = new PrivyClient(appId, appSecret);
    this.walletId = walletId;
    this.publicKey = new PublicKey(publicKeyString);
  }

  /**
   * Sign a transaction using Privy's server wallet
   */
  async signTransaction(transaction: Transaction): Promise<Transaction> {
    // Sign with Privy server wallet - it expects a Transaction object
    const { signedTransaction } = await this.privyClient.walletApi.solana.signTransaction({
      walletId: this.walletId,
      transaction: transaction,
    });

    // Return the signed transaction (Privy returns the full signed Transaction)
    return signedTransaction as Transaction;
  }

  /**
   * Get the wallet address as a string
   */
  async getAddress(): Promise<string> {
    return this.publicKey.toBase58();
  }
}
