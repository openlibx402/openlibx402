/**
 * Payment Handler
 * Handles 402 payments to extend rate limits
 */

import type { Context } from 'hono';
import type { RateLimiter } from '../middleware/rateLimit.ts';
import { logger } from '../utils/logger.ts';
import { SolanaVerificationService } from '../services/solana.ts';

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
 */
export async function handlePayment(c: Context, rateLimiter: RateLimiter) {
  try {
    const body = await c.req.json();
    const { signature, amount, token } = body;

    // Validate request
    if (!signature) {
      return c.json(
        { error: 'Missing payment signature' },
        400
      );
    }

    logger.info('Payment verification requested', { signature, amount, token });

    // Get expected payment amount
    const paymentAmount = parseFloat(Deno.env.get('X402_PAYMENT_AMOUNT') || '0.01');

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
    const verificationResult = await solana.verifyTransaction(signature, paymentAmount);

    if (!verificationResult) {
      logger.warn(`Invalid payment signature: ${signature}`);
      return c.json(
        {
          error: 'Invalid or unconfirmed transaction. Please ensure you sent 0.01 USDC (not SOL) to the recipient address.',
          details: 'Transaction verification failed. Check that: 1) You sent USDC tokens (not SOL), 2) Amount is exactly 0.01 USDC, 3) Sent to the correct recipient address'
        },
        400
      );
    }

    // Mark transaction as used
    await solana.markTransactionUsed(signature, kvStore);

    // Grant additional queries
    // Get user ID same way as rate limiter does (using IP address)
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const userId = `user:${ip}`;

    logger.info(`Granting queries to user ${userId} (IP: ${ip})`);
    await rateLimiter.grantQueries(userId, 1);

    // Verify the grant was successful by checking the updated limit
    const updatedLimit = await rateLimiter.checkLimit(userId);
    logger.info(`Payment accepted for user ${userId} (IP: ${ip})`, {
      signature,
      remaining: updatedLimit.remaining,
      requiresPayment: updatedLimit.requiresPayment
    });

    return c.json({
      success: true,
      message: 'Payment accepted. You have been granted 1 additional query.',
      signature,
      rateLimit: {
        remaining: updatedLimit.remaining,
        resetAt: updatedLimit.resetAt,
        requiresPayment: updatedLimit.requiresPayment,
      },
    });
  } catch (error) {
    logger.error('Payment handler error', error);
    return c.json(
      { error: 'Failed to process payment' },
      500
    );
  }
}

/**
 * Get payment information
 */
export async function getPaymentInfo(c: Context) {
  // Get payment amount from config
  const paymentAmount = parseFloat(Deno.env.get('X402_PAYMENT_AMOUNT') || '0.01');
  const network = Deno.env.get('SOLANA_NETWORK') || 'devnet';
  const usdcMint = Deno.env.get('USDC_MINT_ADDRESS') || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

  const paymentInfo = {
    amount: paymentAmount,
    token: 'USDC',
    network: network,
    recipient: Deno.env.get('X402_WALLET_ADDRESS') || 'Configure wallet address',
    usdcMint: usdcMint,
    instructions: [
      'Send the specified amount of USDC to the recipient address',
      'Submit the transaction signature to the /api/payment endpoint',
      'You will receive 1 additional query after successful verification',
    ],
  };

  return c.json(paymentInfo);
}
