package org.openlibx402.core.errors;

import java.util.HashMap;
import java.util.Map;

/**
 * Base exception class for all X402 protocol errors.
 * <p>
 * All errors include an error code, message, and optional details map.
 * Subclasses represent specific error conditions in the payment flow.
 * </p>
 */
public class X402Error extends Exception {
    private final String code;
    private final Map<String, Object> details;

    /**
     * Creates a new X402Error.
     *
     * @param message Error message
     * @param code Error code
     */
    public X402Error(String message, String code) {
        this(message, code, new HashMap<>());
    }

    /**
     * Creates a new X402Error with details.
     *
     * @param message Error message
     * @param code Error code
     * @param details Additional error details
     */
    public X402Error(String message, String code, Map<String, Object> details) {
        super(message);
        this.code = code;
        this.details = details != null ? new HashMap<>(details) : new HashMap<>();
    }

    /**
     * Creates a new X402Error with a cause.
     *
     * @param message Error message
     * @param code Error code
     * @param cause Underlying cause
     */
    public X402Error(String message, String code, Throwable cause) {
        this(message, code, new HashMap<>(), cause);
    }

    /**
     * Creates a new X402Error with details and a cause.
     *
     * @param message Error message
     * @param code Error code
     * @param details Additional error details
     * @param cause Underlying cause
     */
    public X402Error(String message, String code, Map<String, Object> details, Throwable cause) {
        super(message, cause);
        this.code = code;
        this.details = details != null ? new HashMap<>(details) : new HashMap<>();
    }

    /**
     * Gets the error code.
     *
     * @return Error code
     */
    public String getCode() {
        return code;
    }

    /**
     * Gets the error details.
     *
     * @return Immutable map of error details
     */
    public Map<String, Object> getDetails() {
        return new HashMap<>(details);
    }

    /**
     * Adds a detail to this error.
     *
     * @param key Detail key
     * @param value Detail value
     */
    protected void addDetail(String key, Object value) {
        details.put(key, value);
    }

    @Override
    public String toString() {
        return getClass().getSimpleName() + "{" +
                "code='" + code + '\'' +
                ", message='" + getMessage() + '\'' +
                ", details=" + details +
                '}';
    }
}
