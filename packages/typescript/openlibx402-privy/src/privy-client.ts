import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';
import { PrivyClient } from '@privy-io/server-auth';
import {
  PaymentRequest,
  PaymentAuthorization,
  PaymentExpiredError,
  InsufficientFundsError,
} from '@openlibx402/core';
import { PrivySigner } from './privy-signer';
import { PrivySolanaPaymentProcessor } from './privy-processor';
import { PrivyX402Config } from './privy-config';
import { PrivyRequestOptions } from './types';

/**
 * X402 HTTP client that uses Privy server wallets for payments
 */
export class PrivyX402Client {
  private privyClient: PrivyClient;
  private signer!: PrivySigner;
  private processor!: PrivySolanaPaymentProcessor;
  private httpClient: AxiosInstance;
  private config: PrivyX402Config;
  private walletAddress: string = '';
  private initialized: boolean = false;

  constructor(config: PrivyX402Config) {
    this.config = config;
    this.privyClient = new PrivyClient(config.appId, config.appSecret);
    this.httpClient = axios.create({
      validateStatus: (status) =>
        status === 402 || (status >= 200 && status < 300),
    });
  }

  /**
   * Initialize the client by fetching wallet details from Privy
   * Must be called before making requests
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Get wallet details from Privy
    const wallet = await this.privyClient.walletApi.getWallet({
      id: this.config.walletId,
    });

    this.walletAddress = wallet.address;

    this.signer = new PrivySigner(
      this.config.appId,
      this.config.appSecret,
      this.config.walletId,
      wallet.address
    );

    this.processor = new PrivySolanaPaymentProcessor(
      this.config.getRpcUrl(),
      this.signer
    );

    this.initialized = true;
  }

  /**
   * Make an HTTP request with automatic x402 payment handling
   */
  async fetch(
    url: string,
    options?: PrivyRequestOptions
  ): Promise<AxiosResponse> {
    if (!this.initialized) {
      throw new Error(
        'Client not initialized. Call initialize() before making requests.'
      );
    }

    const method = options?.method || 'GET';

    // Make initial request
    let response = await this.makeRequest(method, url, options);

    // Check if payment required
    if (response.status === 402) {
      const paymentRequest = PaymentRequest.fromDict(response.data);

      // Safety check for maximum payment
      if (
        parseFloat(paymentRequest.maxAmountRequired) >
        parseFloat(this.config.maxPaymentAmount)
      ) {
        throw new Error(
          `Payment amount ${paymentRequest.maxAmountRequired} exceeds maximum allowed ${this.config.maxPaymentAmount}`
        );
      }

      // Create payment
      const authorization = await this.createPayment(paymentRequest);

      // Retry with payment authorization
      response = await this.makeRequest(method, url, {
        ...options,
        headers: {
          ...options?.headers,
          'X-Payment-Authorization': authorization.toHeaderValue(),
        },
      });
    }

    return response;
  }

  /**
   * Make an HTTP request
   */
  private async makeRequest(
    method: string,
    url: string,
    options?: PrivyRequestOptions
  ): Promise<AxiosResponse> {
    const config: AxiosRequestConfig = {
      method,
      url,
      headers: options?.headers,
      data: options?.data,
      timeout: options?.timeout,
    };

    return this.httpClient.request(config);
  }

  /**
   * Create a payment for an x402 payment request
   */
  private async createPayment(
    request: PaymentRequest
  ): Promise<PaymentAuthorization> {
    // Check if payment request is expired
    if (request.isExpired()) {
      throw new PaymentExpiredError(request);
    }

    const payAmount = request.maxAmountRequired;

    // Check balance
    const balance = await this.processor.getTokenBalance(request.assetAddress);
    if (balance < parseFloat(payAmount)) {
      throw new InsufficientFundsError(payAmount, balance.toString());
    }

    // Create and sign transaction
    const tx = await this.processor.createPaymentTransaction(request, payAmount);
    const txHash = await this.processor.signAndSendTransaction(tx);

    return new PaymentAuthorization({
      payment_id: request.paymentId,
      actual_amount: payAmount,
      payment_address: request.paymentAddress,
      asset_address: request.assetAddress,
      network: request.network,
      timestamp: new Date(),
      signature: txHash,
      public_key: this.walletAddress,
      transaction_hash: txHash,
    });
  }

  /**
   * Make a GET request
   */
  async get(url: string, options?: PrivyRequestOptions): Promise<AxiosResponse> {
    return this.fetch(url, { ...options, method: 'GET' });
  }

  /**
   * Make a POST request
   */
  async post(
    url: string,
    data?: unknown,
    options?: PrivyRequestOptions
  ): Promise<AxiosResponse> {
    return this.fetch(url, { ...options, method: 'POST', data });
  }

  /**
   * Make a PUT request
   */
  async put(
    url: string,
    data?: unknown,
    options?: PrivyRequestOptions
  ): Promise<AxiosResponse> {
    return this.fetch(url, { ...options, method: 'PUT', data });
  }

  /**
   * Make a DELETE request
   */
  async delete(
    url: string,
    options?: PrivyRequestOptions
  ): Promise<AxiosResponse> {
    return this.fetch(url, { ...options, method: 'DELETE' });
  }

  /**
   * Get the wallet address
   */
  getWalletAddress(): string {
    return this.walletAddress;
  }

  /**
   * Get token balance
   */
  async getTokenBalance(tokenMint: string): Promise<number> {
    if (!this.initialized) {
      throw new Error('Client not initialized');
    }
    return this.processor.getTokenBalance(tokenMint);
  }

  /**
   * Get SOL balance
   */
  async getSolBalance(): Promise<number> {
    if (!this.initialized) {
      throw new Error('Client not initialized');
    }
    return this.processor.getSolBalance();
  }

  /**
   * Cleanup resources
   */
  async close(): Promise<void> {
    if (this.processor) {
      await this.processor.close();
    }
  }
}
