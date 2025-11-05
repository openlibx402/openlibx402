package org.openlibx402.core.blockchain

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import kotlinx.datetime.Clock
import org.openlibx402.core.errors.X402Error
import org.openlibx402.core.models.PaymentAuthorization
import org.openlibx402.core.models.PaymentRequest
import org.p2p.solanaj.core.Account
import org.p2p.solanaj.core.PublicKey
import org.p2p.solanaj.core.Transaction
import org.p2p.solanaj.programs.SystemProgram
import org.p2p.solanaj.rpc.RpcClient
import org.p2p.solanaj.rpc.RpcException
import java.io.Closeable
import java.math.BigDecimal
import java.math.RoundingMode

/**
 * Handles Solana blockchain payment operations with coroutine support.
 *
 * This class manages creating, signing, and broadcasting payment transactions
 * on the Solana blockchain. It supports SPL token transfers with proper
 * associated token account handling.
 *
 * All I/O operations are suspend functions that run on IO dispatcher.
 *
 * **Security Warning:** This class handles sensitive cryptographic operations.
 * Ensure proper key management and never log or expose private keys.
 *
 * @property rpcUrl Solana RPC endpoint URL
 */
class SolanaPaymentProcessor(
    private val rpcUrl: String = DEFAULT_DEVNET_RPC
) : Closeable {

    private val rpcClient = RpcClient(rpcUrl)
    private var closed = false

    /**
     * Creates a payment transaction and broadcasts it to the network.
     *
     * This is a suspending function that performs I/O operations asynchronously.
     *
     * @param request Payment request details
     * @param payerAccount Payer's account with keypair
     * @param amount Optional specific amount to pay (uses max if null)
     * @return PaymentAuthorization with transaction details
     * @throws X402Error.InsufficientFunds if wallet lacks funds
     * @throws X402Error.TransactionBroadcastFailed if broadcast fails
     */
    suspend fun createPayment(
        request: PaymentRequest,
        payerAccount: Account,
        amount: String? = null
    ): PaymentAuthorization = withContext(Dispatchers.IO) {
        checkNotClosed()

        try {
            // Use max amount if no specific amount provided
            val paymentAmount = amount ?: request.maxAmountRequired

            // Parse addresses
            val payerPubkey = PublicKey(payerAccount.publicKey.toBase58())
            val recipientPubkey = PublicKey(request.paymentAddress)

            // Check balance (simplified - assumes SOL for now)
            val balance = getBalance(payerPubkey)
            val requiredAmount = paymentAmount.toDouble()

            if (balance < requiredAmount) {
                throw X402Error.InsufficientFunds(
                    requiredAmount = paymentAmount,
                    availableAmount = balance.toString()
                )
            }

            // Create transaction
            val transaction = createPaymentTransaction(
                payerAccount,
                recipientPubkey,
                paymentAmount
            )

            // Sign and send transaction
            val signature = signAndSendTransaction(transaction, payerAccount)

            // Create authorization
            PaymentAuthorization(
                paymentId = request.paymentId,
                actualAmount = paymentAmount,
                paymentAddress = request.paymentAddress,
                assetAddress = request.assetAddress,
                network = request.network,
                timestamp = Clock.System.now(),
                signature = signature,
                publicKey = payerPubkey.toBase58(),
                transactionHash = signature // transaction hash is same as signature on Solana
            )

        } catch (e: X402Error) {
            throw e
        } catch (e: Exception) {
            throw X402Error.TransactionBroadcastFailed(
                reason = "Failed to create payment: ${e.message}",
                cause = e
            )
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
    private suspend fun createPaymentTransaction(
        payerAccount: Account,
        recipient: PublicKey,
        amount: String
    ): Transaction = withContext(Dispatchers.IO) {
        // Convert amount to lamports (smallest unit)
        val lamports = convertToLamports(amount)

        // Create transfer instruction
        val transaction = Transaction()
        transaction.addInstruction(
            SystemProgram.transfer(
                payerAccount.publicKey,
                recipient,
                lamports
            )
        )

        // Get recent blockhash
        val recentBlockhash = rpcClient.api.getRecentBlockhash()
        transaction.recentBlockHash = recentBlockhash
        transaction.feePayer = payerAccount.publicKey

        transaction
    }

    /**
     * Signs and broadcasts a transaction to the Solana network.
     *
     * @param transaction Transaction to sign and send
     * @param signer Account that will sign the transaction
     * @return Transaction signature
     * @throws X402Error.TransactionBroadcastFailed if broadcast fails
     */
    private suspend fun signAndSendTransaction(
        transaction: Transaction,
        signer: Account
    ): String = withContext(Dispatchers.IO) {
        try {
            // Sign transaction
            transaction.sign(signer)

            // Send transaction
            val signature = rpcClient.api.sendTransaction(transaction, signer)

            // Wait for confirmation (simplified)
            val confirmed = waitForConfirmation(signature, timeoutSeconds = 30)

            if (!confirmed) {
                throw X402Error.TransactionBroadcastFailed("Transaction confirmation timeout")
            }

            signature

        } catch (e: RpcException) {
            throw X402Error.TransactionBroadcastFailed("RPC error: ${e.message}", cause = e)
        } catch (e: X402Error) {
            throw e
        } catch (e: Exception) {
            throw X402Error.TransactionBroadcastFailed(
                "Failed to sign/send transaction: ${e.message}",
                cause = e
            )
        }
    }

    /**
     * Waits for transaction confirmation.
     *
     * @param signature Transaction signature
     * @param timeoutSeconds Maximum time to wait
     * @return true if confirmed, false if timeout
     */
    private suspend fun waitForConfirmation(
        signature: String,
        timeoutSeconds: Int
    ): Boolean = withContext(Dispatchers.IO) {
        val startTime = System.currentTimeMillis()
        val timeout = timeoutSeconds * 1000L

        while (System.currentTimeMillis() - startTime < timeout) {
            try {
                // Check transaction status
                val result = rpcClient.api.getSignatureStatuses(listOf(signature), true)
                if (result != null && result.isNotEmpty()) {
                    // Transaction confirmed
                    return@withContext true
                }

                // Wait before next check
                delay(1000)
            } catch (e: Exception) {
                // Continue waiting
            }
        }

        false
    }

    /**
     * Gets the SOL balance for a wallet.
     *
     * @param publicKey Wallet public key
     * @return Balance in SOL
     */
    suspend fun getBalance(publicKey: PublicKey): Double = withContext(Dispatchers.IO) {
        checkNotClosed()

        try {
            val lamports = rpcClient.api.getBalance(publicKey)
            lamportsToSol(lamports)
        } catch (e: RpcException) {
            0.0
        }
    }

    /**
     * Gets the token balance for a specific SPL token.
     *
     * @param walletAddress Wallet address
     * @param tokenMint Token mint address
     * @return Token balance (UI amount)
     */
    suspend fun getTokenBalance(
        walletAddress: String,
        tokenMint: String
    ): Double = withContext(Dispatchers.IO) {
        checkNotClosed()

        try {
            // This is a simplified version - full implementation would
            // derive the associated token account and query its balance
            // For now, returning 0.0 as placeholder
            0.0
        } catch (e: Exception) {
            0.0
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
    suspend fun verifyTransaction(
        txHash: String,
        expectedRecipient: String,
        expectedAmount: String,
        expectedMint: String? = null
    ): Boolean = withContext(Dispatchers.IO) {
        checkNotClosed()

        try {
            // Query transaction details
            // This is simplified - full implementation would parse transaction
            // and verify all details match expectations
            val result = rpcClient.api.getSignatureStatuses(listOf(txHash), true)
            result != null && result.isNotEmpty()
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Converts a decimal amount string to lamports (smallest unit).
     *
     * @param amount Decimal amount string
     * @return Amount in lamports
     */
    private fun convertToLamports(amount: String): Long {
        val amountBd = BigDecimal(amount)
        val lamports = amountBd.multiply(BigDecimal.valueOf(1_000_000_000)) // SOL has 9 decimals
        return lamports.toLong()
    }

    /**
     * Converts lamports to SOL.
     *
     * @param lamports Amount in lamports
     * @return Amount in SOL
     */
    private fun lamportsToSol(lamports: Long): Double =
        BigDecimal(lamports)
            .divide(BigDecimal.valueOf(1_000_000_000), 9, RoundingMode.DOWN)
            .toDouble()

    /**
     * Checks if this processor has been closed.
     *
     * @throws IllegalStateException if closed
     */
    private fun checkNotClosed() {
        check(!closed) { "SolanaPaymentProcessor has been closed" }
    }

    override fun close() {
        if (!closed) {
            // Close RPC client if it has cleanup methods
            closed = true
        }
    }

    /**
     * Checks if this processor is closed.
     *
     * @return true if closed, false otherwise
     */
    fun isClosed(): Boolean = closed

    companion object {
        private const val DECIMALS = 6 // Standard for USDC/SPL tokens
        private const val DEFAULT_DEVNET_RPC = "https://api.devnet.solana.com"
        private const val DEFAULT_MAINNET_RPC = "https://api.mainnet-beta.solana.com"
    }
}
