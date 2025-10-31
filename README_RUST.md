# OpenLibx402 Rust SDK

The Rust implementation of OpenLibx402 provides a comprehensive, type-safe SDK for implementing the X402 payment protocol with Solana blockchain micropayments.

## 📦 Packages

The Rust SDK is organized into the following packages:

### Core Libraries

- **openlibx402-core** - Core types, payment processor, and Solana integration
- **openlibx402-client** - HTTP client with automatic payment handling

### Web Framework Integrations

- **openlibx402-rocket** - Rocket web framework integration
- **openlibx402-actix** - Actix Web framework integration

## 🚀 Quick Start

### Installation

Add the required packages to your `Cargo.toml`:

```toml
[dependencies]
openlibx402-core = "0.1"
openlibx402-client = "0.1"  # For client applications
openlibx402-rocket = "0.1"  # For Rocket servers
# OR
openlibx402-actix = "0.1"   # For Actix Web servers
```

### Client Example (Auto Client)

The auto client automatically handles 402 responses and payment flow:

```rust
use openlibx402_client::{X402AutoClient, AutoClientOptions};
use solana_sdk::signature::Keypair;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load your Solana keypair (replace with actual keypair loading)
    let keypair = Keypair::new();

    // Configure auto client
    let options = AutoClientOptions {
        max_payment_amount: "5.0".to_string(),
        auto_retry: true,
        max_retries: 3,
    };

    let client = X402AutoClient::new(keypair, None, Some(options));

    // Make request - payment is handled automatically!
    let response = client.get("https://api.example.com/premium-data").await?;
    let data = response.text().await?;
    println!("Received: {}", data);

    Ok(())
}
```

### Client Example (Explicit Control)

For full control over the payment flow:

```rust
use openlibx402_client::X402Client;
use solana_sdk::signature::Keypair;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let keypair = Keypair::new();
    let client = X402Client::new(keypair, None);

    // Make initial request
    let response = client.get("https://api.example.com/premium-data").await?;

    // Check if payment is required
    if client.is_payment_required(&response) {
        // Parse payment request
        let payment_request = client.parse_payment_request(response).await?;

        println!("Payment required: {} USDC", payment_request.max_amount_required);

        // Create and send payment
        let authorization = client.create_payment(&payment_request).await?;

        // Retry with payment
        let response = client.get_with_auth(
            "https://api.example.com/premium-data",
            &authorization
        ).await?;

        let data = response.text().await?;
        println!("Received: {}", data);
    }

    Ok(())
}
```

### Server Example (Rocket)

Protect endpoints with payment requirements using Rocket:

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

#[get("/premium")]
fn premium_data(
    config: &State<X402Config>,
    auth: Option<PaymentGuard>,
) -> Result<Json<PremiumData>, PaymentRequiredResponse> {
    match auth {
        Some(_) => Ok(Json(PremiumData {
            message: "Premium content".to_string(),
            data: vec!["Data 1".to_string(), "Data 2".to_string()],
        })),
        None => {
            let requirement = PaymentRequirement::new("0.10")
                .with_description("Access to premium data");
            let payment_request = create_payment_request(config, &requirement, "/premium");
            Err(PaymentRequiredResponse { payment_request })
        }
    }
}

#[rocket::main]
async fn main() {
    let config = X402Config {
        payment_address: "YOUR_SOLANA_WALLET_ADDRESS".to_string(),
        token_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".to_string(),
        network: "solana-devnet".to_string(),
        rpc_url: None,
        auto_verify: true,
    };

    rocket::build()
        .manage(config)
        .mount("/", routes![premium_data])
        .launch()
        .await
        .unwrap();
}
```

### Server Example (Actix Web)

Protect endpoints with payment requirements using Actix Web:

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

#[get("/premium")]
async fn premium_data(
    state: web::Data<X402State>,
    auth: Option<PaymentExtractor>,
) -> HttpResponse {
    match auth {
        Some(_) => HttpResponse::Ok().json(PremiumData {
            message: "Premium content".to_string(),
            data: vec!["Data 1".to_string(), "Data 2".to_string()],
        }),
        None => {
            let requirement = PaymentRequirement::new("0.10")
                .with_description("Access to premium data");
            let payment_request = create_payment_request(&state.config, &requirement, "/premium");
            payment_required_response(payment_request)
        }
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let config = X402Config {
        payment_address: "YOUR_SOLANA_WALLET_ADDRESS".to_string(),
        token_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".to_string(),
        network: "solana-devnet".to_string(),
        rpc_url: None,
        auto_verify: true,
    };

    let state = web::Data::new(X402State { config });

    HttpServer::new(move || {
        App::new()
            .app_data(state.clone())
            .service(premium_data)
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
```

