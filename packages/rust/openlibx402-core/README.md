# openlibx402-core

Core library for the X402 payment protocol with Solana blockchain integration.

X402 is an open standard that enables autonomous payments for API access using HTTP 402 "Payment Required" status codes and Solana micropayments.

## Features

- **PaymentRequest Model**: Server-to-client payment requirements with expiration and description
- **PaymentAuthorization Model**: Client-to-server payment proof with on-chain verification
- **Solana Integration**: Direct blockchain payment processing with SPL token support
- **Error Handling**: Comprehensive error types for all X402 operations
- **Type Safe**: Full type safety with Result<T, X402Error> error handling

## Quick Start

Add to your `Cargo.toml`:

```toml
[dependencies]
openlibx402-core = "0.0.1"
```

### Create a Payment Request

```rust
use openlibx402_core::{PaymentRequest, X402Config};

let request = PaymentRequest::new(
    "0.10",  // amount in USDC
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",  // USDC mint
    "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",  // payment address
)
.with_description("Premium API access");

// Send to client (typically as HTTP 402 response body)
let json = request.to_json()?;
```

### Process a Payment

```rust
use openlibx402_core::SolanaPaymentProcessor;
use solana_sdk::signer::keypair::Keypair;

let processor = SolanaPaymentProcessor::new(
    "https://api.devnet.solana.com".to_string(),
    None
);

let result = processor.create_payment(&payment_request, &keypair).await?;
println!("Transaction: {}", result);
```

## Documentation

For full documentation, visit: https://openlibx402.github.io/docs

## License

MIT License - See LICENSE file for details.

## Related Packages

- [`openlibx402-client`](https://crates.io/crates/openlibx402-client) - HTTP client with automatic payment handling
- [`openlibx402-rocket`](https://crates.io/crates/openlibx402-rocket) - Rocket web framework integration
- [`openlibx402-actix`](https://crates.io/crates/openlibx402-actix) - Actix Web framework integration
