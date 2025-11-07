package org.openlibx402.core.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.datetime.Instant
import java.util.Base64

/**
 * Represents a payment authorization in the X402 payment protocol.
 *
 * This data class contains proof of payment that can be sent as an authorization
 * header to access protected resources.
 *
 * @property paymentId Payment identifier from the payment request
 * @property actualAmount Actual amount paid (decimal string)
 * @property paymentAddress Recipient wallet address
 * @property assetAddress Token mint address
 * @property network Solana network identifier
 * @property timestamp Authorization creation timestamp
 * @property signature Solana transaction signature
 * @property publicKey Payer's public key
 * @property transactionHash Transaction hash (often same as signature)
 */
@Serializable
data class PaymentAuthorization(
    @SerialName("payment_id")
    val paymentId: String,

    @SerialName("actual_amount")
    val actualAmount: String,

    @SerialName("payment_address")
    val paymentAddress: String,

    @SerialName("asset_address")
    val assetAddress: String,

    @SerialName("network")
    val network: String,

    @SerialName("timestamp")
    val timestamp: Instant,

    @SerialName("signature")
    val signature: String,

    @SerialName("public_key")
    val publicKey: String,

    @SerialName("transaction_hash")
    val transactionHash: String = signature
) {
    companion object {
        private val json = Json { ignoreUnknownKeys = true }

        /**
         * Creates a PaymentAuthorization from a JSON string.
         *
         * @param jsonString JSON string representation
         * @return Parsed PaymentAuthorization
         * @throws IllegalArgumentException if JSON is invalid
         */
        fun fromJson(jsonString: String): PaymentAuthorization = try {
            json.decodeFromString(serializer(), jsonString)
        } catch (e: Exception) {
            throw IllegalArgumentException("Invalid PaymentAuthorization JSON: ${e.message}", e)
        }

        /**
         * Creates a PaymentAuthorization from a base64-encoded authorization header.
         *
         * @param headerValue Base64-encoded JSON string
         * @return Parsed PaymentAuthorization
         * @throws IllegalArgumentException if header is invalid
         */
        fun fromHeader(headerValue: String): PaymentAuthorization = try {
            val jsonString = String(Base64.getDecoder().decode(headerValue))
            fromJson(jsonString)
        } catch (e: Exception) {
            throw IllegalArgumentException("Invalid authorization header: ${e.message}", e)
        }
    }

    /**
     * Converts this PaymentAuthorization to a JSON string.
     *
     * @return JSON representation
     */
    fun toJson(): String = Json.encodeToString(serializer(), this)

    /**
     * Converts this PaymentAuthorization to a base64-encoded header value.
     *
     * @return Base64-encoded JSON suitable for X-Payment-Authorization header
     */
    fun toHeaderValue(): String {
        val jsonString = toJson()
        return Base64.getEncoder().encodeToString(jsonString.toByteArray())
    }

    /**
     * Converts this PaymentAuthorization to a Map.
     *
     * @return Map representation with snake_case keys
     */
    fun toMap(): Map<String, Any> = mapOf(
        "payment_id" to paymentId,
        "actual_amount" to actualAmount,
        "payment_address" to paymentAddress,
        "asset_address" to assetAddress,
        "network" to network,
        "timestamp" to timestamp.toString(),
        "signature" to signature,
        "public_key" to publicKey,
        "transaction_hash" to transactionHash
    )
}
