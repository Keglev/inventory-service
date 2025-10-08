package com.smartsupplypro.inventory.exception;

import java.util.HashMap;
import java.util.Map;
import java.util.NoSuchElementException;

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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;

/**
 * Enterprise global exception handler for REST API standardization.
 *
 * <p>Provides unified error response structure, HTTP status code mapping, and consistent
 * client experience across all API endpoints with comprehensive exception translation.
 *
 * <p><strong>Response Format</strong>: {@code {"error": "status_token", "message": "description"}}
 * 
 * <p><strong>Status Mapping Strategy</strong>:
 * <ul>
 *   <li><strong>400</strong> – Client validation errors, malformed requests, parameter issues</li>
 *   <li><strong>401</strong> – Authentication failures, missing credentials</li>
 *   <li><strong>403</strong> – Authorization failures, insufficient permissions</li>
 *   <li><strong>404</strong> – Resource not found, invalid endpoints</li>
 *   <li><strong>409</strong> – Business conflicts, constraint violations, concurrent updates</li>
 *   <li><strong>500</strong> – Unhandled server errors, system failures</li>
 * </ul>
 * 
 * <p>Key integrations: REST controllers, Service validation, Security framework, Data layer.
 * 
 * @author Smart Supply Pro Development Team
 * @version 1.0.0
 * @since 1.0.0
 */
@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice
public class GlobalExceptionHandler {

    /* =======================================================================
     * Helpers
     * ======================================================================= */

    /**
     * Constructs standardized JSON error response with HTTP status mapping.
     *
     * <p>Ensures consistent API contract with normalized error tokens and
     * human-readable messages for reliable client error handling.
     * 
     * @param status HTTP status code for response
     * @param message descriptive error message for client
     * @return standardized JSON error response entity
     */
    private ResponseEntity<Map<String, String>> body(HttpStatus status, String message) {
        Map<String, String> map = new HashMap<>();
        map.put("error", errorCode(status));
        map.put("message", nonEmpty(message, status.getReasonPhrase()));
        map.put("timestamp", java.time.Instant.now().toString());
        map.put("correlationId", generateCorrelationId());
        return ResponseEntity.status(status)
                .contentType(MediaType.APPLICATION_JSON)
                .body(map);
    }

    /**
     * Generates unique correlation ID for request tracking and debugging.
     * 
     * @return formatted correlation ID
     */
    private String generateCorrelationId() {
        return "SSP-" + System.currentTimeMillis() + "-" + 
               java.util.concurrent.ThreadLocalRandom.current().nextInt(1000, 9999);
    }

