// Package client provides HTTP client functionality for the X402 payment protocol.
//
// It includes both explicit and automatic payment handling for AI agents and applications
// that need to make payments to access paid APIs.
package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"net/url"
	"strings"

	"github.com/gagliardetto/solana-go"
	"github.com/openlibx402/go/openlibx402-core"
)

// X402Client provides explicit control over the X402 payment flow.
//
// With explicit mode, the developer manually checks for 402 responses,
// creates payments, and retries requests with payment authorization.
type X402Client struct {
	walletKeypair *solana.PrivateKey
	httpClient    *http.Client
	processor     *core.SolanaPaymentProcessor
	allowLocal    bool
	closed        bool
}

// NewX402Client creates a new explicit X402 client.
//
// Parameters:
//   - walletKeypair: Solana wallet keypair for signing transactions
//   - rpcURL: Solana RPC endpoint URL (optional, defaults to devnet)
//   - httpClient: Custom HTTP client (optional)
//   - allowLocal: Allow requests to localhost/private IPs (for development only)
//
// Usage (Production):
//
//	client := NewX402Client(walletKeypair, "", nil, false)
//	defer client.Close()
//
//	resp, err := client.Get(ctx, "https://api.example.com/data", nil)
//	if err != nil {
//	    log.Fatal(err)
//	}
//
//	if client.PaymentRequired(resp) {
//	    paymentReq, err := client.ParsePaymentRequest(resp)
//	    if err != nil {
//	        log.Fatal(err)
//	    }
//
//	    auth, err := client.CreatePayment(ctx, paymentReq, "")
//	    if err != nil {
//	        log.Fatal(err)
//	    }
//
//	    resp, err = client.Get(ctx, "https://api.example.com/data", auth)
//	    if err != nil {
//	        log.Fatal(err)
//	    }
//	}
//
// Usage (Local Development):
//
//	client := NewX402Client(walletKeypair, "", nil, true)
//	defer client.Close()
//
//	resp, err := client.Get(ctx, "http://localhost:8080/api/data", nil)
//	// ... handle payment flow same as above
func NewX402Client(
	walletKeypair solana.PrivateKey,
	rpcURL string,
	httpClient *http.Client,
	allowLocal bool,
) *X402Client {
	if rpcURL == "" {
		rpcURL = "https://api.devnet.solana.com"
	}

	if httpClient == nil {
		httpClient = &http.Client{}
	}

	processor := core.NewSolanaPaymentProcessor(rpcURL, &walletKeypair)

	return &X402Client{
		walletKeypair: &walletKeypair,
		httpClient:    httpClient,
		processor:     processor,
		allowLocal:    allowLocal,
		closed:        false,
	}
}

// Close closes the client and cleans up resources.
//
// IMPORTANT: Always call this method when done to properly cleanup
// connections and attempt to clear sensitive data from memory.
func (c *X402Client) Close() error {
	if c.closed {
		return nil
	}

	err := c.processor.Close()
	c.walletKeypair = nil
	c.closed = true
	return err
}

// validateURL performs basic URL validation to prevent SSRF attacks.
func (c *X402Client) validateURL(urlStr string) error {
	parsedURL, err := url.Parse(urlStr)
	if err != nil {
		return fmt.Errorf("invalid URL: %w", err)
	}

	// Require http or https scheme
	if parsedURL.Scheme != "http" && parsedURL.Scheme != "https" {
		return fmt.Errorf("invalid URL scheme: %s. Only http/https allowed", parsedURL.Scheme)
	}

	// Skip localhost/private IP checks if allowLocal is enabled
	if c.allowLocal {
		return nil
	}

	hostname := strings.ToLower(parsedURL.Hostname())

	// Check for localhost
	if hostname == "localhost" || hostname == "127.0.0.1" || hostname == "::1" {
		return fmt.Errorf("requests to localhost are not allowed. For local development, set allowLocal=true")
	}

	// Check for private IP ranges (basic check)
	if strings.HasPrefix(hostname, "10.") ||
		strings.HasPrefix(hostname, "192.168.") ||
		strings.HasPrefix(hostname, "172.16.") ||
		strings.HasPrefix(hostname, "172.17.") ||
		strings.HasPrefix(hostname, "172.18.") ||
		strings.HasPrefix(hostname, "172.19.") ||
		strings.HasPrefix(hostname, "172.20.") ||
		strings.HasPrefix(hostname, "172.21.") ||
		strings.HasPrefix(hostname, "172.22.") ||
		strings.HasPrefix(hostname, "172.23.") ||
		strings.HasPrefix(hostname, "172.24.") ||
		strings.HasPrefix(hostname, "172.25.") ||
		strings.HasPrefix(hostname, "172.26.") ||
		strings.HasPrefix(hostname, "172.27.") ||
		strings.HasPrefix(hostname, "172.28.") ||
		strings.HasPrefix(hostname, "172.29.") ||
		strings.HasPrefix(hostname, "172.30.") ||
		strings.HasPrefix(hostname, "172.31.") {
		return fmt.Errorf("requests to private IP addresses are not allowed. For local development, set allowLocal=true")
	}

	return nil
}

