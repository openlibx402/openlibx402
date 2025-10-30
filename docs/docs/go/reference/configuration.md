# Configuration Reference

Complete guide to configuring X402 for different use cases and environments.

## Environment Variables

### Core Configuration

#### X402_PAYMENT_ADDRESS (Required)

The Solana wallet address that receives payments.

```bash
export X402_PAYMENT_ADDRESS="YOUR_SOLANA_WALLET_ADDRESS"
```

**Format:** Base58-encoded Solana wallet address
**Example:** `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
**Used by:** Server middleware

---

#### X402_TOKEN_MINT (Required)

The SPL token mint address for payments.

```bash
export X402_TOKEN_MINT="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
```

**Format:** Base58-encoded token mint address
**Example (USDC devnet):** `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
**Example (USDC mainnet):** `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
**Used by:** Server middleware, payment processor

---

### Network Configuration

#### X402_NETWORK (Optional)

Solana network to use.

```bash
export X402_NETWORK="solana-devnet"  # Development
export X402_NETWORK="solana-testnet"  # Testing
export X402_NETWORK="solana-mainnet"  # Production
```

**Default:** `solana-devnet`
**Valid values:** `solana-devnet`, `solana-testnet`, `solana-mainnet`
**Used by:** Core processor, all clients

---

#### X402_RPC_URL (Optional)

Custom Solana RPC endpoint.

```bash
# Use default for network
# Omit to use automatic endpoint

# Or specify custom endpoint
export X402_RPC_URL="https://api.devnet.solana.com"
export X402_RPC_URL="https://api.testnet.solana.com"
export X402_RPC_URL="https://api.mainnet-beta.solana.com"

# Or use custom RPC service
export X402_RPC_URL="https://your-custom-rpc.com"
```

**Default:** Auto-selected based on network
**Used by:** Core processor, payment verification

---

### Client Configuration

#### X402_PRIVATE_KEY (Client Only)

Base58-encoded wallet private key for client.

```bash
export X402_PRIVATE_KEY="your-base58-private-key"
```

**Format:** Base58-encoded Solana private key
**Security:** Store in secure environment variable, never hardcode
**Used by:** Client library

---

#### X402_MAX_PAYMENT (Optional)

Maximum amount to pay per transaction (safety limit).

```bash
export X402_MAX_PAYMENT="10.0"  # Maximum 10 USDC
```

**Default:** `10.0` (if using AutoClient with no options)
**Format:** Decimal string representing token units
**Used by:** AutoClient for payment limits

---

### Server Configuration

#### PORT (Optional)

Server listening port.

```bash
export PORT="8080"  # Default for development
export PORT="443"   # HTTPS in production
```

**Default:** `8080`
**Used by:** Example servers

---

## Middleware Configuration

### net/http Middleware

#### InitX402() Config Structure

```go
type Config struct {
    PaymentAddress string // Required
    TokenMint      string // Required
    Network        string // Optional, default: "solana-devnet"
    RPCURL         string // Optional
    AutoVerify     bool   // Optional, default: false
}
```

**Example:**
```go
nethttp.InitX402(&nethttp.Config{
    PaymentAddress: os.Getenv("X402_PAYMENT_ADDRESS"),
    TokenMint:      os.Getenv("X402_TOKEN_MINT"),
    Network:        "solana-devnet",
    RPCURL:         "https://api.devnet.solana.com",
    AutoVerify:     true,
})
```

---

### Echo Middleware

#### InitX402() Config Structure

```go
type Config struct {
    PaymentAddress string // Required
    TokenMint      string // Required
    Network        string // Optional, default: "solana-devnet"
    RPCURL         string // Optional
    AutoVerify     bool   // Optional, default: false
}
```

**Example:**
```go
echox402.InitX402(&echox402.Config{
    PaymentAddress: os.Getenv("X402_PAYMENT_ADDRESS"),
    TokenMint:      os.Getenv("X402_TOKEN_MINT"),
    Network:        "solana-devnet",
    AutoVerify:     true,
})
```

---

## PaymentRequired Options

### net/http PaymentRequiredOptions

```go
type PaymentRequiredOptions struct {
    Amount         string // Required
    PaymentAddress string // Optional: override global
    TokenMint      string // Optional: override global
    Network        string // Optional: override global
    Description    string // Optional
    ExpiresIn      int    // Optional, default: 300 seconds
    AutoVerify     bool   // Optional: override global
}
```

**Example:**
```go
nethttp.PaymentRequired(nethttp.PaymentRequiredOptions{
    Amount:      "0.10",
    Description: "Premium data access",
    ExpiresIn:   600,  // 10 minutes
    AutoVerify:  true,
})
```

---

### Echo PaymentRequiredOptions

```go
type PaymentRequiredOptions struct {
    Amount         string // Required
    PaymentAddress string // Optional: override global
    TokenMint      string // Optional: override global
    Network        string // Optional: override global
    Description    string // Optional
    ExpiresIn      int    // Optional, default: 300 seconds
    AutoVerify     bool   // Optional: override global
}
```

**Example:**
```go
echox402.PaymentRequired(echox402.PaymentRequiredOptions{
    Amount:      "0.10",
    Description: "Premium data access",
    ExpiresIn:   600,
    AutoVerify:  true,
})
```

---

## Client Configuration

### X402Client Options

```go
func NewX402Client(
    walletKeypair solana.PrivateKey,
    rpcURL string,
    httpClient *http.Client,
    allowLocal bool,
) *X402Client
```

**Parameters:**
- `walletKeypair`: Solana private key for signing payments
- `rpcURL`: Custom RPC URL (empty string for default)
- `httpClient`: Custom HTTP client (nil for default)
- `allowLocal`: Allow localhost URLs (for development only)

**Example:**
```go
client := client.NewX402Client(
    walletKeypair,
    "https://api.devnet.solana.com",
    nil,
    false,
)
```

---

### X402AutoClient Options

```go
type AutoClientOptions struct {
    MaxPaymentAmount string // e.g., "10.0"
    AutoRetry        bool
    AllowLocal       bool
}

