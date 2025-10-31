# Rocket Server Example

Complete example of an X402-enabled API server using Rocket with multiple pricing tiers.

## Source Code

Location: `examples/rust/rocket-server/`

## Overview

This example demonstrates:
- Free and paid endpoints
- Multiple pricing tiers ($0.01, $0.10, $1.00)
- Payment requirement configuration
- Health check endpoint

## Running the Example

```bash
cd examples/rust/rocket-server
cargo run
```

Server starts on `http://localhost:8000`

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
curl http://localhost:8000/
```

Response:
```json
{
  "message": "Welcome to the X402 Rocket example server!"
}
```

### Payment Required

```bash
curl -v http://localhost:8000/premium
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
use openlibx402_rocket::{
    create_payment_request, PaymentGuard, PaymentRequirement,
    PaymentRequiredResponse, X402Config,
};
use rocket::{get, routes, serde::json::Json, State};
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
fn index() -> Json<BasicData> {
    Json(BasicData {
        message: "Welcome to the X402 Rocket example server!".to_string(),
    })
}

/// Basic tier - $0.01
#[get("/basic")]
fn basic_tier(
    config: &State<X402Config>,
    _auth: Option<PaymentGuard>,
) -> Result<Json<PremiumData>, PaymentRequiredResponse> {
    match _auth {
        Some(auth) => {
            Ok(Json(PremiumData {
                message: "Access granted to basic tier".to_string(),
                data: vec![
                    "Basic data point 1".to_string(),
                    "Basic data point 2".to_string(),
                ],
                tier: "basic".to_string(),
            }))
        }
        None => {
            let requirement = PaymentRequirement::new("0.01")
                .with_description("Access to basic tier data");
            let payment_request = create_payment_request(config, &requirement, "/basic");
            Err(PaymentRequiredResponse { payment_request })
        }
    }
}

/// Premium tier - $0.10
#[get("/premium")]
fn premium_tier(
    config: &State<X402Config>,
    _auth: Option<PaymentGuard>,
) -> Result<Json<PremiumData>, PaymentRequiredResponse> {
    match _auth {
        Some(auth) => {
            Ok(Json(PremiumData {
                message: "Access granted to premium tier".to_string(),
                data: vec![
                    "Premium insight 1".to_string(),
                    "Premium insight 2".to_string(),
                    "Premium insight 3".to_string(),
                    "Exclusive data point".to_string(),
                ],
                tier: "premium".to_string(),
            }))
        }
        None => {
            let requirement = PaymentRequirement::new("0.10")
                .with_description("Access to premium tier data")
                .with_expires_in(600);
            let payment_request = create_payment_request(config, &requirement, "/premium");
            Err(PaymentRequiredResponse { payment_request })
        }
    }
}

/// Enterprise tier - $1.00
#[get("/enterprise")]
fn enterprise_tier(
    config: &State<X402Config>,
    _auth: Option<PaymentGuard>,
) -> Result<Json<PremiumData>, PaymentRequiredResponse> {
    match _auth {
        Some(auth) => {
            Ok(Json(PremiumData {
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
            }))
        }
        None => {
            let requirement = PaymentRequirement::new("1.00")
                .with_description("Access to enterprise tier data and analytics");
            let payment_request = create_payment_request(config, &requirement, "/enterprise");
            Err(PaymentRequiredResponse { payment_request })
        }
    }
}

/// Health check
#[get("/health")]
fn health() -> &'static str {
    "OK"
}

#[rocket::main]
async fn main() -> Result<(), rocket::Error> {
    // Configure X402
    let config = X402Config {
        payment_address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU".to_string(),
        token_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".to_string(),
        network: "solana-devnet".to_string(),
        rpc_url: None,
        auto_verify: true,
    };

    println!("\n🚀 Starting Rocket X402 Example Server");
    println!("=====================================");
    println!("Payment Address: {}", config.payment_address);
    println!("Token Mint: {}", config.token_mint);
    println!("Network: {}", config.network);
    println!("\nEndpoints:");
    println!("  - GET  /          : Free endpoint (no payment)");
    println!("  - GET  /basic     : Basic tier ($0.01)");
    println!("  - GET  /premium   : Premium tier ($0.10)");
    println!("  - GET  /enterprise: Enterprise tier ($1.00)");
    println!("  - GET  /health    : Health check\n");

    let _rocket = rocket::build()
        .manage(config)
        .mount("/", routes![index, basic_tier, premium_tier, enterprise_tier, health])
        .launch()
        .await?;

    Ok(())
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
        let url = format!("http://localhost:8000/{}", endpoint);
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
4. **Optional Guards** - Using `Option<PaymentGuard>` for flexible handling
5. **Health Check** - Free endpoint for monitoring

## Next Steps

- Modify pricing tiers
- Add custom business logic
- Integrate with database
- Add rate limiting
- Deploy to production

## See Also

- [Rocket Middleware Documentation](../middleware/rocket.md)
- [Server Quick Start](../getting-started/server-quickstart.md)
- [Actix Web Server Example](actix-server.md)
