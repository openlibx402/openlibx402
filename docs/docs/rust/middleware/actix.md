# Actix Web Middleware

The `openlibx402-actix` crate provides integration with the Actix Web framework for protecting endpoints with X402 payment requirements.

## Installation

```toml
[dependencies]
openlibx402-core = "0.1"
openlibx402-actix = "0.1"
actix-web = "4.4"
actix-rt = "2.9"
```

## Overview

Actix Web integration provides:
- `PaymentExtractor` - Extractor for payment enforcement
- `X402Config` and `X402State` - Server configuration
- `PaymentRequirement` - Payment configuration per endpoint
- Helper functions for creating payment requests and responses

## Quick Start

```rust
use actix_web::{get, web, App, HttpResponse, HttpServer};
use openlibx402_actix::{
    create_payment_request, payment_required_response,
    PaymentExtractor, PaymentRequirement, X402Config, X402State,
};
use serde::Serialize;

#[derive(Serialize)]
struct Data {
    message: String,
}

#[get("/premium")]
async fn premium(
    state: web::Data<X402State>,
    auth: Option<PaymentExtractor>,
) -> HttpResponse {
    match auth {
        Some(_) => HttpResponse::Ok().json(Data {
            message: "Premium content".to_string(),
        }),
        None => {
            let requirement = PaymentRequirement::new("0.10");
            let payment_request = create_payment_request(&state.config, &requirement, "/premium");
            payment_required_response(payment_request)
        }
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let config = X402Config {
        payment_address: "YOUR_WALLET".to_string(),
        token_mint: "USDC_MINT".to_string(),
        network: "solana-devnet".to_string(),
        rpc_url: None,
        auto_verify: true,
    };

    let state = web::Data::new(X402State { config });

    HttpServer::new(move || {
        App::new()
            .app_data(state.clone())
            .service(premium)
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
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

## X402State

Application state containing configuration.

```rust
pub struct X402State {
    pub config: X402Config,
}
```

### Setup

```rust
let config = X402Config {
    payment_address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU".to_string(),
    token_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".to_string(),
    network: "solana-devnet".to_string(),
    rpc_url: None,
    auto_verify: true,
};

let state = web::Data::new(X402State { config });