func NewAutoClient(
    walletKeypair solana.PrivateKey,
    rpcURL string,
    options *AutoClientOptions,
) *X402AutoClient
```

**Example:**
```go
client := client.NewAutoClient(
    walletKeypair,
    "https://api.devnet.solana.com",
    &client.AutoClientOptions{
        MaxPaymentAmount: "10.0",
        AutoRetry:        true,
        AllowLocal:       false,
    },
)
```

---

## Environment-Based Configuration

### Development Setup

```bash
# .env.development
X402_PAYMENT_ADDRESS="YOUR_DEVNET_WALLET"
X402_TOKEN_MINT="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
X402_NETWORK="solana-devnet"
X402_RPC_URL="https://api.devnet.solana.com"
PORT=8080
X402_MAX_PAYMENT="10.0"
```

**Go Code:**
```go
if os.Getenv("ENVIRONMENT") == "" || os.Getenv("ENVIRONMENT") == "development" {
    nethttp.InitX402(&nethttp.Config{
        PaymentAddress: os.Getenv("X402_PAYMENT_ADDRESS"),
        TokenMint:      os.Getenv("X402_TOKEN_MINT"),
        Network:        "solana-devnet",
        AutoVerify:     false,  // Skip for faster testing
    })
}
```

---

### Staging Setup

```bash
# .env.staging
X402_PAYMENT_ADDRESS="YOUR_TESTNET_WALLET"
X402_TOKEN_MINT="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
X402_NETWORK="solana-testnet"
X402_RPC_URL="https://api.testnet.solana.com"
PORT=8080
X402_MAX_PAYMENT="100.0"
```

**Go Code:**
```go
if os.Getenv("ENVIRONMENT") == "staging" {
    nethttp.InitX402(&nethttp.Config{
        PaymentAddress: os.Getenv("X402_PAYMENT_ADDRESS"),
        TokenMint:      os.Getenv("X402_TOKEN_MINT"),
        Network:        "solana-testnet",
        AutoVerify:     true,
    })
}
```

---

### Production Setup

```bash
# .env.production
X402_PAYMENT_ADDRESS="YOUR_MAINNET_WALLET"
X402_TOKEN_MINT="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
X402_NETWORK="solana-mainnet"
X402_RPC_URL="https://api.mainnet-beta.solana.com"
PORT=443
X402_MAX_PAYMENT="50.0"
```

**Go Code:**
```go
if os.Getenv("ENVIRONMENT") == "production" {
    nethttp.InitX402(&nethttp.Config{
        PaymentAddress: os.Getenv("X402_PAYMENT_ADDRESS"),
        TokenMint:      os.Getenv("X402_TOKEN_MINT"),
        Network:        "solana-mainnet",
        RPCURL:         os.Getenv("X402_RPC_URL"),
        AutoVerify:     true,
    })
}
```

---

## Configuration Patterns

### Global Configuration (Recommended)

Initialize once at startup, use everywhere:

```go
func init() {
    nethttp.InitX402(&nethttp.Config{
        PaymentAddress: os.Getenv("X402_PAYMENT_ADDRESS"),
        TokenMint:      os.Getenv("X402_TOKEN_MINT"),
    })
}

