/**
 * OpenLibX402 Error Classes
 *
 * Defines all exception types for the X402 payment protocol.
 */

export interface ErrorDetails {
  [key: string]: any;
}

export class X402Error extends Error {
  code: string;
  details: ErrorDetails;

  constructor(message: string, code: string, details: ErrorDetails = {}) {
    super(message);
    this.name = 'X402Error';
    this.code = code;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toString(): string {
    return `[${this.code}] ${this.message}`;
  }
}

export class PaymentRequiredError extends X402Error {
  paymentRequest: any;

  constructor(paymentRequest: any, message?: string) {
    super(
      message || 'Payment is required to access this resource',
      'PAYMENT_REQUIRED',
      { payment_request: paymentRequest }
    );
    this.name = 'PaymentRequiredError';
    this.paymentRequest = paymentRequest;
  }
}

export class PaymentExpiredError extends X402Error {
  paymentRequest: any;

  constructor(paymentRequest: any, message?: string) {
    super(
      message || 'Payment request has expired',
      'PAYMENT_EXPIRED',
      { payment_request: paymentRequest }
    );
    this.name = 'PaymentExpiredError';
    this.paymentRequest = paymentRequest;
  }
}

export class InsufficientFundsError extends X402Error {
  requiredAmount: string;
  availableAmount: string;

  constructor(requiredAmount: string, availableAmount: string) {
    super(
      `Insufficient funds: need ${requiredAmount}, have ${availableAmount}`,
      'INSUFFICIENT_FUNDS',
      {
        required_amount: requiredAmount,
        available_amount: availableAmount,
      }
    );
    this.name = 'InsufficientFundsError';
    this.requiredAmount = requiredAmount;
    this.availableAmount = availableAmount;
  }
}

export class PaymentVerificationError extends X402Error {
  constructor(reason: string) {
    super(
      `Payment verification failed: ${reason}`,
      'PAYMENT_VERIFICATION_FAILED',
      { reason }
    );
    this.name = 'PaymentVerificationError';
  }
}

export class TransactionBroadcastError extends X402Error {
  constructor(reason: string) {
    super(
      `Failed to broadcast transaction: ${reason}`,
      'TRANSACTION_BROADCAST_FAILED',
      { reason }
    );
    this.name = 'TransactionBroadcastError';
  }
}

export class InvalidPaymentRequestError extends X402Error {
  constructor(reason: string) {
    super(
      `Invalid payment request: ${reason}`,
      'INVALID_PAYMENT_REQUEST',
      { reason }
    );
    this.name = 'InvalidPaymentRequestError';
  }
}

// Error code reference for documentation and tooling
export const ERROR_CODES = {
  PAYMENT_REQUIRED: {
    code: 'PAYMENT_REQUIRED',
    message: 'Payment is required to access this resource',
    retry: true,
    user_action: 'Ensure wallet has sufficient funds and retry',
  },
  PAYMENT_EXPIRED: {
    code: 'PAYMENT_EXPIRED',
    message: 'Payment request has expired',
    retry: true,
    user_action: 'Request a new payment authorization',
  },
  INSUFFICIENT_FUNDS: {
    code: 'INSUFFICIENT_FUNDS',
    message: 'Wallet has insufficient token balance',
    retry: false,
    user_action: 'Add funds to wallet',
  },
  PAYMENT_VERIFICATION_FAILED: {
    code: 'PAYMENT_VERIFICATION_FAILED',
    message: 'Server could not verify payment',
    retry: true,
    user_action: 'Contact API provider if issue persists',
  },
  TRANSACTION_BROADCAST_FAILED: {
    code: 'TRANSACTION_BROADCAST_FAILED',
    message: 'Failed to broadcast transaction to blockchain',
    retry: true,
    user_action: 'Check network connection and RPC endpoint',
  },
  INVALID_PAYMENT_REQUEST: {
    code: 'INVALID_PAYMENT_REQUEST',
    message: 'Payment request format is invalid',
    retry: false,
    user_action: 'Contact API provider',
  },
};
