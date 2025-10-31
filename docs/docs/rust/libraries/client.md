# Client Library

The `openlibx402-client` crate provides HTTP clients for consuming X402-protected APIs with automatic or explicit payment handling.

## Installation

```toml
[dependencies]
openlibx402-client = "0.1"
openlibx402-core = "0.1"
tokio = { version = "1.35", features = ["full"] }
solana-sdk = "2.0"
```

## Overview

The client library provides two client types:

- **X402AutoClient** - Automatically detects and handles 402 responses
- **X402Client** - Explicit control over payment flow

Both clients support:
- GET and POST requests
- Automatic payment creation
- Configurable retry logic
- Payment verification
- Custom RPC endpoints

## X402AutoClient

The auto client automatically handles the complete payment flow.

### Creating an Auto Client

```rust
use openlibx402_client::{X402AutoClient, AutoClientOptions};
use solana_sdk::signature::Keypair;

// With default options
let keypair = Keypair::new();
let client = X402AutoClient::new(keypair, None, None);

// With custom options
let options = AutoClientOptions {
    max_payment_amount: "5.0".to_string(),
    auto_retry: true,
    max_retries: 3,
};

let client = X402AutoClient::new(
    keypair,
    Some("https://your-rpc.com"),
    Some(options)
);
```

### AutoClientOptions

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

Default values:
- `max_payment_amount`: "10.0"
- `auto_retry`: true
- `max_retries`: 3

### Making Requests

#### GET Request

```rust
use openlibx402_client::X402AutoClient;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = X402AutoClient::new(keypair, None, None);

    // Automatically handles 402 and payment
    let response = client.get("https://api.example.com/premium-data").await?;
    let body = response.text().await?;

    println!("Data: {}", body);
    Ok(())
}
```

#### POST Request

```rust
let body = serde_json::json!({
    "query": "premium data"
});

let response = client.post(
    "https://api.example.com/query",
    Some(body.to_string())
).await?;

let data = response.text().await?;
```

### Automatic Flow

When you make a request, the auto client:

1. Makes initial HTTP request
2. If 402 received:
   - Parses payment request
   - Checks amount against `max_payment_amount`
   - Creates and broadcasts payment
   - Retries request with payment authorization
3. Returns successful response or error

### Access to Underlying Client

```rust
// Get the explicit client for manual operations
let explicit_client = auto_client.client();

// Get current options
let options = auto_client.options();
println!("Max payment: {}", options.max_payment_amount);
```

## X402Client

The explicit client gives you full control over the payment flow.

### Creating an Explicit Client

```rust
use openlibx402_client::X402Client;
use solana_sdk::signature::Keypair;

let keypair = Keypair::new();

// With default RPC
let client = X402Client::new(keypair, None);

// With custom RPC
let client = X402Client::new(
    keypair,
    Some("https://your-rpc.com")
);
```

### Making Requests

#### GET Request

```rust
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = X402Client::new(keypair, None);

    // Make initial request
    let response = client.get("https://api.example.com/premium-data").await?;

    // Check if payment required
    if client.is_payment_required(&response) {
        // Parse payment request
        let payment_request = client.parse_payment_request(response).await?;

        println!("Amount: {} USDC", payment_request.max_amount_required);

        // Create payment
        let authorization = client.create_payment(&payment_request).await?;

        // Retry with payment
        let response = client.get_with_auth(
            "https://api.example.com/premium-data",
            &authorization
        ).await?;

        let body = response.text().await?;
        println!("Data: {}", body);
    } else {
        let body = response.text().await?;
        println!("Data: {}", body);
    }

    Ok(())
}
```

#### POST Request

```rust
let body = serde_json::json!({"query": "data"});

// Initial request
let response = client.post(
    "https://api.example.com/query",
    Some(body.to_string())
).await?;

if client.is_payment_required(&response) {
    let payment_request = client.parse_payment_request(response).await?;
    let authorization = client.create_payment(&payment_request).await?;

    // Retry with payment
    let response = client.post_with_auth(
        "https://api.example.com/query",
        Some(body.to_string()),
        &authorization
    ).await?;
}
```

### Client Methods

```rust
// Check if response is 402
let is_402 = client.is_payment_required(&response);

// Parse payment request from 402 response
let payment_request = client.parse_payment_request(response).await?;

// Create and broadcast payment
let authorization = client.create_payment(&payment_request).await?;

// Verify payment (optional)
let verified = client.verify_payment(&authorization, "0.10").await?;

// Make requests with payment authorization
let response = client.get_with_auth(url, &authorization).await?;
let response = client.post_with_auth(url, body, &authorization).await?;
```

## Error Handling

Both clients return `X402Result<T>` or standard `Result` types.

### Handling X402 Errors

