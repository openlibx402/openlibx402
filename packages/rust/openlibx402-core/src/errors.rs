use serde::{Deserialize, Serialize};
use thiserror::Error;

/// Base error type for all X402 operations
#[derive(Debug, Error, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "details")]
pub enum X402Error {
    #[error("Payment required: {0}")]
    PaymentRequired(String),

    #[error("Payment expired: {0}")]
    PaymentExpired(String),

    #[error("Insufficient funds: {0}")]
    InsufficientFunds(String),

    #[error("Payment verification failed: {0}")]
    PaymentVerification(String),

    #[error("Transaction broadcast failed: {0}")]
    TransactionBroadcast(String),

    #[error("Invalid payment request: {0}")]
    InvalidPaymentRequest(String),

    #[error("Invalid payment authorization: {0}")]
    InvalidPaymentAuthorization(String),

    #[error("Configuration error: {0}")]
    Configuration(String),

    #[error("Network error: {0}")]
    Network(String),

    #[error("Blockchain error: {0}")]
    Blockchain(String),

    #[error("Serialization error: {0}")]
    Serialization(String),
}

impl X402Error {
    /// Get the error code for this error type
    pub fn code(&self) -> &'static str {
        match self {
            X402Error::PaymentRequired(_) => "PAYMENT_REQUIRED",
            X402Error::PaymentExpired(_) => "PAYMENT_EXPIRED",
            X402Error::InsufficientFunds(_) => "INSUFFICIENT_FUNDS",
            X402Error::PaymentVerification(_) => "PAYMENT_VERIFICATION_FAILED",
            X402Error::TransactionBroadcast(_) => "TRANSACTION_BROADCAST_FAILED",
            X402Error::InvalidPaymentRequest(_) => "INVALID_PAYMENT_REQUEST",
            X402Error::InvalidPaymentAuthorization(_) => "INVALID_PAYMENT_AUTHORIZATION",
            X402Error::Configuration(_) => "CONFIGURATION_ERROR",
            X402Error::Network(_) => "NETWORK_ERROR",
            X402Error::Blockchain(_) => "BLOCKCHAIN_ERROR",
            X402Error::Serialization(_) => "SERIALIZATION_ERROR",
        }
    }

    /// Get the error message
    pub fn message(&self) -> String {
        self.to_string()
    }
}

/// Result type alias for X402 operations
pub type X402Result<T> = Result<T, X402Error>;

// Implement From conversions for common error types
impl From<serde_json::Error> for X402Error {
    fn from(err: serde_json::Error) -> Self {
        X402Error::Serialization(err.to_string())
    }
}

impl From<base64::DecodeError> for X402Error {
    fn from(err: base64::DecodeError) -> Self {
        X402Error::Serialization(format!("Base64 decode error: {}", err))
    }
}

impl From<solana_sdk::signer::SignerError> for X402Error {
    fn from(err: solana_sdk::signer::SignerError) -> Self {
        X402Error::Blockchain(format!("Signer error: {}", err))
    }
}

impl From<solana_client::client_error::ClientError> for X402Error {
    fn from(err: solana_client::client_error::ClientError) -> Self {
        X402Error::Blockchain(format!("Solana client error: {}", err))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_codes() {
        assert_eq!(
            X402Error::PaymentRequired("test".to_string()).code(),
            "PAYMENT_REQUIRED"
        );
        assert_eq!(
            X402Error::PaymentExpired("test".to_string()).code(),
            "PAYMENT_EXPIRED"
        );
        assert_eq!(
            X402Error::InsufficientFunds("test".to_string()).code(),
            "INSUFFICIENT_FUNDS"
        );
    }

    #[test]
    fn test_error_serialization() {
        let error = X402Error::PaymentRequired("Test payment required".to_string());
        let json = serde_json::to_string(&error).unwrap();
        let deserialized: X402Error = serde_json::from_str(&json).unwrap();
        assert_eq!(error.code(), deserialized.code());
    }
}
