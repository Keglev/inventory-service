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
 * <p><strong>Goals</strong></p>
 * <ul>
 *   <li>Return a consistent, minimal JSON payload: {@code {"error": "...", "message": "..."}}.</li>
 *   <li>Map common error categories to appropriate HTTP status codes.</li>
 *   <li>Keep controllers thin—business and validation exceptions bubble up to here.</li>
 * </ul>
 *
 * <p><strong>Status mapping (summary)</strong></p>
 * <ul>
 *   <li><b>400</b> – Validation / bad input (bean validation, type mismatch, unreadable JSON, missing params)</li>
 *   <li><b>401</b> – Authentication failed / missing</li>
 *   <li><b>403</b> – Access denied (role/permission)</li>
 *   <li><b>404</b> – Resource not found (NoSuchElement, or existence checks)</li>
 *   <li><b>409</b> – Conflicts (duplicates, optimistic locking, DB integrity, state conflicts)</li>
 *   <li><b>RSE</b> – {@link ResponseStatusException} pass‑through (uses embedded status)</li>
 *   <li><b>500</b> – Unhandled errors (as a last‑resort safety net)</li>
 * </ul>
 */
@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice
public class GlobalExceptionHandler {

    /* =======================================================================
     * Helpers
     * ======================================================================= */

    /**
     * Builds a standard JSON error body and wraps it in a {@link ResponseEntity}.
     *
     * <p><b>Contract:</b> The {@code error} field is a normalized, lowercase token derived
     * from the HTTP status (e.g., {@code "bad_request"}, {@code "not_found"}, {@code "conflict"}).
     * The {@code message} field contains a short, human‑readable explanation suitable for clients.</p>
     */
    private ResponseEntity<Map<String, String>> body(HttpStatus status, String message) {
        Map<String, String> map = new HashMap<>();
        map.put("error", errorCode(status));
        map.put("message", nonEmpty(message, status.getReasonPhrase()));
        return ResponseEntity.status(status)
                .contentType(MediaType.APPLICATION_JSON)
                .body(map);
    }

    /** Normalize an HTTP status into a lowercase token (e.g., BAD_REQUEST → "bad_request"). */
    private static String errorCode(HttpStatus status) {
        return status.name().toLowerCase(); // "bad_request", "not_found", "conflict", etc.
    }

    private static String nonEmpty(String s, String fallback) {
        return (s == null || s.isBlank()) ? fallback : s;
    }

    /* =======================================================================
     * 400 Bad Request family
     * ======================================================================= */

    /**
     * Application‑level invalid request (e.g., custom validators).
     * <p>Mapped to <b>400 Bad Request</b>.</p>
     */
    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<Map<String, String>> handleInvalid(InvalidRequestException ex) {
        return body(HttpStatus.BAD_REQUEST, nonEmpty(ex.getMessage(), "Invalid request"));
    }

    /**
     * Bean validation on {@code @Valid} request bodies (e.g., DTO field constraints).
     * <p>Returns the first field error as "<i>field</i> <i>message</i>" for clarity.</p>
     * <p>Mapped to <b>400 Bad Request</b>.</p>
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        String first = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(fe -> fe.getField() + " " + fe.getDefaultMessage())
                .orElse("Validation failed");
        return body(HttpStatus.BAD_REQUEST, first);
    }

    /**
     * Constraint violations on {@code @RequestParam}/{@code @PathVariable} etc.
     * <p>Returns the first violation message.</p>
     * <p>Mapped to <b>400 Bad Request</b>.</p>
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, String>> handleConstraintViolation(ConstraintViolationException ex) {
        String first = ex.getConstraintViolations().stream()
                .findFirst()
                .map(v -> v.getPropertyPath() + " " + v.getMessage())
                .orElse("Constraint violation");
        return body(HttpStatus.BAD_REQUEST, first);
    }

    /**
     * Bad/missing JSON or incompatible payload.
     * <p>Mapped to <b>400 Bad Request</b>.</p>
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> handleNotReadable(HttpMessageNotReadableException ex) {
        return body(HttpStatus.BAD_REQUEST, "Request body is invalid or unreadable");
    }

    /**
     * Missing required query parameter.
     * <p>Mapped to <b>400 Bad Request</b>.</p>
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<Map<String, String>> handleMissingParam(MissingServletRequestParameterException ex) {
        return body(HttpStatus.BAD_REQUEST, "Missing required parameter: " + ex.getParameterName());
    }

    /**
     * Wrong type for a controller method argument (e.g., path or query parameter).
     * <p>Mapped to <b>400 Bad Request</b>.</p>
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, String>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return body(HttpStatus.BAD_REQUEST, "Invalid value for: " + ex.getName());
    }

    /* =======================================================================
     * 401 / 403 Security
     * ======================================================================= */

