//! # OpenLibx402 Core
//!
//! Core library for the X402 payment protocol with Solana blockchain integration.
//!
//! This library provides the fundamental types, error handling, and payment processing
//! capabilities for implementing the X402 protocol - an open standard enabling AI agents
//! to autonomously pay for API access using Solana blockchain micropayments.
//!
//! ## Features
//!
//! - **Payment Models**: `PaymentRequest` and `PaymentAuthorization` for structured payment flow
//! - **Error Handling**: Comprehensive error types for all X402 operations
//! - **Solana Integration**: `SolanaPaymentProcessor` for blockchain transactions
//! - **Serialization**: Base64-encoded JSON for HTTP headers
//!
//! ## Example
//!
//! ```rust,no_run
//! use openlibx402_core::{PaymentRequest, SolanaPaymentProcessor};
//! use solana_sdk::signature::Keypair;
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     // Parse payment request from API response
//!     let payment_request = PaymentRequest::from_json(r#"{
//!         "max_amount_required": "0.10",
//!         "asset_type": "SPL",
//!         "asset_address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
//!         "payment_address": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
//!         "network": "solana-devnet",
//!         "expires_at": "2025-10-31T12:00:00Z",
//!         "nonce": "abc123",
//!         "payment_id": "pay_123",
//!         "resource": "/api/premium-data"
//!     }"#)?;
//!
//!     // Create payment processor
//!     let processor = SolanaPaymentProcessor::new(
//!         "https://api.devnet.solana.com",
//!         None
//!     );
//!
//!     // Create and send payment
//!     let keypair = Keypair::new(); // Use your actual keypair
//!     let authorization = processor.create_payment(&payment_request, &keypair).await?;
//!
//!     // Use authorization in retry request
//!     let header_value = authorization.to_header_value()?;
//!     println!("X-Payment-Authorization: {}", header_value);
//!
//!     Ok(())
//! }
//! ```

pub mod errors;
pub mod models;
pub mod payment_processor;

// Re-export commonly used types
pub use errors::{X402Error, X402Result};
pub use models::{PaymentAuthorization, PaymentRequest};
pub use payment_processor::SolanaPaymentProcessor;

/// Library version
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_version() {
        assert!(!VERSION.is_empty());
    }
}
