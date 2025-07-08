package com.smartsupplypro.inventory.exception;

/**
 * Exception thrown when attempting to create or update a resource
 * that would violate a uniqueness constraint (e.g., duplicate name or ID).
 *
 * <p>Typical use cases include:
 * <ul>
 *   <li>Creating a supplier with an existing name</li>
 *   <li>Adding an inventory item with a duplicate ID or name</li>
 * </ul>
 *
 * <p>This exception is usually mapped to HTTP 409 Conflict in the
 * {@link com.smartsupplypro.inventory.exception.GlobalExceptionHandler}.
 */
public class DuplicateResourceException extends RuntimeException {

    /**
     * Constructs a new DuplicateResourceException with a descriptive message.
     *
     * @param message explanation of the uniqueness violation
     */
    public DuplicateResourceException(String message) {
        super(message);
    }
}

