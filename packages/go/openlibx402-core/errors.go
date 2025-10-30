package core

import "fmt"

// X402Error is the base error type for all X402 protocol errors.
type X402Error struct {
	Message string
	Code    string
	Details map[string]interface{}
}

// Error implements the error interface.
func (e *X402Error) Error() string {
	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

// NewX402Error creates a new X402Error.
func NewX402Error(message, code string, details map[string]interface{}) *X402Error {
	if details == nil {
		details = make(map[string]interface{})
	}
	return &X402Error{
		Message: message,
		Code:    code,
		Details: details,
	}
}

// PaymentRequiredError is raised when a 402 response is received.
type PaymentRequiredError struct {
	*X402Error
	PaymentRequest *PaymentRequest
}

// NewPaymentRequiredError creates a new PaymentRequiredError.
func NewPaymentRequiredError(paymentRequest *PaymentRequest, message string) *PaymentRequiredError {
	if message == "" {
		message = "Payment is required to access this resource"
	}
	details := map[string]interface{}{
		"payment_request": paymentRequest,
	}
	return &PaymentRequiredError{
		X402Error:      NewX402Error(message, "PAYMENT_REQUIRED", details),
		PaymentRequest: paymentRequest,
	}
}

// PaymentExpiredError indicates that a payment request has expired.
type PaymentExpiredError struct {
	*X402Error
	PaymentRequest *PaymentRequest
}

// NewPaymentExpiredError creates a new PaymentExpiredError.
func NewPaymentExpiredError(paymentRequest *PaymentRequest, message string) *PaymentExpiredError {
	if message == "" {
		message = "Payment request has expired"
	}
	details := map[string]interface{}{
		"payment_request": paymentRequest,
	}
	return &PaymentExpiredError{
		X402Error:      NewX402Error(message, "PAYMENT_EXPIRED", details),
		PaymentRequest: paymentRequest,
	}
}

// InsufficientFundsError indicates that the wallet has insufficient funds.
type InsufficientFundsError struct {
	*X402Error
	RequiredAmount  string
	AvailableAmount string
}

// NewInsufficientFundsError creates a new InsufficientFundsError.
func NewInsufficientFundsError(requiredAmount, availableAmount string) *InsufficientFundsError {
	message := fmt.Sprintf("Insufficient funds: need %s, have %s", requiredAmount, availableAmount)
	details := map[string]interface{}{
		"required_amount":  requiredAmount,
		"available_amount": availableAmount,
	}
	return &InsufficientFundsError{
		X402Error:       NewX402Error(message, "INSUFFICIENT_FUNDS", details),
		RequiredAmount:  requiredAmount,
		AvailableAmount: availableAmount,
	}
}

// PaymentVerificationError indicates that payment verification failed.
type PaymentVerificationError struct {
	*X402Error
	Reason string
}

// NewPaymentVerificationError creates a new PaymentVerificationError.
func NewPaymentVerificationError(reason string) *PaymentVerificationError {
	message := fmt.Sprintf("Payment verification failed: %s", reason)
	details := map[string]interface{}{
		"reason": reason,
	}
	return &PaymentVerificationError{
		X402Error: NewX402Error(message, "PAYMENT_VERIFICATION_FAILED", details),
		Reason:    reason,
	}
}

// TransactionBroadcastError indicates that broadcasting a transaction failed.
type TransactionBroadcastError struct {
	*X402Error
	Reason string
}

// NewTransactionBroadcastError creates a new TransactionBroadcastError.
func NewTransactionBroadcastError(reason string) *TransactionBroadcastError {
	message := fmt.Sprintf("Failed to broadcast transaction: %s", reason)
	details := map[string]interface{}{
		"reason": reason,
	}
	return &TransactionBroadcastError{
		X402Error: NewX402Error(message, "TRANSACTION_BROADCAST_FAILED", details),
		Reason:    reason,
	}
}

// InvalidPaymentRequestError indicates that a payment request format is invalid.
type InvalidPaymentRequestError struct {
	*X402Error
	Reason string
}

// NewInvalidPaymentRequestError creates a new InvalidPaymentRequestError.
func NewInvalidPaymentRequestError(reason string) *InvalidPaymentRequestError {
	message := fmt.Sprintf("Invalid payment request: %s", reason)
	details := map[string]interface{}{
		"reason": reason,
	}
	return &InvalidPaymentRequestError{
		X402Error: NewX402Error(message, "INVALID_PAYMENT_REQUEST", details),
		Reason:    reason,
	}
}

// ErrorCode represents metadata about an error code.
type ErrorCode struct {
	Code       string
	Message    string
	Retry      bool
	UserAction string
}

// ErrorCodes contains reference information for all error codes.
var ErrorCodes = map[string]ErrorCode{
	"PAYMENT_REQUIRED": {
		Code:       "PAYMENT_REQUIRED",
		Message:    "Payment is required to access this resource",
		Retry:      true,
		UserAction: "Ensure wallet has sufficient funds and retry",
	},
	"PAYMENT_EXPIRED": {
		Code:       "PAYMENT_EXPIRED",
		Message:    "Payment request has expired",
		Retry:      true,
		UserAction: "Request a new payment authorization",
	},
	"INSUFFICIENT_FUNDS": {
		Code:       "INSUFFICIENT_FUNDS",
		Message:    "Wallet has insufficient token balance",
		Retry:      false,
		UserAction: "Add funds to wallet",
	},
	"PAYMENT_VERIFICATION_FAILED": {
		Code:       "PAYMENT_VERIFICATION_FAILED",
		Message:    "Server could not verify payment",
		Retry:      true,
		UserAction: "Contact API provider if issue persists",
	},
	"TRANSACTION_BROADCAST_FAILED": {
		Code:       "TRANSACTION_BROADCAST_FAILED",
		Message:    "Failed to broadcast transaction to blockchain",
		Retry:      true,
		UserAction: "Check network connection and RPC endpoint",
	},
	"INVALID_PAYMENT_REQUEST": {
		Code:       "INVALID_PAYMENT_REQUEST",
		Message:    "Payment request format is invalid",
		Retry:      false,
		UserAction: "Contact API provider",
	},
}
