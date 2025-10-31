//! # OpenLibx402 Actix Web
//!
//! Actix Web framework integration for the X402 payment protocol.
//!
//! This library provides middleware and extractors to protect Actix Web endpoints
//! with payment requirements using the X402 protocol.
//!
//! ## Example
//!
//! ```rust,no_run
//! use actix_web::{web, App, HttpResponse, HttpServer};
//! use openlibx402_actix::{PaymentExtractor, X402Config, X402State};
//!
//! async fn premium_data(auth: PaymentExtractor) -> HttpResponse {
//!     HttpResponse::Ok().json(serde_json::json!({
//!         "message": "Premium content!",
//!         "payment_id": auth.authorization.payment_id
//!     }))
//! }
//!
//! #[actix_web::main]
//! async fn main() -> std::io::Result<()> {
//!     let config = X402Config {
//!         payment_address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU".to_string(),
//!         token_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".to_string(),
//!         network: "solana-devnet".to_string(),
//!         rpc_url: None,
//!         auto_verify: true,
//!     };
//!
//!     HttpServer::new(move || {
//!         App::new()
//!             .app_data(web::Data::new(X402State { config: config.clone() }))
//!             .route("/premium", web::get().to(premium_data))
//!     })
//!     .bind(("127.0.0.1", 8080))?
//!     .run()
//!     .await
//! }
//! ```

use actix_web::{
    dev::Payload, error::ResponseError, http::StatusCode, Error, FromRequest, HttpRequest,
    HttpResponse,
};
use chrono::{Duration, Utc};
use openlibx402_core::{PaymentAuthorization, PaymentRequest};
use std::future::{ready, Ready};
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

/// Application state containing X402 configuration
#[derive(Debug, Clone)]
pub struct X402State {
    pub config: X402Config,
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

/// Extractor that enforces payment requirements
pub struct PaymentExtractor {
    pub authorization: PaymentAuthorization,
}

impl FromRequest for PaymentExtractor {
    type Error = Error;
    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(req: &HttpRequest, _payload: &mut Payload) -> Self::Future {
        // Get payment authorization header
        let auth_header = match req.headers().get("X-Payment-Authorization") {
            Some(h) => match h.to_str() {
                Ok(s) => s,
                Err(_) => {
                    return ready(Err(PaymentError::InvalidHeader.into()));
                }
            },
            None => {
                return ready(Err(PaymentError::Required.into()));
            }
        };

        // Parse authorization
        match PaymentAuthorization::from_header_value(auth_header) {
            Ok(auth) => {
                // TODO: Verify payment if auto_verify is enabled
                ready(Ok(PaymentExtractor { authorization: auth }))
            }
            Err(e) => ready(Err(PaymentError::InvalidAuthorization(e.to_string()).into())),
        }
    }
}

/// Error type for payment operations
#[derive(Debug)]
pub enum PaymentError {
    Required,
    InvalidHeader,
    InvalidAuthorization(String),
}

impl std::fmt::Display for PaymentError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PaymentError::Required => write!(f, "Payment required"),
            PaymentError::InvalidHeader => write!(f, "Invalid authorization header"),
            PaymentError::InvalidAuthorization(msg) => {
                write!(f, "Invalid payment authorization: {}", msg)
            }
        }
    }
}

impl ResponseError for PaymentError {
    fn status_code(&self) -> StatusCode {
        match self {
            PaymentError::Required => StatusCode::PAYMENT_REQUIRED,
            PaymentError::InvalidHeader | PaymentError::InvalidAuthorization(_) => {
                StatusCode::BAD_REQUEST
            }
        }
    }

    fn error_response(&self) -> HttpResponse {
        match self {
            PaymentError::Required => {
                HttpResponse::PaymentRequired().json(serde_json::json!({
                    "error": "Payment required",
                    "message": "This endpoint requires payment"
                }))
            }
            _ => HttpResponse::BadRequest().json(serde_json::json!({
                "error": self.to_string()
            })),
        }
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

/// Helper function to create a 402 Payment Required response
pub fn payment_required_response(payment_request: PaymentRequest) -> HttpResponse {
    HttpResponse::PaymentRequired().json(payment_request)
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
