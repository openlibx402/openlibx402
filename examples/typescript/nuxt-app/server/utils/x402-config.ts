/**
 * X402 Configuration for Nuxt API Routes
 *
 * This file sets up the X402 payment configuration for server-side API routes.
 * Provides withPayment helper that uses @openlibx402/core for on-chain verification.
 */

import type { H3Event } from 'h3'
import {
  PaymentAuthorization,
  SolanaPaymentProcessor,
  PaymentVerificationError,
  InvalidPaymentRequestError,
} from '@openlibx402/core'
import type { PaymentRequestData } from '@openlibx402/core'

interface X402Config {
  paymentAddress: string
  tokenMint: string
  network: string
  rpcUrl: string
  autoVerify: boolean
}

let config: X402Config | null = null
let paymentProcessor: SolanaPaymentProcessor | null = null

export function initX402Config() {
  const runtimeConfig = useRuntimeConfig()

  config = {
    paymentAddress: runtimeConfig.paymentWalletAddress,
    tokenMint: runtimeConfig.usdcMintAddress,
    network: 'solana-devnet',
    rpcUrl: runtimeConfig.solanaRpcUrl,
    autoVerify: process.env.NODE_ENV === 'production',
  }

  // Initialize Solana payment processor for on-chain verification
  if (config.autoVerify) {
    paymentProcessor = new SolanaPaymentProcessor(config.rpcUrl)
  }

  return config
}

export function getX402Config(): X402Config {
  if (!config) {
    return initX402Config()
  }
  return config
}

export interface PaymentRequirement {
  amount: string
  description: string
  expiresIn?: number
}

export interface PaymentContext {
  payment?: PaymentAuthorization
}

/**
 * Helper function to wrap API routes with payment requirements
 * Uses @openlibx402/core for proper on-chain verification
 */
export async function withPayment<T>(
  event: H3Event,
  requirement: PaymentRequirement,
  handler: (event: H3Event, context: PaymentContext) => Promise<T>
): Promise<T> {
  const config = getX402Config()

  // Check for payment authorization header
  const authHeader = getHeader(event, 'x-payment-authorization')

  if (!authHeader) {
    // No payment provided, return 402 Payment Required
    const expiresIn = requirement.expiresIn || 900
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()
    
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
      resource: event.path || '/api',
    }

    setResponseStatus(event, 402)
    return paymentRequest as any
  }

  // Verify payment authorization
  try {
    // Parse payment authorization using X402 core library
    const authorization = PaymentAuthorization.fromHeader(authHeader)

    // Verify payment amount is sufficient
    if (parseFloat(authorization.actualAmount) < parseFloat(requirement.amount)) {
      setResponseStatus(event, 403)
      throw createError({
        statusCode: 403,
        statusMessage: 'Insufficient payment',
        data: {
          required: requirement.amount,
          provided: authorization.actualAmount,
        },
      })
    }

    // Verify payment addresses match
    if (authorization.paymentAddress !== config.paymentAddress) {
      setResponseStatus(event, 403)
      throw createError({
        statusCode: 403,
        statusMessage: 'Payment address mismatch',
        data: {
          expected: config.paymentAddress,
          provided: authorization.paymentAddress,
        },
      })
    }

    // Verify token mint matches
    if (authorization.assetAddress !== config.tokenMint) {
      setResponseStatus(event, 403)
      throw createError({
        statusCode: 403,
        statusMessage: 'Token mint mismatch',
        data: {
          expected: config.tokenMint,
          provided: authorization.assetAddress,
        },
      })
    }

    // Verify on-chain if autoVerify is enabled and transaction hash exists
    if (config.autoVerify && authorization.transactionHash && paymentProcessor) {
      try {
        const verified = await paymentProcessor.verifyTransaction(
          authorization.transactionHash,
          config.paymentAddress,
          authorization.actualAmount,
          config.tokenMint
        )

        if (!verified) {
          throw new PaymentVerificationError('Transaction verification failed on Solana devnet')
        }
      } catch (error) {
        console.error('On-chain verification failed:', error)
        setResponseStatus(event, 403)
        throw createError({
          statusCode: 403,
          statusMessage: 'Payment verification failed',
          data: {
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        })
      }
    }

    // Payment verified, call handler with payment context
    const context: PaymentContext = { payment: authorization }
    return await handler(event, context)

  } catch (error) {
    if (error instanceof InvalidPaymentRequestError) {
      setResponseStatus(event, 400)
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid payment authorization',
        data: {
          message: error.message,
        },
      })
    } else if (error instanceof PaymentVerificationError) {
      setResponseStatus(event, 403)
      throw createError({
        statusCode: 403,
        statusMessage: 'Payment verification failed',
        data: {
          message: error.message,
        },
      })
    }
    // Re-throw H3 errors (already formatted)
    throw error
  }
}

/**
 * Generate a unique payment ID
 */
function generatePaymentId(): string {
  return 'pay_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15)
}

/**
 * Generate a random nonce
 */
function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15)
}

/**
 * Cleanup function for graceful shutdown
 */
export async function closeX402() {
  if (paymentProcessor) {
    await paymentProcessor.close()
    paymentProcessor = null
  }
}
