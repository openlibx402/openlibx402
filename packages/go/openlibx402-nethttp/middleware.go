// Package nethttp provides middleware for the standard Go net/http package to handle X402 payments.
package nethttp

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/openlibx402/go/openlibx402-core"
)

// Config holds global configuration for X402 middleware.
type Config struct {
	PaymentAddress string
	TokenMint      string
	Network        string
	RPCURL         string
	AutoVerify     bool
}

var globalConfig *Config

// InitX402 initializes the global X402 configuration.
//
// This should be called once at application startup before using the PaymentRequired middleware.
//
// Example:
//
//	nethttp.InitX402(&nethttp.Config{
//	    PaymentAddress: "YOUR_WALLET_ADDRESS",
//	    TokenMint:      "USDC_MINT_ADDRESS",
//	    Network:        "solana-devnet",
//	    AutoVerify:     true,
//	})
func InitX402(config *Config) {
	if config.Network == "" {
		config.Network = "solana-devnet"
	}
	if config.RPCURL == "" {
		config.RPCURL = core.GetDefaultRPCURL(config.Network)
	}
	globalConfig = config
}

// PaymentRequiredOptions configures payment requirements for a specific endpoint.
type PaymentRequiredOptions struct {
	Amount         string // Required payment amount (e.g., "0.10")
	PaymentAddress string // Optional override of global payment address
	TokenMint      string // Optional override of global token mint
	Network        string // Optional override of global network
	Description    string // Human-readable description
	ExpiresIn      int    // Expiration time in seconds (default: 300)
	AutoVerify     bool   // Auto-verify payment on-chain (default: true)
}

// PaymentRequired returns middleware that requires payment for the wrapped handler.
//
// Usage:
//
//	http.Handle("/premium-data", nethttp.PaymentRequired(nethttp.PaymentRequiredOptions{
//	    Amount:      "0.10",
//	    Description: "Premium market data",
//	})(premiumDataHandler))
func PaymentRequired(opts PaymentRequiredOptions) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get configuration
			config := globalConfig
			if config == nil {
				http.Error(w, "X402 not initialized. Call InitX402() first.", http.StatusInternalServerError)
				return
			}

			// Determine parameters (use provided values or config)
			paymentAddress := opts.PaymentAddress
			if paymentAddress == "" {
				paymentAddress = config.PaymentAddress
			}

			tokenMint := opts.TokenMint
			if tokenMint == "" {
				tokenMint = config.TokenMint
			}

			network := opts.Network
			if network == "" {
				network = config.Network
			}

			autoVerify := config.AutoVerify
			if opts.ExpiresIn == 0 {
				opts.ExpiresIn = 300
			}

			if paymentAddress == "" || tokenMint == "" {
				http.Error(w, "paymentAddress and tokenMint must be configured", http.StatusInternalServerError)
				return
			}

			// Check for payment authorization header
			authHeader := r.Header.Get("X-Payment-Authorization")

			if authHeader == "" {
				// No payment provided, return 402
				build402Response(w, r, payment402Options{
					Amount:         opts.Amount,
					PaymentAddress: paymentAddress,
					TokenMint:      tokenMint,
					Network:        network,
					Resource:       r.URL.Path,
					Description:    opts.Description,
					ExpiresIn:      opts.ExpiresIn,
				})
				return
			}

			// Payment authorization provided, verify it
			authorization, err := core.PaymentAuthorizationFromHeader(authHeader)
			if err != nil {
				http.Error(w, fmt.Sprintf("Invalid payment authorization: %s", err.Error()), http.StatusBadRequest)
				return
			}

			// Verify payment amount is sufficient
			requiredAmount, _ := strconv.ParseFloat(opts.Amount, 64)
			actualAmount, _ := strconv.ParseFloat(authorization.ActualAmount, 64)
			if actualAmount < requiredAmount {
				respondJSON(w, http.StatusForbidden, map[string]interface{}{
					"error":    "Insufficient payment",
					"required": opts.Amount,
					"provided": authorization.ActualAmount,
				})
				return
			}

			// Verify payment addresses match
			if authorization.PaymentAddress != paymentAddress {
				respondJSON(w, http.StatusForbidden, map[string]interface{}{
					"error":    "Payment address mismatch",
					"expected": paymentAddress,
					"provided": authorization.PaymentAddress,
				})
				return
			}

			// Verify token mint matches
			if authorization.AssetAddress != tokenMint {
				respondJSON(w, http.StatusForbidden, map[string]interface{}{
					"error":    "Token mint mismatch",
					"expected": tokenMint,
					"provided": authorization.AssetAddress,
				})
				return
			}

			// Verify on-chain if auto_verify is enabled
			if autoVerify && authorization.TransactionHash != "" {
				processor := core.NewSolanaPaymentProcessor(config.RPCURL, nil)
				defer processor.Close()

				verified, err := processor.VerifyTransaction(
					r.Context(),
					authorization.TransactionHash,
					paymentAddress,
					authorization.ActualAmount,
					tokenMint,
				)

				if err != nil || !verified {
					respondJSON(w, http.StatusForbidden, map[string]interface{}{
						"error":   "Payment verification failed",
						"message": err.Error(),
					})
					return
				}
			}

			// Payment verified, attach to request context and continue
			ctx := context.WithValue(r.Context(), paymentAuthKey, authorization)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// paymentAuthKey is the context key for PaymentAuthorization.
