package com.smartsupplypro.inventory.exception;

/**
 * Thrown when a client request fails validation or violates a business rule.
 * Maps to HTTP 400 in {@link BusinessExceptionHandler}.
 */
public class InvalidRequestException extends RuntimeException {

    public InvalidRequestException(String message) {
        super(message);
    }

    public InvalidRequestException(String message, Throwable cause) {
        super(message, cause);
    }
}
