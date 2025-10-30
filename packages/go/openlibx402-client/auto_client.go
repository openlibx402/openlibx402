package client

import (
	"context"
	"fmt"
	"net/http"

	"github.com/gagliardetto/solana-go"
	"github.com/openlibx402/go/openlibx402-core"
)

// X402AutoClient automatically handles the X402 payment flow.
//
// When a 402 response is received, the client automatically creates
// and broadcasts the payment, then retries the request with authorization.
type X402AutoClient struct {
	client           *X402Client
	maxRetries       int
	autoRetry        bool
	maxPaymentAmount string
}

// NewX402AutoClient creates a new automatic X402 client.
//
// Parameters:
//   - walletKeypair: Solana wallet keypair for signing transactions
//   - rpcURL: Solana RPC endpoint URL (optional, defaults to devnet)
//   - options: Optional configuration
//
// Usage:
//
//	client := NewX402AutoClient(walletKeypair, "", &AutoClientOptions{
//	    MaxPaymentAmount: "10.0", // Safety limit
//	    AutoRetry: true,
//	})
//	defer client.Close()
//
//	// Automatically handles 402 and pays
//	resp, err := client.Get(ctx, "https://api.example.com/premium-data")
//	if err != nil {
//	    log.Fatal(err)
//	}
//	defer resp.Body.Close()
//
//	data, _ := io.ReadAll(resp.Body)
//	fmt.Println(string(data))
type NewX402AutoClient struct {
	MaxRetries       int
	AutoRetry        bool
	MaxPaymentAmount string
	AllowLocal       bool
}

// AutoClientOptions contains configuration options for X402AutoClient.
type AutoClientOptions struct {
	MaxRetries       int    // Maximum retry attempts (default: 1)
	AutoRetry        bool   // Automatically retry on 402 (default: true)
	MaxPaymentAmount string // Safety limit for payments (optional)
	AllowLocal       bool   // Allow localhost URLs for development (default: false)
}

// NewX402AutoClient creates a new automatic X402 client.
func NewAutoClient(
	walletKeypair solana.PrivateKey,
	rpcURL string,
	options *AutoClientOptions,
) *X402AutoClient {
	if options == nil {
		options = &AutoClientOptions{
			MaxRetries: 1,
			AutoRetry:  true,
			AllowLocal: false,
		}
	}

	client := NewX402Client(walletKeypair, rpcURL, nil, options.AllowLocal)

	return &X402AutoClient{
		client:           client,
		maxRetries:       options.MaxRetries,
		autoRetry:        options.AutoRetry,
		maxPaymentAmount: options.MaxPaymentAmount,
	}
}

// Close closes the client and cleans up resources.
func (c *X402AutoClient) Close() error {
	return c.client.Close()
}

// fetch makes an HTTP request with automatic payment handling.
func (c *X402AutoClient) fetch(
	ctx context.Context,
	method string,
	url string,
	body []byte,
) (*http.Response, error) {
	var resp *http.Response
	var err error

	// Make initial request
	switch method {
	case "GET":
		resp, err = c.client.Get(ctx, url, nil)
	case "POST":
		resp, err = c.client.Post(ctx, url, body, nil)
	case "PUT":
		resp, err = c.client.Put(ctx, url, body, nil)
	case "DELETE":
		resp, err = c.client.Delete(ctx, url, nil)
	default:
		return nil, fmt.Errorf("unsupported HTTP method: %s", method)
	}

	if err != nil {
		return nil, err
	}

	// Check if payment required
	if c.client.PaymentRequired(resp) {
		if !c.autoRetry {
			paymentReq, _ := c.client.ParsePaymentRequest(resp)
			return nil, core.NewPaymentRequiredError(paymentReq, "")
		}

		// Parse payment request
		paymentReq, err := c.client.ParsePaymentRequest(resp)
		if err != nil {
			return nil, err
		}

		// Safety check
		if c.maxPaymentAmount != "" {
			reqAmountFloat := 0.0
			maxAmountFloat := 0.0
			fmt.Sscanf(paymentReq.MaxAmountRequired, "%f", &reqAmountFloat)
			fmt.Sscanf(c.maxPaymentAmount, "%f", &maxAmountFloat)

			if reqAmountFloat > maxAmountFloat {
				return nil, fmt.Errorf(
					"payment amount %s exceeds max allowed %s",
					paymentReq.MaxAmountRequired,
					c.maxPaymentAmount,
				)
			}
		}

		// Create payment
		authorization, err := c.client.CreatePayment(ctx, paymentReq, "")
		if err != nil {
			return nil, err
		}

		// Retry with payment
		switch method {
		case "GET":
			resp, err = c.client.Get(ctx, url, authorization)
		case "POST":
			resp, err = c.client.Post(ctx, url, body, authorization)
		case "PUT":
			resp, err = c.client.Put(ctx, url, body, authorization)
		case "DELETE":
			resp, err = c.client.Delete(ctx, url, authorization)
		}

		if err != nil {
			return nil, err
		}
	}

	return resp, nil
}

// Get executes a GET request with automatic payment handling.
func (c *X402AutoClient) Get(ctx context.Context, url string) (*http.Response, error) {
	return c.fetch(ctx, "GET", url, nil)
}

// Post executes a POST request with automatic payment handling.
func (c *X402AutoClient) Post(ctx context.Context, url string, body []byte) (*http.Response, error) {
	return c.fetch(ctx, "POST", url, body)
}

// Put executes a PUT request with automatic payment handling.
func (c *X402AutoClient) Put(ctx context.Context, url string, body []byte) (*http.Response, error) {
	return c.fetch(ctx, "PUT", url, body)
}

// Delete executes a DELETE request with automatic payment handling.
func (c *X402AutoClient) Delete(ctx context.Context, url string) (*http.Response, error) {
	return c.fetch(ctx, "DELETE", url, nil)
}
