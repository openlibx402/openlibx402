/**
 * Explicit X402 Client
 *
 * Manual payment control - developer explicitly handles payment flow.
 */

import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';
import { Keypair } from '@solana/web3.js';
import { URL } from 'url';
import {
  PaymentRequest,
  PaymentAuthorization,
  SolanaPaymentProcessor,
  PaymentExpiredError,
  InsufficientFundsError,
} from '@openlibx402/core';

export class X402Client {
  private walletKeypair: Keypair | null;
  private httpClient: AxiosInstance;
  private processor: SolanaPaymentProcessor;
  private _closed: boolean = false;
  private _allowLocal: boolean;

  /**
   * Explicit X402 client - developer controls payment flow
   *
   * Usage (Production):
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
   *
   *   // Always cleanup
   *   await client.close();
   *
   * Usage (Local Development):
   *   // Enable allowLocal for localhost URLs
   *   const client = new X402Client(walletKeypair, undefined, undefined, true);
   *
   *   let response = await client.get("http://localhost:3000/api/data");
   *
   *   if (client.paymentRequired(response)) {
   *     const paymentRequest = client.parsePaymentRequest(response);
   *     const authorization = await client.createPayment(paymentRequest);
   *     response = await client.get("http://localhost:3000/api/data", { payment: authorization });
   *   }
   *
   *   await client.close();
   *
   * Security Notes:
   *   - Always call close() when done to properly cleanup connections
   *   - Private keys are held in memory - ensure proper disposal
   *   - Only use URLs from trusted sources to prevent SSRF attacks
   *   - Default RPC URL is devnet - use mainnet URL for production
   *   - Set allowLocal=true for local development (localhost URLs)
   *   - NEVER use allowLocal=true in production deployments
   */
  constructor(
    walletKeypair: Keypair,
    rpcUrl?: string,
    httpClient?: AxiosInstance,
    allowLocal: boolean = false
  ) {
    this.walletKeypair = walletKeypair;
    this.httpClient = httpClient || axios.create({
      validateStatus: (status) => {
        // Accept 402 and 2xx status codes
        return status === 402 || (status >= 200 && status < 300);
      }
    });
    this.processor = new SolanaPaymentProcessor(
      rpcUrl || 'https://api.devnet.solana.com',
      walletKeypair
    );
    this._allowLocal = allowLocal;
  }

  /**
   * Close HTTP and RPC connections and cleanup sensitive data
   *
   * IMPORTANT: Always call this method when done to properly cleanup
   * connections and attempt to clear sensitive data from memory.
   */
  async close(): Promise<void> {
    if (this._closed) {
      return;
    }

    await this.processor.close();

    // Attempt to clear sensitive data (best-effort)
    this.walletKeypair = null;
    this._closed = true;
  }

  /**
   * Basic URL validation to prevent common SSRF attacks
   *
   * @throws {Error} If URL is invalid or potentially dangerous
   */
  private validateUrl(urlString: string): void {
    try {
      const url = new URL(urlString);

      // Require https or http scheme
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error(`Invalid URL scheme: ${url.protocol}. Only http/https allowed`);
      }

      // Skip localhost/private IP checks if allowLocal is enabled
      if (this._allowLocal) {
        return;
      }

      // Reject localhost and private IPs (basic check)
      const hostname = url.hostname.toLowerCase();

      // Check for localhost
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
        throw new Error(
          'Requests to localhost are not allowed. ' +
          'For local development, set allowLocal=true in constructor'
        );
      }

      // Check for private IP ranges (basic check)
      if (
        hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
      ) {
        throw new Error(
          'Requests to private IP addresses are not allowed. ' +
          'For local development, set allowLocal=true in constructor'
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Invalid URL: ${error}`);
    }
  }

  async get(
    url: string,
    options?: AxiosRequestConfig & { payment?: PaymentAuthorization }
  ): Promise<AxiosResponse> {
    this.validateUrl(url);
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
    this.validateUrl(url);
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
    this.validateUrl(url);
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
    this.validateUrl(url);
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
    if (!this.walletKeypair) {
      throw new Error('Client has been closed');
    }

    // Validate request not expired (advisory check)
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

    // Convert to smallest unit (assuming 6 decimals) for precise integer comparison
    // This avoids floating-point precision issues with currency
    const decimals = 6;
    const balanceSmallestUnit = Math.floor(balance * Math.pow(10, decimals));
    const amountSmallestUnit = Math.floor(parseFloat(payAmount) * Math.pow(10, decimals));

    if (balanceSmallestUnit < amountSmallestUnit) {
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
    // Note: In Solana, the transaction signature IS the transaction hash
    return new PaymentAuthorization({
      payment_id: request.paymentId,
      actual_amount: payAmount,
      payment_address: request.paymentAddress,
      asset_address: request.assetAddress,
      network: request.network,
      timestamp: new Date(),
      signature: txHash, // Solana transaction signature
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
