package com.smartsupplypro.inventory.exception;

/**
 * Exception thrown when attempting to create or update a resource
 * that would violate a uniqueness constraint (e.g., duplicate name or ID).
 *
 * <p>Typical use cases include creating a supplier with an existing name or
 * adding an inventory item with a duplicate SKU/name.</p>
 *
 * <p><strong>HTTP mapping:</strong> Handled as <em>409 Conflict</em> by
 * {@link GlobalExceptionHandler}.</p>
 */
public class DuplicateResourceException extends RuntimeException {

    public DuplicateResourceException(String message) {
        super(message);
    }
}


