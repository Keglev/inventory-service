package com.smartsupplypro.inventory.exception;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Verifies that {@link InvalidRequestException} carries the correct message.
 */
@SuppressWarnings("ThrowableNotThrown")
class InvalidRequestExceptionTest {

    @Test
    @DisplayName("message constructor: stores message and no cause")
    void should_store_the_message_and_no_cause_when_built_from_a_message() {
        InvalidRequestException ex = new InvalidRequestException("Quantity must be positive");

        assertEquals("Quantity must be positive", ex.getMessage());
        assertNull(ex.getCause());
    }
}
