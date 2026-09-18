package com.smartsupplypro.inventory.exception;

import java.util.Objects;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.smartsupplypro.inventory.exception.dto.ErrorResponse;

/**
 * Tests HTTP error response mapping in {@link BusinessExceptionHandler}.
 */
class BusinessExceptionHandlerTest {

    private final BusinessExceptionHandler handler = new BusinessExceptionHandler();

    private static ErrorResponse body(ResponseEntity<ErrorResponse> r) {
        return Objects.requireNonNull(r.getBody(), "Response body should not be null");
    }

    /** 400 responses when the request fails validation or a business rule is broken. */
    @Nested class WhenInvalidRequest {
        @Test void should_use_the_exception_message_when_the_request_is_invalid() {
            var response = handler.handleInvalidRequest(
                new InvalidRequestException("Start date must be before end date"));
            assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
            assertEquals("Start date must be before end date", body(response).message());
        }

        @Test void should_fall_back_to_the_default_when_the_invalid_request_message_is_null() {
            var response = handler.handleInvalidRequest(new InvalidRequestException((String) null));
            assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
            assertEquals("Invalid request", body(response).message());
        }
    }

    /** 409 responses when a resource with the same identifier already exists. */
    @Nested class WhenDuplicateResource {
        @Test void should_use_the_exception_message_when_the_resource_is_duplicate() {
            var response = handler.handleDuplicateResource(
                new DuplicateResourceException("Item name already exists"));
            assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
            assertEquals("Item name already exists", body(response).message());
        }

        @Test void should_fall_back_to_the_default_when_the_duplicate_message_is_null() {
            var response = handler.handleDuplicateResource(new DuplicateResourceException((String) null));
            assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
            assertEquals("Duplicate resource", body(response).message());
        }

        @Test
        @DisplayName("duplicate with field: response carries fieldErrors map")
        void should_carry_field_errors_when_the_duplicate_names_a_field() {
            var response = handler.handleDuplicateResource(
                new DuplicateResourceException("An inventory item with this SKU already exists.", "sku"));
            assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
            assertEquals("An inventory item with this SKU already exists.",
                body(response).fieldErrors().get("sku"));
        }

        @Test
        @DisplayName("duplicate without field: fieldErrors is absent")
        void should_omit_field_errors_when_the_duplicate_names_no_field() {
            var response = handler.handleDuplicateResource(
                new DuplicateResourceException("Duplicate resource"));
            assertEquals(null, body(response).fieldErrors());
        }
    }

    /** 409 responses when a business state transition is invalid. */
    @Nested class WhenBusinessConflict {
        @Test void should_use_the_exception_message_when_the_business_state_conflicts() {
            var response = handler.handleBusinessStateConflict(
                new IllegalStateException("Cannot delete supplier with active inventory"));
            assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
            assertEquals("Cannot delete supplier with active inventory", body(response).message());
        }

        @Test void should_fall_back_to_the_default_when_the_conflict_message_is_blank() {
            var response = handler.handleBusinessStateConflict(new IllegalStateException("   "));
            assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
            assertEquals("Business rule conflict", body(response).message());
        }

        @Test void should_fall_back_to_the_default_when_the_conflict_message_is_null() {
            var response = handler.handleBusinessStateConflict(new IllegalStateException((String) null));
            assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
            assertEquals("Business rule conflict", body(response).message());
        }
    }
}
