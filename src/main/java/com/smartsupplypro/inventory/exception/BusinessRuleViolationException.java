package com.smartsupplypro.inventory.exception;

/**
 * Thrown when a valid request conflicts with the current state under a business rule, such
 * as deleting an item that still has stock. Maps to HTTP 409 in {@link BusinessExceptionHandler}.
 *
 * <p>A dedicated type, not {@link IllegalStateException}: that one also signals internal
 * faults, which must answer 500 without echoing their message to the client.</p>
 */
public class BusinessRuleViolationException extends RuntimeException {

    public BusinessRuleViolationException(String message) {
        super(message);
    }
}
