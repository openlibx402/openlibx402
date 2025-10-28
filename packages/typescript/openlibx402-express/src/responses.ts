/**
 * Response Builders for X402
 *
 * Utilities for building properly formatted 402 Payment Required responses.
 */

import { Response } from 'express';
import { PaymentRequest } from '@openlibx402/core';
import { randomBytes } from 'crypto';

export interface Build402ResponseOptions {
  amount: string;
  paymentAddress: string;
  tokenMint: string;
  network: string;
  resource: string;
  description?: string;
  expiresIn?: number; // seconds
}

export function build402Response(
  res: Response,
  options: Build402ResponseOptions
): Response {
  const {
    amount,
    paymentAddress,
    tokenMint,
    network,
    resource,
    description,
    expiresIn = 300,
  } = options;

  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  const paymentRequest = new PaymentRequest({
    max_amount_required: amount,
    asset_type: 'SPL',
    asset_address: tokenMint,
    payment_address: paymentAddress,
    network,
    expires_at: expiresAt,
    nonce: randomBytes(32).toString('base64url'),
    payment_id: randomBytes(16).toString('base64url'),
    resource,
    description,
  });

  return res
    .status(402)
    .set({
      'X-Payment-Required': 'true',
      'X-Payment-Protocol': 'x402',
      'X-Payment-Amount': amount,
      'X-Payment-Asset': tokenMint,
    })
    .json(paymentRequest.toDict());
}
