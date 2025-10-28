/**
 * Implicit X402 Client
 *
 * Automatic payment handling - client automatically pays when receiving 402 response.
 */

import { AxiosResponse, AxiosRequestConfig } from 'axios';
import { Keypair } from '@solana/web3.js';
import { PaymentRequiredError, PaymentAuthorization } from '@openlibx402/core';
import { X402Client } from './explicit-client';

export class X402AutoClient {
  private client: X402Client;
  private maxRetries: number;
  private autoRetry: boolean;
  private maxPaymentAmount?: string;

  /**
   * Implicit X402 client - automatically handles payment flow
   *
   * Usage:
   *   const client = new X402AutoClient(walletKeypair);
   *
   *   // Automatically detects 402 and pays
   *   const response = await client.fetch("https://api.example.com/data");
   *   const data = response.data;
   */
  constructor(
    walletKeypair: Keypair,
    rpcUrl?: string,
    options?: {
      maxRetries?: number;
      autoRetry?: boolean;
      maxPaymentAmount?: string; // Safety limit
    }
  ) {
    this.client = new X402Client(walletKeypair, rpcUrl);
    this.maxRetries = options?.maxRetries ?? 1;
    this.autoRetry = options?.autoRetry ?? true;
    this.maxPaymentAmount = options?.maxPaymentAmount;
  }

  async close(): Promise<void> {
    await this.client.close();
  }

  async fetch(
    url: string,
    options?: AxiosRequestConfig & {
      method?: string;
      autoRetry?: boolean;
    }
  ): Promise<AxiosResponse> {
    /**
     * Make HTTP request with automatic payment handling
     *
     * Args:
     *   url: Request URL
     *   options: Axios request options plus:
     *     - method: HTTP method (default: "GET")
     *     - autoRetry: Override instance autoRetry setting
     *
     * Returns:
     *   Response after payment (if required)
     *
     * Throws:
     *   PaymentRequiredError: If autoRetry is false and 402 received
     *   InsufficientFundsError: If wallet lacks funds
     *   PaymentExpiredError: If payment request expired
     */
    const method = options?.method || 'GET';
    const shouldRetry =
      options?.autoRetry !== undefined ? options.autoRetry : this.autoRetry;

    // Initial request
    let response = await this.makeRequest(method, url, options);

    // Check if payment required
    if (this.client.paymentRequired(response)) {
      if (!shouldRetry) {
        const paymentRequest = this.client.parsePaymentRequest(response);
        throw new PaymentRequiredError(paymentRequest);
      }

      // Parse payment request
      const paymentRequest = this.client.parsePaymentRequest(response);

      // Safety check
      if (this.maxPaymentAmount) {
        if (
          parseFloat(paymentRequest.maxAmountRequired) >
          parseFloat(this.maxPaymentAmount)
        ) {
          throw new Error(
            `Payment amount ${paymentRequest.maxAmountRequired} exceeds max allowed ${this.maxPaymentAmount}`
          );
        }
      }

      // Create payment
      const authorization = await this.client.createPayment(paymentRequest);

      // Retry with payment
      response = await this.makeRequest(method, url, {
        ...options,
        payment: authorization,
      });
    }

    return response;
  }

  private async makeRequest(
    method: string,
    url: string,
    options?: AxiosRequestConfig & { payment?: PaymentAuthorization }
  ): Promise<AxiosResponse> {
    return this.client.request(method, url, options);
  }

  async get(
    url: string,
    options?: AxiosRequestConfig & { autoRetry?: boolean }
  ): Promise<AxiosResponse> {
    return this.fetch(url, { ...options, method: 'GET' });
  }

  async post(
    url: string,
    data?: any,
    options?: AxiosRequestConfig & { autoRetry?: boolean }
  ): Promise<AxiosResponse> {
    return this.fetch(url, {
      ...options,
      method: 'POST',
      data,
    });
  }

  async put(
    url: string,
    data?: any,
    options?: AxiosRequestConfig & { autoRetry?: boolean }
  ): Promise<AxiosResponse> {
    return this.fetch(url, {
      ...options,
      method: 'PUT',
      data,
    });
  }

  async delete(
    url: string,
    options?: AxiosRequestConfig & { autoRetry?: boolean }
  ): Promise<AxiosResponse> {
    return this.fetch(url, { ...options, method: 'DELETE' });
  }
}
