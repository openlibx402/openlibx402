# Core Library

The `openlibx402-core` crate provides the fundamental types, error handling, and Solana payment processing for the X402 protocol.

## Installation

```toml
[dependencies]
openlibx402-core = "0.1"
```

## Overview

The core library includes:

- **Payment Models** - `PaymentRequest` and `PaymentAuthorization`
- **Error Types** - Comprehensive error handling with `X402Error`
- **Payment Processor** - `SolanaPaymentProcessor` for blockchain operations
- **Utilities** - Serialization, base64 encoding, expiration checking

## Payment Models

### PaymentRequest

Represents a payment requirement from a server.

```rust
use openlibx402_core::PaymentRequest;
use chrono::{Utc, Duration};

let payment_request = PaymentRequest::new(
    "0.10".to_string(),                                              // amount
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".to_string(),   // token mint
    "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU".to_string(),   // payment address
    "solana-devnet".to_string(),                                    // network
    Utc::now() + Duration::seconds(300),                            // expires_at
    "nonce123".to_string(),                                         // nonce
    "payment123".to_string(),                                       // payment_id
    "/api/premium-data".to_string(),                                // resource
).with_description("Access to premium data".to_string());
```

#### Fields

- `max_amount_required` - Amount in USDC (e.g., "0.10")
- `asset_type` - Asset type ("SPL" for Solana tokens)
- `asset_address` - Token mint address (USDC address)
- `payment_address` - Recipient wallet address
- `network` - Network identifier ("solana-devnet", "solana-mainnet")
- `expires_at` - Expiration timestamp (ISO 8601)
- `nonce` - Unique nonce for replay protection
- `payment_id` - Unique payment identifier
- `resource` - API endpoint being accessed
- `description` - Optional human-readable description

#### Methods

```rust
// Check if expired
if payment_request.is_expired() {
    println!("Payment request expired");
}

// Serialize to JSON
let json = payment_request.to_json()?;

// Deserialize from JSON
let request = PaymentRequest::from_json(&json)?;

// Encode as base64
let encoded = payment_request.to_base64()?;

// Decode from base64
let request = PaymentRequest::from_base64(&encoded)?;
```

### PaymentAuthorization

Represents proof of payment sent with retry requests.

```rust
use openlibx402_core::PaymentAuthorization;

let authorization = PaymentAuthorization::new(
    "payment123".to_string(),                                       // payment_id
    "0.10".to_string(),                                             // actual_amount
    "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU".to_string(),   // payment_address
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".to_string(),   // asset_address
    "solana-devnet".to_string(),                                    // network
    "5VERv8NMv...".to_string(),                                     // signature
    "7xKXtg2CW8...".to_string(),                                    // public_key
);
```

#### Fields

- `payment_id` - Links to the original payment request
- `actual_amount` - Amount paid in USDC
- `payment_address` - Recipient wallet address
- `asset_address` - Token mint address
- `network` - Network identifier
- `timestamp` - When payment was authorized
- `signature` - Solana transaction signature
- `public_key` - Payer's public key
- `transaction_hash` - On-chain transaction hash (optional)

#### Methods

```rust
// Serialize to JSON
let json = authorization.to_json()?;

// Deserialize from JSON
let auth = PaymentAuthorization::from_json(&json)?;

// Encode for HTTP header
let header_value = authorization.to_header_value()?;

// Decode from HTTP header
let auth = PaymentAuthorization::from_header_value(&header_value)?;
```

## Error Types

The `X402Error` enum covers all error cases:

```rust
use openlibx402_core::X402Error;

pub enum X402Error {
    PaymentRequired(String),
    PaymentExpired(String),
    InsufficientFunds(String),
    PaymentVerification(String),
    TransactionBroadcast(String),
    InvalidPaymentRequest(String),
    InvalidPaymentAuthorization(String),
    Configuration(String),
    Network(String),
    Blockchain(String),
    Serialization(String),
}
```

### Error Codes

Each error has a unique code:

```rust
let error = X402Error::PaymentRequired("Payment needed".to_string());
println!("Code: {}", error.code());  // "PAYMENT_REQUIRED"
println!("Message: {}", error.message());
```

### Error Handling

```rust
use openlibx402_core::{X402Error, X402Result};

fn process_payment() -> X402Result<String> {
    // ... operation that might fail

    match result {
        Ok(data) => Ok(data),
        Err(X402Error::PaymentExpired(msg)) => {
            eprintln!("Payment expired: {}", msg);
            Err(X402Error::PaymentExpired(msg))
        }
        Err(X402Error::InsufficientFunds(msg)) => {
            eprintln!("Insufficient funds: {}", msg);
            Err(X402Error::InsufficientFunds(msg))
        }
        Err(e) => Err(e),
    }
}
```