func main() {
    // Uses global configuration
    http.Handle("/api/premium", nethttp.PaymentRequired(opts)(handler))
}
```

---

### Per-Route Configuration

Override defaults for specific routes:

```go
nethttp.InitX402(&nethttp.Config{
    PaymentAddress: "default_wallet",
    TokenMint:      "default_mint",
})

// Override for specific route
http.Handle("/api/partner", nethttp.PaymentRequired(nethttp.PaymentRequiredOptions{
    Amount:         "0.10",
    PaymentAddress: "partner_wallet",  // Different recipient
})(handler))
```

---

### Configuration from File

Load configuration from external file:

```go
type AppConfig struct {
    Payment struct {
        Address string `json:"address"`
        Mint    string `json:"mint"`
        Network string `json:"network"`
    } `json:"payment"`
    Server struct {
        Port string `json:"port"`
    } `json:"server"`
}

func loadConfig(path string) (*AppConfig, error) {
    data, err := ioutil.ReadFile(path)
    if err != nil {
        return nil, err
    }
    var config AppConfig
    err = json.Unmarshal(data, &config)
    return &config, err
}

func main() {
    config, _ := loadConfig("config.json")
    nethttp.InitX402(&nethttp.Config{
        PaymentAddress: config.Payment.Address,
        TokenMint:      config.Payment.Mint,
        Network:        config.Payment.Network,
    })
}
```

**config.json:**
```json
{
  "payment": {
    "address": "YOUR_WALLET_ADDRESS",
    "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "network": "solana-devnet"
  },
  "server": {
    "port": "8080"
  }
}
```

---

## Advanced Configuration

### Dynamic Pricing

Configure pricing based on request parameters:

```go
func getPricing(tier string) string {
    pricing := map[string]string{
        "basic":    "0.05",
        "standard": "0.10",
        "premium":  "0.50",
        "enterprise": "5.00",
    }
    if price, ok := pricing[tier]; ok {
        return price
    }
    return "0.05"  // Default
}

e.GET("/api/data/:tier", handler, echox402.PaymentRequired(
    echox402.PaymentRequiredOptions{
        Amount: "0.10",  // Adjusted dynamically in handler
    },
))
```

---

### Multi-Tenant Configuration

Configure per tenant:

```go
type TenantConfig struct {
    PaymentAddress string
    TokenMint      string
    PaymentAmount  string
}

var tenantConfigs = map[string]*TenantConfig{
    "tenant1": {
        PaymentAddress: "wallet_1",
        TokenMint:      "mint_1",
        PaymentAmount:  "0.10",
    },
    "tenant2": {
        PaymentAddress: "wallet_2",
        TokenMint:      "mint_2",
        PaymentAmount:  "0.20",
    },
}

