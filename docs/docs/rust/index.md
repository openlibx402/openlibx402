# Rust Implementation

Welcome to the OpenLibx402 Rust implementation documentation. This section covers all Rust packages, libraries, middleware, and examples for building X402-enabled APIs and clients with type-safe, high-performance code.

## Overview

The Rust implementation provides:

- **Core Library** - X402 protocol implementation with models, errors, and Solana payment processing
- **Client Library** - HTTP client with automatic and explicit payment handling
- **Middleware** - Integration with popular Rust web frameworks (Rocket, Actix Web)
- **Examples** - Complete working examples for server and client implementations

## Quick Navigation

### 📚 Libraries
- [Core Library](libraries/core.md) - Payment models, errors, and Solana processor
- [Client Library](libraries/client.md) - X402 HTTP client with auto-payment support

### 🔗 Middleware
- [Rocket Middleware](middleware/rocket.md) - Rocket web framework integration
- [Actix Web Middleware](middleware/actix.md) - Actix Web framework integration

### 🚀 Examples
- [Rocket Server](examples/rocket-server.md) - Complete server with multiple pricing tiers
- [Actix Web Server](examples/actix-server.md) - Actix Web server with dynamic pricing

### 📖 Getting Started
- [Installation](getting-started/installation.md)
- [Quick Start Server](getting-started/server-quickstart.md)
- [Quick Start Client](getting-started/client-quickstart.md)

### 🔧 Reference
- [API Reference](reference/api-reference.md)
- [Configuration](reference/configuration.md)
- [Error Handling](reference/errors.md)

## Key Features

✨ **Type-Safe** - Compile-time guarantees with Rust's type system
🤖 **Automatic Payments** - Clients automatically handle payment flows
⚡ **High Performance** - Zero-copy, async-first design with Tokio
💰 **Micropayments** - Support payments as low as $0.001
🔐 **Secure** - Memory-safe, payment verification, nonce-based replay protection
🌐 **Framework Agnostic** - Works with Rocket, Actix Web, and custom implementations

## Crate Dependencies

```toml
[dependencies]
# Core protocol
openlibx402-core = "0.1"

# HTTP client
openlibx402-client = "0.1"

# Rocket middleware
openlibx402-rocket = "0.1"

# Actix Web middleware
openlibx402-actix = "0.1"
```

## Installation

```bash
# Core package (required)
cargo add openlibx402-core

# Client (for consuming paid APIs)
cargo add openlibx402-client

# Middleware for your framework
cargo add openlibx402-rocket
# or
cargo add openlibx402-actix
```

## The X402 Flow

```
┌─────────────┐         ┌──────────────┐         ┌────────────┐
│  AI Agent   │  ─1─→   │  API Server  │         │ Blockchain │
│   (Client)  │         │   (Server)   │         │  (Solana)  │
└─────────────┘         └──────────────┘         └────────────┘
     │                        │                        │
     │  GET /data             │                        │
     ├───────────────────────→│                        │
     │                        │                        │
     │  402 Payment Required  │                        │
     │  + Payment Details     │                        │
     │←───────────────────────┤                        │
     │                        │                        │
     │  Create & Broadcast    │                        │
     │  Payment Transaction   │                        │
     ├────────────────────────┼───────────────────────→│
     │                        │                        │
     │                        │   Verify Transaction   │
     │                        │←───────────────────────┤
     │                        │                        │
     │  GET /data             │                        │
     │  + Payment Auth Header │                        │
     ├───────────────────────→│                        │
     │                        │                        │
     │  200 OK + Data         │                        │
     │←───────────────────────┤                        │
```

## Why Rust?

Rust is an excellent choice for X402 implementations:

- **Safety** - Memory safety without garbage collection
- **Performance** - Zero-cost abstractions and minimal runtime
- **Concurrency** - Fearless concurrency with async/await
- **Reliability** - Catch bugs at compile time
- **Ecosystem** - Rich ecosystem of web frameworks and blockchain tools

## Support

For issues, questions, or contributions:
- [GitHub Issues](https://github.com/openlibx402/openlibx402)
- [GitHub Discussions](https://github.com/openlibx402/openlibx402/discussions)
- [X402 Protocol](https://www.x402.org)
- [Rust Documentation](https://doc.rust-lang.org/)

## Next Steps

Start with the [Installation](getting-started/installation.md) guide and choose your path:

- **Building a Server?** → [Server Quick Start](getting-started/server-quickstart.md)
- **Building a Client?** → [Client Quick Start](getting-started/client-quickstart.md)
- **Need Details?** → [API Reference](reference/api-reference.md)