### Automatic Conversions

The library provides automatic error conversions:

```rust
// Automatic conversion from serde_json::Error
let json_result: Result<PaymentRequest, _> = serde_json::from_str(data);
let x402_result: X402Result<PaymentRequest> = json_result.map_err(Into::into);

// Automatic conversion from Solana errors
let solana_result = rpc_client.get_latest_blockhash();
let x402_result: X402Result<_> = solana_result.map_err(Into::into);
```

## Solana Payment Processor

The `SolanaPaymentProcessor` handles blockchain operations.

### Creating a Processor

```rust
use openlibx402_core::SolanaPaymentProcessor;

// Use default RPC URL
let processor = SolanaPaymentProcessor::new(
    "https://api.devnet.solana.com",
    None  // Use default commitment
);

// Use custom RPC and commitment
use solana_sdk::commitment_config::CommitmentConfig;

let processor = SolanaPaymentProcessor::new(
    "https://your-rpc.com",
    Some(CommitmentConfig::confirmed())
);
```

### Creating Payments

```rust
use solana_sdk::signature::Keypair;

let keypair = Keypair::new();
let payment_request = /* ... */;

// Create and broadcast payment
let authorization = processor.create_payment(
    &payment_request,
    &keypair
).await?;

println!("Payment sent! Signature: {}", authorization.signature);
```

The processor automatically:
- Checks if payment expired
- Validates addresses
- Checks sender balance
- Creates recipient ATA if needed
- Builds and signs transaction
- Broadcasts to Solana
- Returns payment authorization

### Verifying Payments

```rust
// Verify payment on-chain
let verified = processor.verify_payment(
    &authorization,
    "0.10"  // expected amount
).await?;

if verified {
    println!("Payment verified!");
}
```

### Checking Balances

```rust
use solana_sdk::pubkey::Pubkey;
use std::str::FromStr;

let token_account = Pubkey::from_str("...")?;
let balance = processor.get_token_balance(&token_account).await?;

println!("Balance: {} lamports", balance);
```

### Default RPC URLs

```rust
// Get default RPC for network
let url = SolanaPaymentProcessor::default_rpc_url("solana-devnet");
// Returns: "https://api.devnet.solana.com"

let url = SolanaPaymentProcessor::default_rpc_url("solana-mainnet");
// Returns: "https://api.mainnet-beta.solana.com"
```

## Constants

### Library Version

```rust
use openlibx402_core::VERSION;

println!("openlibx402-core version: {}", VERSION);
```

## Type Aliases

```rust
// Result type for X402 operations
pub type X402Result<T> = Result<T, X402Error>;
```

## Features

The core library supports:

- **Async-first** - All I/O operations are async
- **Type-safe** - Compile-time guarantees
- **Zero-copy** - Efficient serialization where possible
- **Comprehensive errors** - Detailed error messages
- **Automatic conversions** - From common error types
- **Solana integration** - Full Solana SDK support

## Examples

### Complete Payment Flow

```rust
use openlibx402_core::{
    PaymentRequest, SolanaPaymentProcessor, X402Result
};
use solana_sdk::signature::Keypair;

#[tokio::main]
async fn main() -> X402Result<()> {
    // Parse payment request from server
    let payment_request = PaymentRequest::from_json(r#"
        {
            "max_amount_required": "0.10",
            "asset_type": "SPL",
            "asset_address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "payment_address": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
            "network": "solana-devnet",
            "expires_at": "2025-10-31T12:00:00Z",
            "nonce": "abc123",
            "payment_id": "pay_123",
            "resource": "/api/premium-data"
        }
    "#)?;

    // Create payment processor
    let processor = SolanaPaymentProcessor::new(
        "https://api.devnet.solana.com",
        None
    );

    // Load keypair
    let keypair = Keypair::new();  // Use your actual keypair

    // Create and send payment
    let authorization = processor.create_payment(
        &payment_request,
        &keypair
    ).await?;

    // Encode for HTTP header
    let header_value = authorization.to_header_value()?;
    println!("X-Payment-Authorization: {}", header_value);

    Ok(())
}
```

## See Also

- [Client Library](client.md) - HTTP client built on core
- [Error Reference](../reference/errors.md) - Detailed error documentation
- [API Reference](../reference/api-reference.md) - Complete API documentation
