package org.openlibx402.core.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

/**
 * Represents a payment request in the X402 payment protocol.
 * <p>
 * This model contains all the necessary information for a client to create
 * and execute a payment transaction on the Solana blockchain.
 * </p>
 */
public class PaymentRequest {
    private static final ObjectMapper MAPPER = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    private final String maxAmountRequired;
    private final String assetType;
    private final String assetAddress;
    private final String paymentAddress;
    private final String network;
    private final Instant expiresAt;
    private final String nonce;
    private final String paymentId;
    private final String resource;
    private final String description;

    /**
     * Creates a new PaymentRequest.
     *
     * @param maxAmountRequired Maximum payment amount required (decimal string, e.g., "0.10")
     * @param assetType Type of asset (e.g., "SPL" for Solana tokens)
     * @param assetAddress Token mint address on Solana
     * @param paymentAddress Recipient wallet address
     * @param network Solana network identifier (e.g., "solana-devnet", "solana-mainnet")
     * @param expiresAt Expiration timestamp for this payment request
     * @param nonce Unique nonce for replay protection
     * @param paymentId Unique payment identifier
     * @param resource API resource endpoint
     * @param description Optional description of the payment
     */
    @JsonCreator
    public PaymentRequest(
            @JsonProperty("max_amount_required") String maxAmountRequired,
            @JsonProperty("asset_type") String assetType,
            @JsonProperty("asset_address") String assetAddress,
            @JsonProperty("payment_address") String paymentAddress,
            @JsonProperty("network") String network,
            @JsonProperty("expires_at") Instant expiresAt,
            @JsonProperty("nonce") String nonce,
            @JsonProperty("payment_id") String paymentId,
            @JsonProperty("resource") String resource,
            @JsonProperty("description") String description
    ) {
        this.maxAmountRequired = Objects.requireNonNull(maxAmountRequired, "maxAmountRequired cannot be null");
        this.assetType = Objects.requireNonNull(assetType, "assetType cannot be null");
        this.assetAddress = Objects.requireNonNull(assetAddress, "assetAddress cannot be null");
        this.paymentAddress = Objects.requireNonNull(paymentAddress, "paymentAddress cannot be null");
        this.network = Objects.requireNonNull(network, "network cannot be null");
        this.expiresAt = Objects.requireNonNull(expiresAt, "expiresAt cannot be null");
        this.nonce = Objects.requireNonNull(nonce, "nonce cannot be null");
        this.paymentId = Objects.requireNonNull(paymentId, "paymentId cannot be null");
        this.resource = Objects.requireNonNull(resource, "resource cannot be null");
        this.description = description;
    }

    /**
     * Creates a PaymentRequest from a JSON string.
     *
     * @param json JSON string representation
     * @return Parsed PaymentRequest
     * @throws IllegalArgumentException if JSON is invalid
     */
    public static PaymentRequest fromJson(String json) {
        try {
            return MAPPER.readValue(json, PaymentRequest.class);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Invalid PaymentRequest JSON: " + e.getMessage(), e);
        }
    }

    /**
     * Converts this PaymentRequest to a JSON string.
     *
     * @return JSON representation
     */
    public String toJson() {
        try {
            return MAPPER.writeValueAsString(this);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize PaymentRequest to JSON", e);
        }
    }

    /**
     * Converts this PaymentRequest to a Map.
     *
     * @return Map representation with snake_case keys
     */
    public Map<String, Object> toMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("max_amount_required", maxAmountRequired);
        map.put("asset_type", assetType);
        map.put("asset_address", assetAddress);
        map.put("payment_address", paymentAddress);
        map.put("network", network);
        map.put("expires_at", expiresAt.toString());
        map.put("nonce", nonce);
        map.put("payment_id", paymentId);
        map.put("resource", resource);
        if (description != null) {
            map.put("description", description);
        }
        return map;
    }

    /**
     * Checks if this payment request has expired.
     *
     * @return true if expired, false otherwise
     */
    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    // Getters

    @JsonProperty("max_amount_required")
    public String getMaxAmountRequired() {
        return maxAmountRequired;
    }

    @JsonProperty("asset_type")
    public String getAssetType() {
        return assetType;
    }

    @JsonProperty("asset_address")
    public String getAssetAddress() {
        return assetAddress;
    }

    @JsonProperty("payment_address")
    public String getPaymentAddress() {
        return paymentAddress;
    }

    @JsonProperty("network")
    public String getNetwork() {
        return network;
    }

    @JsonProperty("expires_at")
    public Instant getExpiresAt() {
        return expiresAt;
    }

    @JsonProperty("nonce")
    public String getNonce() {
        return nonce;
    }

    @JsonProperty("payment_id")
    public String getPaymentId() {
        return paymentId;
    }

    @JsonProperty("resource")
    public String getResource() {
        return resource;
    }

    @JsonProperty("description")
    public String getDescription() {
        return description;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PaymentRequest that = (PaymentRequest) o;
        return Objects.equals(maxAmountRequired, that.maxAmountRequired) &&
                Objects.equals(assetType, that.assetType) &&
                Objects.equals(assetAddress, that.assetAddress) &&
                Objects.equals(paymentAddress, that.paymentAddress) &&
                Objects.equals(network, that.network) &&
                Objects.equals(expiresAt, that.expiresAt) &&
                Objects.equals(nonce, that.nonce) &&
                Objects.equals(paymentId, that.paymentId) &&
                Objects.equals(resource, that.resource) &&
                Objects.equals(description, that.description);
    }

    @Override
    public int hashCode() {
        return Objects.hash(maxAmountRequired, assetType, assetAddress, paymentAddress,
                network, expiresAt, nonce, paymentId, resource, description);
    }

    @Override
    public String toString() {
        return "PaymentRequest{" +
                "maxAmountRequired='" + maxAmountRequired + '\'' +
                ", assetType='" + assetType + '\'' +
                ", assetAddress='" + assetAddress + '\'' +
                ", paymentAddress='" + paymentAddress + '\'' +
                ", network='" + network + '\'' +
                ", expiresAt=" + expiresAt +
                ", nonce='" + nonce + '\'' +
                ", paymentId='" + paymentId + '\'' +
                ", resource='" + resource + '\'' +
                ", description='" + description + '\'' +
                '}';
    }
}
