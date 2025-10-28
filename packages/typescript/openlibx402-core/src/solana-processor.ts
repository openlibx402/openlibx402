/**
 * Solana Payment Processor
 *
 * Handles all Solana blockchain operations for X402 payments.
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  SystemProgram,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  TOKEN_PROGRAM_ID,
  getAccount,
} from '@solana/spl-token';
import { PaymentRequest } from './models';
import {
  TransactionBroadcastError,
  PaymentVerificationError,
} from './errors';

export class SolanaPaymentProcessor {
  private connection: Connection;
  private keypair?: Keypair;

  constructor(rpcUrl: string, keypair?: Keypair) {
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.keypair = keypair;
  }

  async close(): Promise<void> {
    // Connection cleanup if needed
    // @solana/web3.js doesn't require explicit connection closing
  }

  async createPaymentTransaction(
    request: PaymentRequest,
    amount: string,
    payerKeypair: Keypair
  ): Promise<Transaction> {
    try {
      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();

      // Parse addresses
      const payerPubkey = payerKeypair.publicKey;
      const recipientPubkey = new PublicKey(request.paymentAddress);
      const tokenMint = new PublicKey(request.assetAddress);

      // Get associated token accounts
      const payerTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        payerPubkey
      );
      const recipientTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        recipientPubkey
      );

      // Create transaction
      const transaction = new Transaction();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = payerPubkey;

      // Check if payer's token account exists
      try {
        await getAccount(this.connection, payerTokenAccount);
      } catch (error) {
        // Create payer's associated token account
        transaction.add(
          createAssociatedTokenAccountInstruction(
            payerPubkey,
            payerTokenAccount,
            payerPubkey,
            tokenMint
          )
        );
      }

      // Check if recipient's token account exists
      try {
        await getAccount(this.connection, recipientTokenAccount);
      } catch (error) {
        // Create recipient's associated token account
        transaction.add(
          createAssociatedTokenAccountInstruction(
            payerPubkey, // Payer pays for account creation
            recipientTokenAccount,
            recipientPubkey,
            tokenMint
          )
        );
      }

      // Convert amount to smallest unit (considering decimals)
      // Assuming 6 decimals for USDC (standard for SPL tokens)
      const decimals = 6;
      const amountInSmallestUnit = Math.floor(
        parseFloat(amount) * Math.pow(10, decimals)
      );

      // Create transfer instruction
      transaction.add(
        createTransferCheckedInstruction(
          payerTokenAccount,
          tokenMint,
          recipientTokenAccount,
          payerPubkey,
          amountInSmallestUnit,
          decimals
        )
      );

      return transaction;
    } catch (error) {
      throw new TransactionBroadcastError(
        `Failed to create transaction: ${error}`
      );
    }
  }

  async signAndSendTransaction(
    transaction: Transaction,
    keypair: Keypair
  ): Promise<string> {
    try {
      // Sign and send transaction
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [keypair],
        {
          commitment: 'confirmed',
          skipPreflight: false,
        }
      );

      return signature;
    } catch (error) {
      throw new TransactionBroadcastError(
        `Failed to broadcast transaction: ${error}`
      );
    }
  }

  async verifyTransaction(
    transactionHash: string,
    expectedRecipient: string,
    expectedAmount: string,
    expectedTokenMint: string
  ): Promise<boolean> {
    try {
      // Get transaction details
      const tx = await this.connection.getTransaction(transactionHash, {
        commitment: 'confirmed',
      });

      if (!tx) {
        throw new PaymentVerificationError(
          `Transaction ${transactionHash} not found`
        );
      }

      // Check if transaction was successful
      if (tx.meta?.err) {
        throw new PaymentVerificationError(
          `Transaction failed: ${JSON.stringify(tx.meta.err)}`
        );
      }

      // For now, return true if transaction exists and succeeded
      // In production, you'd want to parse the transaction details
      // and verify recipient, amount, and token mint match
      return true;
    } catch (error) {
      throw new PaymentVerificationError(
        `Failed to verify transaction: ${error}`
      );
    }
  }

  async getTokenBalance(
    walletAddress: string,
    tokenMint: string
  ): Promise<number> {
    try {
      const walletPubkey = new PublicKey(walletAddress);
      const mintPubkey = new PublicKey(tokenMint);

      // Get associated token account
      const tokenAccount = await getAssociatedTokenAddress(
        mintPubkey,
        walletPubkey
      );

      // Get balance
      const account = await getAccount(this.connection, tokenAccount);

      // Convert to float (ui amount is human-readable format)
      // Assuming 6 decimals
      const decimals = 6;
      return Number(account.amount) / Math.pow(10, decimals);
    } catch (error) {
      // If account doesn't exist, return 0
      return 0.0;
    }
  }

  getDefaultRpcUrl(network: string): string {
    const urls: Record<string, string> = {
      'solana-mainnet': 'https://api.mainnet-beta.solana.com',
      'solana-devnet': 'https://api.devnet.solana.com',
      'solana-testnet': 'https://api.testnet.solana.com',
    };
    return urls[network] || 'https://api.devnet.solana.com';
  }
}
