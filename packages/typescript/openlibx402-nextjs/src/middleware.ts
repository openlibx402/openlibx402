/**
 * Next.js Middleware for X402 Payment Verification
 *
 * Utilities for handling payment requirements in Next.js API routes.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  PaymentAuthorization,
  SolanaPaymentProcessor,
  PaymentVerificationError,
  InvalidPaymentRequestError,
} from "@openlibx402/core";
import { build402Response } from "./responses";
import { getConfig, isInitialized } from "./config";

export interface PaymentRequiredOptions {
  amount: string;
  paymentAddress?: string;
  tokenMint?: string;
  network?: string;
  description?: string;
  expiresIn?: number;
  autoVerify?: boolean;
}

export interface X402HandlerContext {
  payment?: PaymentAuthorization;
}

export type X402Handler<T = any> = (
  req: NextRequest,
  context: X402HandlerContext
) => Promise<NextResponse<T>> | NextResponse<T>;

/**
 * Higher-order function for Next.js App Router API routes
 * Wraps a handler with payment verification logic
 */
export function withPayment<T = any>(
  options: PaymentRequiredOptions,
  handler: X402Handler<T>
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Get configuration
      const config = isInitialized() ? getConfig() : null;

      // Determine parameters (use provided values or config)
      const paymentAddress = options.paymentAddress || config?.paymentAddress;
      const tokenMint = options.tokenMint || config?.tokenMint;
      const network = options.network || config?.network || "solana-devnet";
      const autoVerify =
        options.autoVerify !== undefined
          ? options.autoVerify
          : config?.autoVerify !== undefined
          ? config.autoVerify
          : true;

      if (!paymentAddress || !tokenMint) {
        throw new Error(
          "paymentAddress and tokenMint must be provided either as middleware options or via initX402()"
        );
      }

      // Check for payment authorization header
      const authHeader = req.headers.get("x-payment-authorization");

      if (!authHeader) {
        // No payment provided, return 402
        return build402Response({
          amount: options.amount,
          paymentAddress,
          tokenMint,
          network,
          resource: new URL(req.url).pathname,
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
          return NextResponse.json(
            {
              error: "Insufficient payment",
              required: options.amount,
              provided: authorization.actualAmount,
            },
            { status: 403 }
          );
        }

        // Verify payment addresses match
        if (authorization.paymentAddress !== paymentAddress) {
          return NextResponse.json(
            {
              error: "Payment address mismatch",
              expected: paymentAddress,
              provided: authorization.paymentAddress,
            },
            { status: 403 }
          );
        }

        // Verify token mint matches
        if (authorization.assetAddress !== tokenMint) {
          return NextResponse.json(
            {
              error: "Token mint mismatch",
              expected: tokenMint,
              provided: authorization.assetAddress,
            },
            { status: 403 }
          );
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
                "Transaction verification failed"
              );
            }
          } finally {
            await processor.close();
          }
        }

        // Payment verified, call handler with payment context
        const context: X402HandlerContext = { payment: authorization };
        return await handler(req, context);
      } catch (error) {
        if (error instanceof InvalidPaymentRequestError) {
          return NextResponse.json(
            {
              error: "Invalid payment authorization",
              message: (error as Error).message,
            },
            { status: 400 }
          );
        } else if (error instanceof PaymentVerificationError) {
          return NextResponse.json(
            {
              error: "Payment verification failed",
              message: (error as Error).message,
            },
            { status: 403 }
          );
        } else {
          return NextResponse.json(
            {
              error: "Payment verification failed",
              message: (error as Error).message,
            },
            { status: 403 }
          );
        }
      }
    } catch (error) {
      return NextResponse.json(
        {
          error: "Internal server error",
          message: (error as Error).message,
        },
        { status: 500 }
      );
    }
  };
}

function getDefaultRpcUrl(network: string): string {
  const urls: Record<string, string> = {
    "solana-mainnet": "https://api.mainnet-beta.solana.com",
    "solana-devnet": "https://api.devnet.solana.com",
    "solana-testnet": "https://api.testnet.solana.com",
  };
  return urls[network] || "https://api.devnet.solana.com";
}
