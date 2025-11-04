/**
 * Solana Payment Verification Service
 * Verifies transaction signatures on Solana blockchain
 */

import { Connection, PublicKey, LAMPORTS_PER_SOL } from 'npm:@solana/web3.js@^1.87.6';
import { logger } from '../utils/logger.ts';

export class SolanaVerificationService {
  private connection: Connection;
  private recipientAddress: PublicKey;

  constructor(recipientAddress: string, network: 'devnet' | 'mainnet-beta' = 'devnet') {
    const rpcUrl = network === 'mainnet-beta'
      ? 'https://api.mainnet-beta.solana.com'
      : 'https://api.devnet.solana.com';

    this.connection = new Connection(rpcUrl, 'confirmed');
    this.recipientAddress = new PublicKey(recipientAddress);
  }

  /**
   * Verify a Solana transaction signature
   * @param signature - Transaction signature to verify
   * @param expectedAmount - Expected payment amount in USDC/SOL
   * @returns true if transaction is valid and confirmed
   */
  async verifyTransaction(signature: string, expectedAmount: number): Promise<boolean> {
    try {
      logger.info(`Verifying transaction: ${signature}`);

      // Get transaction details
      const transaction = await this.connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      });

      if (!transaction) {
        logger.warn(`Transaction not found: ${signature}`);
        return false;
      }

      // Check transaction status
      if (transaction.meta?.err) {
        logger.warn(`Transaction failed: ${signature}`, transaction.meta.err);
        return false;
      }

      // Verify recipient
      const postBalances = transaction.meta?.postBalances || [];
      const preBalances = transaction.meta?.preBalances || [];
      const accountKeys = transaction.transaction.message.getAccountKeys();

      // Find our recipient address in the transaction
      let recipientIndex = -1;
      for (let i = 0; i < accountKeys.length; i++) {
        if (accountKeys.get(i)?.equals(this.recipientAddress)) {
          recipientIndex = i;
          break;
        }
      }

      if (recipientIndex === -1) {
        logger.warn(`Recipient address not found in transaction: ${signature}`);
        return false;
      }

      // Calculate amount received (in lamports)
      const amountReceived = postBalances[recipientIndex] - preBalances[recipientIndex];
      const expectedLamports = Math.floor(expectedAmount * LAMPORTS_PER_SOL / 100);

      logger.info(`Amount received: ${amountReceived} lamports, expected: ${expectedLamports} lamports`);

      // Allow 10% tolerance for fees
      const minAmount = expectedLamports * 0.9;
      if (amountReceived < minAmount) {
        logger.warn(`Insufficient payment amount: ${amountReceived} < ${minAmount}`);
        return false;
      }

      logger.info(`Transaction verified successfully: ${signature}`);
      return true;

    } catch (error) {
      logger.error(`Error verifying transaction: ${signature}`, error);
      return false;
    }
  }

  /**
   * Check if a transaction has already been used
   * In production, you should store used signatures in a database
   */
  async isTransactionUsed(signature: string, kv: Deno.Kv): Promise<boolean> {
    const key = ['used_transactions', signature];
    const result = await kv.get(key);
    return result.value !== null;
  }

  /**
   * Mark a transaction as used
   */
  async markTransactionUsed(signature: string, kv: Deno.Kv): Promise<void> {
    const key = ['used_transactions', signature];
    // Store for 30 days
    await kv.set(key, true, { expireIn: 30 * 24 * 60 * 60 * 1000 });
  }
}