```rust
use openlibx402_core::X402Error;

match client.get(url).await {
    Ok(response) => {
        // Handle response
    }
    Err(X402Error::PaymentRequired(msg)) => {
        eprintln!("Payment required: {}", msg);
    }
    Err(X402Error::InsufficientFunds(msg)) => {
        eprintln!("Insufficient funds: {}", msg);
    }
    Err(X402Error::PaymentExpired(msg)) => {
        eprintln!("Payment expired: {}", msg);
    }
    Err(X402Error::TransactionBroadcast(msg)) => {
        eprintln!("Transaction failed: {}", msg);
    }
    Err(X402Error::Network(msg)) => {
        eprintln!("Network error: {}", msg);
    }
    Err(e) => {
        eprintln!("Error: {}", e);
    }
}
```

### Handling HTTP Errors

```rust
let response = client.get(url).await?;

if !response.status().is_success() {
    eprintln!("HTTP error: {}", response.status());
}
```

## Advanced Usage

### Custom Request Handling

```rust
impl X402Client {
    // Make custom HTTP requests
    async fn request(
        &self,
        method: &str,
        url: &str,
        body: Option<String>,
        authorization: Option<&PaymentAuthorization>,
    ) -> X402Result<Response>
}
```

### Payment Verification

```rust
// Verify payment was successful
let authorization = client.create_payment(&payment_request).await?;

let verified = client.verify_payment(
    &authorization,
    &payment_request.max_amount_required
).await?;

if verified {
    println!("Payment verified on-chain");
}
```

### Checking Payment Requirements

```rust
use reqwest::StatusCode;

let response = client.get(url).await?;

match response.status() {
    StatusCode::OK => {
        // No payment required
        let data = response.text().await?;
    }
    StatusCode::PAYMENT_REQUIRED => {
        // Payment required
        let payment_request = PaymentRequest::from_json(
            &response.text().await?
        )?;
    }
    status => {
        // Other HTTP error
        eprintln!("HTTP {}", status);
    }
}
```

## Best Practices

### 1. Use Auto Client for Simple Cases

```rust
// Recommended for most use cases
let client = X402AutoClient::new(keypair, None, None);
let response = client.get(url).await?;
```

### 2. Set Payment Limits

```rust
let options = AutoClientOptions {
    max_payment_amount: "5.0".to_string(),  // Prevent overpaying
    auto_retry: true,
    max_retries: 3,
};
```

### 3. Handle Expired Payments

```rust
loop {
    match client.get(url).await {
        Ok(response) => break response,
        Err(X402Error::PaymentExpired(_)) => {
            // Payment expired, retry automatically
            continue;
        }
        Err(e) => return Err(e),
    }
}
```

### 4. Reuse Clients

```rust
// Create once, reuse for multiple requests
let client = X402AutoClient::new(keypair, None, None);

for url in urls {
    let response = client.get(&url).await?;
    // Process response
}
```

### 5. Custom RPC for Performance

```rust
// Use dedicated RPC endpoint for better performance
let client = X402AutoClient::new(
    keypair,
    Some("https://your-fast-rpc.com"),
    None
);
```

## Complete Examples

### Auto Client with Error Handling

```rust
use openlibx402_client::{X402AutoClient, AutoClientOptions};
use openlibx402_core::X402Error;
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

    let urls = vec![
        "http://localhost:8000/basic",
        "http://localhost:8000/premium",
        "http://localhost:8000/enterprise",
    ];

    for url in urls {
        match client.get(url).await {
            Ok(response) => {
                let body = response.text().await?;
                println!("✓ {}: {}", url, body);
            }
            Err(X402Error::InsufficientFunds(msg)) => {
                eprintln!("✗ {}: Insufficient funds - {}", url, msg);
            }
            Err(X402Error::PaymentRequired(msg)) => {
                eprintln!("✗ {}: Payment required exceeds limit - {}", url, msg);
            }
            Err(e) => {
                eprintln!("✗ {}: {}", url, e);
            }
        }
    }

    Ok(())
}
```

### Explicit Client with Full Control

```rust
use openlibx402_client::X402Client;
use solana_sdk::signature::read_keypair_file;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let keypair = read_keypair_file("~/.config/solana/id.json")?;
    let client = X402Client::new(keypair, None);

    let url = "http://localhost:8000/premium";

    // Make request
    let response = client.get(url).await?;

    // Handle 402
    if client.is_payment_required(&response) {
        let payment_request = client.parse_payment_request(response).await?;

        // Show payment details to user
        println!("Payment required:");
        println!("  Amount: {} USDC", payment_request.max_amount_required);
        println!("  Description: {:?}", payment_request.description);
        println!("  Expires: {}", payment_request.expires_at);

        // Confirm with user (in real app)
        println!("Proceeding with payment...");

        // Create payment
        let authorization = client.create_payment(&payment_request).await?;
        println!("Payment sent: {}", authorization.signature);

        // Retry request
        let response = client.get_with_auth(url, &authorization).await?;
        let body = response.text().await?;
        println!("Received: {}", body);
    } else {
        let body = response.text().await?;
        println!("Received: {}", body);
    }

    Ok(())
}
```

## See Also

- [Core Library](core.md) - Payment models and processor
- [Client Quick Start](../getting-started/client-quickstart.md) - Quick start guide
- [Error Reference](../reference/errors.md) - Error handling details
