package com.smartsupplypro.inventory.exception;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.smartsupplypro.inventory.exception.dto.ErrorResponse;

/**
 * Tests that {@link ErrorResponse} stores and exposes its components correctly.
 */
class ErrorResponseBuilderTest {

    @Test
    @DisplayName("record: components are stored and accessible via accessors")
    void record_storesAndExposesComponents() {
        ErrorResponse response = new ErrorResponse("bad_request", "Invalid input", "2026-01-01T00:00:00Z");

        assertEquals("bad_request", response.error());
        assertEquals("Invalid input", response.message());
        assertEquals("2026-01-01T00:00:00Z", response.timestamp());
    }
}
