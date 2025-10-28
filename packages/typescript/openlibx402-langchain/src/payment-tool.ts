/**
 * X402 Payment Tool for LangChain.js
 *
 * Allows LangChain agents to make payments for API access.
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { Keypair } from '@solana/web3.js';
import { X402AutoClient } from '@openlibx402/client';
import { X402Error } from '@openlibx402/core';

export interface X402PaymentToolOptions {
  walletKeypair: Keypair;
  rpcUrl?: string;
  maxPayment?: string;
  name?: string;
  description?: string;
}

export function createX402PaymentTool(
  options: X402PaymentToolOptions
): DynamicStructuredTool {
  const {
    walletKeypair,
    rpcUrl,
    maxPayment = '1.0',
    name = 'x402_payment',
    description = 'Make an X402 payment to access a paid API endpoint. Input should be a URL to the API endpoint. Returns the API response after successful payment.',
  } = options;

  return new DynamicStructuredTool({
    name,
    description,
    schema: z.object({
      url: z.string().describe('The API endpoint URL to access'),
      method: z
        .string()
        .optional()
        .default('GET')
        .describe('HTTP method (GET, POST, PUT, DELETE)'),
    }),
    func: async ({ url, method = 'GET' }) => {
      const client = new X402AutoClient(walletKeypair, rpcUrl, {
        maxPaymentAmount: maxPayment,
      });

      try {
        const response = await client.fetch(url, { method });
        const data = response.data;
        return typeof data === 'string' ? data : JSON.stringify(data);
      } catch (error) {
        if (error instanceof X402Error) {
          return `Payment error: ${error.code} - ${error.message}`;
        }
        return `Error: ${(error as Error).message}`;
      } finally {
        await client.close();
      }
    },
  });
}

export class X402PaymentTool extends DynamicStructuredTool {
  private walletKeypair: Keypair;
  private rpcUrl?: string;
  private maxPayment: string;

  constructor(options: X402PaymentToolOptions) {
    const {
      walletKeypair,
      rpcUrl,
      maxPayment = '1.0',
      name = 'x402_payment',
      description = 'Make an X402 payment to access a paid API endpoint. Input should be a URL to the API endpoint. Returns the API response after successful payment.',
    } = options;

    super({
      name,
      description,
      schema: z.object({
        url: z.string().describe('The API endpoint URL to access'),
        method: z
          .string()
          .optional()
          .default('GET')
          .describe('HTTP method (GET, POST, PUT, DELETE)'),
      }),
      func: async ({ url, method = 'GET' }) => {
        return this.execute(url, method);
      },
    });

    this.walletKeypair = walletKeypair;
    this.rpcUrl = rpcUrl;
    this.maxPayment = maxPayment;
  }

  private async execute(url: string, method: string = 'GET'): Promise<string> {
    const client = new X402AutoClient(this.walletKeypair, this.rpcUrl, {
      maxPaymentAmount: this.maxPayment,
    });

    try {
      const response = await client.fetch(url, { method });
      return typeof response.data === 'string'
        ? response.data
        : JSON.stringify(response.data);
    } catch (error) {
      if (error instanceof X402Error) {
        return `Payment error: ${error.code} - ${error.message}`;
      }
      return `Error: ${(error as Error).message}`;
    } finally {
      await client.close();
    }
  }
}
