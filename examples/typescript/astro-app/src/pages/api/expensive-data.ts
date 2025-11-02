/**
 * Expensive Data Endpoint - Requires 1.00 USDC payment
 */

import { withPayment } from '../../utils/x402-config';

export async function GET({ request }: { request: Request }) {
  const result = await withPayment(
    request,
    {
      amount: '1.00',
      description: 'AI model inference with high payment requirement',
    },
    async (req, context) => {
      return {
        data: 'This is expensive AI inference content',
        inference: {
          model: 'gpt-4',
          tokens: 5000,
          cost: 1.0,
          timestamp: new Date().toISOString(),
        },
        price_paid: '1.00',
        access: 'premium-ai',
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
