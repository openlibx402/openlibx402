use openlibx402_core::{
    PaymentAuthorization, PaymentRequest, SolanaPaymentProcessor, X402Error, X402Result,
};
use reqwest::{Client, Response, StatusCode};
use solana_sdk::signature::Keypair;

/// X402 HTTP client with explicit payment control
///
/// This client provides full control over the payment flow, allowing you to
/// decide when and how to handle payment requests.
pub struct X402Client {
    http_client: Client,
    payment_processor: SolanaPaymentProcessor,
    keypair: Keypair,
}

impl X402Client {
    /// Create a new X402 client
    ///
    /// # Arguments
    /// * `keypair` - Solana keypair for signing transactions
    /// * `rpc_url` - Optional Solana RPC URL (defaults to devnet)
    pub fn new(keypair: Keypair, rpc_url: Option<&str>) -> Self {
        let rpc_url = rpc_url.unwrap_or("https://api.devnet.solana.com");
        Self {
            http_client: Client::new(),
            payment_processor: SolanaPaymentProcessor::new(rpc_url, None),
            keypair,
        }
    }

    /// Make a GET request
    pub async fn get(&self, url: &str) -> X402Result<Response> {
        self.request("GET", url, None, None).await
    }

    /// Make a GET request with payment authorization
    pub async fn get_with_auth(
        &self,
        url: &str,
        authorization: &PaymentAuthorization,
    ) -> X402Result<Response> {
        self.request("GET", url, None, Some(authorization)).await
    }

    /// Make a POST request
    pub async fn post(&self, url: &str, body: Option<String>) -> X402Result<Response> {
        self.request("POST", url, body, None).await
    }

    /// Make a POST request with payment authorization
    pub async fn post_with_auth(
        &self,
        url: &str,
        body: Option<String>,
        authorization: &PaymentAuthorization,
    ) -> X402Result<Response> {
        self.request("POST", url, body, Some(authorization)).await
    }

    /// Make an HTTP request
    async fn request(
        &self,
        method: &str,
        url: &str,
        body: Option<String>,
        authorization: Option<&PaymentAuthorization>,
    ) -> X402Result<Response> {
        let mut request = match method {
            "GET" => self.http_client.get(url),
            "POST" => {
                let mut req = self.http_client.post(url);
                if let Some(b) = body {
                    req = req.body(b).header("Content-Type", "application/json");
                }
                req
            }
            _ => {
                return Err(X402Error::Configuration(format!(
                    "Unsupported HTTP method: {}",
                    method
                )))
            }
        };

        // Add payment authorization header if provided
        if let Some(auth) = authorization {
            let header_value = auth.to_header_value()?;
            request = request.header("X-Payment-Authorization", header_value);
        }

        // Send request
        let response = request.send().await.map_err(|e| {
            X402Error::Network(format!("HTTP request failed: {}", e))
        })?;

        Ok(response)
    }

    /// Check if a response requires payment (402 status code)
    pub fn is_payment_required(&self, response: &Response) -> bool {
        response.status() == StatusCode::PAYMENT_REQUIRED
    }

    /// Parse payment request from 402 response
    pub async fn parse_payment_request(&self, response: Response) -> X402Result<PaymentRequest> {
        if !self.is_payment_required(&response) {
            return Err(X402Error::InvalidPaymentRequest(format!(
                "Response status is not 402, got {}",
                response.status()
            )));
        }

        // Get payment request from response body
        let body = response.text().await.map_err(|e| {
            X402Error::Network(format!("Failed to read response body: {}", e))
        })?;

        PaymentRequest::from_json(&body)
    }

    /// Create a payment from a payment request
    ///
    /// This creates, signs, and broadcasts the payment transaction
    pub async fn create_payment(
        &self,
        request: &PaymentRequest,
    ) -> X402Result<PaymentAuthorization> {
        self.payment_processor
            .create_payment(request, &self.keypair)
            .await
    }

    /// Verify a payment authorization
    pub async fn verify_payment(
        &self,
        authorization: &PaymentAuthorization,
        expected_amount: &str,
    ) -> X402Result<bool> {
        self.payment_processor
            .verify_payment(authorization, expected_amount)
            .await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_client_creation() {
        let keypair = Keypair::new();
        let client = X402Client::new(keypair, None);
        assert!(true); // Just verify it compiles
    }
}
