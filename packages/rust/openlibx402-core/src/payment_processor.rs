use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    commitment_config::CommitmentConfig,
    instruction::Instruction,
    message::Message,
    pubkey::Pubkey,
    signature::{Keypair, Signature, Signer},
    transaction::Transaction,
};
use spl_token::instruction as token_instruction;
use spl_associated_token_account::{
    get_associated_token_address, instruction::create_associated_token_account,
};
use std::str::FromStr;

use crate::{
    errors::{X402Error, X402Result},
    models::{PaymentAuthorization, PaymentRequest},
};

/// Solana payment processor for handling blockchain operations
pub struct SolanaPaymentProcessor {
    rpc_client: RpcClient,
    #[allow(dead_code)]
    commitment: CommitmentConfig,
}

impl SolanaPaymentProcessor {
    /// Create a new Solana payment processor
    ///
    /// # Arguments
    /// * `rpc_url` - Solana RPC endpoint URL
    /// * `commitment` - Transaction commitment level (default: confirmed)
    pub fn new(rpc_url: &str, commitment: Option<CommitmentConfig>) -> Self {
        Self {
            rpc_client: RpcClient::new_with_commitment(
                rpc_url.to_string(),
                commitment.unwrap_or(CommitmentConfig::confirmed()),
            ),
            commitment: commitment.unwrap_or(CommitmentConfig::confirmed()),
        }
    }

