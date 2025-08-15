package com.smartsupplypro.inventory.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;
import java.util.NoSuchElementException;

/**
 * Global exception translator for REST controllers.
 *
 * <p>Goals:
 * <ul>
 *   <li>Return consistent JSON: {@code {"error": "...", "message": "..."}}</li>
 *   <li>Use appropriate HTTP status codes for each failure class</li>
 *   <li>Keep controllers thin: let exceptions bubble to here</li>
 * </ul>
 *
 * <p>Status mapping (summary):
 * <ul>
 *   <li>400 – Validation / bad input (bean validation, type mismatch, unreadable JSON, missing params)</li>
 *   <li>401 – Authentication failed / missing</li>
 *   <li>403 – Access denied (role/permission)</li>
 *   <li>404 – Resource not found (including existence checks that currently throw IllegalArgumentException)</li>
 *   <li>409 – Conflicts (duplicates, optimistic locking, DB unique constraints)</li>
 *   <li>Pass-through – {@link ResponseStatusException} uses its embedded status</li>
 * </ul>
 */
@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice
public class GlobalExceptionHandler {

    /* ---------- Helpers ---------- */

    private ResponseEntity<Map<String, String>> body(HttpStatus status, String message) {
        Map<String, String> map = new HashMap<>();
        map.put("error", status.toString().toLowerCase()); // e.g. "400 BAD_REQUEST" -> "400 bad_request"
        map.put("message", message == null ? "" : message);
        return ResponseEntity.status(status)
                .contentType(MediaType.APPLICATION_JSON)
                .body(map);
    }

    /* ---------- 400 Bad Request family ---------- */

 
    /** Invalid request */
    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<Map<String, String>> handleInvalid(InvalidRequestException ex) {
        return body(HttpStatus.BAD_REQUEST, nonEmpty(ex.getMessage(), "Invalid request"));
    }

    /** Bean validation on @Valid annotated request bodies. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        String first = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(fe -> fe.getField() + " " + fe.getDefaultMessage())
                .orElse("Validation failed");
        return body(HttpStatus.BAD_REQUEST, first);
    }

    /** Constraint violations on @RequestParam/@PathVariable etc. */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, String>> handleConstraintViolation(ConstraintViolationException ex) {
        String first = ex.getConstraintViolations().stream()
                .findFirst()
                .map(v -> v.getPropertyPath() + " " + v.getMessage())
                .orElse("Constraint violation");
        return body(HttpStatus.BAD_REQUEST, first);
    }

    /** Bad/missing JSON or incompatible payload. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> handleNotReadable(HttpMessageNotReadableException ex) {
        return body(HttpStatus.BAD_REQUEST, "Request body is invalid or unreadable");
    }

    /** Missing required query parameter. */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<Map<String, String>> handleMissingParam(MissingServletRequestParameterException ex) {
        return body(HttpStatus.BAD_REQUEST, "Missing required parameter: " + ex.getParameterName());
    }

    /** Wrong type for a controller method argument. */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, String>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return body(HttpStatus.BAD_REQUEST, "Invalid value for: " + ex.getName());
    }

    /* ---------- 401/403 Security ---------- */

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, String>> handleAuthentication(AuthenticationException ex) {
        return body(HttpStatus.UNAUTHORIZED, "Authentication required");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDenied(AccessDeniedException ex) {
        return body(HttpStatus.FORBIDDEN, "Access denied");
    }

    /* ---------- 404 Not Found ---------- */

    /** For existence checks currently implemented with IllegalArgumentException. */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        return body(HttpStatus.NOT_FOUND, nonEmpty(ex.getMessage(), "Resource not found"));
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, String>> handleNoSuchElement(NoSuchElementException ex) {
        return body(HttpStatus.NOT_FOUND, nonEmpty(ex.getMessage(), "Resource not found"));
    }

    /* ---------- 409 Conflict ---------- */

    /** Your domain-level duplicate key/uniqueness violations. */
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<Map<String, String>> handleDuplicate(DuplicateResourceException ex) {
        return body(HttpStatus.CONFLICT, nonEmpty(ex.getMessage(), "Duplicate resource"));
    }

    /** Database-level unique/index constraints and similar integrity issues. */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataIntegrity(DataIntegrityViolationException ex) {
        return body(HttpStatus.CONFLICT, "Data conflict");
    }

    /** Optimistic locking (if you add @Version). */
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<Map<String, String>> handleOptimistic(ObjectOptimisticLockingFailureException ex) {
        return body(HttpStatus.CONFLICT, "Concurrent update detected");
    }

    /* ---------- Pass-through for precise statuses ---------- */

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleResponseStatus(ResponseStatusException ex, HttpServletRequest request) {
        String msg = nonEmpty(ex.getReason(), "Request failed");
        // Preserve original status from RSE
        Map<String, String> map = new HashMap<>();
        map.put("error", ex.getStatusCode().toString().toLowerCase());
        map.put("message", msg);
        return ResponseEntity.status(ex.getStatusCode())
                .contentType(MediaType.APPLICATION_JSON)
                .body(map);
    }

    /* ---------- Utilities ---------- */

    private static String nonEmpty(String s, String fallback) {
        return (s == null || s.isBlank()) ? fallback : s;
    }
}
