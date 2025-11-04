/**
 * Payment Handler
 * Handles 402 payments to extend rate limits
 */

import type { Context } from 'hono';
import type { RateLimiter } from '../middleware/rateLimit.ts';
import { logger } from '../utils/logger.ts';

/**
 * Payment verification (placeholder for OpenLibx402 integration)
 * TODO: Integrate with @openlibx402/core for actual payment verification
 */
async function verifyPayment(
  signature: string,
  amount: number,
  token: string
): Promise<boolean> {
  // This is a placeholder implementation
  // In production, this would:
  // 1. Verify the Solana transaction signature
  // 2. Check the amount matches expected payment
  // 3. Verify the token is USDC
  // 4. Ensure the payment is to the correct wallet

  logger.info('Payment verification requested', { signature, amount, token });

  // For now, we'll accept any signature as valid
  // TODO: Implement actual Solana transaction verification
  return signature && signature.length > 0;
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

    // Verify payment
    const isValid = await verifyPayment(signature, amount || 0.1, token || 'USDC');

    if (!isValid) {
      return c.json(
        { error: 'Invalid payment signature' },
        400
      );
    }

    // Grant additional queries
    const userId = c.get('userId') || 'unknown';
    await rateLimiter.grantQueries(userId, 1);

    logger.info(`Payment accepted for user ${userId}`, { signature });

    return c.json({
      success: true,
      message: 'Payment accepted. You have been granted 1 additional query.',
      signature,
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
  // This would typically come from config
  const paymentInfo = {
    amount: 0.1,
    token: 'USDC',
    network: 'solana',
    recipient: Deno.env.get('X402_WALLET_ADDRESS') || 'Configure wallet address',
    instructions: [
      'Send the specified amount of USDC to the recipient address',
      'Submit the transaction signature to the /api/payment endpoint',
      'You will receive 1 additional query after successful verification',
    ],
  };

  return c.json(paymentInfo);
}
