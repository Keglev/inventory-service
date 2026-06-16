package com.smartsupplypro.inventory.exception;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Verifies that {@link InvalidRequestException} carries the correct message and cause.
 */
@SuppressWarnings("ThrowableNotThrown")
class InvalidRequestExceptionTest {

    @Test
    @DisplayName("message constructor: stores message and no cause")
    void messageConstructor_storesMessageAndNoCause() {
        InvalidRequestException ex = new InvalidRequestException("Quantity must be positive");

        assertEquals("Quantity must be positive", ex.getMessage());
        assertNull(ex.getCause());
    }

    @Test
    @DisplayName("message+cause constructor: stores both")
    void messageCauseConstructor_storesBoth() {
        Throwable cause = new RuntimeException("root");
        InvalidRequestException ex = new InvalidRequestException("Invalid SKU format", cause);

        assertEquals("Invalid SKU format", ex.getMessage());
        assertEquals(cause, ex.getCause());
    }
}