    /// Get the default RPC URL for a network
    pub fn default_rpc_url(network: &str) -> &'static str {
        match network {
            "solana-mainnet" => "https://api.mainnet-beta.solana.com",
            "solana-devnet" => "https://api.devnet.solana.com",
            "solana-testnet" => "https://api.testnet.solana.com",
            _ => "https://api.devnet.solana.com",
        }
    }

    /// Create a payment from a payment request
    ///
    /// This creates, signs, and broadcasts a Solana SPL token transfer transaction
    pub async fn create_payment(
        &self,
        request: &PaymentRequest,
        payer: &Keypair,
    ) -> X402Result<PaymentAuthorization> {
        // Check if payment has expired
        if request.is_expired() {
            return Err(X402Error::PaymentExpired(format!(
                "Payment request expired at {}",
                request.expires_at
            )));
        }

        // Parse addresses
        let token_mint = Pubkey::from_str(&request.asset_address).map_err(|e| {
            X402Error::InvalidPaymentRequest(format!("Invalid token mint address: {}", e))
        })?;

        let recipient = Pubkey::from_str(&request.payment_address).map_err(|e| {
            X402Error::InvalidPaymentRequest(format!("Invalid payment address: {}", e))
        })?;

        let amount = Self::parse_amount(&request.max_amount_required)?;

        // Get or create associated token accounts
        let sender_ata = get_associated_token_address(&payer.pubkey(), &token_mint);
        let recipient_ata = get_associated_token_address(&recipient, &token_mint);

        // Check sender balance
        self.check_balance(&sender_ata, amount).await?;

        // Build transaction
        let mut instructions: Vec<Instruction> = Vec::new();

        // Check if recipient ATA exists, if not create it
        if !self.account_exists(&recipient_ata).await? {
            instructions.push(create_associated_token_account(
                &payer.pubkey(),
                &recipient,
                &token_mint,
                &spl_token::id(),
            ));
        }

        // Add transfer instruction
        instructions.push(
            token_instruction::transfer_checked(
                &spl_token::id(),
                &sender_ata,
                &token_mint,
                &recipient_ata,
                &payer.pubkey(),
                &[],
                amount,
                6, // USDC uses 6 decimals
            )
            .map_err(|e| {
                X402Error::Blockchain(format!("Failed to create transfer instruction: {}", e))
            })?,
        );

        // Get recent blockhash
        let recent_blockhash = self
            .rpc_client
            .get_latest_blockhash()
            .map_err(|e| X402Error::Network(format!("Failed to get recent blockhash: {}", e)))?;

        // Create and sign transaction
        let message = Message::new(&instructions, Some(&payer.pubkey()));
        let mut transaction = Transaction::new_unsigned(message);
        transaction.sign(&[payer], recent_blockhash);

        // Send transaction
        let signature = self
            .rpc_client
            .send_and_confirm_transaction(&transaction)
            .map_err(|e| {
                X402Error::TransactionBroadcast(format!("Failed to broadcast transaction: {}", e))
            })?;

        // Create payment authorization
        Ok(PaymentAuthorization::new(
            request.payment_id.clone(),
            request.max_amount_required.clone(),
            request.payment_address.clone(),
            request.asset_address.clone(),
            request.network.clone(),
            signature.to_string(),
            payer.pubkey().to_string(),
        ))
    }

    /// Verify a payment transaction
    ///
    /// This checks that the transaction exists on-chain and matches the expected parameters
    pub async fn verify_payment(
        &self,
        authorization: &PaymentAuthorization,
        expected_amount: &str,
    ) -> X402Result<bool> {
        let signature = Signature::from_str(&authorization.signature).map_err(|e| {
            X402Error::InvalidPaymentAuthorization(format!("Invalid signature: {}", e))
        })?;

        // Get transaction details
        let transaction = self
            .rpc_client
            .get_transaction(&signature, solana_transaction_status::UiTransactionEncoding::Json)
            .map_err(|e| {
                X402Error::PaymentVerification(format!("Failed to fetch transaction: {}", e))
            })?;

        // Verify transaction succeeded
        if transaction.transaction.meta.as_ref().and_then(|m| m.err.as_ref()).is_some() {
            return Err(X402Error::PaymentVerification(
                "Transaction failed on-chain".to_string(),
            ));
        }

        // Parse and verify amount
        let expected = Self::parse_amount(expected_amount)?;
        let actual = Self::parse_amount(&authorization.actual_amount)?;

        if actual < expected {
            return Err(X402Error::PaymentVerification(format!(
                "Payment amount {} is less than required {}",
                authorization.actual_amount, expected_amount
            )));
        }

        Ok(true)
    }

    /// Get token balance for an account
    pub async fn get_token_balance(&self, token_account: &Pubkey) -> X402Result<u64> {
        let balance = self
            .rpc_client
            .get_token_account_balance(token_account)
            .map_err(|e| X402Error::Network(format!("Failed to get token balance: {}", e)))?;

        balance
            .amount
            .parse::<u64>()
            .map_err(|e| X402Error::Blockchain(format!("Failed to parse balance: {}", e)))
    }

    /// Check if an account exists
    async fn account_exists(&self, account: &Pubkey) -> X402Result<bool> {
        match self.rpc_client.get_account(account) {
            Ok(_) => Ok(true),
            Err(e) => {
                // Account not found is not an error
                if e.to_string().contains("AccountNotFound") {
                    Ok(false)
                } else {
                    Err(X402Error::Network(format!(
                        "Failed to check account existence: {}",
                        e
                    )))
                }
            }
        }
    }

    /// Check if the sender has sufficient balance
    async fn check_balance(&self, token_account: &Pubkey, required_amount: u64) -> X402Result<()> {
        let balance = self.get_token_balance(token_account).await?;

        if balance < required_amount {
            return Err(X402Error::InsufficientFunds(format!(
                "Insufficient balance: {} required, {} available",
                required_amount, balance
            )));
        }

        Ok(())
    }

    /// Parse amount string to lamports (assumes 6 decimals for USDC)
    fn parse_amount(amount_str: &str) -> X402Result<u64> {
        let amount: f64 = amount_str.parse().map_err(|e| {
            X402Error::InvalidPaymentRequest(format!("Invalid amount format: {}", e))
        })?;

        // Convert to smallest unit (6 decimals for USDC)
        let lamports = (amount * 1_000_000.0) as u64;
        Ok(lamports)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_amount() {
        assert_eq!(SolanaPaymentProcessor::parse_amount("0.10").unwrap(), 100_000);
        assert_eq!(SolanaPaymentProcessor::parse_amount("1.0").unwrap(), 1_000_000);
        assert_eq!(
            SolanaPaymentProcessor::parse_amount("0.000001").unwrap(),
            1
        );
    }

    #[test]
    fn test_default_rpc_url() {
        assert_eq!(
            SolanaPaymentProcessor::default_rpc_url("solana-mainnet"),
            "https://api.mainnet-beta.solana.com"
        );
        assert_eq!(
            SolanaPaymentProcessor::default_rpc_url("solana-devnet"),
            "https://api.devnet.solana.com"
        );
    }
}
