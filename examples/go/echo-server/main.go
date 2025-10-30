package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	echox402 "github.com/openlibx402/go/openlibx402-echo"
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
	echox402.InitX402(&echox402.Config{
		PaymentAddress: paymentAddress,
		TokenMint:      tokenMint,
		Network:        network,
		AutoVerify:     true,
	})

	// Create Echo instance
	e := echo.New()

	// Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())

	// Routes

	// Free endpoint - no payment required
	e.GET("/api/free-data", freeDataHandler)

	// Premium endpoint - requires payment
	e.GET("/api/premium-data", premiumDataHandler, echox402.PaymentRequired(echox402.PaymentRequiredOptions{
		Amount:      "0.10",
		Description: "Premium market data access",
	}))

	// Expensive endpoint - higher payment
	e.GET("/api/expensive-data", expensiveDataHandler, echox402.PaymentRequired(echox402.PaymentRequiredOptions{
		Amount:      "1.00",
		Description: "High-value exclusive data",
	}))

	// Process endpoint - dynamic pricing
	e.POST("/api/process", processHandler, echox402.PaymentRequired(echox402.PaymentRequiredOptions{
		Amount:      "0.50",
		Description: "Data processing service",
	}))

	// Tiered pricing endpoint
	e.GET("/api/tiered/:tier", tieredDataHandler)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 X402 Echo Server starting on port %s", port)
	log.Printf("📍 Network: %s", network)
	log.Printf("💰 Payment Address: %s", paymentAddress)
	log.Printf("🪙 Token Mint: %s", tokenMint)
	log.Println("")
	log.Println("Available endpoints:")
	log.Println("  GET  /api/free-data         - Free access (no payment)")
	log.Println("  GET  /api/premium-data      - $0.10 USDC")
	log.Println("  GET  /api/expensive-data    - $1.00 USDC")
	log.Println("  POST /api/process           - $0.50 USDC")
	log.Println("  GET  /api/tiered/:tier      - Dynamic pricing by tier")
	log.Println("")

	e.Logger.Fatal(e.Start(":" + port))
}

// freeDataHandler handles free data requests.
func freeDataHandler(c echo.Context) error {
	data := map[string]interface{}{
		"message": "This is free public data",
		"data": map[string]interface{}{
			"timestamp": "2024-01-01T00:00:00Z",
			"value":     "basic information",
		},
	}
	return c.JSON(http.StatusOK, data)
}

// premiumDataHandler handles premium data requests.
func premiumDataHandler(c echo.Context) error {
	// You can access payment details if needed
	auth := echox402.GetPaymentAuthorization(c)
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
	return c.JSON(http.StatusOK, data)
}

// expensiveDataHandler handles expensive data requests.
func expensiveDataHandler(c echo.Context) error {
	auth := echox402.GetPaymentAuthorization(c)
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
	return c.JSON(http.StatusOK, data)
}

// processHandler handles data processing requests.
func processHandler(c echo.Context) error {
	auth := echox402.GetPaymentAuthorization(c)
	if auth != nil {
		log.Printf("✅ Payment received: %s USDC from %s", auth.ActualAmount, auth.PublicKey)
	}

	// Parse request body
	var input map[string]interface{}
	if err := c.Bind(&input); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid JSON")
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
	return c.JSON(http.StatusOK, result)
}

// tieredDataHandler demonstrates dynamic pricing based on tier.
func tieredDataHandler(c echo.Context) error {
	tier := c.Param("tier")

	// Define pricing per tier
	pricing := map[string]string{
		"basic":    "0.05",
		"standard": "0.10",
		"premium":  "0.25",
		"ultimate": "1.00",
	}

	amount, ok := pricing[tier]
	if !ok {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid tier. Choose: basic, standard, premium, ultimate")
	}

	// Apply payment middleware dynamically
	paymentMiddleware := echox402.PaymentRequired(echox402.PaymentRequiredOptions{
		Amount:      amount,
		Description: fmt.Sprintf("Tiered data access - %s tier", tier),
	})

	// Wrap handler with payment middleware
	handler := paymentMiddleware(func(c echo.Context) error {
		auth := echox402.GetPaymentAuthorization(c)
		if auth != nil {
			log.Printf("✅ Payment received: %s USDC from %s for %s tier", auth.ActualAmount, auth.PublicKey, tier)
		}

		data := map[string]interface{}{
			"message": fmt.Sprintf("This is %s tier data (paid $%s)", tier, amount),
			"tier":    tier,
			"data": map[string]interface{}{
				"timestamp": "2024-01-01T00:00:00Z",
				"value":     fmt.Sprintf("%s tier content", tier),
				"quality":   tier,
			},
		}
		return c.JSON(http.StatusOK, data)
	})

	return handler(c)
}
