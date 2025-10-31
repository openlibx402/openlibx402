use openlibx402_core::{PaymentRequest, X402Error, X402Result};
use reqwest::{Response, StatusCode};
use solana_sdk::signature::Keypair;

use crate::client::X402Client;

/// Configuration options for the auto client
#[derive(Debug, Clone)]
pub struct AutoClientOptions {
    /// Maximum amount willing to pay automatically (in USDC)
    pub max_payment_amount: String,

    /// Whether to automatically retry after payment
    pub auto_retry: bool,

    /// Maximum number of retry attempts
    pub max_retries: u32,
}

impl Default for AutoClientOptions {
    fn default() -> Self {
        Self {
            max_payment_amount: "10.0".to_string(),
            auto_retry: true,
            max_retries: 3,
        }
    }
}

/// X402 HTTP client with automatic payment handling
///
/// This client automatically detects 402 Payment Required responses,
/// creates and sends payments, and retries the original request.
pub struct X402AutoClient {
    client: X402Client,
    options: AutoClientOptions,
}

impl X402AutoClient {
    /// Create a new auto client
    ///
    /// # Arguments
    /// * `keypair` - Solana keypair for signing transactions
    /// * `rpc_url` - Optional Solana RPC URL (defaults to devnet)
    /// * `options` - Optional configuration (uses defaults if None)
    pub fn new(
        keypair: Keypair,
        rpc_url: Option<&str>,
        options: Option<AutoClientOptions>,
    ) -> Self {
        Self {
            client: X402Client::new(keypair, rpc_url),
            options: options.unwrap_or_default(),
        }
    }

    /// Make a GET request with automatic payment handling
    pub async fn get(&self, url: &str) -> X402Result<Response> {
        self.request("GET", url, None).await
    }

    /// Make a POST request with automatic payment handling
    pub async fn post(&self, url: &str, body: Option<String>) -> X402Result<Response> {
        self.request("POST", url, body).await
    }

    /// Make an HTTP request with automatic payment handling
    async fn request(&self, method: &str, url: &str, body: Option<String>) -> X402Result<Response> {
        let mut retries = 0;

        loop {
            // Make initial request
            let response = match method {
                "GET" => self.client.get(url).await?,
                "POST" => self.client.post(url, body.clone()).await?,
                _ => {
                    return Err(X402Error::Configuration(format!(
                        "Unsupported HTTP method: {}",
                        method
                    )))
                }
            };

            // Check if payment is required
            if response.status() == StatusCode::PAYMENT_REQUIRED {
                // Check retry limit
                if retries >= self.options.max_retries {
                    return Err(X402Error::PaymentRequired(
                        "Maximum retry attempts reached".to_string(),
                    ));
                }
                retries += 1;

                // Parse payment request
                let payment_request = self.client.parse_payment_request(response).await?;

                // Check if amount is acceptable
                self.check_payment_amount(&payment_request)?;

                // Create and send payment
                let authorization = self.client.create_payment(&payment_request).await?;

                // Retry request with payment authorization
                let retry_response = match method {
                    "GET" => self.client.get_with_auth(url, &authorization).await?,
                    "POST" => {
                        self.client
                            .post_with_auth(url, body.clone(), &authorization)
                            .await?
                    }
                    _ => unreachable!(),
                };

                // Check if retry was successful
                if retry_response.status().is_success() {
                    return Ok(retry_response);
                }

                // If still getting 402, continue loop
                if retry_response.status() == StatusCode::PAYMENT_REQUIRED {
                    continue;
                }

                // Return other error responses
                return Ok(retry_response);
            }

            // Return successful or non-402 error responses
            return Ok(response);
        }
    }

    /// Check if the payment amount is acceptable
    fn check_payment_amount(&self, request: &PaymentRequest) -> X402Result<()> {
        let max_amount: f64 = self.options.max_payment_amount.parse().map_err(|e| {
            X402Error::Configuration(format!("Invalid max_payment_amount: {}", e))
        })?;

        let required_amount: f64 = request.max_amount_required.parse().map_err(|e| {
            X402Error::InvalidPaymentRequest(format!("Invalid payment amount: {}", e))
        })?;

        if required_amount > max_amount {
            return Err(X402Error::PaymentRequired(format!(
                "Payment amount {} exceeds maximum allowed amount {}",
                required_amount, max_amount
            )));
        }

        Ok(())
    }

    /// Get the underlying client for manual operations
    pub fn client(&self) -> &X402Client {
        &self.client
    }

    /// Get the client options
    pub fn options(&self) -> &AutoClientOptions {
        &self.options
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_auto_client_creation() {
        let keypair = Keypair::new();
        let client = X402AutoClient::new(keypair, None, None);
        assert_eq!(client.options().max_payment_amount, "10.0");
        assert!(client.options().auto_retry);
    }

    #[test]
    fn test_custom_options() {
        let keypair = Keypair::new();
        let options = AutoClientOptions {
            max_payment_amount: "5.0".to_string(),
            auto_retry: false,
            max_retries: 1,
        };
        let client = X402AutoClient::new(keypair, None, Some(options));
        assert_eq!(client.options().max_payment_amount, "5.0");
        assert!(!client.options().auto_retry);
    }
}
