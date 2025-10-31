# Client Quick Start

Build your first X402 client in Rust to consume payment-protected APIs. This guide shows you how to use both automatic and explicit payment handling.

## Choose Your Client Type

- [Auto Client](#auto-client) - Automatic payment handling (recommended)
- [Explicit Client](#explicit-client) - Full control over payment flow

---

## Auto Client

The auto client automatically detects 402 responses, creates payments, and retries requests.

### Step 1: Create Project

```bash
cargo new my-x402-client
cd my-x402-client
```

### Step 2: Add Dependencies

```toml
[dependencies]
openlibx402-core = "0.1"
openlibx402-client = "0.1"
tokio = { version = "1.35", features = ["full"] }
solana-sdk = "2.0"
```

### Step 3: Load Keypair

```rust
use solana_sdk::signature::{read_keypair_file, Keypair};
use std::error::Error;

fn load_keypair() -> Result<Keypair, Box<dyn Error>> {
    // Load from file
    let keypair = read_keypair_file(
        std::env::var("SOLANA_KEYPAIR")
            .unwrap_or_else(|_| {
                format!("{}/.config/solana/id.json", std::env::var("HOME").unwrap())
            })
    )?;
    Ok(keypair)
}
```

### Step 4: Create Auto Client

```rust
use openlibx402_client::{X402AutoClient, AutoClientOptions};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load your Solana keypair
    let keypair = load_keypair()?;

    // Configure auto client
    let options = AutoClientOptions {
        max_payment_amount: "5.0".to_string(),  // Max $5 per request
        auto_retry: true,
        max_retries: 3,
    };

    // Create client
    let client = X402AutoClient::new(keypair, None, Some(options));

    // Make request - payment handled automatically!
    let response = client.get("http://localhost:8000/premium").await?;
    let body = response.text().await?;

    println!("Response: {}", body);

    Ok(())
}
```

### Step 5: Run Client

```bash
cargo run
```

The client will automatically:
1. Make initial request
2. Detect 402 response
3. Create and send payment
4. Retry with payment authorization
5. Return the data

---

## Explicit Client

The explicit client gives you full control over the payment flow.

### Step 1: Create Project

Same as auto client.

### Step 2: Add Dependencies

Same as auto client.

### Step 3: Create Explicit Client

```rust
use openlibx402_client::X402Client;
use solana_sdk::signature::{read_keypair_file, Keypair};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load keypair
    let keypair = read_keypair_file(
        format!("{}/.config/solana/id.json", std::env::var("HOME")?)
    )?;

    // Create client
    let client = X402Client::new(keypair, None);

    // Make initial request
    let response = client.get("http://localhost:8000/premium").await?;

    // Check if payment is required
    if client.is_payment_required(&response) {
        println!("Payment required!");

        // Parse payment request
        let payment_request = client.parse_payment_request(response).await?;

        println!("Amount: {} USDC", payment_request.max_amount_required);
        println!("Description: {:?}", payment_request.description);

        // Create and send payment
        let authorization = client.create_payment(&payment_request).await?;

        println!("Payment sent! Signature: {}", authorization.signature);

        // Retry with payment authorization
        let response = client.get_with_auth(
            "http://localhost:8000/premium",
            &authorization
        ).await?;

        let body = response.text().await?;
        println!("Response: {}", body);
    } else {
        // No payment required
        let body = response.text().await?;
        println!("Response: {}", body);
    }

    Ok(())
}
```

### Step 4: Run Client

```bash
cargo run
```

---

## POST Requests

Both clients support POST requests:

### Auto Client

```rust
let body = serde_json::json!({
    "query": "premium data"
});

let response = client.post(
    "http://localhost:8000/query",
    Some(body.to_string())
).await?;
```

### Explicit Client

```rust
let body = serde_json::json!({
    "query": "premium data"
});

let response = client.post(
    "http://localhost:8000/query",
    Some(body.to_string())
).await?;

if client.is_payment_required(&response) {
    let payment_request = client.parse_payment_request(response).await?;
    let authorization = client.create_payment(&payment_request).await?;

    let response = client.post_with_auth(
        "http://localhost:8000/query",
        Some(body.to_string()),
        &authorization
    ).await?;

    // Handle response
}
```

## Error Handling

Handle X402-specific errors:

```rust
use openlibx402_core::X402Error;

match client.get(url).await {
    Ok(response) => {
        // Handle response
    }
    Err(e) => {
        match e {
            X402Error::PaymentRequired(msg) => {
                eprintln!("Payment required: {}", msg);
            }
            X402Error::InsufficientFunds(msg) => {
                eprintln!("Insufficient funds: {}", msg);
            }
            X402Error::PaymentExpired(msg) => {
                eprintln!("Payment expired: {}", msg);
            }
            X402Error::Network(msg) => {
                eprintln!("Network error: {}", msg);
            }
            _ => {
                eprintln!("Error: {}", e);
            }
        }
    }
}
```

## Configuration

### Auto Client Options

```rust
let options = AutoClientOptions {
    max_payment_amount: "10.0".to_string(),  // Maximum amount to pay
    auto_retry: true,                         // Automatically retry after payment
    max_retries: 3,                           // Maximum retry attempts
};
```

### Custom RPC URL

```rust
let client = X402AutoClient::new(
    keypair,
    Some("https://your-rpc-endpoint.com"),
    Some(options)
);
```

## Best Practices

### 1. Load Keypair Securely

```rust
use std::env;

fn load_keypair() -> Result<Keypair, Box<dyn Error>> {
    let path = env::var("SOLANA_KEYPAIR")
        .or_else(|_| env::var("HOME").map(|h| format!("{}/.config/solana/id.json", h)))?;

    read_keypair_file(path)
        .map_err(|e| format!("Failed to load keypair: {}", e).into())
}
```

### 2. Set Payment Limits

```rust
let options = AutoClientOptions {
    max_payment_amount: "5.0".to_string(),  // Protect against overpaying
    auto_retry: true,
    max_retries: 3,
};
```

### 3. Handle All Error Cases

```rust
async fn fetch_premium_data(client: &X402AutoClient) -> Result<String, Box<dyn Error>> {
    match client.get("http://localhost:8000/premium").await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(response.text().await?)
            } else {
                Err(format!("HTTP error: {}", response.status()).into())
            }
        }
        Err(X402Error::InsufficientFunds(_)) => {
            Err("Not enough USDC in wallet".into())
        }
        Err(X402Error::PaymentExpired(_)) => {
            // Retry with new payment request
            client.get("http://localhost:8000/premium").await?
                .text().await.map_err(Into::into)
        }
        Err(e) => Err(e.into()),
    }
}
```

### 4. Use Connection Pooling

The client reuses HTTP connections automatically via reqwest.

## Testing Without Payments

For testing, you can mock the payment processor:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_client() {
        // Use test server without payment requirements
        let client = X402AutoClient::new(
            Keypair::new(),
            None,
            None
        );

        let response = client.get("http://localhost:8000/free-endpoint").await.unwrap();
        assert!(response.status().is_success());
    }
}
```

## Complete Example

```rust
use openlibx402_client::{X402AutoClient, AutoClientOptions};
use solana_sdk::signature::read_keypair_file;
use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    // Load keypair
    let keypair = read_keypair_file(
        format!("{}/.config/solana/devnet.json", std::env::var("HOME")?)
    )?;

    // Configure client
    let options = AutoClientOptions {
        max_payment_amount: "5.0".to_string(),
        auto_retry: true,
        max_retries: 3,
    };

    let client = X402AutoClient::new(keypair, None, Some(options));

    // Make multiple requests
    let endpoints = vec![
        "http://localhost:8000/basic",
        "http://localhost:8000/premium",
        "http://localhost:8000/enterprise",
    ];

    for endpoint in endpoints {
        match client.get(endpoint).await {
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

## Next Steps

- [Client Library Reference](../libraries/client.md) - Detailed API documentation
- [Error Handling](../reference/errors.md) - All error types and handling
- [Configuration](../reference/configuration.md) - Advanced configuration options

## Troubleshooting

### "Failed to load keypair"

Make sure your keypair file exists:

```bash
ls ~/.config/solana/id.json
```

Generate one if needed:

```bash
solana-keygen new --outfile ~/.config/solana/devnet.json
```

### "Insufficient funds"

Check your SOL balance for gas fees:

```bash
solana balance
```

Airdrop on devnet:

```bash
solana airdrop 2
```

### "Payment verification failed"

Ensure you're using the correct network (devnet vs mainnet) and have USDC tokens.