type contextKey string

const paymentAuthKey contextKey = "payment_authorization"

// GetPaymentAuthorization retrieves the PaymentAuthorization from the request context.
//
// This is useful if you want to access payment details in your handler.
func GetPaymentAuthorization(r *http.Request) *core.PaymentAuthorization {
	if auth, ok := r.Context().Value(paymentAuthKey).(*core.PaymentAuthorization); ok {
		return auth
	}
	return nil
}

// payment402Options contains options for building a 402 response.
type payment402Options struct {
	Amount         string
	PaymentAddress string
	TokenMint      string
	Network        string
	Resource       string
	Description    string
	ExpiresIn      int
}

// build402Response builds and sends a 402 Payment Required response.
func build402Response(w http.ResponseWriter, r *http.Request, opts payment402Options) {
	// Generate unique payment ID and nonce
	paymentID := generateID()
	nonce := generateID()

	// Calculate expiration
	expiresAt := time.Now().UTC().Add(time.Duration(opts.ExpiresIn) * time.Second)

	// Create payment request
	paymentReq := &core.PaymentRequest{
		MaxAmountRequired: opts.Amount,
		AssetType:         "SPL",
		AssetAddress:      opts.TokenMint,
		PaymentAddress:    opts.PaymentAddress,
		Network:           opts.Network,
		ExpiresAt:         expiresAt,
		Nonce:             nonce,
		PaymentID:         paymentID,
		Resource:          opts.Resource,
		Description:       opts.Description,
	}

	respondJSON(w, http.StatusPaymentRequired, paymentReq)
}

// respondJSON sends a JSON response.
func respondJSON(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

// generateID generates a random hexadecimal ID.
func generateID() string {
	bytes := make([]byte, 16)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

// PaymentRequiredFunc is a wrapper that converts a HandlerFunc to use PaymentRequired middleware.
//
// Usage:
//
//	http.HandleFunc("/premium-data", nethttp.PaymentRequiredFunc(nethttp.PaymentRequiredOptions{
//	    Amount: "0.10",
//	}, func(w http.ResponseWriter, r *http.Request) {
//	    json.NewEncoder(w).Encode(map[string]string{"data": "premium content"})
//	}))
func PaymentRequiredFunc(opts PaymentRequiredOptions, handler http.HandlerFunc) http.HandlerFunc {
	middleware := PaymentRequired(opts)
	wrappedHandler := middleware(handler)
	return wrappedHandler.ServeHTTP
}
