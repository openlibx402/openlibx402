# Installation

This guide covers installing the OpenLibx402 Rust packages for your project.

## Prerequisites

- **Rust 1.70+** - [Install Rust](https://www.rust-lang.org/tools/install)
- **Cargo** - Comes with Rust installation
- **Solana Wallet** - For testing and production payments

## Quick Install

### For Server Projects

```bash
# Add core library
cargo add openlibx402-core

# Add framework integration
cargo add openlibx402-rocket
# OR
cargo add openlibx402-actix

# Add required dependencies
cargo add tokio --features full
cargo add serde --features derive
```

### For Client Projects

```bash
# Add core and client libraries
cargo add openlibx402-core
cargo add openlibx402-client

# Add required dependencies
cargo add tokio --features full
cargo add solana-sdk
```

## Cargo.toml Configuration

### Server Example (Rocket)

```toml
[package]
name = "my-x402-server"
version = "0.1.0"
edition = "2021"

[dependencies]
openlibx402-core = "0.1"
openlibx402-rocket = "0.1"
rocket = { version = "0.5", features = ["json"] }
tokio = { version = "1.35", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

### Server Example (Actix Web)

```toml
[package]
name = "my-x402-server"
version = "0.1.0"
edition = "2021"

[dependencies]
openlibx402-core = "0.1"
openlibx402-actix = "0.1"
actix-web = "4.4"
actix-rt = "2.9"
tokio = { version = "1.35", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

### Client Example

```toml
[package]
name = "my-x402-client"
version = "0.1.0"
edition = "2021"

[dependencies]
openlibx402-core = "0.1"
openlibx402-client = "0.1"
tokio = { version = "1.35", features = ["full"] }
solana-sdk = "2.0"
reqwest = "0.12"
```

## From Source

To build from source or contribute:

```bash
# Clone repository
git clone https://github.com/openlibx402/openlibx402.git
cd openlibx402/packages/rust

# Build all packages
cargo build --release

# Run tests
cargo test --workspace

# Build documentation
cargo doc --open
```

## Workspace Development

The Rust packages are organized as a Cargo workspace:

```
packages/rust/
├── Cargo.toml              # Workspace configuration
├── openlibx402-core/       # Core library
├── openlibx402-client/     # Client library
├── openlibx402-rocket/     # Rocket integration
└── openlibx402-actix/      # Actix Web integration
```

To work on multiple packages simultaneously:

```bash
cd packages/rust

# Build everything
cargo build

# Test everything
cargo test

# Build specific package
cargo build -p openlibx402-core

# Test specific package
cargo test -p openlibx402-client
```

## Setting Up Solana

### Install Solana CLI

```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

### Generate Keypair

For development and testing:

```bash
# Generate new keypair
solana-keygen new --outfile ~/.config/solana/devnet.json

# View public key
solana-keygen pubkey ~/.config/solana/devnet.json

# Set network to devnet
solana config set --url https://api.devnet.solana.com

# Airdrop SOL for gas fees
solana airdrop 2
```

### Get Test USDC

On devnet, you can mint test USDC or use a faucet.

## Environment Variables

Set up your environment:

```bash
# Add to ~/.bashrc or ~/.zshrc
export SOLANA_KEYPAIR="$HOME/.config/solana/devnet.json"
export X402_PAYMENT_ADDRESS="YOUR_WALLET_ADDRESS"
export X402_TOKEN_MINT="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"  # USDC Devnet
export X402_NETWORK="solana-devnet"
export X402_RPC_URL="https://api.devnet.solana.com"
```

## Verify Installation

Create a simple test file:

```rust
// test_installation.rs
use openlibx402_core::{PaymentRequest, X402Error};

fn main() -> Result<(), X402Error> {
    println!("OpenLibx402 Rust SDK installed successfully!");
    println!("Version: {}", openlibx402_core::VERSION);
    Ok(())
}
```

Run it:

```bash
cargo run
```

## Next Steps

- [Server Quick Start](server-quickstart.md) - Build your first X402 server
- [Client Quick Start](client-quickstart.md) - Build your first X402 client
- [Core Library](../libraries/core.md) - Learn about core types and functions

## Troubleshooting

### Compilation Errors

If you encounter compilation errors:

```bash
# Update Rust
rustup update

# Clean build cache
cargo clean

# Rebuild
cargo build
```

### Dependency Conflicts

If you have dependency conflicts:

```bash
# Update dependencies
cargo update

# Check for outdated dependencies
cargo outdated
```

### Solana SDK Issues

If Solana SDK installation fails:

```bash
# Use specific version
cargo add solana-sdk@2.0
cargo add solana-client@2.0
```

## Support

Need help? Check:
- [Rust Documentation](https://doc.rust-lang.org/)
- [Cargo Book](https://doc.rust-lang.org/cargo/)
- [GitHub Issues](https://github.com/openlibx402/openlibx402/issues)
