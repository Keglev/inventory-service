package com.smartsupplypro.inventory.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;
import java.util.NoSuchElementException;

/**
 * Global exception handler for REST API error responses.
 *
 * <p>Handles both standard Spring exceptions and custom domain-specific ones,
 * and maps them to structured JSON responses with appropriate HTTP status codes.
 *
 * <p>This centralized handler ensures consistent error formats across all controllers.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handles validation errors triggered by {@code @Valid} annotations.
     *
     * @param ex validation exception with field-specific errors
     * @return HTTP 400 with a map of field -> validation message
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
            errors.put(error.getField(), error.getDefaultMessage()));
        return new ResponseEntity<>(errors, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handles general {@link IllegalArgumentException}, typically thrown from service layers.
     *
     * @param ex the exception thrown
     * @return HTTP 400 with the exception message in JSON format
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        System.out.println("GlobalExceptionHandler triggered with message: " + ex.getMessage());
        Map<String, String> body = new HashMap<>();
        body.put("error", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body);
    }

    /**
     * Handles missing request parameters in GET/POST methods.
     *
     * @param ex Spring's missing parameter exception
     * @return HTTP 400 with a descriptive message
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<String> handleMissingParam(MissingServletRequestParameterException ex) {
        return ResponseEntity.badRequest().body("Missing required parameter: " + ex.getParameterName());
    }

    /**
     * Handles {@link NoSuchElementException} when a resource is not found.
     *
     * @param ex exception thrown when searching for non-existent resource
     * @return HTTP 404 Not Found with message
     */
    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<String> handleNotFound(NoSuchElementException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }

    /**
     * Handles custom {@link DuplicateResourceException} used for uniqueness constraint violations.
     *
     * @param ex duplicate resource exception
     * @return HTTP 409 Conflict with error message
     */
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<Map<String, String>> handleDuplicateResource(DuplicateResourceException ex) {
        Map<String, String> body = new HashMap<>();
        body.put("error", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body);
    }

    /**
     * Handles {@link IllegalStateException} which may indicate a business rule violation.
     *
     * @param ex the illegal state exception
     * @return HTTP 409 Conflict (or 400 if preferred), with message
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleIllegalState(IllegalStateException ex) {
        Map<String, String> body = new HashMap<>();
        body.put("error", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.CONFLICT) // optionally change to BAD_REQUEST
                .body(body);
    }

    /**
     * Handles {@link ResponseStatusException} thrown manually with custom HTTP status codes.
     *
     * @param ex Spring's generic exception wrapper with status code and reason
     * @return structured error message based on embedded status and reason
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleResponseStatus(ResponseStatusException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", ex.getStatusCode().toString().toLowerCase());
        error.put("message", ex.getReason());
        return ResponseEntity.status(ex.getStatusCode()).body(error);
    }
}