## 📖 Core Concepts

### Payment Request

When a server requires payment, it returns a 402 status code with a `PaymentRequest`:

```rust
use openlibx402_core::PaymentRequest;

// Example PaymentRequest structure
let payment_request = PaymentRequest {
    max_amount_required: "0.10".to_string(),
    asset_type: "SPL".to_string(),
    asset_address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".to_string(),
    payment_address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU".to_string(),
    network: "solana-devnet".to_string(),
    expires_at: chrono::Utc::now() + chrono::Duration::seconds(300),
    nonce: "unique_nonce".to_string(),
    payment_id: "unique_payment_id".to_string(),
    resource: "/api/premium-data".to_string(),
    description: Some("Access to premium data".to_string()),
};
```

### Payment Authorization

After processing payment, the client sends a `PaymentAuthorization` header:

```rust
use openlibx402_core::PaymentAuthorization;

// Example PaymentAuthorization structure
let authorization = PaymentAuthorization {
    payment_id: "unique_payment_id".to_string(),
    actual_amount: "0.10".to_string(),
    payment_address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU".to_string(),
    asset_address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".to_string(),
    network: "solana-devnet".to_string(),
    timestamp: chrono::Utc::now(),
    signature: "transaction_signature".to_string(),
    public_key: "payer_public_key".to_string(),
    transaction_hash: Some("transaction_hash".to_string()),
};

// Encode for HTTP header
let header_value = authorization.to_header_value()?;
```

### Solana Payment Processor

The core library provides a `SolanaPaymentProcessor` for blockchain operations:

```rust
use openlibx402_core::{SolanaPaymentProcessor, PaymentRequest};
use solana_sdk::signature::Keypair;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Create payment processor
    let processor = SolanaPaymentProcessor::new(
        "https://api.devnet.solana.com",
        None
    );

    // Create payment from request
    let keypair = Keypair::new();
    let payment_request = /* ... */;
    let authorization = processor.create_payment(&payment_request, &keypair).await?;

    // Verify payment
    let verified = processor.verify_payment(&authorization, "0.10").await?;
    println!("Payment verified: {}", verified);

    Ok(())
}
```

## 🔧 Configuration

### Client Configuration

```rust
use openlibx402_client::{X402AutoClient, AutoClientOptions};

let options = AutoClientOptions {
    max_payment_amount: "10.0".to_string(),  // Maximum USDC to pay automatically
    auto_retry: true,                         // Automatically retry after payment
    max_retries: 3,                           // Maximum retry attempts
};

let client = X402AutoClient::new(keypair, rpc_url, Some(options));
```

### Server Configuration

```rust
use openlibx402_rocket::X402Config;

let config = X402Config {
    payment_address: "YOUR_WALLET".to_string(),     // Your Solana wallet
    token_mint: "USDC_MINT_ADDRESS".to_string(),    // USDC token mint
    network: "solana-devnet".to_string(),           // Network identifier
    rpc_url: Some("https://api.devnet.solana.com".to_string()), // Custom RPC
    auto_verify: true,                              // Verify payments on-chain
};
```

### Payment Requirements

```rust
use openlibx402_rocket::PaymentRequirement;

let requirement = PaymentRequirement::new("0.10")
    .with_description("Access to premium API endpoint")
    .with_expires_in(600);  // 10 minutes
```

## 🌐 Network Configuration

### Devnet (Testing)

```rust
let config = X402Config {
    payment_address: "YOUR_DEVNET_WALLET".to_string(),
    token_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".to_string(), // USDC Devnet
    network: "solana-devnet".to_string(),
    rpc_url: None,  // Uses default devnet RPC
    auto_verify: true,
};
```

### Mainnet (Production)

```rust
let config = X402Config {
    payment_address: "YOUR_MAINNET_WALLET".to_string(),
    token_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".to_string(), // USDC Mainnet
    network: "solana-mainnet".to_string(),
    rpc_url: None,  // Uses default mainnet RPC
    auto_verify: true,
};
```

## 🔐 Keypair Management

### Loading from File

