//! # OpenLibx402 Rocket
//!
//! Rocket web framework integration for the X402 payment protocol.
//!
//! This library provides guards and utilities to protect Rocket endpoints
//! with payment requirements using the X402 protocol.
//!
//! ## Example
//!
//! ```rust,no_run
//! use rocket::{get, routes, State};
//! use openlibx402_rocket::{PaymentGuard, X402Config};
//!
//! #[get("/premium-data")]
//! fn premium_data(_auth: PaymentGuard) -> &'static str {
//!     "Premium content!"
//! }
//!
//! #[rocket::main]
//! async fn main() {
//!     let config = X402Config {
//!         payment_address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU".to_string(),
//!         token_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".to_string(),
//!         network: "solana-devnet".to_string(),
//!         rpc_url: None,
//!         auto_verify: true,
//!     };
//!
//!     rocket::build()
//!         .manage(config)
//!         .mount("/", routes![premium_data])
//!         .launch()
//!         .await
//!         .unwrap();
//! }
//! ```

use chrono::{Duration, Utc};
use openlibx402_core::{PaymentAuthorization, PaymentRequest, X402Error};
use rocket::{
    http::Status,
    request::{FromRequest, Outcome, Request},
    response::Responder,
    serde::json::Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Global X402 configuration
#[derive(Debug, Clone)]
pub struct X402Config {
    /// Wallet address to receive payments
    pub payment_address: String,

    /// SPL token mint address (USDC)
    pub token_mint: String,

    /// Solana network (e.g., "solana-devnet", "solana-mainnet")
    pub network: String,

    /// Optional custom RPC URL
    pub rpc_url: Option<String>,

    /// Whether to verify payments on-chain
    pub auto_verify: bool,
}

/// Payment requirement configuration for a specific endpoint
#[derive(Debug, Clone)]
pub struct PaymentRequirement {
    /// Amount required in USDC
    pub amount: String,

    /// Optional description
    pub description: Option<String>,

    /// Expiration time in seconds (default: 300)
    pub expires_in: i64,
}

impl PaymentRequirement {
    /// Create a new payment requirement
    pub fn new(amount: &str) -> Self {
        Self {
            amount: amount.to_string(),
            description: None,
            expires_in: 300,
        }
    }

    /// Set the description
    pub fn with_description(mut self, description: &str) -> Self {
        self.description = Some(description.to_string());
        self
    }

    /// Set the expiration time
    pub fn with_expires_in(mut self, seconds: i64) -> Self {
        self.expires_in = seconds;
        self
    }
}

/// Request guard that enforces payment requirements
pub struct PaymentGuard {
    pub authorization: PaymentAuthorization,
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for PaymentGuard {
    type Error = X402Error;

    async fn from_request(req: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        // Get payment authorization header
        let auth_header = match req.headers().get_one("X-Payment-Authorization") {
            Some(h) => h,
            None => {
                // No payment provided, return 402 with payment request
                return Outcome::Error((
                    Status::PaymentRequired,
                    X402Error::PaymentRequired("Payment authorization required".to_string()),
                ));
            }
        };

        // Parse authorization
        match PaymentAuthorization::from_header_value(auth_header) {
            Ok(auth) => {
                // TODO: Verify payment if auto_verify is enabled
                Outcome::Success(PaymentGuard { authorization: auth })
            }
            Err(e) => Outcome::Error((Status::BadRequest, e)),
        }
    }
}

/// Response type for 402 Payment Required
#[derive(Debug, Serialize, Deserialize)]
pub struct PaymentRequiredResponse {
    pub payment_request: PaymentRequest,
}

impl<'r, 'o: 'r> Responder<'r, 'o> for PaymentRequiredResponse {
    fn respond_to(self, req: &'r Request<'_>) -> rocket::response::Result<'o> {
        rocket::response::Response::build_from(Json(self.payment_request).respond_to(req)?)
            .status(Status::PaymentRequired)
            .ok()
    }
}

/// Create a payment request for an endpoint
pub fn create_payment_request(
    config: &X402Config,
    requirement: &PaymentRequirement,
    resource: &str,
) -> PaymentRequest {
    let expires_at = Utc::now() + Duration::seconds(requirement.expires_in);
    let payment_id = Uuid::new_v4().to_string();
    let nonce = Uuid::new_v4().to_string();

    let mut request = PaymentRequest::new(
        requirement.amount.clone(),
        config.token_mint.clone(),
        config.payment_address.clone(),
        config.network.clone(),
        expires_at,
        nonce,
        payment_id,
        resource.to_string(),
    );

    if let Some(desc) = &requirement.description {
        request = request.with_description(desc.clone());
    }

    request
}

/// Macro to create a payment-protected route handler
#[macro_export]
macro_rules! payment_required {
    ($amount:expr) => {
        $crate::PaymentRequirement::new($amount)
    };
    ($amount:expr, $description:expr) => {
        $crate::PaymentRequirement::new($amount).with_description($description)
    };
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_payment_requirement() {
        let req = PaymentRequirement::new("0.10")
            .with_description("Premium data access")
            .with_expires_in(600);

        assert_eq!(req.amount, "0.10");
        assert_eq!(req.description, Some("Premium data access".to_string()));
        assert_eq!(req.expires_in, 600);
    }

    #[test]
    fn test_create_payment_request() {
        let config = X402Config {
            payment_address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU".to_string(),
            token_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".to_string(),
            network: "solana-devnet".to_string(),
            rpc_url: None,
            auto_verify: false,
        };

        let requirement = PaymentRequirement::new("0.10");
        let request = create_payment_request(&config, &requirement, "/api/premium");

        assert_eq!(request.max_amount_required, "0.10");
        assert_eq!(request.payment_address, config.payment_address);
        assert_eq!(request.asset_address, config.token_mint);
    }
}
