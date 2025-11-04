/**
 * Rate Limiting Middleware
 * Uses Deno KV to track query limits per user
 */

import type { Context, Next } from 'hono';
import type { Config } from '../utils/config.ts';
import { logger } from '../utils/logger.ts';

export interface RateLimitInfo {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  requiresPayment: boolean;
}

export class RateLimiter {
  private kv: Deno.Kv | null = null;
  private freeQueries: number;

  constructor(config: Config) {
    this.freeQueries = config.rateLimit.freeQueries;
  }

  /**
   * Initialize Deno KV
   */
  async init() {
    this.kv = await Deno.openKv();
    logger.info('Rate limiter initialized with Deno KV');
  }

  /**
   * Get user identifier from request
   */
  private getUserId(c: Context): string {
    // Priority: 1. User ID from body, 2. IP address, 3. Session
    const body = c.req.raw.body;
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    return `user:${ip}`;
  }

  /**
   * Get current day key (resets daily)
   */
  private getDayKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  /**
   * Get reset timestamp (midnight UTC)
   */
  private getResetTimestamp(): number {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }

  /**
   * Check if user has queries remaining
   */
  async checkLimit(userId: string): Promise<RateLimitInfo> {
    if (!this.kv) {
      throw new Error('Rate limiter not initialized');
    }

    const dayKey = this.getDayKey();
    const key = ['rate_limit', userId, dayKey];

    const entry = await this.kv.get<number>(key);
    const currentCount = entry.value || 0;
    const remaining = Math.max(0, this.freeQueries - currentCount);

    logger.info(`Check limit: userId=${userId}, dayKey=${dayKey}, currentCount=${currentCount}, freeQueries=${this.freeQueries}, remaining=${remaining}`);

    return {
      allowed: remaining > 0,
      remaining,
      resetAt: this.getResetTimestamp(),
      requiresPayment: remaining === 0,
    };
  }

  /**
   * Increment usage counter
   */
  async incrementUsage(userId: string): Promise<void> {
    if (!this.kv) {
      throw new Error('Rate limiter not initialized');
    }

    const dayKey = this.getDayKey();
    const key = ['rate_limit', userId, dayKey];

    const entry = await this.kv.get<number>(key);
    const currentCount = entry.value || 0;

    // Set with expiration (25 hours to ensure it covers the day)
    await this.kv.set(key, currentCount + 1, {
      expireIn: 25 * 60 * 60 * 1000,
    });
  }

  /**
   * Grant additional queries after payment
   */
  async grantQueries(userId: string, count: number = 1): Promise<void> {
    if (!this.kv) {
      throw new Error('Rate limiter not initialized');
    }

    const dayKey = this.getDayKey();
    const key = ['rate_limit', userId, dayKey];

    const entry = await this.kv.get<number>(key);
    const currentCount = entry.value || 0;

    // Calculate new count - ensure user gets queries even if they've exceeded the free limit
    // If currentCount > freeQueries, set to (freeQueries - count) to give them exactly `count` queries
    let newCount: number;
    if (currentCount >= this.freeQueries) {
      // User has used all or exceeded free queries
      // Set count so they have exactly `count` queries available
      newCount = this.freeQueries - count;
    } else {
      // User hasn't exceeded free queries yet, just reduce by count
      newCount = Math.max(0, currentCount - count);
    }

    logger.info(`Granting queries: userId=${userId}, dayKey=${dayKey}, currentCount=${currentCount}, freeQueries=${this.freeQueries}, newCount=${newCount}, granting=${count}`);

    // Update count (grant queries by reducing usage)
    await this.kv.set(key, newCount, {
      expireIn: 25 * 60 * 60 * 1000,
    });

    // Verify the write
    const verification = await this.kv.get<number>(key);
    const remaining = Math.max(0, this.freeQueries - (verification.value || 0));
    logger.info(`Grant verified: stored=${verification.value}, remaining=${remaining}, granted ${count} queries to ${userId}`);
  }

  /**
   * Middleware function
   */
  middleware() {
    return async (c: Context, next: Next) => {
      const userId = this.getUserId(c);
      const limitInfo = await this.checkLimit(userId);

      // Add rate limit info to context
      c.set('rateLimitInfo', limitInfo);
      c.set('userId', userId);

      // Set rate limit headers
      c.header('X-RateLimit-Limit', String(this.freeQueries));
      c.header('X-RateLimit-Remaining', String(limitInfo.remaining));
      c.header('X-RateLimit-Reset', String(limitInfo.resetAt));

      if (!limitInfo.allowed) {
        const paymentAmount = parseFloat(Deno.env.get('X402_PAYMENT_AMOUNT') || '0.01');
        return c.json(
          {
            error: 'Rate limit exceeded',
            message: `You have used all ${this.freeQueries} free queries for today. Please make a payment to continue.`,
            remaining: 0,
            resetAt: limitInfo.resetAt,
            payment: {
              required: true,
              amount: paymentAmount,
              token: 'USDC',
            },
          },
          402 // Payment Required
        );
      }

      await next();
    };
  }
}
