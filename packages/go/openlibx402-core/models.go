// Package core provides core data structures and functionality for the X402 payment protocol.
//
// The X402 protocol enables AI agents and APIs to autonomously pay for services using
// HTTP 402 "Payment Required" status code and blockchain micropayments on Solana.
package core

import (
	"encoding/base64"
	"encoding/json"
	"time"
)

// PaymentRequest represents an X402 payment request (402 response).
//
// When a server requires payment for a resource, it returns a 402 status code
// with a PaymentRequest in the response body containing payment details.
type PaymentRequest struct {
	MaxAmountRequired string    `json:"max_amount_required"`   // Amount in token units (e.g., "0.10")
	AssetType         string    `json:"asset_type"`            // "SPL" for Solana tokens
	AssetAddress      string    `json:"asset_address"`         // Token mint address
	PaymentAddress    string    `json:"payment_address"`       // Recipient's wallet address
	Network           string    `json:"network"`               // "solana-devnet" | "solana-mainnet"
	ExpiresAt         time.Time `json:"expires_at"`            // Expiration timestamp
	Nonce             string    `json:"nonce"`                 // Unique identifier for replay protection
	PaymentID         string    `json:"payment_id"`            // Unique payment request ID
	Resource          string    `json:"resource"`              // API endpoint being accessed
	Description       string    `json:"description,omitempty"` // Human-readable description (optional)
}

// IsExpired checks if the payment request has expired.
func (pr *PaymentRequest) IsExpired() bool {
	return time.Now().UTC().After(pr.ExpiresAt)
}

// ToJSON converts the payment request to a JSON string.
func (pr *PaymentRequest) ToJSON() (string, error) {
	data, err := json.Marshal(pr)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// FromJSON parses a PaymentRequest from a JSON string.
func PaymentRequestFromJSON(jsonStr string) (*PaymentRequest, error) {
	var pr PaymentRequest
	if err := json.Unmarshal([]byte(jsonStr), &pr); err != nil {
		return nil, NewInvalidPaymentRequestError("failed to parse payment request: " + err.Error())
	}
	return &pr, nil
}

// PaymentAuthorization represents a signed payment authorization sent with retry request.
//
// After creating and broadcasting a payment transaction, the client includes this
// authorization in the X-Payment-Authorization header when retrying the request.
type PaymentAuthorization struct {
	PaymentID       string    `json:"payment_id"`                 // From payment request
	ActualAmount    string    `json:"actual_amount"`              // Amount being paid (≤ max_amount_required)
	PaymentAddress  string    `json:"payment_address"`            // Recipient address
	AssetAddress    string    `json:"asset_address"`              // Token mint address
	Network         string    `json:"network"`                    // Blockchain network
	Timestamp       time.Time `json:"timestamp"`                  // Authorization timestamp
	Signature       string    `json:"signature"`                  // Solana signature
	PublicKey       string    `json:"public_key"`                 // Payer's public key
	TransactionHash string    `json:"transaction_hash,omitempty"` // On-chain tx hash (after broadcast)
}

// ToHeaderValue encodes the PaymentAuthorization as a base64-encoded JSON string
// for use in the X-Payment-Authorization HTTP header.
func (pa *PaymentAuthorization) ToHeaderValue() (string, error) {
	jsonData, err := json.Marshal(pa)
	if err != nil {
		return "", err
	}
	encoded := base64.StdEncoding.EncodeToString(jsonData)
	return encoded, nil
}

// FromHeader parses a PaymentAuthorization from the X-Payment-Authorization header value.
func PaymentAuthorizationFromHeader(headerValue string) (*PaymentAuthorization, error) {
	decoded, err := base64.StdEncoding.DecodeString(headerValue)
	if err != nil {
		return nil, NewInvalidPaymentRequestError("failed to decode base64: " + err.Error())
	}

	var pa PaymentAuthorization
	if err := json.Unmarshal(decoded, &pa); err != nil {
		return nil, NewInvalidPaymentRequestError("failed to parse payment authorization: " + err.Error())
	}

	return &pa, nil
}

// ToJSON converts the payment authorization to a JSON string.
func (pa *PaymentAuthorization) ToJSON() (string, error) {
	data, err := json.Marshal(pa)
	if err != nil {
		return "", err
	}
	return string(data), nil
}
