use base64::{engine::general_purpose, Engine as _};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::errors::{X402Error, X402Result};

/// Payment request received from server in 402 response
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PaymentRequest {
    /// Maximum amount required in USDC (e.g., "0.10")
    pub max_amount_required: String,

    /// Type of asset (e.g., "SPL" for Solana Program Library tokens)
    pub asset_type: String,

    /// Token mint address (USDC address on Solana)
    pub asset_address: String,

    /// Recipient wallet address for payment
    pub payment_address: String,

    /// Network identifier (e.g., "solana-devnet", "solana-mainnet")
    pub network: String,

    /// Expiration timestamp (ISO 8601 format)
    pub expires_at: DateTime<Utc>,

    /// Nonce for replay protection
    pub nonce: String,

    /// Unique payment identifier
    pub payment_id: String,

    /// API endpoint/resource being accessed
    pub resource: String,

    /// Human-readable description (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

impl PaymentRequest {
    /// Create a new payment request
    pub fn new(
        max_amount_required: String,
        asset_address: String,
        payment_address: String,
        network: String,
        expires_at: DateTime<Utc>,
        nonce: String,
        payment_id: String,
        resource: String,
    ) -> Self {
        Self {
            max_amount_required,
            asset_type: "SPL".to_string(),
            asset_address,
            payment_address,
            network,
            expires_at,
            nonce,
            payment_id,
            resource,
            description: None,
        }
    }

    /// Set the description
    pub fn with_description(mut self, description: String) -> Self {
        self.description = Some(description);
        self
    }

    /// Check if the payment request has expired
    pub fn is_expired(&self) -> bool {
        Utc::now() > self.expires_at
    }

    /// Parse payment request from JSON string
    pub fn from_json(json: &str) -> X402Result<Self> {
        serde_json::from_str(json).map_err(|e| {
            X402Error::InvalidPaymentRequest(format!("Failed to parse payment request: {}", e))
        })
    }

    /// Convert payment request to JSON string
    pub fn to_json(&self) -> X402Result<String> {
        serde_json::to_string(self).map_err(|e| {
            X402Error::Serialization(format!("Failed to serialize payment request: {}", e))
        })
    }

    /// Encode payment request as base64 JSON
    pub fn to_base64(&self) -> X402Result<String> {
        let json = self.to_json()?;
        Ok(general_purpose::STANDARD.encode(json.as_bytes()))
    }

    /// Decode payment request from base64 JSON
    pub fn from_base64(encoded: &str) -> X402Result<Self> {
        let decoded = general_purpose::STANDARD.decode(encoded)?;
        let json = String::from_utf8(decoded).map_err(|e| {
            X402Error::InvalidPaymentRequest(format!("Invalid UTF-8 in base64 data: {}", e))
        })?;
        Self::from_json(&json)
    }
}

/// Payment authorization sent with retry request
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PaymentAuthorization {
    /// Payment ID from the original request
    pub payment_id: String,

    /// Actual amount paid in USDC (e.g., "0.10")
    pub actual_amount: String,

    /// Recipient wallet address
    pub payment_address: String,

    /// Token mint address
    pub asset_address: String,

    /// Network identifier
    pub network: String,

    /// Timestamp when payment was authorized
    pub timestamp: DateTime<Utc>,

    /// Solana transaction signature
    pub signature: String,

    /// Payer's public key
    pub public_key: String,

    /// On-chain transaction hash (optional, may be same as signature)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub transaction_hash: Option<String>,
}

impl PaymentAuthorization {
    /// Create a new payment authorization
    pub fn new(
        payment_id: String,
        actual_amount: String,
        payment_address: String,
        asset_address: String,
        network: String,
        signature: String,
        public_key: String,
    ) -> Self {
        Self {
            payment_id,
            actual_amount,
            payment_address,
            asset_address,
            network,
            timestamp: Utc::now(),
            signature: signature.clone(),
            public_key,
            transaction_hash: Some(signature),
        }
    }

    /// Parse payment authorization from JSON string
    pub fn from_json(json: &str) -> X402Result<Self> {
        serde_json::from_str(json).map_err(|e| {
            X402Error::InvalidPaymentAuthorization(format!(
                "Failed to parse payment authorization: {}",
                e
            ))
        })
    }

    /// Convert payment authorization to JSON string
    pub fn to_json(&self) -> X402Result<String> {
        serde_json::to_string(self).map_err(|e| {
            X402Error::Serialization(format!("Failed to serialize payment authorization: {}", e))
        })
    }

    /// Encode payment authorization as base64 JSON for X-Payment-Authorization header
    pub fn to_header_value(&self) -> X402Result<String> {
        let json = self.to_json()?;
        Ok(general_purpose::STANDARD.encode(json.as_bytes()))
    }

    /// Decode payment authorization from X-Payment-Authorization header value
    pub fn from_header_value(encoded: &str) -> X402Result<Self> {
        let decoded = general_purpose::STANDARD.decode(encoded)?;
        let json = String::from_utf8(decoded).map_err(|e| {
            X402Error::InvalidPaymentAuthorization(format!("Invalid UTF-8 in header: {}", e))
        })?;
        Self::from_json(&json)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Duration;

    #[test]
    fn test_payment_request_serialization() {
        let expires_at = Utc::now() + Duration::seconds(300);
        let request = PaymentRequest::new(
            "0.10".to_string(),
            "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".to_string(),
            "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU".to_string(),
            "solana-devnet".to_string(),
            expires_at,
            "nonce123".to_string(),
            "payment123".to_string(),
            "/api/premium-data".to_string(),
        )
        .with_description("Access premium data".to_string());

        let json = request.to_json().unwrap();
        let deserialized = PaymentRequest::from_json(&json).unwrap();
        assert_eq!(request, deserialized);
    }

    #[test]
    fn test_payment_request_base64() {
        let expires_at = Utc::now() + Duration::seconds(300);
        let request = PaymentRequest::new(
            "0.10".to_string(),
            "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".to_string(),
            "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU".to_string(),
            "solana-devnet".to_string(),
            expires_at,
            "nonce123".to_string(),
            "payment123".to_string(),
            "/api/premium-data".to_string(),
        );

        let encoded = request.to_base64().unwrap();
        let decoded = PaymentRequest::from_base64(&encoded).unwrap();
        assert_eq!(request, decoded);
    }

    #[test]
    fn test_payment_request_expiration() {
        let past = Utc::now() - Duration::seconds(10);
        let request = PaymentRequest::new(
            "0.10".to_string(),
            "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".to_string(),
            "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU".to_string(),
            "solana-devnet".to_string(),
            past,
            "nonce123".to_string(),
            "payment123".to_string(),
            "/api/premium-data".to_string(),
        );

        assert!(request.is_expired());

        let future = Utc::now() + Duration::seconds(300);
        let request2 = PaymentRequest::new(
            "0.10".to_string(),
            "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".to_string(),
            "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU".to_string(),
            "solana-devnet".to_string(),
            future,
            "nonce123".to_string(),
            "payment123".to_string(),
            "/api/premium-data".to_string(),
        );

        assert!(!request2.is_expired());
    }

    #[test]
    fn test_payment_authorization_header() {
        let auth = PaymentAuthorization::new(
            "payment123".to_string(),
            "0.10".to_string(),
            "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU".to_string(),
            "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".to_string(),
            "solana-devnet".to_string(),
            "5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW".to_string(),
            "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU".to_string(),
        );

        let header = auth.to_header_value().unwrap();
        let decoded = PaymentAuthorization::from_header_value(&header).unwrap();

        assert_eq!(auth.payment_id, decoded.payment_id);
        assert_eq!(auth.signature, decoded.signature);
        assert_eq!(auth.public_key, decoded.public_key);
    }
}
