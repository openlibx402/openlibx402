//! # OpenLibx402 Client
//!
//! HTTP client library for the X402 payment protocol with automatic payment handling.
//!
//! This library provides two client implementations:
//! - **X402Client**: Explicit control over payment flow
//! - **X402AutoClient**: Automatic payment handling
//!
//! ## Features
//!
//! - Automatic detection of 402 Payment Required responses
//! - Seamless payment creation and transaction broadcasting
//! - Configurable payment limits and retry behavior
//! - Support for GET and POST requests
//!
//! ## Example: Explicit Client
//!
//! ```rust,no_run
//! use openlibx402_client::X402Client;
//! use solana_sdk::signature::Keypair;
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     let keypair = Keypair::new(); // Load your keypair
//!     let client = X402Client::new(keypair, None);
//!
//!     // Make request
//!     let response = client.get("https://api.example.com/premium-data").await?;
//!
//!     // Check if payment is required
//!     if client.is_payment_required(&response) {
//!         // Parse payment request
//!         let payment_request = client.parse_payment_request(response).await?;
//!
//!         // Create payment
//!         let authorization = client.create_payment(&payment_request).await?;
//!
//!         // Retry with payment
//!         let response = client.get_with_auth(
//!             "https://api.example.com/premium-data",
//!             &authorization
//!         ).await?;
//!
//!         println!("Got data: {:?}", response.text().await?);
//!     }
//!
//!     Ok(())
//! }
//! ```
//!
//! ## Example: Auto Client
//!
//! ```rust,no_run
//! use openlibx402_client::{X402AutoClient, AutoClientOptions};
//! use solana_sdk::signature::Keypair;
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     let keypair = Keypair::new(); // Load your keypair
//!
//!     // Configure options
//!     let options = AutoClientOptions {
//!         max_payment_amount: "5.0".to_string(),
//!         auto_retry: true,
//!         max_retries: 3,
//!     };
//!
//!     let client = X402AutoClient::new(keypair, None, Some(options));
//!
//!     // Make request - payment is handled automatically!
//!     let response = client.get("https://api.example.com/premium-data").await?;
//!     println!("Got data: {:?}", response.text().await?);
//!
//!     Ok(())
//! }
//! ```

pub mod auto_client;
pub mod client;

// Re-export commonly used types
pub use auto_client::{AutoClientOptions, X402AutoClient};
pub use client::X402Client;

// Re-export core types for convenience
pub use openlibx402_core::{
    PaymentAuthorization, PaymentRequest, SolanaPaymentProcessor, X402Error, X402Result,
};

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
