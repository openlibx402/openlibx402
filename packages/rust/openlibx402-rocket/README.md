# openlibx402-rocket

Rocket web framework integration for the X402 payment protocol.

This library provides middleware and utilities for implementing payment-protected endpoints in Rocket web applications.

## Features

- **PaymentGuard**: Request guard for enforcing payment requirements
- **PaymentRequiredResponse**: Automatic 402 response generation
- **Configuration**: Easy payment setup with X402Config
- **Flexible Requirements**: Per-endpoint payment amounts and descriptions
- **Type Safe**: Full Rocket integration with type safety

## Quick Start

Add to your `Cargo.toml`:

```toml
[dependencies]
openlibx402-rocket = "0.0.1"
rocket = { version = "0.5", features = ["json"] }
tokio = "1.35"
```

### Create a Protected Endpoint

```rust
use rocket::{get, routes, State};
use openlibx402_rocket::{
    X402Config, PaymentGuard, PaymentRequirement,
    create_payment_request, PaymentRequiredResponse
};

#[get("/premium")]
fn premium_content(
    config: &State<X402Config>,
    _auth: Option<PaymentGuard>
) -> Result<String, PaymentRequiredResponse> {
    match _auth {
        Some(_) => {
            // Payment verified
            Ok("Premium content here!".to_string())
        }
        None => {
            // No payment, return 402
            let requirement = PaymentRequirement::new("0.10")
                .with_description("Access to premium content");
            let payment_request = create_payment_request(config, &requirement, "/premium");
            Err(PaymentRequiredResponse { payment_request })
        }
    }
}

#[rocket::main]
async fn main() -> Result<(), rocket::Error> {
    let config = X402Config {
        payment_address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU".to_string(),
        token_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".to_string(),
        network: "solana-devnet".to_string(),
        rpc_url: None,
        auto_verify: true,
    };

    let _rocket = rocket::build()
        .manage(config)
        .mount("/", routes![premium_content])
        .launch()
        .await?;

    Ok(())
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
- [`openlibx402-actix`](https://crates.io/crates/openlibx402-actix) - Actix Web integration
