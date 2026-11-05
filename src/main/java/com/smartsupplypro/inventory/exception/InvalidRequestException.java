package com.smartsupplypro.inventory.exception;

/**
 * Thrown when a client request fails validation. Maps to HTTP 400 in
 * {@link BusinessExceptionHandler}; a broken business rule is
 * {@link BusinessRuleViolationException} (409).
 */
public class InvalidRequestException extends RuntimeException {

    public InvalidRequestException(String message) {
        super(message);
    }
}
