# Actix Web Server Example

Complete example of an X402-enabled API server using Actix Web with multiple pricing tiers.

## Source Code

Location: `examples/rust/actix-server/`

## Overview

This example demonstrates:
- Free and paid endpoints
- Multiple pricing tiers ($0.01, $0.10, $1.00)
- Payment requirement configuration
- Health check endpoint

## Running the Example

```bash
cd examples/rust/actix-server
cargo run
```

Server starts on `http://localhost:8080`

## Endpoints

| Endpoint | Price | Description |
|----------|-------|-------------|
| `GET /` | Free | Welcome message |
| `GET /basic` | $0.01 | Basic tier data |
| `GET /premium` | $0.10 | Premium tier data |
| `GET /enterprise` | $1.00 | Enterprise tier data |
| `GET /health` | Free | Health check |

## Testing

### Free Endpoint

```bash
curl http://localhost:8080/
```

Response:
```json
{
  "message": "Welcome to the X402 Actix Web example server!"
}
```

### Payment Required

```bash
curl -v http://localhost:8080/premium
```

Response (402 Payment Required):
```json
{
  "max_amount_required": "0.10",
  "asset_type": "SPL",
  "asset_address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "payment_address": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "network": "solana-devnet",
  "expires_at": "2025-10-31T12:05:00Z",
  "nonce": "abc-123-def",
  "payment_id": "pay-456-ghi",
  "resource": "/premium",
  "description": "Access to premium tier data"
}
```

## Complete Code

```rust
use actix_web::{get, web, App, HttpResponse, HttpServer};
use openlibx402_actix::{
    create_payment_request, payment_required_response, PaymentExtractor, PaymentRequirement,
    X402Config, X402State,
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct PremiumData {
    message: String,
    data: Vec<String>,
    tier: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct BasicData {
    message: String,
}

/// Free endpoint
#[get("/")]
async fn index() -> HttpResponse {
    HttpResponse::Ok().json(BasicData {
        message: "Welcome to the X402 Actix Web example server!".to_string(),
    })
}

/// Basic tier - $0.01
#[get("/basic")]
async fn basic_tier(
    state: web::Data<X402State>,
    auth: Option<PaymentExtractor>,
) -> HttpResponse {
    match auth {
        Some(auth) => {
            HttpResponse::Ok().json(PremiumData {
                message: "Access granted to basic tier".to_string(),
                data: vec![
                    "Basic data point 1".to_string(),
                    "Basic data point 2".to_string(),
                ],
                tier: "basic".to_string(),
            })
        }
        None => {
            let requirement =
                PaymentRequirement::new("0.01").with_description("Access to basic tier data");
            let payment_request = create_payment_request(&state.config, &requirement, "/basic");
            payment_required_response(payment_request)
        }
    }
}

/// Premium tier - $0.10
#[get("/premium")]
async fn premium_tier(
    state: web::Data<X402State>,
    auth: Option<PaymentExtractor>,
) -> HttpResponse {
    match auth {
        Some(auth) => {
            HttpResponse::Ok().json(PremiumData {
                message: "Access granted to premium tier".to_string(),
                data: vec![
                    "Premium insight 1".to_string(),
                    "Premium insight 2".to_string(),
                    "Premium insight 3".to_string(),
                    "Exclusive data point".to_string(),
                ],
                tier: "premium".to_string(),
            })
        }
        None => {
            let requirement = PaymentRequirement::new("0.10")
                .with_description("Access to premium tier data")
                .with_expires_in(600);
            let payment_request = create_payment_request(&state.config, &requirement, "/premium");
            payment_required_response(payment_request)
        }
    }
}

/// Enterprise tier - $1.00
#[get("/enterprise")]
async fn enterprise_tier(
    state: web::Data<X402State>,
    auth: Option<PaymentExtractor>,
) -> HttpResponse {
    match auth {
        Some(auth) => {
            HttpResponse::Ok().json(PremiumData {
                message: "Access granted to enterprise tier".to_string(),
                data: vec![
                    "Enterprise analytics 1".to_string(),
                    "Enterprise analytics 2".to_string(),
                    "Enterprise analytics 3".to_string(),
                    "Enterprise analytics 4".to_string(),
                    "Confidential market data".to_string(),
                    "Advanced predictions".to_string(),
                ],
                tier: "enterprise".to_string(),
            })
        }
        None => {
            let requirement = PaymentRequirement::new("1.00")
                .with_description("Access to enterprise tier data and analytics");
            let payment_request =
                create_payment_request(&state.config, &requirement, "/enterprise");
            payment_required_response(payment_request)
        }
    }
}

/// Health check
#[get("/health")]
async fn health() -> &'static str {
    "OK"
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Configure X402
    let config = X402Config {
        payment_address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU".to_string(),
        token_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".to_string(),
        network: "solana-devnet".to_string(),
        rpc_url: None,
        auto_verify: true,
    };

    let state = web::Data::new(X402State {
        config: config.clone(),
    });

    println!("\n🌐 Starting Actix Web X402 Example Server");
    println!("=========================================");
    println!("Payment Address: {}", config.payment_address);
    println!("Token Mint: {}", config.token_mint);
    println!("Network: {}", config.network);
    println!("\nEndpoints:");
    println!("  - GET  /          : Free endpoint (no payment)");
    println!("  - GET  /basic     : Basic tier ($0.01)");
    println!("  - GET  /premium   : Premium tier ($0.10)");
    println!("  - GET  /enterprise: Enterprise tier ($1.00)");
    println!("  - GET  /health    : Health check");
    println!("\nServer running at http://127.0.0.1:8080\n");

    HttpServer::new(move || {
        App::new()
            .app_data(state.clone())
            .service(index)
            .service(basic_tier)
            .service(premium_tier)
            .service(enterprise_tier)
            .service(health)
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
```

