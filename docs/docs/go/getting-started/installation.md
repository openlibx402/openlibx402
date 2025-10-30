# Installation

Get started with OpenLibx402 Go packages in minutes.

## Prerequisites

- **Go**: 1.21 or later
- **Solana Wallet**: For testing (testnet/devnet tokens recommended)
- **Git**: For cloning the repository

## Package Installation

### Option 1: Using `go get` (Recommended for Users)

Install the packages you need:

```bash
# Core protocol (required)
go get github.com/openlibx402/go/openlibx402-core

# Client for consuming APIs
go get github.com/openlibx402/go/openlibx402-client

# Middleware for your framework
go get github.com/openlibx402/go/openlibx402-nethttp
# or
go get github.com/openlibx402/go/openlibx402-echo
```

### Option 2: Development Installation (for Contributors)

```bash
# Clone the repository
git clone https://github.com/openlibx402/openlibx402.git
cd openlibx402

# Navigate to a package
cd packages/go/openlibx402-core

# Install dependencies
go mod tidy

# Build and test
go build
go test ./...
```

## Verifying Installation

### Verify with Go

```bash
go list -m github.com/openlibx402/go/openlibx402-core
```

Output should show:
```
github.com/openlibx402/go/openlibx402-core v0.1.0
```

### Verify with pkg.go.dev

Visit: https://pkg.go.dev/github.com/openlibx402/go/openlibx402-core

## Import Statements

Once installed, you can import in your code:

```go
package main

import (
    "github.com/openlibx402/go/openlibx402-core"
    "github.com/openlibx402/go/openlibx402-client"
)
```

Or with aliases:

```go
import (
    nethttp "github.com/openlibx402/go/openlibx402-nethttp"
    echox402 "github.com/openlibx402/go/openlibx402-echo"
)
```

## Environment Setup

### For Server Development

Create a `.env` file:

```bash
# Your Solana wallet address
X402_PAYMENT_ADDRESS="YOUR_SOLANA_WALLET_ADDRESS"

# USDC token mint (devnet: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v)
X402_TOKEN_MINT="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"

# Network (solana-devnet, solana-mainnet)
X402_NETWORK="solana-devnet"

# RPC endpoint
X402_RPC_URL="https://api.devnet.solana.com"

# Server port
PORT=8080
```

Load in your code:

```go
import "os"

paymentAddress := os.Getenv("X402_PAYMENT_ADDRESS")
tokenMint := os.Getenv("X402_TOKEN_MINT")
```

### For Client Development

```bash
# Your wallet's private key (base58 encoded)
export X402_PRIVATE_KEY="your-base58-private-key"

# Optional: RPC endpoint
export X402_RPC_URL="https://api.devnet.solana.com"
```

## Getting Devnet Tokens

To test on Solana devnet:

1. Create a Solana wallet:
   ```bash
   solana-keygen new
   ```

2. Get devnet SOL:
   ```bash
   solana airdrop 2 $(solana address) --url devnet
   ```

3. Get devnet USDC:
   - Use [spl-token](https://spl.solana.com/token)
   - Or visit a devnet faucet

## Troubleshooting

### Module not found error

```
go: github.com/openlibx402/go/openlibx402-core@latest:
reading go.sum: no matching version found
```

**Solution**: Clear module cache and retry:
```bash
go clean -modcache
go get github.com/openlibx402/go/openlibx402-core@latest
```

### Version mismatch

```
different modules with the same import path
```

**Solution**: Ensure you're using the correct import path:
```bash
# Wrong (old path)
import "github.com/openlibx402/openlibx402/go/openlibx402-core"

# Correct (simplified path)
import "github.com/openlibx402/go/openlibx402-core"
```

### Missing Go version

**Solution**: Update Go:
```bash
# macOS with Homebrew
brew upgrade go

# Or download from https://golang.org/dl/
```

## Next Steps

After installation:

1. **Choose Your Path**:
   - [Server Quick Start](server-quickstart.md) - Build a payment-required API
   - [Client Quick Start](client-quickstart.md) - Build a payment client

2. **Explore Examples**:
   - [net/http Server Example](../examples/nethttp-server.md)
   - [Echo Server Example](../examples/echo-server.md)

3. **Learn More**:
   - [Core Library](../libraries/core.md)
   - [Client Library](../libraries/client.md)

## Support

- **Issues**: [GitHub Issues](https://github.com/openlibx402/openlibx402/issues)
- **Discussions**: [GitHub Discussions](https://github.com/openlibx402/openlibx402/discussions)
