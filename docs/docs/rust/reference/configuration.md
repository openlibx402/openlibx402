# Configuration Reference

Complete configuration reference for all Rust packages.

## Server Configuration

### X402Config

Global configuration for X402 payments in server applications.

```rust
pub struct X402Config {
    /// Wallet address to receive payments
    pub payment_address: String,

    /// SPL token mint address (USDC)
    pub token_mint: String,

    /// Solana network identifier
    pub network: String,

    /// Optional custom RPC URL
    pub rpc_url: Option<String>,

    /// Whether to verify payments on-chain
    pub auto_verify: bool,
}
```

### Configuration Options

#### payment_address (Required)

Your Solana wallet address that will receive payments.

```rust
payment_address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU".to_string()
```

**How to get:**
```bash
# View your wallet address
solana-keygen pubkey ~/.config/solana/id.json
```

#### token_mint (Required)

The SPL token mint address for the token you want to receive.

```rust
// USDC on Devnet
token_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".to_string()

// USDC on Mainnet
token_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".to_string()
```

#### network (Required)

The Solana network to use.

```rust
// For development and testing
network: "solana-devnet".to_string()

// For production
network: "solana-mainnet".to_string()

// For testing
network: "solana-testnet".to_string()
```

#### rpc_url (Optional)

Custom RPC endpoint. If not specified, uses default for the network.

```rust
// Use default
rpc_url: None

// Use custom RPC
rpc_url: Some("https://your-rpc-endpoint.com".to_string())
```

**Default RPC URLs:**
- Devnet: `https://api.devnet.solana.com`
- Mainnet: `https://api.mainnet-beta.solana.com`
- Testnet: `https://api.testnet.solana.com`

#### auto_verify (Required)

Whether to automatically verify payments on-chain.

```rust
// Verify all payments (recommended for production)
auto_verify: true

// Skip verification (faster, less secure)
auto_verify: false
```

**Recommendation:** Enable for production, can disable for development.

### Example Configurations

#### Development

```rust
let config = X402Config {
    payment_address: env::var("PAYMENT_ADDRESS")?,
    token_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".to_string(),
    network: "solana-devnet".to_string(),
    rpc_url: None,
    auto_verify: false,  // Faster for development
};
```

#### Production

```rust
let config = X402Config {
    payment_address: env::var("PAYMENT_ADDRESS")?,
    token_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".to_string(),
    network: "solana-mainnet".to_string(),
    rpc_url: Some(env::var("SOLANA_RPC_URL")?),  // Use dedicated RPC
    auto_verify: true,  // Verify all payments
};
```

#### High Performance

```rust
let config = X402Config {
    payment_address: env::var("PAYMENT_ADDRESS")?,
    token_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".to_string(),
    network: "solana-mainnet".to_string(),
    rpc_url: Some("https://your-fast-rpc.com".to_string()),
    auto_verify: true,
};
```

---

## Payment Requirements

### PaymentRequirement

Configuration for individual endpoint payment requirements.

```rust
pub struct PaymentRequirement {
    /// Amount required in USDC
    pub amount: String,

    /// Optional human-readable description
    pub description: Option<String>,

    /// Expiration time in seconds (default: 300)
    pub expires_in: i64,
}
```

### Configuration Options

#### amount (Required)

Payment amount in USDC.

```rust
// Micropayment
let req = PaymentRequirement::new("0.001");

// Standard
let req = PaymentRequirement::new("0.10");

// Premium
let req = PaymentRequirement::new("1.00");
```

#### description (Optional)

Human-readable description shown to users.

```rust
let req = PaymentRequirement::new("0.10")
    .with_description("Access to premium market data");
```

#### expires_in (Optional)

Payment validity duration in seconds.

```rust
// Short-lived: 1 minute
let req = PaymentRequirement::new("0.01")
    .with_expires_in(60);

// Standard: 5 minutes (default)
let req = PaymentRequirement::new("0.10")
    .with_expires_in(300);

// Long-lived: 1 hour
let req = PaymentRequirement::new("1.00")
    .with_expires_in(3600);
```

**Recommendation:** Use shorter expirations for lower amounts, longer for higher amounts.

### Example Requirements

#### Basic Tier

```rust
PaymentRequirement::new("0.01")
    .with_description("Basic tier access")
    .with_expires_in(300)
```

#### Premium Tier

```rust
PaymentRequirement::new("0.10")
    .with_description("Premium tier with advanced features")
    .with_expires_in(600)
```

#### Enterprise Tier

```rust
PaymentRequirement::new("5.00")
    .with_description("Enterprise tier with full API access")
    .with_expires_in(3600)
```

---

## Client Configuration

### AutoClientOptions