    /**
     * Sanitizes error messages to prevent sensitive information disclosure.
     * 
     * @param message original error message
     * @return sanitized message safe for client response
     */
    private String sanitizeMessage(String message) {
        if (message == null) return "Unknown error";
        
        // Remove sensitive patterns
        return message
            .replaceAll("\\b[A-Za-z]:\\\\[\\w\\\\.-]+", "[PATH]")
            .replaceAll("\\bcom\\.smartsupplypro\\.[\\w.]+", "[INTERNAL]")
            .replaceAll("\\bSQL.*", "Database operation failed")
            .replaceAll("\\bPassword.*", "Authentication failed")
            .replaceAll("\\bToken.*", "Authentication failed")
            .trim();
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
     * Handles custom application validation failures with business context.
     * 
     * @param ex application-specific validation exception
     * @return 400 Bad Request with validation details
     */
    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<Map<String, String>> handleInvalid(InvalidRequestException ex) {
        String message = ex.hasFieldErrors() ? 
            "Validation failed: " + ex.getFieldErrors().size() + " field error(s)" :
            nonEmpty(ex.getMessage(), "Invalid request");
        
        // Use sanitized message for response
        return body(HttpStatus.BAD_REQUEST, sanitizeMessage(message));
    }

    /**
     * Bean validation failures on request bodies with enhanced field error extraction.
     * 
     * @param ex Spring validation exception with field-level details
     * @return 400 Bad Request with specific field validation errors
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        String first = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(fe -> fe.getField() + " " + fe.getDefaultMessage())
                .orElse("Validation failed");
        return body(HttpStatus.BAD_REQUEST, sanitizeMessage(first));
    }

    /**
     * Constraint validation failures with enhanced error path extraction.
     * 
     * @param ex constraint violation exception with validation details
     * @return 400 Bad Request with constraint violation details
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, String>> handleConstraintViolation(ConstraintViolationException ex) {
        String first = ex.getConstraintViolations().stream()
                .findFirst()
                .map(v -> v.getPropertyPath() + " " + v.getMessage())
                .orElse("Constraint violation");
        return body(HttpStatus.BAD_REQUEST, sanitizeMessage(first));
    }

    /**
     * JSON parsing failures with enhanced error context.
     * 
     * @param ex HTTP message parsing exception
     * @return 400 Bad Request with parsing error details
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> handleNotReadable(HttpMessageNotReadableException ex) {
        return body(HttpStatus.BAD_REQUEST, sanitizeMessage("Request body is invalid or unreadable"));
    }

    /**
     * Missing required request parameters with parameter identification.
     * 
     * @param ex missing parameter exception with parameter details
     * @return 400 Bad Request with missing parameter information
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<Map<String, String>> handleMissingParam(MissingServletRequestParameterException ex) {
        return body(HttpStatus.BAD_REQUEST, "Missing required parameter: " + ex.getParameterName());
    }

    /**
     * Parameter type conversion failures with field identification.
     * 
     * @param ex type mismatch exception with parameter details
     * @return 400 Bad Request with type conversion error
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, String>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return body(HttpStatus.BAD_REQUEST, "Invalid value for: " + ex.getName());
    }

    /* =======================================================================
     * 401 / 403 Security
     * ======================================================================= */

    /**
     * Authentication failures with secure error response for credential issues.
     * 
     * @param ex Spring Security authentication exception
     * @return 401 Unauthorized with generic authentication message
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, String>> handleAuthentication(AuthenticationException ex) {
        return body(HttpStatus.UNAUTHORIZED, "Authentication required");
    }

    /**
     * Authorization failures with role-based access control enforcement.
     * 
     * @param ex Spring Security access denied exception  
     * @return 403 Forbidden with generic access denied message
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDenied(AccessDeniedException ex) {
        return body(HttpStatus.FORBIDDEN, "Access denied");
    }

    /* =======================================================================
     * 404 Not Found
     * ======================================================================= */

    /**
     * Resource existence validation failures with sanitized error messages.
     * 
     * @param ex illegal argument exception indicating resource not found
     * @return 404 Not Found with sanitized resource identification
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        return body(HttpStatus.NOT_FOUND, sanitizeMessage(nonEmpty(ex.getMessage(), "Resource not found")));
    }

    /**
     * Repository lookup failures with enhanced error context.
     * 
     * @param ex no such element exception from repository operations
     * @return 404 Not Found with sanitized error details
     */
    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, String>> handleNoSuchElement(NoSuchElementException ex) {
        return body(HttpStatus.NOT_FOUND, sanitizeMessage(nonEmpty(ex.getMessage(), "Resource not found")));
    }

    /**
     * Static resource access failures for missing web assets.
     * 
     * @return 404 Not Found with no response body for resource efficiency
     */
    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public void notFound() { /* no body */ }

    /* =======================================================================
     * 409 Conflict
     * ======================================================================= */

    /**
     * Handles enterprise duplicate resource violations with conflict resolution.
     * 
     * @param ex business rule uniqueness constraint exception
     * @return 409 Conflict with resource conflict details
     */
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<Map<String, String>> handleDuplicate(DuplicateResourceException ex) {
        String message = ex.hasDetailedContext() ? 
            ex.getClientMessage() : 
            nonEmpty(ex.getMessage(), "Duplicate resource");
        
        return body(HttpStatus.CONFLICT, sanitizeMessage(message));
    }

    /**
     * Database constraint violations with enterprise conflict resolution.
     * 
     * @param ex Spring Data integrity violation exception
     * @return 409 Conflict with sanitized database constraint details
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataIntegrity(DataIntegrityViolationException ex) {
        return body(HttpStatus.CONFLICT, sanitizeMessage("Data conflict"));
    }

    /**
     * Business state violations with operational context preservation.
     * 
     * <p>Handles enterprise business rule conflicts such as deleting suppliers with 
     * active inventory or state transition violations requiring specific conditions.</p>
     * 
     * @param ex illegal state exception indicating business rule violation
     * @return 409 Conflict with business context details
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleIllegalState(IllegalStateException ex) {
        return body(HttpStatus.CONFLICT, sanitizeMessage(nonEmpty(ex.getMessage(), "Business rule conflict")));
    }

    /**
     * Concurrent modification conflicts with optimistic locking support.
     * 
     * @param ex JPA optimistic locking failure exception
     * @return 409 Conflict with concurrent update notification
     */
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<Map<String, String>> handleOptimistic(ObjectOptimisticLockingFailureException ex) {
        return body(HttpStatus.CONFLICT, "Concurrent update detected - please retry");
    }

    /* =======================================================================
     * Pass-through (ResponseStatusException)
     * ======================================================================= */

    /**
     * ResponseStatusException pass-through with status preservation and enhanced tracking.
     * 
     * <p>Maintains original HTTP status codes while adding enterprise tracking capabilities
     * for explicit controller-level exceptions and custom status scenarios.</p>
     * 
     * @param ex response status exception with embedded HTTP status
     * @param request HTTP servlet request for context extraction
     * @return original status code with enhanced error response structure
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleResponseStatus(ResponseStatusException ex,
                                                                     HttpServletRequest request) {
        Map<String, String> map = new HashMap<>();
        map.put("error", ex.getStatusCode().toString().toLowerCase());
        map.put("message", sanitizeMessage(nonEmpty(ex.getReason(), "Request failed")));
        map.put("timestamp", java.time.Instant.now().toString());
        map.put("correlationId", generateCorrelationId());
        return ResponseEntity.status(ex.getStatusCode())
                .contentType(MediaType.APPLICATION_JSON)
                .body(map);
    }

    /* =======================================================================
     * 500 Internal Server Error (safety net)
     * ======================================================================= */

    /**
     * Enterprise safety net for unhandled exceptions with comprehensive error tracking.
     * 
     * <p>Provides stable API contract while preventing sensitive information disclosure.
     * Includes correlation tracking for debugging and monitoring integration.</p>
     * 
     * @param ex any unhandled exception reaching the global handler
     * @return 500 Internal Server Error with sanitized generic message
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleAny(Exception ex) {
        // Note: Consider adding ERROR-level logging with correlation ID for production monitoring
        return body(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected server error");
    }
}
