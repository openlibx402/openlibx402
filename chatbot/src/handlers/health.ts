/**
 * Health and Status Handlers
 */

import type { Context } from 'hono';
import type { RateLimitInfo } from '../middleware/rateLimit.ts';

/**
 * Health check endpoint
 */
export async function handleHealth(c: Context) {
  return c.json({
    status: 'ok',
    service: 'openlibx402-ragbot',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Get rate limit status for current user
 */
export async function handleStatus(c: Context) {
  const rateLimitInfo = c.get('rateLimitInfo') as RateLimitInfo | undefined;

  if (!rateLimitInfo) {
    return c.json({
      error: 'Rate limit information not available',
    }, 500);
  }

  return c.json({
    rateLimit: {
      remaining: rateLimitInfo.remaining,
      resetAt: rateLimitInfo.resetAt,
      requiresPayment: rateLimitInfo.requiresPayment,
    },
    payment: rateLimitInfo.requiresPayment ? {
      amount: 0.1,
      token: 'USDC',
      network: 'solana',
    } : undefined,
  });
}
