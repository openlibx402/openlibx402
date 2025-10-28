/**
 * Explicit X402 Client
 *
 * Manual payment control - developer explicitly handles payment flow.
 */

import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';
import { Keypair } from '@solana/web3.js';
import {
  PaymentRequest,
  PaymentAuthorization,
  SolanaPaymentProcessor,
  PaymentExpiredError,
  InsufficientFundsError,
} from '@openlibx402/core';

export class X402Client {
  private walletKeypair: Keypair;
  private httpClient: AxiosInstance;
  private processor: SolanaPaymentProcessor;

  /**
   * Explicit X402 client - developer controls payment flow
   *
   * Usage:
   *   const client = new X402Client(walletKeypair);
   *
   *   // Check if payment required
   *   let response = await client.get("https://api.example.com/data");
   *
   *   if (client.paymentRequired(response)) {
   *     const paymentRequest = client.parsePaymentRequest(response);
   *
   *     // Make payment
   *     const authorization = await client.createPayment(paymentRequest);
   *
   *     // Retry with payment
   *     response = await client.get("https://api.example.com/data", { payment: authorization });
   *   }
   */
  constructor(
    walletKeypair: Keypair,
    rpcUrl?: string,
    httpClient?: AxiosInstance
  ) {
    this.walletKeypair = walletKeypair;
    this.httpClient = httpClient || axios.create({
      validateStatus: (status) => {
        // Accept 402 status codes so we can handle payment flow
        // Also accept normal success codes (2xx) and other client/server errors
        return status === 402 || (status >= 200 && status < 600);
      }
    });
    this.processor = new SolanaPaymentProcessor(
      rpcUrl || 'https://api.devnet.solana.com',
      walletKeypair
    );
  }

  async close(): Promise<void> {
    await this.processor.close();
  }

  async get(
    url: string,
    options?: AxiosRequestConfig & { payment?: PaymentAuthorization }
  ): Promise<AxiosResponse> {
    const config = { ...options };
    if (options?.payment) {
      config.headers = {
        ...config.headers,
        'X-Payment-Authorization': options.payment.toHeaderValue(),
      };
      delete config.payment;
    }
    return this.httpClient.get(url, config);
  }

  async post(
    url: string,
    data?: any,
    options?: AxiosRequestConfig & { payment?: PaymentAuthorization }
  ): Promise<AxiosResponse> {
    const config = { ...options };
    if (options?.payment) {
      config.headers = {
        ...config.headers,
        'X-Payment-Authorization': options.payment.toHeaderValue(),
      };
      delete config.payment;
    }
    return this.httpClient.post(url, data, config);
  }

  async put(
    url: string,
    data?: any,
    options?: AxiosRequestConfig & { payment?: PaymentAuthorization }
  ): Promise<AxiosResponse> {
    const config = { ...options };
    if (options?.payment) {
      config.headers = {
        ...config.headers,
        'X-Payment-Authorization': options.payment.toHeaderValue(),
      };
      delete config.payment;
    }
    return this.httpClient.put(url, data, config);
  }

  async delete(
    url: string,
    options?: AxiosRequestConfig & { payment?: PaymentAuthorization }
  ): Promise<AxiosResponse> {
    const config = { ...options };
    if (options?.payment) {
      config.headers = {
        ...config.headers,
        'X-Payment-Authorization': options.payment.toHeaderValue(),
      };
      delete config.payment;
    }
    return this.httpClient.delete(url, config);
  }

  paymentRequired(response: AxiosResponse): boolean {
    return response.status === 402;
  }

  parsePaymentRequest(response: AxiosResponse): PaymentRequest {
    if (!this.paymentRequired(response)) {
      throw new Error('Response does not require payment (status !== 402)');
    }

    try {
      return PaymentRequest.fromDict(response.data);
    } catch (error) {
      throw new Error(`Failed to parse payment request: ${error}`);
    }
  }

  async createPayment(
    request: PaymentRequest,
    amount?: string
  ): Promise<PaymentAuthorization> {
    // Validate request not expired
    if (request.isExpired()) {
      throw new PaymentExpiredError(request);
    }

    // Use provided amount or max required
    const payAmount = amount || request.maxAmountRequired;

    // Check sufficient balance
    const balance = await this.processor.getTokenBalance(
      this.walletKeypair.publicKey.toString(),
      request.assetAddress
    );

    if (balance < parseFloat(payAmount)) {
      throw new InsufficientFundsError(payAmount, balance.toString());
    }

    // Create transaction
    const tx = await this.processor.createPaymentTransaction(
      request,
      payAmount,
      this.walletKeypair
    );

    // Sign and broadcast
    const txHash = await this.processor.signAndSendTransaction(
      tx,
      this.walletKeypair
    );

    // Create authorization
    return new PaymentAuthorization({
      payment_id: request.paymentId,
      actual_amount: payAmount,
      payment_address: request.paymentAddress,
      asset_address: request.assetAddress,
      network: request.network,
      timestamp: new Date(),
      signature: '', // Solana signature
      public_key: this.walletKeypair.publicKey.toString(),
      transaction_hash: txHash,
    });
  }

  async request(
    method: string,
    url: string,
    options?: AxiosRequestConfig & { payment?: PaymentAuthorization }
  ): Promise<AxiosResponse> {
    const methodUpper = method.toUpperCase();

    switch (methodUpper) {
      case 'GET':
        return this.get(url, options);
      case 'POST':
        return this.post(url, undefined, options);
      case 'PUT':
        return this.put(url, undefined, options);
      case 'DELETE':
        return this.delete(url, options);
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
  }
}
