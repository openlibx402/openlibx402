package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	nethttp "github.com/openlibx402/go/openlibx402-nethttp"
)

func main() {
	// Load configuration from environment variables
	paymentAddress := os.Getenv("X402_PAYMENT_ADDRESS")
	tokenMint := os.Getenv("X402_TOKEN_MINT")
	network := os.Getenv("X402_NETWORK")

	if paymentAddress == "" {
		paymentAddress = "YOUR_SOLANA_WALLET_ADDRESS"
		log.Println("⚠️  X402_PAYMENT_ADDRESS not set, using placeholder")
	}

	if tokenMint == "" {
		tokenMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" // USDC devnet
		log.Println("⚠️  X402_TOKEN_MINT not set, using USDC devnet")
	}

	if network == "" {
		network = "solana-devnet"
	}

	// Initialize X402 configuration
	nethttp.InitX402(&nethttp.Config{
		PaymentAddress: paymentAddress,
		TokenMint:      tokenMint,
		Network:        network,
		AutoVerify:     true,
	})

	// Create HTTP server
	mux := http.NewServeMux()

	// Free endpoint - no payment required
	mux.HandleFunc("/api/free-data", freeDataHandler)

	// Premium endpoint - requires payment
	mux.Handle("/api/premium-data", nethttp.PaymentRequired(nethttp.PaymentRequiredOptions{
		Amount:      "0.10",
		Description: "Premium market data access",
	})(http.HandlerFunc(premiumDataHandler)))

	// Expensive endpoint - higher payment
	mux.Handle("/api/expensive-data", nethttp.PaymentRequired(nethttp.PaymentRequiredOptions{
		Amount:      "1.00",
		Description: "High-value exclusive data",
	})(http.HandlerFunc(expensiveDataHandler)))

	// Process endpoint - dynamic pricing
	mux.Handle("/api/process", nethttp.PaymentRequired(nethttp.PaymentRequiredOptions{
		Amount:      "0.50",
		Description: "Data processing service",
	})(http.HandlerFunc(processHandler)))

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 X402 Server starting on port %s", port)
	log.Printf("📍 Network: %s", network)
	log.Printf("💰 Payment Address: %s", paymentAddress)
	log.Printf("🪙 Token Mint: %s", tokenMint)
	log.Println("")
	log.Println("Available endpoints:")
	log.Println("  GET  /api/free-data       - Free access (no payment)")
	log.Println("  GET  /api/premium-data    - $0.10 USDC")
	log.Println("  GET  /api/expensive-data  - $1.00 USDC")
	log.Println("  POST /api/process         - $0.50 USDC")
	log.Println("")

	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatal(err)
	}
}

// freeDataHandler handles free data requests.
func freeDataHandler(w http.ResponseWriter, r *http.Request) {
	data := map[string]interface{}{
		"message": "This is free public data",
		"data": map[string]interface{}{
			"timestamp": "2024-01-01T00:00:00Z",
			"value":     "basic information",
		},
	}
	respondJSON(w, http.StatusOK, data)
}

// premiumDataHandler handles premium data requests.
func premiumDataHandler(w http.ResponseWriter, r *http.Request) {
	// You can access payment details if needed
	auth := nethttp.GetPaymentAuthorization(r)
	if auth != nil {
		log.Printf("✅ Payment received: %s USDC from %s", auth.ActualAmount, auth.PublicKey)
	}

	data := map[string]interface{}{
		"message": "This is premium data (paid $0.10)",
		"data": map[string]interface{}{
			"timestamp": "2024-01-01T00:00:00Z",
			"value":     "premium market data",
			"metrics": map[string]interface{}{
				"price":  42.50,
				"volume": 1000000,
				"trend":  "bullish",
			},
		},
	}
	respondJSON(w, http.StatusOK, data)
}

// expensiveDataHandler handles expensive data requests.
func expensiveDataHandler(w http.ResponseWriter, r *http.Request) {
	auth := nethttp.GetPaymentAuthorization(r)
	if auth != nil {
		log.Printf("✅ Payment received: %s USDC from %s", auth.ActualAmount, auth.PublicKey)
	}

	data := map[string]interface{}{
		"message": "This is expensive exclusive data (paid $1.00)",
		"data": map[string]interface{}{
			"timestamp": "2024-01-01T00:00:00Z",
			"value":     "exclusive insights",
			"insights": map[string]interface{}{
				"prediction": "High growth expected",
				"confidence": 0.95,
				"sources":    []string{"expert-1", "expert-2", "expert-3"},
			},
		},
	}
	respondJSON(w, http.StatusOK, data)
}

// processHandler handles data processing requests.
func processHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	auth := nethttp.GetPaymentAuthorization(r)
	if auth != nil {
		log.Printf("✅ Payment received: %s USDC from %s", auth.ActualAmount, auth.PublicKey)
	}

	// Parse request body
	var input map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Process the data (mock processing)
	result := map[string]interface{}{
		"message": "Data processed successfully (paid $0.50)",
		"input":   input,
		"result": map[string]interface{}{
			"processed": true,
			"timestamp": "2024-01-01T00:00:00Z",
			"output":    "Processed: " + fmt.Sprint(input),
		},
	}
	respondJSON(w, http.StatusOK, result)
}

// respondJSON sends a JSON response.
func respondJSON(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}
