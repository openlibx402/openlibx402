/**
 * Express Middleware for X402 Payment Verification
 *
 * Middleware for handling payment requirements in Express.js applications.
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import {
  PaymentAuthorization,
  SolanaPaymentProcessor,
  PaymentVerificationError,
  InvalidPaymentRequestError,
} from '@openlibx402/core';
import { build402Response } from './responses';
import { getConfig, isInitialized } from './config';

export interface PaymentRequiredOptions {
  amount: string;
  paymentAddress?: string;
  tokenMint?: string;
  network?: string;
  description?: string;
  expiresIn?: number;
  autoVerify?: boolean;
}

export interface X402Request extends Request {
  payment?: PaymentAuthorization;
}

export function paymentRequired(options: PaymentRequiredOptions): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get configuration
      const config = isInitialized() ? getConfig() : null;

      // Determine parameters (use provided values or config)
      const paymentAddress =
        options.paymentAddress || config?.paymentAddress;
      const tokenMint = options.tokenMint || config?.tokenMint;
      const network = options.network || config?.network || 'solana-devnet';
      const autoVerify =
        options.autoVerify !== undefined
          ? options.autoVerify
          : config?.autoVerify !== undefined
          ? config.autoVerify
          : true;

      if (!paymentAddress || !tokenMint) {
        throw new Error(
          'paymentAddress and tokenMint must be provided either as middleware options or via initX402()'
        );
      }

      // Check for payment authorization header
      const authHeader = req.headers['x-payment-authorization'] as string;

      if (!authHeader) {
        // No payment provided, return 402
        return build402Response(res, {
          amount: options.amount,
          paymentAddress,
          tokenMint,
          network,
          resource: req.path,
          description: options.description,
          expiresIn: options.expiresIn,
        });
      }

      // Payment authorization provided, verify it
      try {
        const authorization = PaymentAuthorization.fromHeader(authHeader);

        // Verify payment amount is sufficient
        if (
          parseFloat(authorization.actualAmount) < parseFloat(options.amount)
        ) {
          return res.status(403).json({
            error: 'Insufficient payment',
            required: options.amount,
            provided: authorization.actualAmount,
          });
        }

        // Verify payment addresses match
        if (authorization.paymentAddress !== paymentAddress) {
          return res.status(403).json({
            error: 'Payment address mismatch',
            expected: paymentAddress,
            provided: authorization.paymentAddress,
          });
        }

        // Verify token mint matches
        if (authorization.assetAddress !== tokenMint) {
          return res.status(403).json({
            error: 'Token mint mismatch',
            expected: tokenMint,
            provided: authorization.assetAddress,
          });
        }

        // Verify on-chain if auto_verify is enabled
        if (autoVerify && authorization.transactionHash) {
          const rpcUrl = config?.getRpcUrl() || getDefaultRpcUrl(network);
          const processor = new SolanaPaymentProcessor(rpcUrl);

          try {
            const verified = await processor.verifyTransaction(
              authorization.transactionHash,
              paymentAddress,
              authorization.actualAmount,
              tokenMint
            );

            if (!verified) {
              throw new PaymentVerificationError(
                'Transaction verification failed'
              );
            }
          } finally {
            await processor.close();
          }
        }

        // Payment verified, attach to request and continue
        (req as X402Request).payment = authorization;
        next();
      } catch (error) {
        if (error instanceof InvalidPaymentRequestError) {
          return res.status(400).json({
            error: 'Invalid payment authorization',
            message: (error as Error).message,
          });
        } else if (error instanceof PaymentVerificationError) {
          return res.status(403).json({
            error: 'Payment verification failed',
            message: (error as Error).message,
          });
        } else {
          return res.status(403).json({
            error: 'Payment verification failed',
            message: (error as Error).message,
          });
        }
      }
    } catch (error) {
      next(error);
    }
  };
}

function getDefaultRpcUrl(network: string): string {
  const urls: Record<string, string> = {
    'solana-mainnet': 'https://api.mainnet-beta.solana.com',
    'solana-devnet': 'https://api.devnet.solana.com',
    'solana-testnet': 'https://api.testnet.solana.com',
  };
  return urls[network] || 'https://api.devnet.solana.com';
}
