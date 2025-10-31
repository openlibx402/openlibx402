# Rocket Middleware

The `openlibx402-rocket` crate provides integration with the Rocket web framework for protecting endpoints with X402 payment requirements.

## Installation

```toml
[dependencies]
openlibx402-core = "0.1"
openlibx402-rocket = "0.1"
rocket = { version = "0.5", features = ["json"] }
```

## Overview

Rocket integration provides:
- `PaymentGuard` - Request guard for payment enforcement
- `X402Config` - Server configuration
- `PaymentRequirement` - Payment configuration per endpoint
- Helper functions for creating payment requests

## Quick Start

```rust
use openlibx402_rocket::{
    create_payment_request, PaymentGuard, PaymentRequirement,
    PaymentRequiredResponse, X402Config,
};
use rocket::{get, routes, serde::json::Json, State};
use serde::Serialize;

#[derive(Serialize)]
struct Data {
    message: String,
}

#[get("/premium")]
fn premium(
    config: &State<X402Config>,
    auth: Option<PaymentGuard>,
) -> Result<Json<Data>, PaymentRequiredResponse> {
    match auth {
        Some(_) => Ok(Json(Data {
            message: "Premium content".to_string(),
        })),
        None => {
            let requirement = PaymentRequirement::new("0.10");
            let payment_request = create_payment_request(config, &requirement, "/premium");
            Err(PaymentRequiredResponse { payment_request })
        }
    }
}

#[rocket::main]
async fn main() {
    let config = X402Config {
        payment_address: "YOUR_WALLET".to_string(),
        token_mint: "USDC_MINT".to_string(),
        network: "solana-devnet".to_string(),
        rpc_url: None,
        auto_verify: true,
    };

    rocket::build()
        .manage(config)
        .mount("/", routes![premium])
        .launch()
        .await
        .unwrap();
}
```

## X402Config

Global configuration for X402 payments.

```rust
pub struct X402Config {
    /// Wallet address to receive payments
    pub payment_address: String,

    /// SPL token mint address (USDC)
    pub token_mint: String,

    /// Solana network
    pub network: String,

    /// Optional custom RPC URL
    pub rpc_url: Option<String>,

    /// Whether to verify payments on-chain
    pub auto_verify: bool,
}
```

### Example Configuration

```rust
let config = X402Config {
    payment_address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU".to_string(),
    token_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".to_string(),
    network: "solana-devnet".to_string(),
    rpc_url: Some("https://your-rpc.com".to_string()),
    auto_verify: true,
};
```

## PaymentGuard

Request guard that enforces payment requirements.

### Usage

```rust
#[get("/protected")]
fn protected(auth: PaymentGuard) -> String {
    format!("Payment ID: {}", auth.authorization.payment_id)
}
```

### Optional Guard

Use `Option<PaymentGuard>` to manually handle 402 responses:

```rust
#[get("/protected")]
fn protected(
    config: &State<X402Config>,
    auth: Option<PaymentGuard>,
) -> Result<Json<Data>, PaymentRequiredResponse> {
    match auth {
        Some(auth) => {
            // Payment verified
            Ok(Json(Data { /* ... */ }))
        }
        None => {
            // Return 402 with payment request
            let requirement = PaymentRequirement::new("0.10");
            let payment_request = create_payment_request(config, &requirement, "/protected");
            Err(PaymentRequiredResponse { payment_request })
        }
    }
}
```

## PaymentRequirement

Configuration for payment requirements.

```rust
pub struct PaymentRequirement {
    /// Amount required in USDC
    pub amount: String,

    /// Optional description
    pub description: Option<String>,

    /// Expiration time in seconds (default: 300)
    pub expires_in: i64,
}
```

### Creating Requirements

```rust
// Simple requirement
let requirement = PaymentRequirement::new("0.10");

// With description
let requirement = PaymentRequirement::new("0.10")
    .with_description("Access to premium data");

// With custom expiration
let requirement = PaymentRequirement::new("0.10")
    .with_description("Premium API access")
    .with_expires_in(600);  // 10 minutes
```

## Helper Functions

### create_payment_request

Creates a payment request for an endpoint:

```rust
pub fn create_payment_request(
    config: &X402Config,
    requirement: &PaymentRequirement,
    resource: &str,
) -> PaymentRequest
```

Example:

```rust
let requirement = PaymentRequirement::new("0.10");
let payment_request = create_payment_request(
    config,
    &requirement,
    "/api/premium-data"
);
```

## PaymentRequiredResponse

Response type that returns 402 status with payment request:

```rust
pub struct PaymentRequiredResponse {
    pub payment_request: PaymentRequest,
}
```

