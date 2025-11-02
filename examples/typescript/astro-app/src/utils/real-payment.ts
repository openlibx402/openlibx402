/**
 * Real Payment Transaction Handler
 *
 * Creates actual Solana token transfer transactions for X402 payments.
 * Requires a connected Phantom wallet with USDC tokens.
 */

import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import type { PaymentRequestData } from '@openlibx402/core';

export interface PaymentTransactionResult {
  transactionHash: string;
  signature: string;
  publicKey: string;
  amount: string;
  timestamp: string;
  paymentAddress: string;
}

/**
 * Create a payment transaction for payment
 *
 * Note: This demo creates real transactions. To use:
 * 1. Have SOL for transaction fees (get from https://solfaucet.com)
 * 2. Have USDC tokens (get USDC from devnet faucet)
 * 3. Use "Simulate Payment & Retry" if you don't have funds
 */
export async function createPaymentTransaction(
  paymentRequest: PaymentRequestData,
  phantomProvider: any
): Promise<PaymentTransactionResult> {
  try {
    if (!phantomProvider) {
      throw new Error('Phantom wallet not found');
    }

    // Check if wallet is connected
    if (!phantomProvider.publicKey) {
      throw new Error(
        'Phantom wallet is not connected. Please click "Connect Wallet" first.'
      );
    }

    const connection = new Connection(
      'https://api.devnet.solana.com',
      'confirmed'
    );

    const senderPublicKey = new PublicKey(phantomProvider.publicKey);

    // Validate recipient address
    let recipientPublicKey: PublicKey;
    try {
      recipientPublicKey = new PublicKey(paymentRequest.payment_address);
    } catch (e) {
      throw new Error(
        `Invalid recipient address: ${paymentRequest.payment_address}`
      );
    }

    // Check sender has SOL balance for fees
    const balance = await connection.getBalance(senderPublicKey);
    if (balance < 5000) {
      throw new Error(
        `Insufficient SOL balance for transaction fees. You have ${(
          balance / 1000000000
        ).toFixed(4)} SOL, need at least 0.000005 SOL. Get free SOL from https://solfaucet.com`
      );
    }

    // Get the latest blockhash
    const { blockhash } = await connection.getLatestBlockhash();

    // Create a simple SOL transfer transaction
    // In production, use SPL Token program for actual USDC transfers
    const transaction = new Transaction({
      recentBlockhash: blockhash,
      feePayer: senderPublicKey,
    });

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: senderPublicKey,
        toPubkey: recipientPublicKey,
        lamports: 1000, // ~0.000001 SOL for demo (covers fees)
      })
    );

    // Sign with Phantom wallet
    const signedTransaction = await phantomProvider.signTransaction(transaction);

    // Serialize and send transaction
    const serialized = signedTransaction.serialize();
    const signature = await connection.sendRawTransaction(serialized, {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });

    // Wait for confirmation (with timeout)
    const confirmationPromise = connection.confirmTransaction(
      signature,
      'confirmed'
    );

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              'Transaction confirmation timeout. Check Solscan to verify: https://solscan.io/tx/' +
                signature +
                '?cluster=devnet'
            )
          ),
        30000
      )
    );

    await Promise.race([confirmationPromise, timeoutPromise]);

    return {
      transactionHash: signature,
      signature: signature,
      publicKey: senderPublicKey.toString(),
      amount: paymentRequest.max_amount_required,
      timestamp: new Date().toISOString(),
      paymentAddress: paymentRequest.payment_address,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Failed to create payment transaction:', message);

    // Provide helpful error messages
    if (message.includes('insufficient funds')) {
      throw new Error(
        'Insufficient SOL balance for transaction fees. Get free SOL from https://solfaucet.com'
      );
    } else if (message.includes('not found')) {
      throw new Error('Please ensure your wallet is properly connected to Solana Devnet');
    }

    throw error;
  }
}

/**
 * Convert transaction result to X402 authorization header
 */
export function transactionToAuthHeader(result: PaymentTransactionResult): string {
  const authData = {
    payment_id: `tx_${result.transactionHash.substring(0, 8)}`,
    actual_amount: result.amount,
    payment_address: result.paymentAddress,
    asset_address: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // USDC devnet mint
    network: 'solana-devnet',
    timestamp: result.timestamp,
    signature: result.signature,
    public_key: result.publicKey,
    transaction_hash: result.transactionHash,
  };

  const jsonStr = JSON.stringify(authData);
  // Use btoa for browser-compatible base64 encoding
  return btoa(jsonStr);
}

/**
 * Get Phantom provider from window
 */
export function getPhantomProvider(): any {
  if (typeof window === 'undefined') return null;
  return (window as any).phantom?.solana;
}

/**
 * Check if Phantom wallet is installed
 */
export function isPhantomInstalled(): boolean {
  return typeof window !== 'undefined' && !!(window as any).phantom?.solana;
}
