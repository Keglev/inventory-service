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
    void messageConstructor_storesMessageAndNoCause() {
        DuplicateResourceException ex = new DuplicateResourceException("Supplier already exists");

        assertEquals("Supplier already exists", ex.getMessage());
        assertNull(ex.getCause());
    }

    @Test
    @DisplayName("message+cause constructor: stores both")
    void messageCauseConstructor_storesBoth() {
        Throwable cause = new RuntimeException("root");
        DuplicateResourceException ex = new DuplicateResourceException("Item SKU conflict", cause);

        assertEquals("Item SKU conflict", ex.getMessage());
        assertEquals(cause, ex.getCause());
    }
}