    /**
     * Authentication failures (missing/invalid credentials).
     * <p>Mapped to <b>401 Unauthorized</b>.</p>
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, String>> handleAuthentication(AuthenticationException ex) {
        return body(HttpStatus.UNAUTHORIZED, "Authentication required");
    }

    /**
     * Authorization failures (insufficient privileges).
     * <p>Mapped to <b>403 Forbidden</b>.</p>
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDenied(AccessDeniedException ex) {
        return body(HttpStatus.FORBIDDEN, "Access denied");
    }

    /* =======================================================================
     * 404 Not Found
     * ======================================================================= */

    /**
     * Existence checks currently signaled with {@link IllegalArgumentException}.
     * <p>Mapped to <b>404 Not Found</b>.</p>
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        return body(HttpStatus.NOT_FOUND, nonEmpty(ex.getMessage(), "Resource not found"));
    }

    /**
     * Resource not found via repository lookups.
     * <p>Mapped to <b>404 Not Found</b>.</p>
     */
    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, String>> handleNoSuchElement(NoSuchElementException ex) {
        return body(HttpStatus.NOT_FOUND, nonEmpty(ex.getMessage(), "Resource not found"));
    }

    /* =======================================================================
     * 409 Conflict
     * ======================================================================= */

    /**
     * Domain‑level duplicate key / uniqueness violations.
     * <p>Mapped to <b>409 Conflict</b>.</p>
     */
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<Map<String, String>> handleDuplicate(DuplicateResourceException ex) {
        return body(HttpStatus.CONFLICT, nonEmpty(ex.getMessage(), "Duplicate resource"));
    }

    /**
     * Database integrity violations (unique index, foreign key, etc.).
     * <p>Mapped to <b>409 Conflict</b>.</p>
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataIntegrity(DataIntegrityViolationException ex) {
        return body(HttpStatus.CONFLICT, "Data conflict");
    }

    /**
     * Business‑rule conflicts (state‑dependent failures).
     *
     * <p>Common examples include attempts to delete a supplier that still has linked inventory
     * items in stock. The request is syntactically valid but cannot be applied in the current
     * domain state.</p>
     *
     * <p>Mapped to <b>409 Conflict</b>.</p>
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleIllegalState(IllegalStateException ex) {
        return body(HttpStatus.CONFLICT, nonEmpty(ex.getMessage(), "Conflict"));
    }

    /**
     * Optimistic locking conflicts (e.g., JPA {@code @Version}).
     * <p>Mapped to <b>409 Conflict</b>.</p>
     */
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<Map<String, String>> handleOptimistic(ObjectOptimisticLockingFailureException ex) {
        return body(HttpStatus.CONFLICT, "Concurrent update detected");
    }

    /* =======================================================================
     * Pass-through (ResponseStatusException)
     * ======================================================================= */

    /**
     * Pass‑through for {@link ResponseStatusException}, preserving the embedded status.
     * <p>Useful for explicit controller rejections such as path/payload mismatches.</p>
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleResponseStatus(ResponseStatusException ex,
                                                                     HttpServletRequest request) {
        Map<String, String> map = new HashMap<>();
        map.put("error", ex.getStatusCode().toString().toLowerCase()); // keep your existing shape here
        map.put("message", nonEmpty(ex.getReason(), "Request failed"));
        return ResponseEntity.status(ex.getStatusCode())
                .contentType(MediaType.APPLICATION_JSON)
                .body(map);
    }

    /* =======================================================================
     * 500 Internal Server Error (safety net)
     * ======================================================================= */

    /**
     * Final safety net for unhandled exceptions. Keeps the API contract stable
     * while surfacing a generic message to clients.
     * <p>Mapped to <b>500 Internal Server Error</b>.</p>
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleAny(Exception ex) {
        // You may want to log at ERROR here with a correlation id if you add one.
        return body(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected server error");
    }
}