func tenantMiddleware(tenantID string) nethttp.PaymentRequiredOptions {
    config := tenantConfigs[tenantID]
    return nethttp.PaymentRequiredOptions{
        Amount:         config.PaymentAmount,
        PaymentAddress: config.PaymentAddress,
        TokenMint:      config.TokenMint,
    }
}
```

---

### Regional Configuration

Configure based on region:

```go
func getRegionalConfig(region string) *nethttp.Config {
    configs := map[string]*nethttp.Config{
        "us": {
            PaymentAddress: "us_wallet",
            TokenMint:      "us_mint",
            Network:        "solana-mainnet",
        },
        "eu": {
            PaymentAddress: "eu_wallet",
            TokenMint:      "eu_mint",
            Network:        "solana-mainnet",
        },
    }
    return configs[region]
}
```

---

## Security Best Practices

### ✅ Do

```go
// Use environment variables
paymentAddress := os.Getenv("X402_PAYMENT_ADDRESS")

// Keep private keys secure
privateKeyBytes := base58.Decode(os.Getenv("X402_PRIVATE_KEY"))
keypair := solana.PrivateKey(privateKeyBytes)

// Use HTTPS in production
e.StartTLS(":443", "cert.pem", "key.pem")

// Enable payment verification
nethttp.InitX402(&nethttp.Config{
    AutoVerify: true,
})

// Use allowLocal=false in production
client := client.NewAutoClient(keypair, "", &client.AutoClientOptions{
    AllowLocal: false,
})

// Set payment limits
client := client.NewAutoClient(keypair, "", &client.AutoClientOptions{
    MaxPaymentAmount: "10.0",
})
```

---

### ❌ Don't

```go
// Don't hardcode secrets
config := nethttp.Config{
    PaymentAddress: "actual_wallet_address",
    TokenMint:      "actual_token",
}

// Don't store private keys in code
keypair := solana.PrivateKey([]byte("my_secret_key"))

// Don't use HTTP in production
http.ListenAndServe(":8080", nil)

// Don't disable payment verification
nethttp.InitX402(&nethttp.Config{
    AutoVerify: false,  // Bad for production
})

// Don't allow local in production
client := client.NewAutoClient(keypair, "", &client.AutoClientOptions{
    AllowLocal: true,  // Only for dev!
})

// Don't set unlimited payment amounts
client := client.NewAutoClient(keypair, "", nil)
```

---

## Troubleshooting Configuration

### Issue: "X402 not initialized"

**Solution:**
```go
// Call InitX402() before defining routes
nethttp.InitX402(&nethttp.Config{...})
http.Handle("/api", handler)
```

---

### Issue: "paymentAddress and tokenMint must be configured"

**Solution:**
```bash
# Set environment variables
export X402_PAYMENT_ADDRESS="YOUR_ADDRESS"
export X402_TOKEN_MINT="YOUR_MINT"

# Or pass to InitX402()
nethttp.InitX402(&nethttp.Config{
    PaymentAddress: "YOUR_ADDRESS",
    TokenMint:      "YOUR_MINT",
})
```

---

### Issue: "Payment verification always fails"

**Solution:**
```go
// Check RPC endpoint
nethttp.InitX402(&nethttp.Config{
    RPCURL: "https://api.devnet.solana.com",
    AutoVerify: true,
})

// Or disable for development
nethttp.InitX402(&nethttp.Config{
    AutoVerify: false,
})
```

---

## Default Values

```go
const (
    DefaultNetwork         = "solana-devnet"
    DefaultExpiresIn       = 300  // seconds (5 minutes)
    DefaultMaxPaymentLimit = "10.0"  // USDC
)
```

---

## Supported Networks

| Network | RPC URL | Use Case |
|---------|---------|----------|
| `solana-devnet` | https://api.devnet.solana.com | Development/Testing |
| `solana-testnet` | https://api.testnet.solana.com | Staging |
| `solana-mainnet` | https://api.mainnet-beta.solana.com | Production |

---

## Token Addresses

### USDC (Recommended)

| Network | Address |
|---------|---------|
| devnet | EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v |
| mainnet | EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v |

### Other Tokens

Use your custom token mint address in configuration.

---

## See Also

- [Getting Started](../getting-started/installation.md)
- [API Reference](api-reference.md)
- [Environment Variables Overview](../getting-started/installation.md#environment-setup)
