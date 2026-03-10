package com.smartsupplypro.inventory.exception;

import java.util.Map;
import java.util.Objects;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.smartsupplypro.inventory.exception.dto.ErrorResponse;

/**
 * Unit tests for {@link BusinessExceptionHandler}.
 *
 * <h2>Scope</h2>
 * Validates the handler’s domain-exception mapping contract:
 * <ul>
 *   <li>{@link InvalidRequestException} → 400 with either field-error summary or message fallback</li>
 *   <li>{@link DuplicateResourceException} → 409 with either detailed client message or message fallback</li>
 *   <li>{@link IllegalStateException} (business rule conflicts) → 409 with message or blank/null fallback</li>
 * </ul>
 *
 * <h2>Why this matters</h2>
 * Business exceptions are part of the API contract: frontends and integrations depend on stable
 * status codes and predictable, user-friendly messages.
 *
 * <h2>Test strategy</h2>
 * Pure unit tests (no Spring MVC context). Focus is branch coverage for the message-selection logic
 * rather than controller wiring.
 */
class BusinessExceptionHandlerTest {

    private final BusinessExceptionHandler handler = new BusinessExceptionHandler();

    private static ErrorResponse body(ResponseEntity<ErrorResponse> response) {
        return Objects.requireNonNull(response.getBody(), "Response body should not be null");
    }

    @Test
    @DisplayName("handleInvalidRequest: when field errors exist -> summary message includes count")
    void handleInvalidRequest_withFieldErrors_summarizesCount() {
        InvalidRequestException ex = new InvalidRequestException(
            "ignored",
            Map.of("sku", "must match pattern", "price", "must be positive")
        );

        ResponseEntity<ErrorResponse> response = handler.handleInvalidRequest(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Validation failed: 2 field error(s)", body(response).getMessage());
    }

    @Test
    @DisplayName("handleInvalidRequest: no field errors + non-null message -> uses exception message")
    void handleInvalidRequest_noFieldErrors_usesMessage() {
        InvalidRequestException ex = new InvalidRequestException("Start date must be before end date");

        ResponseEntity<ErrorResponse> response = handler.handleInvalidRequest(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Start date must be before end date", body(response).getMessage());
    }

    @Test
    @DisplayName("handleInvalidRequest: no field errors + null message -> falls back to 'Invalid request'")
    void handleInvalidRequest_noFieldErrors_nullMessage_fallback() {
        // Use the (String) overload explicitly to ensure the message is actually null.
        InvalidRequestException ex = new InvalidRequestException((String) null);

        ResponseEntity<ErrorResponse> response = handler.handleInvalidRequest(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Invalid request", body(response).getMessage());
    }

    @Test
    @DisplayName("handleDuplicateResource: when detailed context exists -> uses client message")
    void handleDuplicateResource_withDetailedContext_usesClientMessage() {
        DuplicateResourceException ex = DuplicateResourceException.inventoryItemSku("SKU-123");

        ResponseEntity<ErrorResponse> response = handler.handleDuplicateResource(ex);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("InventoryItem with sku 'SKU-123' already exists", body(response).getMessage());
    }

    @Test
    @DisplayName("handleDuplicateResource: no detailed context + non-null message -> uses exception message")
    void handleDuplicateResource_noDetailedContext_usesMessage() {
        DuplicateResourceException ex = new DuplicateResourceException("Item name already exists");

        ResponseEntity<ErrorResponse> response = handler.handleDuplicateResource(ex);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("Item name already exists", body(response).getMessage());
    }

    @Test
    @DisplayName("handleDuplicateResource: no detailed context + null message -> falls back to 'Duplicate resource'")
    void handleDuplicateResource_noDetailedContext_nullMessage_fallback() {
        // As above: explicit (String) overload ensures the message is truly null.
        DuplicateResourceException ex = new DuplicateResourceException((String) null);

        ResponseEntity<ErrorResponse> response = handler.handleDuplicateResource(ex);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("Duplicate resource", body(response).getMessage());
    }

    @Test
    @DisplayName("handleBusinessStateConflict: non-blank message -> uses message")
    void handleBusinessStateConflict_nonBlankMessage() {
        IllegalStateException ex = new IllegalStateException("Cannot delete supplier with active inventory");

        ResponseEntity<ErrorResponse> response = handler.handleBusinessStateConflict(ex);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("Cannot delete supplier with active inventory", body(response).getMessage());
    }

    @Test
    @DisplayName("handleBusinessStateConflict: blank message -> falls back to 'Business rule conflict'")
    void handleBusinessStateConflict_blankMessage_fallback() {
        // Blank message should behave the same as null: handler must not leak empties to clients.
        IllegalStateException ex = new IllegalStateException("   ");

        ResponseEntity<ErrorResponse> response = handler.handleBusinessStateConflict(ex);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("Business rule conflict", body(response).getMessage());
    }

    @Test
    @DisplayName("handleBusinessStateConflict: null message -> falls back to 'Business rule conflict'")
    void handleBusinessStateConflict_nullMessage_fallback() {
        // Null message should trigger a stable fallback message.
        IllegalStateException ex = new IllegalStateException((String) null);

        ResponseEntity<ErrorResponse> response = handler.handleBusinessStateConflict(ex);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("Business rule conflict", body(response).getMessage());
    }
}
