/**
 * Solana Payment Verification Service
 * Verifies transaction signatures on Solana blockchain
 */

import { Connection, PublicKey } from 'npm:@solana/web3.js@^1.87.6';
import { logger } from '../utils/logger.ts';

export class SolanaVerificationService {
  private connection: Connection;
  private recipientAddress: PublicKey;
  private usdcMintAddress: PublicKey;

  constructor(recipientAddress: string, network: 'devnet' | 'mainnet-beta' = 'devnet') {
    const rpcUrl = network === 'mainnet-beta'
      ? 'https://api.mainnet-beta.solana.com'
      : 'https://api.devnet.solana.com';

    this.connection = new Connection(rpcUrl, 'confirmed');
    this.recipientAddress = new PublicKey(recipientAddress);

    // USDC mint address (devnet by default, use mainnet address for production)
    const usdcMint = Deno.env.get('USDC_MINT_ADDRESS') || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
    this.usdcMintAddress = new PublicKey(usdcMint);
  }

  /**
   * Verify a Solana transaction signature
   * @param signature - Transaction signature to verify
   * @param expectedAmount - Expected payment amount in USDC (e.g., 0.01)
   * @returns true if transaction is valid and confirmed
   */
  async verifyTransaction(signature: string, expectedAmount: number): Promise<boolean> {
    try {
      logger.info(`Verifying USDC transaction: ${signature}, expected amount: ${expectedAmount} USDC`);

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

      // For USDC transfers, we need to check token balance changes
      // USDC has 6 decimals, so 0.01 USDC = 10000 base units
      const expectedTokenAmount = Math.floor(expectedAmount * 1_000_000); // USDC has 6 decimals

      // Check pre and post token balances
      const preTokenBalances = transaction.meta?.preTokenBalances || [];
      const postTokenBalances = transaction.meta?.postTokenBalances || [];

      logger.info(`Pre-token balances: ${JSON.stringify(preTokenBalances)}`);
      logger.info(`Post-token balances: ${JSON.stringify(postTokenBalances)}`);

      // Get account keys to map indices to addresses
      const accountKeys = transaction.transaction.message.getAccountKeys();

      // Find token balance changes for our recipient address
      // Note: For SPL tokens, the recipient address owns a token account, not the tokens directly
      let recipientReceived = 0;
      let foundRecipientAccount = false;

      for (const postBalance of postTokenBalances) {
        // Check if this is USDC
        if (postBalance.mint === this.usdcMintAddress.toBase58()) {
          const preBalance = preTokenBalances.find(
            (pre: any) => pre.accountIndex === postBalance.accountIndex
          );

          const postAmount = parseFloat(postBalance.uiTokenAmount.amount);
          const preAmount = preBalance ? parseFloat(preBalance.uiTokenAmount.amount) : 0;
          const received = postAmount - preAmount;

          // Get the actual token account address
          const tokenAccountAddress = accountKeys.get(postBalance.accountIndex);

          logger.info(`Token account ${postBalance.accountIndex} (${tokenAccountAddress?.toBase58()}): owner=${postBalance.owner}, received=${received}`);

          // Check if this account belongs to our recipient (owner field contains the wallet address)
          if (received > 0 && postBalance.owner === this.recipientAddress.toBase58()) {
            recipientReceived += received;
            foundRecipientAccount = true;
            logger.info(`✓ Found recipient account with ${received} tokens received (${received / 1_000_000} USDC)`);
          }
        }
      }

      if (!foundRecipientAccount) {
        logger.warn(`❌ No token account found for recipient ${this.recipientAddress.toBase58()}`);
        logger.info(`Transaction may be sending to a different address or using a different token`);
      }

      logger.info(`USDC amount received: ${recipientReceived}, expected: ${expectedTokenAmount}`);

      // Allow 1% tolerance for rounding
      const minAmount = expectedTokenAmount * 0.99;
      if (recipientReceived < minAmount) {
        logger.warn(`Insufficient USDC payment: ${recipientReceived} < ${minAmount} (${recipientReceived / 1_000_000} USDC)`);
        return false;
      }

      logger.info(`USDC transaction verified successfully: ${signature} (${recipientReceived / 1_000_000} USDC received)`);
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
