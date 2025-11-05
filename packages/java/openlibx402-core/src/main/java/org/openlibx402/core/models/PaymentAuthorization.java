package org.openlibx402.core.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

/**
 * Represents a payment authorization in the X402 payment protocol.
 * <p>
 * This model contains proof of payment that can be sent as an authorization
 * header to access protected resources.
 * </p>
 */
public class PaymentAuthorization {
    private static final ObjectMapper MAPPER = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    private final String paymentId;
    private final String actualAmount;
    private final String paymentAddress;
    private final String assetAddress;
    private final String network;
    private final Instant timestamp;
    private final String signature;
    private final String publicKey;
    private final String transactionHash;

    /**
     * Creates a new PaymentAuthorization.
     *
     * @param paymentId Payment identifier from the payment request
     * @param actualAmount Actual amount paid (decimal string)
     * @param paymentAddress Recipient wallet address
     * @param assetAddress Token mint address
     * @param network Solana network identifier
     * @param timestamp Authorization creation timestamp
     * @param signature Solana transaction signature
     * @param publicKey Payer's public key
     * @param transactionHash Transaction hash (often same as signature)
     */
    @JsonCreator
    public PaymentAuthorization(
            @JsonProperty("payment_id") String paymentId,
            @JsonProperty("actual_amount") String actualAmount,
            @JsonProperty("payment_address") String paymentAddress,
            @JsonProperty("asset_address") String assetAddress,
            @JsonProperty("network") String network,
            @JsonProperty("timestamp") Instant timestamp,
            @JsonProperty("signature") String signature,
            @JsonProperty("public_key") String publicKey,
            @JsonProperty("transaction_hash") String transactionHash
    ) {
        this.paymentId = Objects.requireNonNull(paymentId, "paymentId cannot be null");
        this.actualAmount = Objects.requireNonNull(actualAmount, "actualAmount cannot be null");
        this.paymentAddress = Objects.requireNonNull(paymentAddress, "paymentAddress cannot be null");
        this.assetAddress = Objects.requireNonNull(assetAddress, "assetAddress cannot be null");
        this.network = Objects.requireNonNull(network, "network cannot be null");
        this.timestamp = Objects.requireNonNull(timestamp, "timestamp cannot be null");
        this.signature = Objects.requireNonNull(signature, "signature cannot be null");
        this.publicKey = Objects.requireNonNull(publicKey, "publicKey cannot be null");
        this.transactionHash = transactionHash != null ? transactionHash : signature;
    }

    /**
     * Creates a PaymentAuthorization from a JSON string.
     *
     * @param json JSON string representation
     * @return Parsed PaymentAuthorization
     * @throws IllegalArgumentException if JSON is invalid
     */
    public static PaymentAuthorization fromJson(String json) {
        try {
            return MAPPER.readValue(json, PaymentAuthorization.class);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Invalid PaymentAuthorization JSON: " + e.getMessage(), e);
        }
    }

    /**
     * Creates a PaymentAuthorization from a base64-encoded authorization header.
     *
     * @param headerValue Base64-encoded JSON string
     * @return Parsed PaymentAuthorization
     * @throws IllegalArgumentException if header is invalid
     */
    public static PaymentAuthorization fromHeader(String headerValue) {
        try {
            String json = new String(Base64.getDecoder().decode(headerValue), StandardCharsets.UTF_8);
            return fromJson(json);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid authorization header: " + e.getMessage(), e);
        }
    }

    /**
     * Converts this PaymentAuthorization to a JSON string.
     *
     * @return JSON representation
     */
    public String toJson() {
        try {
            return MAPPER.writeValueAsString(this);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize PaymentAuthorization to JSON", e);
        }
    }

    /**
     * Converts this PaymentAuthorization to a base64-encoded header value.
     *
     * @return Base64-encoded JSON suitable for X-Payment-Authorization header
     */
    public String toHeaderValue() {
        String json = toJson();
        return Base64.getEncoder().encodeToString(json.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Converts this PaymentAuthorization to a Map.
     *
     * @return Map representation with snake_case keys
     */
    public Map<String, Object> toMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("payment_id", paymentId);
        map.put("actual_amount", actualAmount);
        map.put("payment_address", paymentAddress);
        map.put("asset_address", assetAddress);
        map.put("network", network);
        map.put("timestamp", timestamp.toString());
        map.put("signature", signature);
        map.put("public_key", publicKey);
        map.put("transaction_hash", transactionHash);
        return map;
    }

    // Getters

    @JsonProperty("payment_id")
    public String getPaymentId() {
        return paymentId;
    }

    @JsonProperty("actual_amount")
    public String getActualAmount() {
        return actualAmount;
    }

    @JsonProperty("payment_address")
    public String getPaymentAddress() {
        return paymentAddress;
    }

    @JsonProperty("asset_address")
    public String getAssetAddress() {
        return assetAddress;
    }

    @JsonProperty("network")
    public String getNetwork() {
        return network;
    }

    @JsonProperty("timestamp")
    public Instant getTimestamp() {
        return timestamp;
    }

    @JsonProperty("signature")
    public String getSignature() {
        return signature;
    }

    @JsonProperty("public_key")
    public String getPublicKey() {
        return publicKey;
    }

    @JsonProperty("transaction_hash")
    public String getTransactionHash() {
        return transactionHash;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PaymentAuthorization that = (PaymentAuthorization) o;
        return Objects.equals(paymentId, that.paymentId) &&
                Objects.equals(actualAmount, that.actualAmount) &&
                Objects.equals(paymentAddress, that.paymentAddress) &&
                Objects.equals(assetAddress, that.assetAddress) &&
                Objects.equals(network, that.network) &&
                Objects.equals(timestamp, that.timestamp) &&
                Objects.equals(signature, that.signature) &&
                Objects.equals(publicKey, that.publicKey) &&
                Objects.equals(transactionHash, that.transactionHash);
    }

    @Override
    public int hashCode() {
        return Objects.hash(paymentId, actualAmount, paymentAddress, assetAddress,
                network, timestamp, signature, publicKey, transactionHash);
    }

    @Override
    public String toString() {
        return "PaymentAuthorization{" +
                "paymentId='" + paymentId + '\'' +
                ", actualAmount='" + actualAmount + '\'' +
                ", paymentAddress='" + paymentAddress + '\'' +
                ", assetAddress='" + assetAddress + '\'' +
                ", network='" + network + '\'' +
                ", timestamp=" + timestamp +
                ", signature='" + signature + '\'' +
                ", publicKey='" + publicKey + '\'' +
                ", transactionHash='" + transactionHash + '\'' +
                '}';
    }
}
