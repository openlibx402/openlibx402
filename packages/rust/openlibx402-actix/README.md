# openlibx402-actix

Actix Web framework integration for the X402 payment protocol.

This library provides extractors and utilities for implementing payment-protected endpoints in Actix Web applications.

## Features

- **PaymentExtractor**: Request extractor for payment enforcement
- **PaymentError**: Custom error type with automatic 402 responses
- **X402State**: Application state wrapper for configuration
- **Configuration**: Easy payment setup with X402Config
- **High Performance**: Built on Actix Web's actor system
- **Type Safe**: Full type safety with Actix Web patterns

## Quick Start

Add to your `Cargo.toml`:

```toml
[dependencies]
openlibx402-actix = "0.0.1"
actix-web = "4.4"
tokio = "1.35"
```

### Create a Protected Endpoint

```rust
use actix_web::{get, web, App, HttpServer, HttpResponse};
use openlibx402_actix::{
    X402Config, X402State, PaymentExtractor, PaymentRequirement,
    create_payment_request, payment_required_response
};

#[get("/premium")]
async fn premium_content(
    state: web::Data<X402State>,
    auth: Option<PaymentExtractor>,
) -> HttpResponse {
    match auth {
        Some(_) => {
            // Payment verified
            HttpResponse::Ok().json("Premium content here!")
        }
        None => {
            // No payment, return 402
            let requirement = PaymentRequirement::new("0.10")
                .with_description("Access to premium content");
            let payment_request = create_payment_request(&state.config, &requirement, "/premium");
            payment_required_response(payment_request)
        }
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
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
            .service(premium_content)
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
```

## Configuration

### X402Config

```rust
pub struct X402Config {
    pub payment_address: String,      // Where payments go
    pub token_mint: String,            // Token to accept (e.g., USDC)
    pub network: String,               // Solana network (mainnet, devnet, testnet)
    pub rpc_url: Option<String>,       // Custom RPC endpoint
    pub auto_verify: bool,             // Auto-verify payments
}
```

### PaymentRequirement

```rust
let requirement = PaymentRequirement::new("1.00")
    .with_description("Premium API access")
    .with_expires_in(600);  // Expires in 10 minutes
```

## Documentation

For full documentation, visit: https://openlibx402.github.io/docs

## License

MIT License - See LICENSE file for details.

## Related Packages

- [`openlibx402-core`](https://crates.io/crates/openlibx402-core) - Core protocol library
- [`openlibx402-client`](https://crates.io/crates/openlibx402-client) - HTTP client library
- [`openlibx402-rocket`](https://crates.io/crates/openlibx402-rocket) - Rocket Web integration
