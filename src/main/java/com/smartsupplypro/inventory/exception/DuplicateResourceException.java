package com.smartsupplypro.inventory.exception;

/**
 * Thrown when a resource with the same unique identifier already exists.
 * Maps to HTTP 409 in {@link BusinessExceptionHandler}.
 */
public class DuplicateResourceException extends RuntimeException {

    public DuplicateResourceException(String message) {
        super(message);
    }

    public DuplicateResourceException(String message, Throwable cause) {
        super(message, cause);
    }
}
