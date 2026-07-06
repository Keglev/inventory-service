package com.smartsupplypro.inventory.exception;

/**
 * Thrown when a resource with the same unique identifier already exists.
 * Maps to HTTP 409 in {@link BusinessExceptionHandler}.
 *
 * <p>The optional {@code field} names the request field that caused the
 * conflict (e.g. {@code "sku"}), enabling per-field error responses.</p>
 */
public class DuplicateResourceException extends RuntimeException {

    private final String field;

    public DuplicateResourceException(String message) {
        super(message);
        this.field = null;
    }

    public DuplicateResourceException(String message, String field) {
        super(message);
        this.field = field;
    }

    public DuplicateResourceException(String message, Throwable cause) {
        super(message, cause);
        this.field = null;
    }

    /** @return the conflicting field name, or {@code null} when not attributable */
    public String getField() {
        return field;
    }
}
