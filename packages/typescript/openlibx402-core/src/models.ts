/**
 * OpenLibx402 Payment Models
 *
 * Defines core data structures for X402 payment protocol.
 */

import { InvalidPaymentRequestError } from "./errors";

export interface PaymentRequestData {
  max_amount_required: string;
  asset_type: string;
  asset_address: string;
  payment_address: string;
  network: string;
  expires_at: string | Date;
  nonce: string;
  payment_id: string;
  resource: string;
  description?: string;
}

export class PaymentRequest {
  maxAmountRequired: string;
  assetType: string;
  assetAddress: string;
  paymentAddress: string;
  network: string;
  expiresAt: Date;
  nonce: string;
  paymentId: string;
  resource: string;
  description?: string;

  constructor(data: PaymentRequestData) {
    this.maxAmountRequired = data.max_amount_required;
    this.assetType = data.asset_type;
    this.assetAddress = data.asset_address;
    this.paymentAddress = data.payment_address;
    this.network = data.network;
    this.expiresAt =
      typeof data.expires_at === "string"
        ? new Date(data.expires_at)
        : data.expires_at;
    this.nonce = data.nonce;
    this.paymentId = data.payment_id;
    this.resource = data.resource;
    this.description = data.description;
  }

  toDict(): Record<string, any> {
    return {
      max_amount_required: this.maxAmountRequired,
      asset_type: this.assetType,
      asset_address: this.assetAddress,
      payment_address: this.paymentAddress,
      network: this.network,
      expires_at: this.expiresAt.toISOString(),
      nonce: this.nonce,
      payment_id: this.paymentId,
      resource: this.resource,
      description: this.description,
    };
  }

  static fromDict(data: any): PaymentRequest {
    try {
      // Parse datetime from ISO format
      if (typeof data.expires_at === "string") {
        data.expires_at = new Date(data.expires_at);
      } else if (!(data.expires_at instanceof Date)) {
        throw new Error("expires_at must be a Date or ISO format string");
      }

      return new PaymentRequest(data);
    } catch (error) {
      throw new InvalidPaymentRequestError(
        `Failed to parse payment request: ${error}`
      );
    }
  }

  isExpired(): boolean {
    const now = new Date();
    return now > this.expiresAt;
  }

  toJSON(): string {
    return JSON.stringify(this.toDict());
  }
}

export interface PaymentAuthorizationData {
  payment_id: string;
  actual_amount: string;
  payment_address: string;
  asset_address: string;
  network: string;
  timestamp: string | Date;
  signature: string;
  public_key: string;
  transaction_hash?: string;
}

export class PaymentAuthorization {
  paymentId: string;
  actualAmount: string;
  paymentAddress: string;
  assetAddress: string;
  network: string;
  timestamp: Date;
  signature: string;
  publicKey: string;
  transactionHash?: string;

  constructor(data: PaymentAuthorizationData) {
    this.paymentId = data.payment_id;
    this.actualAmount = data.actual_amount;
    this.paymentAddress = data.payment_address;
    this.assetAddress = data.asset_address;
    this.network = data.network;
    this.timestamp =
      typeof data.timestamp === "string"
        ? new Date(data.timestamp)
        : data.timestamp;
    this.signature = data.signature;
    this.publicKey = data.public_key;
    this.transactionHash = data.transaction_hash;
  }

  toHeaderValue(): string {
    const data = {
      payment_id: this.paymentId,
      actual_amount: this.actualAmount,
      payment_address: this.paymentAddress,
      asset_address: this.assetAddress,
      network: this.network,
      timestamp: this.timestamp.toISOString(),
      signature: this.signature,
      public_key: this.publicKey,
      transaction_hash: this.transactionHash,
    };

    // Encode as base64 JSON for header
    const jsonStr = JSON.stringify(data);
    const encoded = Buffer.from(jsonStr).toString("base64");
    return encoded;
  }

  static fromHeader(headerValue: string): PaymentAuthorization {
    try {
      // Decode base64
      const decoded = Buffer.from(headerValue, "base64").toString("utf-8");
      const data = JSON.parse(decoded);

      // Parse datetime
      if (typeof data.timestamp === "string") {
        data.timestamp = new Date(data.timestamp);
      }

      return new PaymentAuthorization(data);
    } catch (error) {
      throw new InvalidPaymentRequestError(
        `Failed to parse payment authorization: ${error}`
      );
    }
  }

  toDict(): Record<string, any> {
    return {
      payment_id: this.paymentId,
      actual_amount: this.actualAmount,
      payment_address: this.paymentAddress,
      asset_address: this.assetAddress,
      network: this.network,
      timestamp: this.timestamp.toISOString(),
      signature: this.signature,
      public_key: this.publicKey,
      transaction_hash: this.transactionHash,
    };
  }

  toJSON(): string {
    return JSON.stringify(this.toDict());
  }
}