## Configuration

Update the wallet addresses in the code:

```rust
let config = X402Config {
    payment_address: "YOUR_WALLET_ADDRESS".to_string(),  // Replace with your wallet
    token_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".to_string(),  // USDC Devnet
    network: "solana-devnet".to_string(),
    rpc_url: None,
    auto_verify: true,
};
```

## Using with Client

Test with the auto client:

```rust
use openlibx402_client::{X402AutoClient, AutoClientOptions};
use solana_sdk::signature::Keypair;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let keypair = Keypair::new();
    let options = AutoClientOptions {
        max_payment_amount: "5.0".to_string(),
        auto_retry: true,
        max_retries: 3,
    };

    let client = X402AutoClient::new(keypair, None, Some(options));

    // Test each tier
    for endpoint in ["basic", "premium", "enterprise"] {
        let url = format!("http://localhost:8080/{}", endpoint);
        match client.get(&url).await {
            Ok(response) => {
                let body = response.text().await?;
                println!("✓ {}: {}", endpoint, body);
            }
            Err(e) => {
                eprintln!("✗ {}: {}", endpoint, e);
            }
        }
    }

    Ok(())
}
```

## Key Features Demonstrated

1. **Multiple Pricing Tiers** - Different prices for different data levels
2. **Payment Descriptions** - Human-readable descriptions in payment requests
3. **Custom Expirations** - Premium tier has 10-minute expiration
4. **Optional Extractors** - Using `Option<PaymentExtractor>` for flexible handling
5. **Health Check** - Free endpoint for monitoring
6. **Async Handlers** - All handlers are async for maximum performance

## Performance Considerations

Actix Web is known for excellent performance:
- Async I/O with Tokio
- Efficient request routing
- Low overhead middleware
- Connection pooling

## Next Steps

- Modify pricing tiers
- Add custom business logic
- Integrate with database
- Add rate limiting
- Deploy to production
- Add middleware for logging/metrics

## See Also

- [Actix Web Middleware Documentation](../middleware/actix.md)
- [Server Quick Start](../getting-started/server-quickstart.md)
- [Rocket Server Example](rocket-server.md)