HttpServer::new(move || {
    App::new()
        .app_data(state.clone())
        // ...
})
```

## PaymentExtractor

Extractor that enforces payment requirements.

### Usage

```rust
#[get("/protected")]
async fn protected(auth: PaymentExtractor) -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "payment_id": auth.authorization.payment_id
    }))
}
```

### Optional Extractor

Use `Option<PaymentExtractor>` to manually handle 402 responses:

```rust
#[get("/protected")]
async fn protected(
    state: web::Data<X402State>,
    auth: Option<PaymentExtractor>,
) -> HttpResponse {
    match auth {
        Some(auth) => {
            // Payment verified
            HttpResponse::Ok().json(serde_json::json!({
                "data": "premium content"
            }))
        }
        None => {
            // Return 402 with payment request
            let requirement = PaymentRequirement::new("0.10");
            let payment_request = create_payment_request(&state.config, &requirement, "/protected");
            payment_required_response(payment_request)
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

### payment_required_response

Creates a 402 HTTP response with payment request:

```rust
pub fn payment_required_response(
    payment_request: PaymentRequest
) -> HttpResponse
```

Example:

```rust
let requirement = PaymentRequirement::new("0.10");
let payment_request = create_payment_request(&config, &requirement, "/api/data");
let response = payment_required_response(payment_request);
```

## PaymentError

Error type for payment operations:

```rust
pub enum PaymentError {
    Required,
    InvalidHeader,
    InvalidAuthorization(String),
}
```

Automatically converts to appropriate HTTP responses:
- `Required` → 402 Payment Required
- `InvalidHeader` → 400 Bad Request
- `InvalidAuthorization` → 400 Bad Request

## Complete Examples

### Multiple Pricing Tiers

```rust
use actix_web::{get, web, App, HttpResponse, HttpServer};
use openlibx402_actix::*;
use serde::Serialize;

#[derive(Serialize)]
struct TierData {
    tier: String,
    data: Vec<String>,
}

#[get("/basic")]
async fn basic(
    state: web::Data<X402State>,
    auth: Option<PaymentExtractor>,
) -> HttpResponse {
    match auth {
        Some(_) => HttpResponse::Ok().json(TierData {
            tier: "basic".to_string(),
            data: vec!["Basic data".to_string()],
        }),
        None => {
            let req = PaymentRequirement::new("0.01")
                .with_description("Basic tier access");
            payment_required_response(create_payment_request(&state.config, &req, "/basic"))
        }
    }
}

#[get("/premium")]
async fn premium(
    state: web::Data<X402State>,
    auth: Option<PaymentExtractor>,
) -> HttpResponse {
    match auth {
        Some(_) => HttpResponse::Ok().json(TierData {
            tier: "premium".to_string(),
            data: vec!["Premium 1".to_string(), "Premium 2".to_string()],
        }),
        None => {
            let req = PaymentRequirement::new("0.10")
                .with_description("Premium tier access")
                .with_expires_in(600);
            payment_required_response(create_payment_request(&state.config, &req, "/premium"))
        }
    }
}

#[get("/enterprise")]
async fn enterprise(
    state: web::Data<X402State>,
    auth: Option<PaymentExtractor>,
) -> HttpResponse {
    match auth {
        Some(_) => HttpResponse::Ok().json(TierData {
            tier: "enterprise".to_string(),
            data: vec!["Enterprise 1".to_string(), "Enterprise 2".to_string(), "Enterprise 3".to_string()],
        }),
        None => {
            let req = PaymentRequirement::new("1.00")
                .with_description("Enterprise tier access");
            payment_required_response(create_payment_request(&state.config, &req, "/enterprise"))
        }
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let config = X402Config {
        payment_address: "YOUR_WALLET".to_string(),
        token_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".to_string(),
        network: "solana-devnet".to_string(),
        rpc_url: None,
        auto_verify: true,
    };

    let state = web::Data::new(X402State { config });

    HttpServer::new(move || {
        App::new()
            .app_data(state.clone())
            .service(basic)
            .service(premium)
            .service(enterprise)
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
```

### Accessing Payment Details

```rust
#[get("/paid-endpoint")]
async fn paid_endpoint(auth: PaymentExtractor) -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "payment_id": auth.authorization.payment_id,
        "amount_paid": auth.authorization.actual_amount,
        "payer": auth.authorization.public_key,
        "transaction": auth.authorization.signature,
    }))
}
```

### Mixed Free and Paid Endpoints

```rust
#[get("/free")]
async fn free_endpoint() -> HttpResponse {
    HttpResponse::Ok().body("This is free content")
}

#[get("/paid")]
async fn paid_endpoint(
    state: web::Data<X402State>,
    auth: Option<PaymentExtractor>,
) -> HttpResponse {
    match auth {
        Some(_) => HttpResponse::Ok().body("This is paid content"),
        None => {
            let req = PaymentRequirement::new("0.10");
            payment_required_response(create_payment_request(&state.config, &req, "/paid"))
        }
    }
}
```

## Best Practices

### 1. Use App Data for Configuration

```rust
let state = web::Data::new(X402State { config });

HttpServer::new(move || {
    App::new()
        .app_data(state.clone())  // Available in all routes
        .service(...)
})
```

### 2. Set Reasonable Expirations

```rust
// Short-lived: 1 minute
let req = PaymentRequirement::new("0.01").with_expires_in(60);

// Standard: 5 minutes
let req = PaymentRequirement::new("0.10").with_expires_in(300);

// Long-lived: 1 hour
let req = PaymentRequirement::new("1.00").with_expires_in(3600);
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

- [Actix Web Example](../examples/actix-server.md) - Complete example
- [Server Quick Start](../getting-started/server-quickstart.md) - Getting started guide
- [Configuration Reference](../reference/configuration.md) - All options
