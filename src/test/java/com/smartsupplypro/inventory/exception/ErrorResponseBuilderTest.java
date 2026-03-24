package com.smartsupplypro.inventory.exception;

import java.lang.reflect.Field;
import java.util.Objects;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import com.smartsupplypro.inventory.exception.dto.ErrorResponse;

/**
 * Unit tests for {@link ErrorResponse.Builder}.
 *
 * <h2>Scope</h2>
 * These tests validate the <em>builder contract</em> used by exception handlers to produce a standardized
 * {@link ErrorResponse} payload wrapped in a {@link ResponseEntity}. The builder is a critical boundary:
 * it shapes the API's error semantics and ensures responses are consistently JSON.
 *
 * <h2>Why this matters</h2>
 * <ul>
 *   <li><strong>Client reliability</strong>: Frontend code depends on stable tokens ({@code error}) and message defaults.</li>
 *   <li><strong>Operational support</strong>: Correlation IDs must be present and well-formed for tracing.</li>
 *   <li><strong>Coverage</strong>: The builder contains multiple fallback branches that controller tests typically do not hit.</li>
 * </ul>
 *
 * <h2>Test strategy</h2>
 * <ul>
 *   <li>Exercise message fallback paths (explicit message vs blank/null, with/without status set).</li>
 *   <li>Exercise auto-generation paths for timestamp/correlationId.</li>
 *   <li>Use reflection only to preset internal fields to cover the “already set” branches.
 *       This does not test reflection; it locks down behavior that is otherwise unreachable via the public API.</li>
 * </ul>
 */
class ErrorResponseBuilderTest {

    private static ErrorResponse body(ResponseEntity<ErrorResponse> response) {
        return Objects.requireNonNull(response.getBody(), "Response body should not be null");
    }

    private static void setPrivateField(Object target, String fieldName, Object value) {
        try {
            Field f = target.getClass().getDeclaredField(fieldName);
            f.setAccessible(true);
            f.set(target, value);
        } catch (ReflectiveOperationException | SecurityException e) {
            throw new IllegalStateException("Unable to set field '%s' via reflection".formatted(fieldName), e);
        }
    }

    @Test
    @DisplayName("build: explicit status+message yields JSON ResponseEntity and derived error token")
    void build_explicitStatusAndMessage_yieldsJsonResponse_andDerivedErrorToken() {
        // Arrange: a normal, explicit message should bypass all fallback paths.
        ResponseEntity<ErrorResponse> response = ErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST)
                .message("Invalid email format")
                .build();

        // Assert: envelope fields (status + JSON content type).
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals(MediaType.APPLICATION_JSON, response.getHeaders().getContentType());

        // Assert: payload fields.
        ErrorResponse payload = body(response);
        assertEquals("bad_request", payload.getError());
        assertEquals("Invalid email format", payload.getMessage());
        assertNotNull(payload.getTimestamp());

        // Correlation format: SSP-{millis}-{4 digits}.
        assertNotNull(payload.getCorrelationId());
        assertTrue(payload.getCorrelationId().matches("SSP-\\d+-\\d{4}"));
    }

    @Test
    @DisplayName("message: null/blank falls back to HTTP reason phrase when status is set")
    void message_nullOrBlank_fallsBackToReasonPhrase_whenStatusIsSet() {
        // Arrange: use NOT_FOUND so the expected reason phrase is stable ("Not Found").
        ResponseEntity<ErrorResponse> response = ErrorResponse.builder()
                .status(HttpStatus.NOT_FOUND)
                .message(null)
                .build();

        // Assert: message becomes the reason phrase.
        assertEquals("Not Found", body(response).getMessage());
    }

    @Test
    @DisplayName("message: blank before status falls back to 'Unknown error' (status not yet available)")
    void message_blankBeforeStatus_fallsBackToUnknownError() {
        // Arrange: call message first so the Builder evaluates its fallback with status == null.
        ResponseEntity<ErrorResponse> response = ErrorResponse.builder()
                .message("   ")
                .status(HttpStatus.BAD_REQUEST)
                .build();

        // Assert: the builder must not rewrite the already-derived fallback message.
        assertEquals("Unknown error", body(response).getMessage());
    }

    @Test
    @DisplayName("build: does not overwrite preset timestamp/correlationId (covers non-null branches)")
    void build_doesNotOverwritePresetTimestampOrCorrelationId() {
        // Arrange: use the public API for the standard required inputs.
        ErrorResponse.Builder builder = ErrorResponse.builder()
                .status(HttpStatus.CONFLICT)
                .message("Resource already exists");

        // Force the "already set" branches in build() that are otherwise unreachable (no public setters).
        setPrivateField(builder, "timestamp", "2026-03-24T00:00:00Z");
        setPrivateField(builder, "correlationId", "SSP-1700000000000-1234");

        // Act.
        ResponseEntity<ErrorResponse> response = builder.build();

        // Assert: provided values remain unchanged.
        ErrorResponse payload = body(response);
        assertEquals("2026-03-24T00:00:00Z", payload.getTimestamp());
        assertEquals("SSP-1700000000000-1234", payload.getCorrelationId());
    }

    @Test
    @DisplayName("build: status is required (defensive contract check)")
    void build_requiresStatus() {
        // Arrange/Act/Assert: without status, ResponseEntity.status(status) is invalid and should fail fast.
        RuntimeException thrown = assertThrows(RuntimeException.class, () -> ErrorResponse.builder()
                .message("any")
                .build());

        // The exception type may vary by Spring version (null-check strategy), but it must be thrown.
        assertNotNull(thrown);
    }
}