```rust
use solana_sdk::signature::{Keypair, read_keypair_file};

// Load from file
let keypair = read_keypair_file("path/to/keypair.json")
    .expect("Failed to load keypair");
```

### Environment Variable

```rust
use solana_sdk::signature::Keypair;
use std::env;

let keypair_bytes = env::var("SOLANA_KEYPAIR")
    .expect("SOLANA_KEYPAIR not set");
let keypair_data: Vec<u8> = serde_json::from_str(&keypair_bytes)?;
let keypair = Keypair::from_bytes(&keypair_data)?;
```

## 🎯 Examples

Complete examples are available in the `examples/rust/` directory:

### Running the Rocket Server Example

```bash
cd examples/rust/rocket-server
cargo run
```

Visit:
- `http://localhost:8000/` - Free endpoint
- `http://localhost:8000/basic` - Requires $0.01
- `http://localhost:8000/premium` - Requires $0.10
- `http://localhost:8000/enterprise` - Requires $1.00

### Running the Actix Web Server Example

```bash
cd examples/rust/actix-server
cargo run
```

Visit:
- `http://localhost:8080/` - Free endpoint
- `http://localhost:8080/basic` - Requires $0.01
- `http://localhost:8080/premium` - Requires $0.10
- `http://localhost:8080/enterprise` - Requires $1.00

## 🧪 Testing

Run tests for all packages:

```bash
cd packages/rust
cargo test
```

Run tests for a specific package:

```bash
cargo test -p openlibx402-core
cargo test -p openlibx402-client
```

## 📚 API Documentation

Generate and view the API documentation:

```bash
cd packages/rust
cargo doc --open
```

## 🛠️ Building

Build all packages:

```bash
cd packages/rust
cargo build
```

Build with optimizations:

```bash
cargo build --release
```

## ⚡ Performance

The Rust SDK is designed for high performance:

- **Zero-copy** where possible
- **Async-first** design with Tokio
- **Type-safe** with compile-time guarantees
- **Minimal dependencies** for faster builds
- **Efficient serialization** with serde

## 🔍 Error Handling

All operations return `Result<T, X402Error>`:

```rust
use openlibx402_core::{X402Error, X402Result};

async fn handle_payment() -> X402Result<String> {
    // ... operation that might fail

    match result {
        Ok(data) => Ok(data),
        Err(X402Error::PaymentExpired(msg)) => {
            println!("Payment expired: {}", msg);
            Err(X402Error::PaymentExpired(msg))
        }
        Err(X402Error::InsufficientFunds(msg)) => {
            println!("Insufficient funds: {}", msg);
            Err(X402Error::InsufficientFunds(msg))
        }
        Err(e) => Err(e),
    }
}
```

### Error Types

- `PaymentRequired` - Payment is required
- `PaymentExpired` - Payment request has expired
- `InsufficientFunds` - Wallet has insufficient balance
- `PaymentVerification` - Payment verification failed
- `TransactionBroadcast` - Failed to broadcast transaction
- `InvalidPaymentRequest` - Malformed payment request
- `InvalidPaymentAuthorization` - Malformed authorization
- `Configuration` - Configuration error
- `Network` - Network/HTTP error
- `Blockchain` - Solana blockchain error
- `Serialization` - JSON serialization error

## 🤝 Contributing

Contributions are welcome! Please see the main [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

## 🔗 Resources

- [X402 Protocol Specification](https://x402.org)
- [Solana Documentation](https://docs.solana.com)
- [Main Project README](README.md)
- [Python SDK Documentation](README_PYTHON.md)
- [TypeScript SDK Documentation](README_TYPESCRIPT.md)
- [Go SDK Documentation](README_GO.md)

## 💡 Tips

### Using with Other Frameworks

The core library can be integrated with any Rust web framework. The Rocket and Actix examples demonstrate the pattern:

1. Create a request guard/extractor
2. Check for `X-Payment-Authorization` header
3. Return 402 with `PaymentRequest` if missing
4. Parse and validate authorization if present

### Custom RPC Endpoints

For better performance, use a custom RPC endpoint:

```rust
let config = X402Config {
    // ... other config
    rpc_url: Some("https://your-rpc-endpoint.com".to_string()),
    // ...
};
```

### Transaction Verification

Enable `auto_verify` to verify payments on-chain:

```rust
let config = X402Config {
    // ... other config
    auto_verify: true,  // Verifies transaction on Solana blockchain
};
```

This adds latency but ensures payment authenticity.