// Do executes an HTTP request with optional payment authorization.
func (c *X402Client) Do(ctx context.Context, req *http.Request, payment *core.PaymentAuthorization) (*http.Response, error) {
	if c.closed {
		return nil, fmt.Errorf("client has been closed")
	}

	if err := c.validateURL(req.URL.String()); err != nil {
		return nil, err
	}

	// Add payment authorization header if provided
	if payment != nil {
		headerValue, err := payment.ToHeaderValue()
		if err != nil {
			return nil, fmt.Errorf("failed to encode payment authorization: %w", err)
		}
		req.Header.Set("X-Payment-Authorization", headerValue)
	}

	// Execute request
	return c.httpClient.Do(req.WithContext(ctx))
}

// Get executes a GET request.
func (c *X402Client) Get(ctx context.Context, url string, payment *core.PaymentAuthorization) (*http.Response, error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	return c.Do(ctx, req, payment)
}

// Post executes a POST request.
func (c *X402Client) Post(ctx context.Context, url string, body []byte, payment *core.PaymentAuthorization) (*http.Response, error) {
	req, err := http.NewRequest("POST", url, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	return c.Do(ctx, req, payment)
}

// Put executes a PUT request.
func (c *X402Client) Put(ctx context.Context, url string, body []byte, payment *core.PaymentAuthorization) (*http.Response, error) {
	req, err := http.NewRequest("PUT", url, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	return c.Do(ctx, req, payment)
}

// Delete executes a DELETE request.
func (c *X402Client) Delete(ctx context.Context, url string, payment *core.PaymentAuthorization) (*http.Response, error) {
	req, err := http.NewRequest("DELETE", url, nil)
	if err != nil {
		return nil, err
	}
	return c.Do(ctx, req, payment)
}

// PaymentRequired checks if a response indicates that payment is required (status 402).
func (c *X402Client) PaymentRequired(resp *http.Response) bool {
	return resp.StatusCode == http.StatusPaymentRequired
}

// ParsePaymentRequest parses a PaymentRequest from a 402 response.
func (c *X402Client) ParsePaymentRequest(resp *http.Response) (*core.PaymentRequest, error) {
	if !c.PaymentRequired(resp) {
		return nil, fmt.Errorf("response does not require payment (status != 402)")
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}
	defer resp.Body.Close()

	var paymentReq core.PaymentRequest
	if err := json.Unmarshal(body, &paymentReq); err != nil {
		return nil, core.NewInvalidPaymentRequestError("failed to parse payment request: " + err.Error())
	}

	return &paymentReq, nil
}

// CreatePayment creates and broadcasts a payment transaction, returning a PaymentAuthorization.
//
// Parameters:
//   - ctx: Context for cancellation
//   - request: The payment request from the 402 response
//   - amount: Optional custom amount (uses max_amount_required if empty)
//
// Returns:
//   - PaymentAuthorization to include in retry request
func (c *X402Client) CreatePayment(
	ctx context.Context,
	request *core.PaymentRequest,
	amount string,
) (*core.PaymentAuthorization, error) {
	if c.closed {
		return nil, fmt.Errorf("client has been closed")
	}

	if c.walletKeypair == nil {
		return nil, fmt.Errorf("client has been closed")
	}

	// Validate request not expired
	if request.IsExpired() {
		return nil, core.NewPaymentExpiredError(request, "")
	}

	// Use provided amount or max required
	payAmount := amount
	if payAmount == "" {
		payAmount = request.MaxAmountRequired
	}

	// Check sufficient balance
	balance, err := c.processor.GetTokenBalance(
		ctx,
		c.walletKeypair.PublicKey().String(),
		request.AssetAddress,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get token balance: %w", err)
	}

	// Convert to smallest unit (assuming 6 decimals) for precise comparison
	decimals := 6
	balanceSmallestUnit := uint64(math.Floor(balance * math.Pow(10, float64(decimals))))

	payAmountFloat := 0.0
	_, err = fmt.Sscanf(payAmount, "%f", &payAmountFloat)
	if err != nil {
		return nil, fmt.Errorf("invalid amount format: %w", err)
	}
	amountSmallestUnit := uint64(math.Floor(payAmountFloat * math.Pow(10, float64(decimals))))

	if balanceSmallestUnit < amountSmallestUnit {
		return nil, core.NewInsufficientFundsError(payAmount, fmt.Sprintf("%.6f", balance))
	}

	// Create transaction
	tx, err := c.processor.CreatePaymentTransaction(ctx, request, payAmount, *c.walletKeypair)
	if err != nil {
		return nil, err
	}

	// Sign and broadcast
	txHash, err := c.processor.SignAndSendTransaction(ctx, tx, *c.walletKeypair)
	if err != nil {
		return nil, err
	}

	// Create authorization
	return &core.PaymentAuthorization{
		PaymentID:       request.PaymentID,
		ActualAmount:    payAmount,
		PaymentAddress:  request.PaymentAddress,
		AssetAddress:    request.AssetAddress,
		Network:         request.Network,
		Timestamp:       request.ExpiresAt, // Use current time in production
		Signature:       txHash,
		PublicKey:       c.walletKeypair.PublicKey().String(),
		TransactionHash: txHash,
	}, nil
}
