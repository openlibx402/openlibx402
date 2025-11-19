import {
  Connection,
  Transaction,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferCheckedInstruction,
  getAccount,
  createAssociatedTokenAccountInstruction,
  getMint,
} from '@solana/spl-token';
import { PaymentRequest } from '@openlibx402/core';
import { PrivySigner } from './privy-signer';

/**
 * Solana payment processor using Privy for signing
 */
export class PrivySolanaPaymentProcessor {
  private connection: Connection;
  private signer: PrivySigner;

  constructor(rpcUrl: string, signer: PrivySigner) {
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.signer = signer;
  }

  /**
   * Create a payment transaction for an x402 payment request
   */
  async createPaymentTransaction(
    request: PaymentRequest,
    amount: string
  ): Promise<Transaction> {
    const payerPubkey = this.signer.publicKey;
    const recipientPubkey = new PublicKey(request.paymentAddress);
    const tokenMint = new PublicKey(request.assetAddress);

    // Get latest blockhash
    const { blockhash } = await this.connection.getLatestBlockhash();

    // Get token accounts
    const payerTokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      payerPubkey
    );
    const recipientTokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      recipientPubkey
    );

    const transaction = new Transaction();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = payerPubkey;

    // Check if recipient token account exists, create if needed
    try {
      await getAccount(this.connection, recipientTokenAccount);
    } catch {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          payerPubkey,
          recipientTokenAccount,
          recipientPubkey,
          tokenMint
        )
      );
    }

    // Get token decimals
    const mintInfo = await getMint(this.connection, tokenMint);
    const decimals = mintInfo.decimals;

    // Calculate amount in smallest unit
    const amountInSmallestUnit = BigInt(
      Math.floor(parseFloat(amount) * Math.pow(10, decimals))
    );

    // Add transfer instruction
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
  }

  /**
   * Sign and send a transaction to the network
   */
  async signAndSendTransaction(transaction: Transaction): Promise<string> {
    try {
      // Sign with Privy
      const signedTx = await this.signer.signTransaction(transaction);

      // Send to network
      const signature = await this.connection.sendRawTransaction(
        signedTx.serialize()
      );

      // Confirm transaction
      await this.connection.confirmTransaction(signature, 'confirmed');

      return signature;
    } catch (error) {
      throw new Error(
        `Failed to broadcast transaction: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Get token balance for the signer's wallet
   */
  async getTokenBalance(tokenMint: string): Promise<number> {
    try {
      const mintPubkey = new PublicKey(tokenMint);
      const tokenAccount = await getAssociatedTokenAddress(
        mintPubkey,
        this.signer.publicKey
      );
      const account = await getAccount(this.connection, tokenAccount);
      const mintInfo = await getMint(this.connection, mintPubkey);
      return Number(account.amount) / Math.pow(10, mintInfo.decimals);
    } catch {
      return 0.0;
    }
  }

  /**
   * Get SOL balance for the signer's wallet
   */
  async getSolBalance(): Promise<number> {
    const balance = await this.connection.getBalance(this.signer.publicKey);
    return balance / 1e9; // Convert lamports to SOL
  }

  /**
   * Cleanup resources
   */
  async close(): Promise<void> {
    // No cleanup needed for now
  }
}
