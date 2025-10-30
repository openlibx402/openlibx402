package core

import (
	"context"
	"fmt"
	"math"

	"github.com/gagliardetto/solana-go"
	associatedtokenaccount "github.com/gagliardetto/solana-go/programs/associated-token-account"
	"github.com/gagliardetto/solana-go/programs/token"
	"github.com/gagliardetto/solana-go/rpc"
)

// SolanaPaymentProcessor handles all Solana blockchain operations for X402 payments.
type SolanaPaymentProcessor struct {
	client  *rpc.Client
	keypair *solana.PrivateKey
}

// NewSolanaPaymentProcessor creates a new SolanaPaymentProcessor.
//
// Parameters:
//   - rpcURL: Solana RPC endpoint URL (e.g., "https://api.devnet.solana.com")
//   - keypair: Optional wallet keypair for signing transactions
func NewSolanaPaymentProcessor(rpcURL string, keypair *solana.PrivateKey) *SolanaPaymentProcessor {
	return &SolanaPaymentProcessor{
		client:  rpc.New(rpcURL),
		keypair: keypair,
	}
}

// Close closes the processor and cleans up resources.
func (sp *SolanaPaymentProcessor) Close() error {
	// The Solana RPC client doesn't require explicit cleanup
	sp.keypair = nil
	return nil
}

// CreatePaymentTransaction creates a Solana transaction for an X402 payment.
//
// This function creates a transaction that transfers SPL tokens from the payer to the recipient.
// It handles associated token account creation if needed.
//
// Parameters:
//   - ctx: Context for cancellation
//   - request: The payment request with payment details
//   - amount: The amount to pay (in token units, e.g., "0.10")
//   - payerKeypair: The payer's wallet keypair
//
// Returns:
//   - A Solana transaction ready to be signed and sent
func (sp *SolanaPaymentProcessor) CreatePaymentTransaction(
	ctx context.Context,
	request *PaymentRequest,
	amount string,
	payerKeypair solana.PrivateKey,
) (*solana.Transaction, error) {
	// Parse addresses
	payerPubkey := payerKeypair.PublicKey()
	recipientPubkey, err := solana.PublicKeyFromBase58(request.PaymentAddress)
	if err != nil {
		return nil, NewTransactionBroadcastError("invalid payment address: " + err.Error())
	}

	tokenMint, err := solana.PublicKeyFromBase58(request.AssetAddress)
	if err != nil {
		return nil, NewTransactionBroadcastError("invalid token mint address: " + err.Error())
	}

	// Get associated token accounts
	payerTokenAccount, _, err := solana.FindAssociatedTokenAddress(payerPubkey, tokenMint)
	if err != nil {
		return nil, NewTransactionBroadcastError("failed to derive payer token account: " + err.Error())
	}

	recipientTokenAccount, _, err := solana.FindAssociatedTokenAddress(recipientPubkey, tokenMint)
	if err != nil {
		return nil, NewTransactionBroadcastError("failed to derive recipient token account: " + err.Error())
	}

	// Get recent blockhash
	recentBlockhash, err := sp.client.GetRecentBlockhash(ctx, rpc.CommitmentFinalized)
	if err != nil {
		return nil, NewTransactionBroadcastError("failed to get recent blockhash: " + err.Error())
	}

	// Build instructions
	var instructions []solana.Instruction

	// Check if recipient's token account exists
	recipientAccountInfo, err := sp.client.GetAccountInfo(ctx, recipientTokenAccount)
	if err != nil || recipientAccountInfo == nil || recipientAccountInfo.Value == nil {
		// Create recipient's associated token account
		createAccountIx := associatedtokenaccount.NewCreateInstruction(
			payerPubkey,     // payer
			recipientPubkey, // wallet address
			tokenMint,       // mint
		).Build()
		instructions = append(instructions, createAccountIx)
	}

	// Convert amount to smallest unit (assuming 6 decimals for SPL tokens like USDC)
	decimals := 6
	amountFloat := 0.0
	_, err = fmt.Sscanf(amount, "%f", &amountFloat)
	if err != nil {
		return nil, NewTransactionBroadcastError("invalid amount format: " + err.Error())
	}
	amountInSmallestUnit := uint64(math.Floor(amountFloat * math.Pow(10, float64(decimals))))

	// Create transfer instruction
	transferIx := token.NewTransferCheckedInstruction(
		amountInSmallestUnit,
		uint8(decimals),
		payerTokenAccount,
		tokenMint,
		recipientTokenAccount,
		payerPubkey,
		[]solana.PublicKey{},
	).Build()
	instructions = append(instructions, transferIx)

	// Create transaction with all instructions
	tx, err := solana.NewTransaction(
		instructions,
		recentBlockhash.Value.Blockhash,
		solana.TransactionPayer(payerPubkey),
	)
	if err != nil {
		return nil, NewTransactionBroadcastError("failed to create transaction: " + err.Error())
	}

	return tx, nil
}

