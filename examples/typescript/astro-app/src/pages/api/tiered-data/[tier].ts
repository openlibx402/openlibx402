/**
 * Tiered Data Endpoint - Requires 0.05 USDC payment for premium tier
 */

import { withPayment } from '../../../utils/x402-config';

export async function GET({ params, request }: { params: { tier: string }; request: Request }) {
  const tier = params.tier || 'free';

  // Free tier requires no payment
  if (tier === 'free') {
    return new Response(
      JSON.stringify({
        data: 'This is free tier content',
        tier: 'free',
        quality: 'low',
        access: 'public',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // Premium tier requires payment
  const result = await withPayment(
    request,
    {
      amount: '0.05',
      description: `Access to ${tier} tier content`,
    },
    async (req, context) => {
      return {
        data: `This is ${tier} tier content`,
        tier,
        quality: tier === 'premium' ? 'high' : 'medium',
        price_paid: '0.05',
        access: 'tiered',
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
