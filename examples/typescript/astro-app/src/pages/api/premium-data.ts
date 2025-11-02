/**
 * Premium Data Endpoint - Requires 0.10 USDC payment
 */

import { withPayment } from '../../utils/x402-config';
import type { PaymentRequestData } from '@openlibx402/core';

export async function GET({ request }: { request: Request }) {
  const result = await withPayment(
    request,
    {
      amount: '0.10',
      description: 'Access to premium market data',
    },
    async (req, context) => {
      return {
        data: 'This is premium content',
        market_data: {
          price: 100.5,
          volume: 1_000_000,
          timestamp: new Date().toISOString(),
        },
        price_paid: '0.10',
        access: 'premium',
        payment_id: context.payment?.paymentId,
      };
    }
  );

  // Return 402 or 403 with payment request if needed
  if (result.status === 402 || result.status === 403) {
    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Return successful response
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