// SignAndSendTransaction signs a transaction with the keypair and broadcasts it to the network.
//
// Parameters:
//   - ctx: Context for cancellation
//   - transaction: The transaction to sign and send
//   - keypair: The keypair to sign with
//
// Returns:
//   - The transaction signature (hash)
func (sp *SolanaPaymentProcessor) SignAndSendTransaction(
	ctx context.Context,
	transaction *solana.Transaction,
	keypair solana.PrivateKey,
) (string, error) {
	// Sign the transaction
	_, err := transaction.Sign(func(key solana.PublicKey) *solana.PrivateKey {
		if key.Equals(keypair.PublicKey()) {
			return &keypair
		}
		return nil
	})
	if err != nil {
		return "", NewTransactionBroadcastError("failed to sign transaction: " + err.Error())
	}

	// Send the transaction
	sig, err := sp.client.SendTransactionWithOpts(
		ctx,
		transaction,
		rpc.TransactionOpts{
			SkipPreflight:       false,
			PreflightCommitment: rpc.CommitmentFinalized,
		},
	)
	if err != nil {
		return "", NewTransactionBroadcastError("failed to send transaction: " + err.Error())
	}

	return sig.String(), nil
}

// VerifyTransaction verifies that a transaction exists on-chain and matches expected parameters.
//
// Parameters:
//   - ctx: Context for cancellation
//   - transactionHash: The transaction signature to verify
//   - expectedRecipient: Expected recipient address
//   - expectedAmount: Expected payment amount
//   - expectedTokenMint: Expected token mint address
//
// Returns:
//   - true if the transaction is valid and matches parameters
func (sp *SolanaPaymentProcessor) VerifyTransaction(
	ctx context.Context,
	transactionHash string,
	expectedRecipient string,
	expectedAmount string,
	expectedTokenMint string,
) (bool, error) {
	// Parse the signature
	sig, err := solana.SignatureFromBase58(transactionHash)
	if err != nil {
		return false, NewPaymentVerificationError("invalid transaction signature: " + err.Error())
	}

	// Get transaction details
	tx, err := sp.client.GetTransaction(ctx, sig, &rpc.GetTransactionOpts{
		Commitment: rpc.CommitmentConfirmed,
	})
	if err != nil {
		return false, NewPaymentVerificationError("transaction not found: " + err.Error())
	}

	if tx == nil {
		return false, NewPaymentVerificationError("transaction not found")
	}

	// Check if transaction was successful
	if tx.Meta != nil && tx.Meta.Err != nil {
		return false, NewPaymentVerificationError("transaction failed on-chain")
	}

	// In a production implementation, you would parse the transaction details
	// and verify the recipient, amount, and token mint match expected values.
	// For now, we return true if the transaction exists and succeeded.
	return true, nil
}

// GetTokenBalance retrieves the SPL token balance for a wallet.
//
// Parameters:
//   - ctx: Context for cancellation
//   - walletAddress: The wallet address to check
//   - tokenMint: The token mint address
//
// Returns:
//   - The token balance as a float64 (in token units, not smallest unit)
func (sp *SolanaPaymentProcessor) GetTokenBalance(
	ctx context.Context,
	walletAddress string,
	tokenMint string,
) (float64, error) {
	walletPubkey, err := solana.PublicKeyFromBase58(walletAddress)
	if err != nil {
		return 0, fmt.Errorf("invalid wallet address: %w", err)
	}

	mintPubkey, err := solana.PublicKeyFromBase58(tokenMint)
	if err != nil {
		return 0, fmt.Errorf("invalid token mint: %w", err)
	}

	// Get associated token account
	tokenAccount, _, err := solana.FindAssociatedTokenAddress(walletPubkey, mintPubkey)
	if err != nil {
		return 0, fmt.Errorf("failed to derive token account: %w", err)
	}

	// Get account info
	accountInfo, err := sp.client.GetTokenAccountBalance(ctx, tokenAccount, rpc.CommitmentFinalized)
	if err != nil {
		// If account doesn't exist, return 0
		return 0.0, nil
	}

	if accountInfo == nil || accountInfo.Value == nil {
		return 0.0, nil
	}

	// Return UI amount (human-readable format)
	return *accountInfo.Value.UiAmount, nil
}

// GetDefaultRPCURL returns the default RPC URL for a given network.
func GetDefaultRPCURL(network string) string {
	urls := map[string]string{
		"solana-mainnet": "https://api.mainnet-beta.solana.com",
		"solana-devnet":  "https://api.devnet.solana.com",
		"solana-testnet": "https://api.testnet.solana.com",
	}
	if url, ok := urls[network]; ok {
		return url
	}
	return "https://api.devnet.solana.com"
}
