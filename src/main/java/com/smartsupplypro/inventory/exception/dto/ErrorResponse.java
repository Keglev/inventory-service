package com.smartsupplypro.inventory.exception.dto;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Error response payload returned for all handled exceptions.
 *
 * <p>The optional {@code fieldErrors} map attributes an error to specific
 * request fields (field name to message). It is omitted from the JSON
 * payload when absent, so responses without field context keep the
 * original three-key envelope.</p>
 *
 * @param error       normalized HTTP status token (e.g., {@code "bad_request"})
 * @param message     human-readable error description
 * @param timestamp   ISO-8601 time the error occurred
 * @param fieldErrors optional map of field name to field-specific message
 */
public record ErrorResponse(
        String error,
        String message,
        String timestamp,
        @JsonInclude(JsonInclude.Include.NON_NULL) Map<String, String> fieldErrors) {

    /** Convenience constructor for errors without field attribution. */
    public ErrorResponse(String error, String message, String timestamp) {
        this(error, message, timestamp, null);
    }
}