Configuration for automatic payment handling.

```rust
pub struct AutoClientOptions {
    /// Maximum amount willing to pay automatically (in USDC)
    pub max_payment_amount: String,

    /// Whether to automatically retry after payment
    pub auto_retry: bool,

    /// Maximum number of retry attempts
    pub max_retries: u32,
}
```

### Configuration Options

#### max_payment_amount (Optional)

Maximum amount the client will automatically pay.

```rust
// Conservative
let options = AutoClientOptions {
    max_payment_amount: "1.0".to_string(),
    ..Default::default()
};

// Moderate
let options = AutoClientOptions {
    max_payment_amount: "10.0".to_string(),  // Default
    ..Default::default()
};

// Generous
let options = AutoClientOptions {
    max_payment_amount: "100.0".to_string(),
    ..Default::default()
};
```

#### auto_retry (Optional)

Whether to automatically retry after payment.

```rust
// Auto-retry (default)
let options = AutoClientOptions {
    auto_retry: true,
    ..Default::default()
};

// Manual retry
let options = AutoClientOptions {
    auto_retry: false,
    ..Default::default()
};
```

#### max_retries (Optional)

Maximum retry attempts after payment.

```rust
// Few retries
let options = AutoClientOptions {
    max_retries: 1,
    ..Default::default()
};

// Standard
let options = AutoClientOptions {
    max_retries: 3,  // Default
    ..Default::default()
};

// Many retries
let options = AutoClientOptions {
    max_retries: 10,
    ..Default::default()
};
```

### Example Configurations

#### Conservative

```rust
let options = AutoClientOptions {
    max_payment_amount: "1.0".to_string(),
    auto_retry: true,
    max_retries: 1,
};
```

#### Balanced (Default)

```rust
let options = AutoClientOptions {
    max_payment_amount: "10.0".to_string(),
    auto_retry: true,
    max_retries: 3,
};
```

#### Aggressive

```rust
let options = AutoClientOptions {
    max_payment_amount: "100.0".to_string(),
    auto_retry: true,
    max_retries: 5,
};
```

---

## Environment Variables

Recommended environment variables for configuration.

### Server

```bash
# Required
export X402_PAYMENT_ADDRESS="7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
export X402_TOKEN_MINT="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
export X402_NETWORK="solana-devnet"

# Optional
export X402_RPC_URL="https://your-rpc.com"
export X402_AUTO_VERIFY="true"
```

### Client

```bash
# Required
export SOLANA_KEYPAIR="$HOME/.config/solana/id.json"

# Optional
export X402_MAX_PAYMENT="10.0"
export X402_MAX_RETRIES="3"
export SOLANA_RPC_URL="https://api.devnet.solana.com"
```

### Loading from Environment

```rust
use std::env;

// Server
let config = X402Config {
    payment_address: env::var("X402_PAYMENT_ADDRESS")?,
    token_mint: env::var("X402_TOKEN_MINT")?,
    network: env::var("X402_NETWORK")?,
    rpc_url: env::var("X402_RPC_URL").ok(),
    auto_verify: env::var("X402_AUTO_VERIFY").unwrap_or("true".to_string()) == "true",
};

// Client
let keypair = read_keypair_file(env::var("SOLANA_KEYPAIR")?)?;
let options = AutoClientOptions {
    max_payment_amount: env::var("X402_MAX_PAYMENT").unwrap_or("10.0".to_string()),
    auto_retry: true,
    max_retries: env::var("X402_MAX_RETRIES")
        .unwrap_or("3".to_string())
        .parse()
        .unwrap_or(3),
};
```

---

## Best Practices

### 1. Use Environment Variables in Production

```rust
let config = X402Config {
    payment_address: env::var("X402_PAYMENT_ADDRESS")
        .expect("X402_PAYMENT_ADDRESS must be set"),
    // ...
};
```

### 2. Enable Verification in Production

```rust
auto_verify: env::var("ENV")
    .map(|e| e == "production")
    .unwrap_or(false)
```

### 3. Use Dedicated RPC Endpoints

```rust
rpc_url: Some(env::var("SOLANA_RPC_URL")?)
```

### 4. Set Reasonable Payment Limits

```rust
max_payment_amount: "10.0".to_string()  // Not too high, not too low
```

### 5. Log Configuration (Safely)

```rust
println!("X402 Config:");
println!("  Network: {}", config.network);
println!("  Auto-verify: {}", config.auto_verify);
// Don't log sensitive data like private keys
```

## See Also

- [API Reference](api-reference.md)
- [Error Handling](errors.md)
- [Server Quick Start](../getting-started/server-quickstart.md)
- [Client Quick Start](../getting-started/client-quickstart.md)
