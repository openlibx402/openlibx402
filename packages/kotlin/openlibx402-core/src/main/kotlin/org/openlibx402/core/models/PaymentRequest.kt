package org.openlibx402.core.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.datetime.Instant
import kotlinx.datetime.Clock

/**
 * Represents a payment request in the X402 payment protocol.
 *
 * This data class contains all the necessary information for a client to create
 * and execute a payment transaction on the Solana blockchain.
 *
 * @property maxAmountRequired Maximum payment amount required (decimal string, e.g., "0.10")
 * @property assetType Type of asset (e.g., "SPL" for Solana tokens)
 * @property assetAddress Token mint address on Solana
 * @property paymentAddress Recipient wallet address
 * @property network Solana network identifier (e.g., "solana-devnet", "solana-mainnet")
 * @property expiresAt Expiration timestamp for this payment request
 * @property nonce Unique nonce for replay protection
 * @property paymentId Unique payment identifier
 * @property resource API resource endpoint
 * @property description Optional description of the payment
 */
@Serializable
data class PaymentRequest(
    @SerialName("max_amount_required")
    val maxAmountRequired: String,

    @SerialName("asset_type")
    val assetType: String,

    @SerialName("asset_address")
    val assetAddress: String,

    @SerialName("payment_address")
    val paymentAddress: String,

    @SerialName("network")
    val network: String,

    @SerialName("expires_at")
    val expiresAt: Instant,

    @SerialName("nonce")
    val nonce: String,

    @SerialName("payment_id")
    val paymentId: String,

    @SerialName("resource")
    val resource: String,

    @SerialName("description")
    val description: String? = null
) {
    companion object {
        private val json = Json { ignoreUnknownKeys = true }

        /**
         * Creates a PaymentRequest from a JSON string.
         *
         * @param jsonString JSON string representation
         * @return Parsed PaymentRequest
         * @throws IllegalArgumentException if JSON is invalid
         */
        fun fromJson(jsonString: String): PaymentRequest = try {
            json.decodeFromString(serializer(), jsonString)
        } catch (e: Exception) {
            throw IllegalArgumentException("Invalid PaymentRequest JSON: ${e.message}", e)
        }
    }

    /**
     * Converts this PaymentRequest to a JSON string.
     *
     * @return JSON representation
     */
    fun toJson(): String = Json.encodeToString(serializer(), this)

    /**
     * Converts this PaymentRequest to a Map.
     *
     * @return Map representation with snake_case keys
     */
    fun toMap(): Map<String, Any?> = mapOf(
        "max_amount_required" to maxAmountRequired,
        "asset_type" to assetType,
        "asset_address" to assetAddress,
        "payment_address" to paymentAddress,
        "network" to network,
        "expires_at" to expiresAt.toString(),
        "nonce" to nonce,
        "payment_id" to paymentId,
        "resource" to resource,
        "description" to description
    )

    /**
     * Checks if this payment request has expired.
     *
     * @return true if expired, false otherwise
     */
    fun isExpired(): Boolean = Clock.System.now() > expiresAt
}
