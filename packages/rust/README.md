# OpenLibx402 Rust Packages

This directory contains the Rust implementation of OpenLibx402, providing a comprehensive SDK for the X402 payment protocol.

## 📦 Workspace Structure

```
packages/rust/
├── openlibx402-core/        # Core types and Solana payment processor
├── openlibx402-client/      # HTTP client with payment handling
├── openlibx402-rocket/      # Rocket web framework integration
└── openlibx402-actix/       # Actix Web framework integration
```

## 🚀 Getting Started

See the main [Rust documentation](../../README_RUST.md) for complete guides and examples.

## 🛠️ Building

Build all packages:

```bash
cargo build
```

Build in release mode:

```bash
cargo build --release
```

## 🧪 Testing

Run all tests:

```bash
cargo test
```

Test a specific package:

```bash
cargo test -p openlibx402-core
```

## 📚 Documentation

Generate API documentation:

```bash
cargo doc --open
```

## 📖 Package Details

### openlibx402-core

Core library providing:
- `PaymentRequest` and `PaymentAuthorization` models
- Error types and result aliases
- `SolanaPaymentProcessor` for blockchain operations
- Serialization utilities

### openlibx402-client

HTTP client library providing:
- `X402Client` - Explicit payment flow control
- `X402AutoClient` - Automatic payment handling
- Configurable retry and payment limits

### openlibx402-rocket

Rocket framework integration providing:
- `PaymentGuard` - Request guard for payment enforcement
- `X402Config` - Server configuration
- Helper functions for payment requests

### openlibx402-actix

Actix Web framework integration providing:
- `PaymentExtractor` - Payment extractor for routes
- `X402State` - Application state
- Helper functions for payment responses

## 🔗 Resources

- [Main Rust Documentation](../../README_RUST.md)
- [Examples](../../examples/rust/)
- [Project Website](https://x402.org)
