/**
 * Payment Handler
 * Handles 402 payments to extend rate limits
 * Supports both X-Payment-Authorization header and legacy POST body
 */

import type { Context } from 'hono';
import type { RateLimiter } from '../middleware/rateLimit.ts';
import { logger } from '../utils/logger.ts';
import { SolanaVerificationService } from '../services/solana.ts';
import {
  PaymentVerificationError,
  PaymentExpiredError,
  InsufficientFundsError
} from '@openlibx402/core';

// Deno KV for tracking used transactions
let kv: Deno.Kv | null = null;
let solanaService: SolanaVerificationService | null = null;

// Initialize KV
async function getKv(): Promise<Deno.Kv> {
  if (!kv) {
    kv = await Deno.openKv();
  }
  return kv;
}

// Get Solana verification service (lazy initialization)
function getSolanaService(): SolanaVerificationService {
  if (!solanaService) {
    const recipientAddress = Deno.env.get('X402_WALLET_ADDRESS');
    if (!recipientAddress) {
      throw new Error('X402_WALLET_ADDRESS not configured');
    }
    const network = Deno.env.get('SOLANA_NETWORK') as 'devnet' | 'mainnet-beta' || 'devnet';
    solanaService = new SolanaVerificationService(recipientAddress, network);
  }
  return solanaService;
}

/**
 * Handle payment submission
 * Supports both X-Payment-Authorization header (standard) and POST body (legacy)
 */
export async function handlePayment(c: Context, rateLimiter: RateLimiter) {
  try {
    let signature: string;
    let paymentAmount: number;
    let paymentId: string | undefined;

    // Check for X-Payment-Authorization header (new standard format)
    const authHeader = c.req.header('x-payment-authorization');
    if (authHeader) {
      try {
        // Parse the header - format is typically base64-encoded JSON
        const decodedAuth = JSON.parse(atob(authHeader));
        signature = decodedAuth.signature;
        paymentAmount = parseFloat(decodedAuth.actual_amount || decodedAuth.amount || '0.01');
        paymentId = decodedAuth.payment_id;

        logger.info('Payment via X-Payment-Authorization header', {
          payment_id: paymentId,
          amount: paymentAmount,
        });
      } catch (error) {
        logger.warn('Invalid X-Payment-Authorization header', error);
        return c.json(
          { error: 'Invalid payment authorization header format' },
          400
        );
      }
    } else {
      // Fall back to legacy POST body format for backward compatibility
      const body = await c.req.json();
      signature = body.signature;
      paymentAmount = parseFloat(body.amount || '0.01');
      paymentId = body.payment_id;

      logger.info('Payment via POST body (legacy format)', { signature, amount: paymentAmount });
    }

    // Validate request
    if (!signature) {
      return c.json(
        { error: 'Missing payment signature' },
        400
      );
    }

    // Validate amount
    const minAmount = 0.01;
    const maxAmount = 1.0;

    if (isNaN(paymentAmount) || paymentAmount < minAmount || paymentAmount > maxAmount) {
      return c.json(
        { error: `Invalid payment amount. Must be between ${minAmount} and ${maxAmount} USDC` },
        400
      );
    }

    logger.info('Payment verification requested', { signature, amount: paymentAmount, payment_id: paymentId });

    // Get services
    const kvStore = await getKv();
    const solana = getSolanaService();

    // Check if transaction was already used
    const alreadyUsed = await solana.isTransactionUsed(signature, kvStore);

    if (alreadyUsed) {
      logger.warn(`Transaction already used: ${signature}`);
      return c.json(
        { error: 'Transaction already used' },
        400
      );
    }

    // Verify the Solana transaction
    let verificationResult = false;
    try {
      verificationResult = await solana.verifyTransaction(signature, paymentAmount);
    } catch (error) {
      if (error instanceof PaymentVerificationError) {
        logger.warn(`Payment verification error: ${signature}`, error);
        return c.json(
          { error: error.message },
          400
        );
      }
      throw error;
    }

    if (!verificationResult) {
      logger.warn(`Invalid payment signature: ${signature}`);
      throw new PaymentVerificationError(
        `Invalid or unconfirmed transaction. Please ensure you sent ${paymentAmount} USDC (not SOL) to the recipient address. ` +
        `Check that: 1) You sent USDC tokens (not SOL), 2) Amount is ${paymentAmount} USDC, 3) Sent to the correct recipient address, ` +
        `4) Transaction has been confirmed on the blockchain (wait 30-60 seconds)`
      );
    }

    // Mark transaction as used
    await solana.markTransactionUsed(signature, kvStore);

    // Grant additional queries
    // Calculate queries: 0.01 USDC = 10 queries, 1 USDC = 1000 queries
    const queriesGranted = Math.floor(paymentAmount * 1000);

    // Get user ID same way as rate limiter does (using IP address)
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const userId = `user:${ip}`;

    logger.info(`Granting ${queriesGranted} queries to user ${userId} (IP: ${ip}) for ${paymentAmount} USDC payment`);
    await rateLimiter.grantQueries(userId, queriesGranted);

    // Verify the grant was successful by checking the updated limit
    const updatedLimit = await rateLimiter.checkLimit(userId);
    logger.info(`Payment accepted for user ${userId} (IP: ${ip})`, {
      signature,
      amount: paymentAmount,
      queriesGranted,
      remaining: updatedLimit.remaining,
      requiresPayment: updatedLimit.requiresPayment
    });

    const queryText = queriesGranted === 1 ? 'query' : 'queries';
    return c.json({
      success: true,
      message: `Payment accepted. You have been granted ${queriesGranted} additional ${queryText}.`,
      signature,
      queriesGranted,
      rateLimit: {
        remaining: updatedLimit.remaining,
        resetAt: updatedLimit.resetAt,
        requiresPayment: updatedLimit.requiresPayment,
      },
    });
  } catch (error) {
    // Handle openlibx402 errors
    if (error instanceof PaymentVerificationError) {
      logger.warn('Payment verification error', error);
      return c.json(
        { error: error.message },
        400
      );
    }
    if (error instanceof PaymentExpiredError) {
      logger.warn('Payment expired', error);
      return c.json(
        { error: 'Payment request expired. Please request a new payment.' },
        400
      );
    }
    if (error instanceof InsufficientFundsError) {
      logger.warn('Insufficient funds', error);
      return c.json(
        { error: 'Insufficient funds in wallet' },
        400
      );
    }

    logger.error('Payment handler error', error);
    return c.json(
      { error: 'Failed to process payment' },
      500
    );
  }
}

