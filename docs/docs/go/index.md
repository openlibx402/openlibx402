# Go Implementation

Welcome to the OpenLibx402 Go implementation documentation. This section covers all Go packages, libraries, middleware, and examples for building X402-enabled APIs and clients.

## Overview

The Go implementation provides:

- **Core Library** - X402 protocol implementation with models, errors, and Solana payment processing
- **Client Library** - HTTP client with automatic and explicit payment handling
- **Middleware** - Integration with popular Go web frameworks (net/http, Echo)
- **Examples** - Complete working examples for server and client implementations

## Quick Navigation

### 📚 Libraries
- [Core Library](libraries/core.md) - Payment models, errors, and Solana processor
- [Client Library](libraries/client.md) - X402 HTTP client with auto-payment support

### 🔗 Middleware
- [net/http Middleware](middleware/nethttp.md) - Standard Go net/http integration
- [Echo Middleware](middleware/echo.md) - Echo web framework integration

### 🚀 Examples
- [net/http Server](examples/nethttp-server.md) - Complete server with multiple pricing tiers
- [Echo Server](examples/echo-server.md) - Echo framework server with dynamic pricing

### 📖 Getting Started
- [Installation](getting-started/installation.md)
- [Quick Start Server](getting-started/server-quickstart.md)
- [Quick Start Client](getting-started/client-quickstart.md)

### 🔧 Reference
- [API Reference](reference/api-reference.md)
- [Configuration](reference/configuration.md)
- [Error Handling](reference/errors.md)

## Key Features

✨ **One-Line Integration** - Add payment requirements with minimal code
🤖 **Automatic Payments** - Clients automatically handle payment flows
⚡ **Instant Settlement** - ~200ms on Solana
💰 **Micropayments** - Support payments as low as $0.001
🔐 **Secure** - SSRF protection, payment verification, nonce-based replay protection
🌐 **Framework Agnostic** - Works with net/http, Echo, and custom implementations

## Import Paths

```go
// Core protocol
import "github.com/openlibx402/go/openlibx402-core"

// HTTP client
import "github.com/openlibx402/go/openlibx402-client"

// net/http middleware
import nethttp "github.com/openlibx402/go/openlibx402-nethttp"

// Echo middleware
import echox402 "github.com/openlibx402/go/openlibx402-echo"
```

## Installation

```bash
# Core package (required)
go get github.com/openlibx402/go/openlibx402-core

# Client (for consuming paid APIs)
go get github.com/openlibx402/go/openlibx402-client

# Middleware for your framework
go get github.com/openlibx402/go/openlibx402-nethttp
# or
go get github.com/openlibx402/go/openlibx402-echo
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

## Support

For issues, questions, or contributions:
- [GitHub Issues](https://github.com/openlibx402/openlibx402)
- [GitHub Discussions](https://github.com/openlibx402/openlibx402/discussions)
- [X402 Protocol](https://www.x402.org)

## Next Steps

Start with the [Installation](getting-started/installation.md) guide and choose your path:

- **Building a Server?** → [Server Quick Start](getting-started/server-quickstart.md)
- **Building a Client?** → [Client Quick Start](getting-started/client-quickstart.md)
- **Need Details?** → [API Reference](reference/api-reference.md)
