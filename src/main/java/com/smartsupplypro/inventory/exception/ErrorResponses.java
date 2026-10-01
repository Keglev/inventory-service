package com.smartsupplypro.inventory.exception;

import java.time.Instant;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.smartsupplypro.inventory.exception.dto.ErrorResponse;

/**
 * Builds the error envelope and scrubs messages for both exception handlers, so every
 * error body has one shape and no message reaches a client without the same scrubbing.
 */
final class ErrorResponses {

    private ErrorResponses() {}

    static ResponseEntity<ErrorResponse> respond(HttpStatus status, String message) {
        return respond(status, message, null);
    }

    static ResponseEntity<ErrorResponse> respond(HttpStatus status, String message,
                                                 Map<String, String> fieldErrors) {
        return ResponseEntity.status(status)
            .body(new ErrorResponse(status.name().toLowerCase(), message,
                Instant.now().toString(), fieldErrors));
    }

    /** Strips file paths, class names, SQL fragments, and credentials from error messages. */
    static String sanitize(String message) {
        if (message == null) return "Unknown error";
        return message
            .replaceAll("\\b[A-Za-z]:\\\\[\\w\\\\.-]+", "[PATH]")
            .replaceAll("/[\\w/.-]+\\.(java|class)", "[INTERNAL]")
            .replaceAll("\\bcom\\.smartsupplypro\\.[\\w.]+", "[INTERNAL]")
            .replaceAll("(?i)\\bSQL.*", "Database operation failed")
            .replaceAll("(?i)\\bPassword.*", "Authentication failed")
            .replaceAll("(?i)\\bToken.*", "Authentication failed")
            .trim();
    }
}