/**
 * Get payment information
 * Returns standardized X402 payment details
 */
export async function getPaymentInfo(c: Context) {
  // Get payment amount from config
  const paymentAmount = parseFloat(Deno.env.get('X402_PAYMENT_AMOUNT') || '0.01');
  const network = Deno.env.get('SOLANA_NETWORK') || 'devnet';
  const usdcMint = Deno.env.get('USDC_MINT_ADDRESS') || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
  const recipientAddress = Deno.env.get('X402_WALLET_ADDRESS') || 'Configure wallet address';

  // X402 standard payment info format
  const paymentInfo = {
    // Standard X402 fields
    x402_format: 'v1',
    asset_type: 'SPL',
    asset_address: usdcMint,
    payment_address: recipientAddress,
    network: network === 'mainnet-beta' ? 'solana-mainnet' : 'solana-devnet',

    // Legacy fields (backward compatibility)
    amount: paymentAmount,
    token: 'USDC',
    recipient: recipientAddress,

    // Instructions
    payment_methods: [
      {
        method: 'x-payment-authorization-header',
        description: 'Submit as X-Payment-Authorization header in base64-encoded JSON'
      },
      {
        method: 'post-body-legacy',
        description: 'Submit as JSON POST body (backward compatible)'
      }
    ],

    instructions: [
      '1. Send the specified amount of USDC to the payment address',
      '2. Get the transaction signature',
      '3. Submit via X-Payment-Authorization header OR POST body to /api/payment',
      '4. Receive query credits (1 USDC = 1000 queries)'
    ],
  };

  return c.json(paymentInfo);
}
