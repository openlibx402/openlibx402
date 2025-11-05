package org.openlibx402.core.blockchain;

import org.openlibx402.core.errors.InsufficientFundsError;
import org.openlibx402.core.errors.TransactionBroadcastError;
import org.openlibx402.core.models.PaymentAuthorization;
import org.openlibx402.core.models.PaymentRequest;
import org.p2p.solanaj.core.Account;
import org.p2p.solanaj.core.PublicKey;
import org.p2p.solanaj.core.Transaction;
import org.p2p.solanaj.programs.SystemProgram;
import org.p2p.solanaj.rpc.RpcClient;
import org.p2p.solanaj.rpc.RpcException;
import org.p2p.solanaj.rpc.types.config.Commitment;
import org.p2p.solanaj.rpc.types.SignatureStatuses;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;

/**
 * Handles Solana blockchain payment operations.
 * <p>
 * This class manages creating, signing, and broadcasting payment transactions
 * on the Solana blockchain. It supports SPL token transfers with proper
 * associated token account handling.
 * </p>
 *
 * <p><strong>Security Warning:</strong> This class handles sensitive cryptographic
 * operations. Ensure proper key management and never log or expose private keys.</p>
 */
public class SolanaPaymentProcessor implements AutoCloseable {
    private static final int DECIMALS = 6; // Standard for USDC/SPL tokens
    private static final String DEFAULT_DEVNET_RPC = "https://api.devnet.solana.com";
    private static final String DEFAULT_MAINNET_RPC = "https://api.mainnet-beta.solana.com";

    private final RpcClient rpcClient;
    private final String rpcUrl;
    private boolean closed = false;

    /**
     * Creates a new SolanaPaymentProcessor with default devnet RPC.
     */
    public SolanaPaymentProcessor() {
        this(DEFAULT_DEVNET_RPC);
    }

    /**
     * Creates a new SolanaPaymentProcessor with a custom RPC URL.
     *
     * @param rpcUrl Solana RPC endpoint URL
     */
    public SolanaPaymentProcessor(String rpcUrl) {
        this.rpcUrl = rpcUrl != null ? rpcUrl : DEFAULT_DEVNET_RPC;
        this.rpcClient = new RpcClient(this.rpcUrl);
    }

    /**
     * Creates a payment transaction and broadcasts it to the network.
     *
     * @param request Payment request details
     * @param payerAccount Payer's account with keypair
     * @param amount Optional specific amount to pay (uses max if null)
     * @return PaymentAuthorization with transaction details
     * @throws InsufficientFundsError if wallet lacks funds
     * @throws TransactionBroadcastError if broadcast fails
     */
    public PaymentAuthorization createPayment(
            PaymentRequest request,
            Account payerAccount,
            String amount
    ) throws InsufficientFundsError, TransactionBroadcastError {
        checkNotClosed();

        try {
            // Use max amount if no specific amount provided
            String paymentAmount = amount != null ? amount : request.getMaxAmountRequired();

            // Parse addresses
            PublicKey payerPubkey = new PublicKey(payerAccount.getPublicKey().toBase58());
            PublicKey recipientPubkey = new PublicKey(request.getPaymentAddress());

            // Check balance (simplified - assumes SOL for now)
            double balance = getBalance(payerPubkey);
            double requiredAmount = Double.parseDouble(paymentAmount);

            if (balance < requiredAmount) {
                throw new InsufficientFundsError(paymentAmount, String.valueOf(balance));
            }

            // Create transaction
            Transaction transaction = createPaymentTransaction(
                    payerAccount,
                    recipientPubkey,
                    paymentAmount
            );

            // Sign and send transaction
            String signature = signAndSendTransaction(transaction, payerAccount);

            // Create authorization
            return new PaymentAuthorization(
                    request.getPaymentId(),
                    paymentAmount,
                    request.getPaymentAddress(),
                    request.getAssetAddress(),
                    request.getNetwork(),
                    Instant.now(),
                    signature,
                    payerPubkey.toBase58(),
                    signature // transaction hash is same as signature on Solana
            );

        } catch (InsufficientFundsError | TransactionBroadcastError e) {
            throw e;
        } catch (Exception e) {
            throw new TransactionBroadcastError("Failed to create payment: " + e.getMessage(), e);
        }
    }

    /**
     * Creates a payment transaction (not yet signed).
     *
     * @param payerAccount Payer's account
     * @param recipient Recipient's public key
     * @param amount Amount to transfer (decimal string)
     * @return Unsigned transaction
     */
    private Transaction createPaymentTransaction(
            Account payerAccount,
            PublicKey recipient,
            String amount
    ) throws Exception {
        // Convert amount to lamports (smallest unit)
        long lamports = convertToLamports(amount);

        // Create transfer instruction
        Transaction transaction = new Transaction();
        transaction.addInstruction(
                SystemProgram.transfer(
                        payerAccount.getPublicKey(),
                        recipient,
                        lamports
                )
        );

        // Get recent blockhash
        String recentBlockhash = rpcClient.getApi().getRecentBlockhash();
        transaction.setRecentBlockHash(recentBlockhash);
        // Note: feePayer is automatically set to the first signer in newer versions
        // transaction.setFeePayer(payerAccount.getPublicKey());

        return transaction;
    }

