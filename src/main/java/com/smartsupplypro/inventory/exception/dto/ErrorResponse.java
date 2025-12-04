package com.smartsupplypro.inventory.exception.dto;

import java.time.Instant;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

/**
 * Standardized error response builder for enterprise REST API consistency.
 *
 * <p>Provides immutable error response structure with correlation tracking,
 * ISO-8601 timestamps, and normalized HTTP status token mapping for reliable
 * client-side error handling across all API endpoints.
 *
 * <p><strong>Response Structure</strong>:
 * <pre>
 * {
 *   "error": "bad_request",
 *   "message": "Validation failed: email is required",
 *   "timestamp": "2025-11-14T12:34:56.789Z",
 *   "correlationId": "SSP-1700123456789-4523"
 * }
 * </pre>
 *
 * <p><strong>Usage Example</strong>:
 * <pre>
 * return ErrorResponse.builder()
 *     .status(HttpStatus.BAD_REQUEST)
 *     .message("Invalid email format")
 *     .build();
 * </pre>
 *
 * @author Smart Supply Pro Development Team
 * @version 1.0.0
 * @since 1.0.0
 */
public class ErrorResponse {

    private final String error;
    private final String message;
    private final String timestamp;
    private final String correlationId;

    private ErrorResponse(Builder builder) {
        this.error = builder.error;
        this.message = builder.message;
        this.timestamp = builder.timestamp;
        this.correlationId = builder.correlationId;
    }

    /**
     * Creates a new builder instance for fluent error response construction.
     *
     * @return new ErrorResponse builder
     */
    public static Builder builder() {
        return new Builder();
    }

    /**
     * Fluent builder for ErrorResponse construction with validation.
     * @author Smart Supply Pro Development Team
     */
    public static class Builder {
        private String error;
        private String message;
        private String timestamp;
        private String correlationId;
        private HttpStatus status;

        /**
         * Sets HTTP status and derives normalized error token.
         *
         * @param status HTTP status code
         * @return this builder for chaining
         */
        public Builder status(HttpStatus status) {
            this.status = status;
            this.error = status.name().toLowerCase();
            return this;
        }

        /**
         * Sets human-readable error message with fallback to HTTP reason phrase.
         *
         * @param message descriptive error message
         * @return this builder for chaining
         */
        public Builder message(String message) {
            this.message = (message == null || message.isBlank()) 
                ? (status != null ? status.getReasonPhrase() : "Unknown error")
                : message;
            return this;
        }

        /**
         * Builds ResponseEntity with JSON content type and standardized structure.
         *
         * @return complete HTTP response entity with error payload
         */
        public ResponseEntity<ErrorResponse> build() {
            // Auto-generate timestamp and correlation ID if not provided
            if (this.timestamp == null) {
                this.timestamp = Instant.now().toString();
            }
            if (this.correlationId == null) {
                this.correlationId = generateCorrelationId();
            }
            
            ErrorResponse response = new ErrorResponse(this);
            return ResponseEntity.status(status)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        }

        /**
         * Generates unique correlation ID for request tracking.
         *
         * @return formatted correlation ID (SSP-{timestamp}-{random})
         */
        private String generateCorrelationId() {
            return "SSP-" + System.currentTimeMillis() + "-" + 
                   ThreadLocalRandom.current().nextInt(1000, 9999);
        }
    }

    // Getters for JSON serialization
    public String getError() { return error; }
    public String getMessage() { return message; }
    public String getTimestamp() { return timestamp; }
    public String getCorrelationId() { return correlationId; }
}
