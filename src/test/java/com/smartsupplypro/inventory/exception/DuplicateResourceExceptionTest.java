package com.smartsupplypro.inventory.exception;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Verifies that {@link DuplicateResourceException} carries the correct message and cause.
 */
@SuppressWarnings("ThrowableNotThrown")
class DuplicateResourceExceptionTest {

    @Test
    @DisplayName("message constructor: stores message and no cause")
    void should_store_the_message_and_no_cause_when_built_from_a_message() {
        DuplicateResourceException ex = new DuplicateResourceException("Supplier already exists");

        assertEquals("Supplier already exists", ex.getMessage());
        assertNull(ex.getCause());
    }

    @Test
    @DisplayName("message+cause constructor: stores both")
    void should_store_the_message_and_the_cause_when_built_from_both() {
        Throwable cause = new RuntimeException("root");
        DuplicateResourceException ex = new DuplicateResourceException("Item SKU conflict", cause);

        assertEquals("Item SKU conflict", ex.getMessage());
        assertEquals(cause, ex.getCause());
    }
}
