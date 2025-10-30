package main

import (
	"context"
	"fmt"
	"io"
	"log"
	"os"

	"github.com/gagliardetto/solana-go"
	"github.com/mr-tron/base58"
	"github.com/openlibx402/go/openlibx402-client"
)

// This example demonstrates how to use the X402 client to access paid APIs.
//
// To run this example:
//  1. Set your Solana wallet private key: export X402_PRIVATE_KEY="your-base58-private-key"
//  2. Make sure the server is running: go run main.go
//  3. Run this client: go run client_example.go
func runClientExample() {
	// Load wallet keypair from environment
	privateKeyStr := os.Getenv("X402_PRIVATE_KEY")
	if privateKeyStr == "" {
		log.Fatal("X402_PRIVATE_KEY environment variable not set")
	}

	privateKeyBytes := base58.Decode(privateKeyStr)
	walletKeypair := solana.PrivateKey(privateKeyBytes)

	// Create X402 auto client (automatically handles payments)
	client := client.NewAutoClient(walletKeypair, "", &client.AutoClientOptions{
		MaxPaymentAmount: "10.0", // Safety limit
		AutoRetry:        true,
		AllowLocal:       true, // Enable for local development
	})
	defer client.Close()

	ctx := context.Background()

	// Example 1: Access free endpoint
	log.Println("\n📡 Accessing free endpoint...")
	resp, err := client.Get(ctx, "http://localhost:8080/api/free-data")
	if err != nil {
		log.Printf("❌ Error: %v", err)
	} else {
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		log.Printf("✅ Response: %s", string(body))
	}

	// Example 2: Access premium endpoint (automatically pays)
	log.Println("\n📡 Accessing premium endpoint...")
	resp, err = client.Get(ctx, "http://localhost:8080/api/premium-data")
	if err != nil {
		log.Printf("❌ Error: %v", err)
	} else {
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		log.Printf("✅ Response: %s", string(body))
	}

	// Example 3: Access expensive endpoint
	log.Println("\n📡 Accessing expensive endpoint...")
	resp, err = client.Get(ctx, "http://localhost:8080/api/expensive-data")
	if err != nil {
		log.Printf("❌ Error: %v", err)
	} else {
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		log.Printf("✅ Response: %s", string(body))
	}

	// Example 4: POST to process endpoint
	log.Println("\n📡 Posting to process endpoint...")
	requestBody := []byte(`{"data": "sample data to process"}`)
	resp, err = client.Post(ctx, "http://localhost:8080/api/process", requestBody)
	if err != nil {
		log.Printf("❌ Error: %v", err)
	} else {
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		log.Printf("✅ Response: %s", string(body))
	}
}

// Example using explicit client (manual payment control)
func runExplicitClientExample() {
	privateKeyStr := os.Getenv("X402_PRIVATE_KEY")
	if privateKeyStr == "" {
		log.Fatal("X402_PRIVATE_KEY environment variable not set")
	}

	privateKeyBytes := base58.Decode(privateKeyStr)
	walletKeypair := solana.PrivateKey(privateKeyBytes)

	// Create explicit client
	client := client.NewX402Client(walletKeypair, "", nil, true)
	defer client.Close()

	ctx := context.Background()

	log.Println("\n📡 Accessing premium endpoint with explicit client...")

	// Initial request
	resp, err := client.Get(ctx, "http://localhost:8080/api/premium-data", nil)
	if err != nil {
		log.Fatal(err)
	}

	// Check if payment required
	if client.PaymentRequired(resp) {
		log.Println("💰 Payment required, processing payment...")

		// Parse payment request
		paymentReq, err := client.ParsePaymentRequest(resp)
		if err != nil {
			log.Fatal(err)
		}

		log.Printf("💵 Amount required: %s USDC", paymentReq.MaxAmountRequired)

		// Create and broadcast payment
		auth, err := client.CreatePayment(ctx, paymentReq, "")
		if err != nil {
			log.Fatal(err)
		}

		log.Printf("✅ Payment broadcasted: %s", auth.TransactionHash)

		// Retry with payment authorization
		resp, err = client.Get(ctx, "http://localhost:8080/api/premium-data", auth)
		if err != nil {
			log.Fatal(err)
		}
	}

	// Read response
	body, _ := io.ReadAll(resp.Body)
	resp.Body.Close()
	log.Printf("✅ Response: %s", string(body))
}

// Uncomment one of these in your main function to run the examples
func main() {
	fmt.Println("X402 Client Examples")
	fmt.Println("====================")

	// Run auto client example
	runClientExample()

	// Or run explicit client example
	// runExplicitClientExample()
}
