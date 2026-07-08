package com.smartsupplypro.inventory.exception;

import java.time.Instant;
import java.util.Map;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.smartsupplypro.inventory.exception.dto.ErrorResponse;

/**
 * Handles domain exceptions before the fallback {@link GlobalExceptionHandler}.
 */
@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice
public class BusinessExceptionHandler {

    /** Maps {@link InvalidRequestException} to 400 Bad Request. */
    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<ErrorResponse> handleInvalidRequest(InvalidRequestException ex) {
        String message = ex.getMessage() != null ? ex.getMessage() : "Invalid request";
        return respond(HttpStatus.BAD_REQUEST, message);
    }

    /** Maps {@link DuplicateResourceException} to 409 Conflict, attaching the offending field when present. */
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateResource(DuplicateResourceException ex) {
        String message = ex.getMessage() != null ? ex.getMessage() : "Duplicate resource";
        Map<String, String> fieldErrors = ex.getField() != null
            ? Map.of(ex.getField(), message)
            : null;
        return respond(HttpStatus.CONFLICT, message, fieldErrors);
    }

    /** Maps {@link IllegalStateException} (business-rule violation) to 409 Conflict. */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleBusinessStateConflict(IllegalStateException ex) {
        String message = (ex.getMessage() != null && !ex.getMessage().isBlank())
            ? ex.getMessage()
            : "Business rule conflict";
        return respond(HttpStatus.CONFLICT, message);
    }

    private ResponseEntity<ErrorResponse> respond(HttpStatus status, String message) {
        return respond(status, message, null);
    }

    private ResponseEntity<ErrorResponse> respond(HttpStatus status, String message,
                                                  Map<String, String> fieldErrors) {
        return ResponseEntity.status(status)
            .body(new ErrorResponse(status.name().toLowerCase(), message,
                Instant.now().toString(), fieldErrors));
    }
}
