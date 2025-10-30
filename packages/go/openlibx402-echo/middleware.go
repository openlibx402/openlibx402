// Package echo provides middleware for the Echo web framework to handle X402 payments.
package echo

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
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
//	echox402.InitX402(&echox402.Config{
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

// PaymentRequired returns Echo middleware that requires payment for the wrapped handler.
//
// Usage:
//
//	e.GET("/premium-data", premiumDataHandler, echox402.PaymentRequired(echox402.PaymentRequiredOptions{
//	    Amount:      "0.10",
//	    Description: "Premium market data",
//	}))
func PaymentRequired(opts PaymentRequiredOptions) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Get configuration
			config := globalConfig
			if config == nil {
				return echo.NewHTTPError(http.StatusInternalServerError, "X402 not initialized. Call InitX402() first.")
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
				return echo.NewHTTPError(http.StatusInternalServerError, "paymentAddress and tokenMint must be configured")
			}

			// Check for payment authorization header
			authHeader := c.Request().Header.Get("X-Payment-Authorization")

			if authHeader == "" {
				// No payment provided, return 402
				return build402Response(c, payment402Options{
					Amount:         opts.Amount,
					PaymentAddress: paymentAddress,
					TokenMint:      tokenMint,
					Network:        network,
					Resource:       c.Request().URL.Path,
					Description:    opts.Description,
					ExpiresIn:      opts.ExpiresIn,
				})
			}

			// Payment authorization provided, verify it
			authorization, err := core.PaymentAuthorizationFromHeader(authHeader)
			if err != nil {
				return c.JSON(http.StatusBadRequest, map[string]interface{}{
					"error":   "Invalid payment authorization",
					"message": err.Error(),
				})
			}

			// Verify payment amount is sufficient
			requiredAmount, _ := strconv.ParseFloat(opts.Amount, 64)
			actualAmount, _ := strconv.ParseFloat(authorization.ActualAmount, 64)
			if actualAmount < requiredAmount {
				return c.JSON(http.StatusForbidden, map[string]interface{}{
					"error":    "Insufficient payment",
					"required": opts.Amount,
					"provided": authorization.ActualAmount,
				})
			}

			// Verify payment addresses match
			if authorization.PaymentAddress != paymentAddress {
				return c.JSON(http.StatusForbidden, map[string]interface{}{
					"error":    "Payment address mismatch",
					"expected": paymentAddress,
					"provided": authorization.PaymentAddress,
				})
			}

			// Verify token mint matches
			if authorization.AssetAddress != tokenMint {
				return c.JSON(http.StatusForbidden, map[string]interface{}{
					"error":    "Token mint mismatch",
					"expected": tokenMint,
					"provided": authorization.AssetAddress,
				})
			}

			// Verify on-chain if auto_verify is enabled
			if autoVerify && authorization.TransactionHash != "" {
				processor := core.NewSolanaPaymentProcessor(config.RPCURL, nil)
				defer processor.Close()

				verified, err := processor.VerifyTransaction(
					c.Request().Context(),
					authorization.TransactionHash,
					paymentAddress,
					authorization.ActualAmount,
					tokenMint,
				)

				if err != nil || !verified {
					return c.JSON(http.StatusForbidden, map[string]interface{}{
						"error":   "Payment verification failed",
						"message": err.Error(),
					})
				}
			}

			// Payment verified, attach to context and continue
			c.Set("payment_authorization", authorization)
			return next(c)
		}
	}
}

// GetPaymentAuthorization retrieves the PaymentAuthorization from the Echo context.
//
// This is useful if you want to access payment details in your handler.
//
// Example:
//
//	func premiumDataHandler(c echo.Context) error {
//	    auth := echox402.GetPaymentAuthorization(c)
//	    if auth != nil {
//	        log.Printf("Payment received: %s from %s", auth.ActualAmount, auth.PublicKey)
//	    }
//	    return c.JSON(http.StatusOK, map[string]string{"data": "premium content"})
//	}
func GetPaymentAuthorization(c echo.Context) *core.PaymentAuthorization {
	if auth, ok := c.Get("payment_authorization").(*core.PaymentAuthorization); ok {
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
func build402Response(c echo.Context, opts payment402Options) error {
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

	return c.JSON(http.StatusPaymentRequired, paymentReq)
}

// generateID generates a random hexadecimal ID.
func generateID() string {
	bytes := make([]byte, 16)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}