Automatically sets status to 402 and serializes payment request as JSON.

## Complete Examples

### Multiple Pricing Tiers

```rust
use openlibx402_rocket::*;
use rocket::{get, routes, serde::json::Json, State};
use serde::Serialize;

#[derive(Serialize)]
struct TierData {
    tier: String,
    data: Vec<String>,
}

#[get("/basic")]
fn basic(
    config: &State<X402Config>,
    auth: Option<PaymentGuard>,
) -> Result<Json<TierData>, PaymentRequiredResponse> {
    match auth {
        Some(_) => Ok(Json(TierData {
            tier: "basic".to_string(),
            data: vec!["Basic data".to_string()],
        })),
        None => {
            let req = PaymentRequirement::new("0.01")
                .with_description("Basic tier access");
            Err(PaymentRequiredResponse {
                payment_request: create_payment_request(config, &req, "/basic")
            })
        }
    }
}

#[get("/premium")]
fn premium(
    config: &State<X402Config>,
    auth: Option<PaymentGuard>,
) -> Result<Json<TierData>, PaymentRequiredResponse> {
    match auth {
        Some(_) => Ok(Json(TierData {
            tier: "premium".to_string(),
            data: vec!["Premium data 1".to_string(), "Premium data 2".to_string()],
        })),
        None => {
            let req = PaymentRequirement::new("0.10")
                .with_description("Premium tier access")
                .with_expires_in(600);
            Err(PaymentRequiredResponse {
                payment_request: create_payment_request(config, &req, "/premium")
            })
        }
    }
}

#[get("/enterprise")]
fn enterprise(
    config: &State<X402Config>,
    auth: Option<PaymentGuard>,
) -> Result<Json<TierData>, PaymentRequiredResponse> {
    match auth {
        Some(_) => Ok(Json(TierData {
            tier: "enterprise".to_string(),
            data: vec![
                "Enterprise data 1".to_string(),
                "Enterprise data 2".to_string(),
                "Enterprise data 3".to_string(),
            ],
        })),
        None => {
            let req = PaymentRequirement::new("1.00")
                .with_description("Enterprise tier access");
            Err(PaymentRequiredResponse {
                payment_request: create_payment_request(config, &req, "/enterprise")
            })
        }
    }
}

#[rocket::main]
async fn main() {
    let config = X402Config {
        payment_address: "YOUR_WALLET".to_string(),
        token_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".to_string(),
        network: "solana-devnet".to_string(),
        rpc_url: None,
        auto_verify: true,
    };

    rocket::build()
        .manage(config)
        .mount("/", routes![basic, premium, enterprise])
        .launch()
        .await
        .unwrap();
}
```

### Accessing Payment Details

```rust
#[get("/paid-endpoint")]
fn paid_endpoint(auth: PaymentGuard) -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "payment_id": auth.authorization.payment_id,
        "amount_paid": auth.authorization.actual_amount,
        "payer": auth.authorization.public_key,
        "transaction": auth.authorization.signature,
    }))
}
```

### Mixed Free and Paid Endpoints

```rust
// Free endpoint
#[get("/free")]
fn free_endpoint() -> &'static str {
    "This is free content"
}

// Paid endpoint
#[get("/paid")]
fn paid_endpoint(
    config: &State<X402Config>,
    auth: Option<PaymentGuard>,
) -> Result<&'static str, PaymentRequiredResponse> {
    match auth {
        Some(_) => Ok("This is paid content"),
        None => {
            let req = PaymentRequirement::new("0.10");
            Err(PaymentRequiredResponse {
                payment_request: create_payment_request(config, &req, "/paid")
            })
        }
    }
}
```

## Best Practices

### 1. Use Global Config State

```rust
rocket::build()
    .manage(config)  // Available in all routes via State<X402Config>
    .mount("/", routes![...])
```

### 2. Set Reasonable Expirations

```rust
// Short-lived data
let req = PaymentRequirement::new("0.01").with_expires_in(60);  // 1 minute

// Standard
let req = PaymentRequirement::new("0.10").with_expires_in(300);  // 5 minutes

// Long-lived
let req = PaymentRequirement::new("1.00").with_expires_in(3600);  // 1 hour
```

### 3. Add Descriptions

```rust
let req = PaymentRequirement::new("0.10")
    .with_description("Access to real-time market data");
```

### 4. Enable Auto-Verify for Production

```rust
let config = X402Config {
    // ...
    auto_verify: true,  // Verify payments on-chain
};
```

## See Also

- [Rocket Example](../examples/rocket-server.md) - Complete example
- [Server Quick Start](../getting-started/server-quickstart.md) - Getting started guide
- [Configuration Reference](../reference/configuration.md) - All options