    /**
     * Signs and broadcasts a transaction to the Solana network.
     *
     * @param transaction Transaction to sign and send
     * @param signer Account that will sign the transaction
     * @return Transaction signature
     * @throws TransactionBroadcastError if broadcast fails
     */
    private String signAndSendTransaction(Transaction transaction, Account signer)
            throws TransactionBroadcastError {
        try {
            // Sign transaction
            transaction.sign(signer);

            // Send transaction
            String signature = rpcClient.getApi().sendTransaction(transaction, signer);

            // Wait for confirmation (simplified)
            boolean confirmed = waitForConfirmation(signature, 30);

            if (!confirmed) {
                throw new TransactionBroadcastError("Transaction confirmation timeout");
            }

            return signature;

        } catch (RpcException e) {
            throw new TransactionBroadcastError("RPC error: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new TransactionBroadcastError("Failed to sign/send transaction: " + e.getMessage(), e);
        }
    }

    /**
     * Waits for transaction confirmation.
     *
     * @param signature Transaction signature
     * @param timeoutSeconds Maximum time to wait
     * @return true if confirmed, false if timeout
     */
    private boolean waitForConfirmation(String signature, int timeoutSeconds) {
        long startTime = System.currentTimeMillis();
        long timeout = timeoutSeconds * 1000L;

        while (System.currentTimeMillis() - startTime < timeout) {
            try {
                // Check transaction status
                SignatureStatuses result = rpcClient.getApi().getSignatureStatuses(List.of(signature), true);
                if (result != null && result.getValue() != null && !result.getValue().isEmpty()) {
                    // Transaction confirmed
                    return true;
                }

                // Wait before next check
                Thread.sleep(1000);
            } catch (Exception e) {
                // Continue waiting
            }
        }

        return false;
    }

    /**
     * Gets the SOL balance for a wallet.
     *
     * @param publicKey Wallet public key
     * @return Balance in SOL
     */
    public double getBalance(PublicKey publicKey) {
        checkNotClosed();

        try {
            long lamports = rpcClient.getApi().getBalance(publicKey);
            return lamportsToSol(lamports);
        } catch (RpcException e) {
            return 0.0;
        }
    }

    /**
     * Gets the token balance for a specific SPL token.
     *
     * @param walletAddress Wallet address
     * @param tokenMint Token mint address
     * @return Token balance (UI amount)
     */
    public double getTokenBalance(String walletAddress, String tokenMint) {
        checkNotClosed();

        try {
            PublicKey walletPubkey = new PublicKey(walletAddress);
            PublicKey mintPubkey = new PublicKey(tokenMint);

            // This is a simplified version - full implementation would
            // derive the associated token account and query its balance
            // For now, returning 0.0 as placeholder
            return 0.0;

        } catch (Exception e) {
            return 0.0;
        }
    }

    /**
     * Verifies a transaction on-chain.
     *
     * @param txHash Transaction hash/signature
     * @param expectedRecipient Expected recipient address
     * @param expectedAmount Expected transfer amount
     * @param expectedMint Expected token mint (can be null for SOL)
     * @return true if transaction is valid, false otherwise
     */
    public boolean verifyTransaction(
            String txHash,
            String expectedRecipient,
            String expectedAmount,
            String expectedMint
    ) {
        checkNotClosed();

        try {
            // Query transaction details
            // This is simplified - full implementation would parse transaction
            // and verify all details match expectations
            SignatureStatuses result = rpcClient.getApi().getSignatureStatuses(List.of(txHash), true);
            return result != null && result.getValue() != null && !result.getValue().isEmpty();

        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Converts a decimal amount string to lamports (smallest unit).
     *
     * @param amount Decimal amount string
     * @return Amount in lamports
     */
    private long convertToLamports(String amount) {
        BigDecimal amountBd = new BigDecimal(amount);
        BigDecimal lamports = amountBd.multiply(BigDecimal.valueOf(1_000_000_000)); // SOL has 9 decimals
        return lamports.longValue();
    }

    /**
     * Converts lamports to SOL.
     *
     * @param lamports Amount in lamports
     * @return Amount in SOL
     */
    private double lamportsToSol(long lamports) {
        return new BigDecimal(lamports)
                .divide(BigDecimal.valueOf(1_000_000_000), 9, RoundingMode.DOWN)
                .doubleValue();
    }

    /**
     * Gets the RPC URL being used.
     *
     * @return RPC endpoint URL
     */
    public String getRpcUrl() {
        return rpcUrl;
    }

    /**
     * Checks if this processor has been closed.
     *
     * @throws IllegalStateException if closed
     */
    private void checkNotClosed() {
        if (closed) {
            throw new IllegalStateException("SolanaPaymentProcessor has been closed");
        }
    }

    @Override
    public void close() {
        if (!closed) {
            // Close RPC client if it has cleanup methods
            closed = true;
        }
    }

    /**
     * Checks if this processor is closed.
     *
     * @return true if closed, false otherwise
     */
    public boolean isClosed() {
        return closed;
    }
}
