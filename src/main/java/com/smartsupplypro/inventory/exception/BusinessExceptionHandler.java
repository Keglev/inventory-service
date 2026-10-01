package com.smartsupplypro.inventory.exception;

import java.util.Map;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.smartsupplypro.inventory.exception.dto.ErrorResponse;

import static com.smartsupplypro.inventory.exception.ErrorResponses.respond;
import static com.smartsupplypro.inventory.exception.ErrorResponses.sanitize;

/**
 * Handles domain exceptions before the fallback {@link GlobalExceptionHandler}.
 */
@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice
public class BusinessExceptionHandler {

    /** Maps {@link InvalidRequestException} to 400 Bad Request. */
    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<ErrorResponse> handleInvalidRequest(InvalidRequestException ex) {
        String message = sanitize(ex.getMessage() != null ? ex.getMessage() : "Invalid request");
        return respond(HttpStatus.BAD_REQUEST, message);
    }

    /** Maps {@link DuplicateResourceException} to 409 Conflict, attaching the offending field when present. */
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateResource(DuplicateResourceException ex) {
        String message = sanitize(ex.getMessage() != null ? ex.getMessage() : "Duplicate resource");
        Map<String, String> fieldErrors = ex.getField() != null
            ? Map.of(ex.getField(), message)
            : null;
        return respond(HttpStatus.CONFLICT, message, fieldErrors);
    }

    /**
     * Maps {@link BusinessRuleViolationException} to 409 Conflict. An {@link IllegalStateException}
     * is deliberately not handled here: it also signals internal faults, so it reaches the
     * global fallback, which logs it and answers a generic 500.
     */
    @ExceptionHandler(BusinessRuleViolationException.class)
    public ResponseEntity<ErrorResponse> handleBusinessRuleViolation(BusinessRuleViolationException ex) {
        String message = (ex.getMessage() != null && !ex.getMessage().isBlank())
            ? ex.getMessage()
            : "Business rule conflict";
        return respond(HttpStatus.CONFLICT, sanitize(message));
    }
}
