# Server Quick Start

Build your first X402-enabled API server in Rust. This guide shows you how to protect endpoints with payment requirements using either Rocket or Actix Web.

## Choose Your Framework

- [Rocket](#rocket-server) - Elegant, type-safe web framework
- [Actix Web](#actix-web-server) - High-performance, actor-based framework

---

## Rocket Server

### Step 1: Create Project

```bash
cargo new my-x402-server
cd my-x402-server
```

### Step 2: Add Dependencies

```toml
[dependencies]
openlibx402-core = "0.1"
openlibx402-rocket = "0.1"
rocket = { version = "0.5", features = ["json"] }
tokio = { version = "1.35", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

### Step 3: Write Server Code

```rust
use openlibx402_rocket::{
    create_payment_request, PaymentGuard, PaymentRequirement,
    PaymentRequiredResponse, X402Config,
};
use rocket::{get, routes, serde::json::Json, State};
use serde::Serialize;

#[derive(Serialize)]
struct PremiumData {
    message: String,
    data: Vec<String>,
}

// Free endpoint - no payment required
#[get("/")]
fn index() -> &'static str {
    "Welcome to my X402 API!"
}

// Premium endpoint - requires $0.10 payment
#[get("/premium")]
fn premium_data(
    config: &State<X402Config>,
    auth: Option<PaymentGuard>,
) -> Result<Json<PremiumData>, PaymentRequiredResponse> {
    match auth {
        Some(_) => {
            // Payment verified - return premium content
            Ok(Json(PremiumData {
                message: "Premium content unlocked!".to_string(),
                data: vec![
                    "Secret data 1".to_string(),
                    "Secret data 2".to_string(),
                ],
            }))
        }
        None => {
            // No payment - return 402 with payment request
            let requirement = PaymentRequirement::new("0.10")
                .with_description("Access to premium data");
            let payment_request = create_payment_request(
                config,
                &requirement,
                "/premium"
            );
            Err(PaymentRequiredResponse { payment_request })
        }
    }
}

#[rocket::main]
async fn main() {
    // Configure X402
    let config = X402Config {
        payment_address: "YOUR_WALLET_ADDRESS".to_string(),
        token_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".to_string(),
        network: "solana-devnet".to_string(),
        rpc_url: None,
        auto_verify: true,
    };

    rocket::build()
        .manage(config)
        .mount("/", routes![index, premium_data])
        .launch()
        .await
        .unwrap();
}
```

### Step 4: Run Server

```bash
cargo run
```

Visit `http://localhost:8000/premium` - you'll get a 402 response with payment details!

---

## Actix Web Server

### Step 1: Create Project

```bash
cargo new my-x402-server
cd my-x402-server
```

### Step 2: Add Dependencies

```toml
[dependencies]
openlibx402-core = "0.1"
openlibx402-actix = "0.1"
actix-web = "4.4"
actix-rt = "2.9"
tokio = { version = "1.35", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

### Step 3: Write Server Code

```rust
use actix_web::{get, web, App, HttpResponse, HttpServer};
use openlibx402_actix::{
    create_payment_request, payment_required_response,
    PaymentExtractor, PaymentRequirement, X402Config, X402State,
};
use serde::Serialize;

#[derive(Serialize)]
struct PremiumData {
    message: String,
    data: Vec<String>,
}

// Free endpoint - no payment required
#[get("/")]
async fn index() -> HttpResponse {
    HttpResponse::Ok().body("Welcome to my X402 API!")
}

// Premium endpoint - requires $0.10 payment
#[get("/premium")]
async fn premium_data(
    state: web::Data<X402State>,
    auth: Option<PaymentExtractor>,
) -> HttpResponse {
    match auth {
        Some(_) => {
            // Payment verified - return premium content
            HttpResponse::Ok().json(PremiumData {
                message: "Premium content unlocked!".to_string(),
                data: vec![
                    "Secret data 1".to_string(),
                    "Secret data 2".to_string(),
                ],
            })
        }
        None => {
            // No payment - return 402 with payment request
            let requirement = PaymentRequirement::new("0.10")
                .with_description("Access to premium data");
            let payment_request = create_payment_request(
                &state.config,
                &requirement,
                "/premium"
            );
            payment_required_response(payment_request)
        }
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Configure X402
    let config = X402Config {
        payment_address: "YOUR_WALLET_ADDRESS".to_string(),
        token_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".to_string(),
        network: "solana-devnet".to_string(),
        rpc_url: None,
        auto_verify: true,
    };

    let state = web::Data::new(X402State { config });

    HttpServer::new(move || {
        App::new()
            .app_data(state.clone())
            .service(index)
            .service(premium_data)
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
```

### Step 4: Run Server

```bash
cargo run
```

Visit `http://localhost:8080/premium` - you'll get a 402 response with payment details!

---

## Testing Your Server

### Using curl

```bash
# Test free endpoint
curl http://localhost:8000/

# Test premium endpoint (will return 402)
curl -v http://localhost:8000/premium
```

### Using httpie

```bash
# Install httpie
cargo install httpie

# Test premium endpoint
http GET http://localhost:8000/premium
```

## Multiple Pricing Tiers

Add different pricing levels:

```rust
// Basic tier - $0.01
#[get("/basic")]
fn basic_tier(
    config: &State<X402Config>,
    auth: Option<PaymentGuard>,
) -> Result<Json<PremiumData>, PaymentRequiredResponse> {
    match auth {
        Some(_) => Ok(Json(PremiumData {
            message: "Basic tier".to_string(),
            data: vec!["Basic data".to_string()],
        })),
        None => {
            let requirement = PaymentRequirement::new("0.01");
            let payment_request = create_payment_request(config, &requirement, "/basic");
            Err(PaymentRequiredResponse { payment_request })
        }
    }
}

// Premium tier - $0.10
#[get("/premium")]
fn premium_tier(
    config: &State<X402Config>,
    auth: Option<PaymentGuard>,
) -> Result<Json<PremiumData>, PaymentRequiredResponse> {
    match auth {
        Some(_) => Ok(Json(PremiumData {
            message: "Premium tier".to_string(),
            data: vec!["Premium data 1".to_string(), "Premium data 2".to_string()],
        })),
        None => {
            let requirement = PaymentRequirement::new("0.10");
            let payment_request = create_payment_request(config, &requirement, "/premium");
            Err(PaymentRequiredResponse { payment_request })
        }
    }
}

// Enterprise tier - $1.00
#[get("/enterprise")]
fn enterprise_tier(
    config: &State<X402Config>,
    auth: Option<PaymentGuard>,
) -> Result<Json<PremiumData>, PaymentRequiredResponse> {
    match auth {
        Some(_) => Ok(Json(PremiumData {
            message: "Enterprise tier".to_string(),
            data: vec![
                "Enterprise data 1".to_string(),
                "Enterprise data 2".to_string(),
                "Enterprise data 3".to_string(),
            ],
        })),
        None => {
            let requirement = PaymentRequirement::new("1.00");
            let payment_request = create_payment_request(config, &requirement, "/enterprise");
            Err(PaymentRequiredResponse { payment_request })
        }
    }
}
```

## Configuration Options

Customize payment requirements:

```rust
let requirement = PaymentRequirement::new("0.10")
    .with_description("Access to premium API endpoint")
    .with_expires_in(600);  // 10 minutes
```

Configure X402:

```rust
let config = X402Config {
    payment_address: "YOUR_WALLET".to_string(),
    token_mint: "USDC_MINT".to_string(),
    network: "solana-devnet".to_string(),
    rpc_url: Some("https://your-rpc.com".to_string()),  // Custom RPC
    auto_verify: true,  // Verify payments on-chain
};
```

## Next Steps

- [Client Quick Start](client-quickstart.md) - Build a client to consume your API
- [Rocket Middleware](../middleware/rocket.md) - Learn more about Rocket integration
- [Actix Web Middleware](../middleware/actix.md) - Learn more about Actix integration
- [Configuration Reference](../reference/configuration.md) - All configuration options

## Complete Examples

See full working examples:
- [Rocket Server Example](../examples/rocket-server.md)
- [Actix Web Server Example](../examples/actix-server.md)
