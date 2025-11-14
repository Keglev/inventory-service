package com.smartsupplypro.inventory.exception;

import java.util.NoSuchElementException;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
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

import com.smartsupplypro.inventory.exception.dto.ErrorResponse;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;

/**
 * Enterprise global exception handler for REST API standardization.
 *
 * <p>Handles framework-level exceptions (validation, security, HTTP). Domain business
 * logic exceptions are handled by {@link BusinessExceptionHandler}.
 *
 * <p><strong>Status Mapping</strong>: 400 (validation), 401 (auth), 403 (authz),
 * 404 (not found), 409 (conflicts), 500 (unexpected).
 * 
 * @author Smart Supply Pro Development Team
 * @version 2.0.0
 * @see BusinessExceptionHandler
 * @see ErrorResponse
 */
@Order(Ordered.HIGHEST_PRECEDENCE + 1)  // Runs after BusinessExceptionHandler as a catch-all
@RestControllerAdvice
public class GlobalExceptionHandler {

    /* =======================================================================
     * 400 BAD REQUEST - Validation & Parameter Errors
     * ======================================================================= */

    /** Handles {@code @Valid} validation failures. Extracts first field error. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(fe -> fe.getField() + " " + fe.getDefaultMessage())
                .orElse("Validation failed");
        
        return ErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST)
                .message(sanitize(message))
                .build();
    }

    /** Handles JSR-380 constraint violations ({@code @NotNull}, {@code @Size}). */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraint(ConstraintViolationException ex) {
        String message = ex.getConstraintViolations().stream()
                .findFirst()
                .map(v -> v.getPropertyPath() + " " + v.getMessage())
                .orElse("Constraint violation");
        
        return ErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST)
                .message(sanitize(message))
                .build();
    }

    /** Handles malformed JSON payloads and deserialization errors. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleParsingError(HttpMessageNotReadableException ex) {
        return ErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST)
                .message("Request body is invalid or unreadable")
                .build();
    }

    /** Handles missing parameters and type conversion failures. */
    @ExceptionHandler({
        MissingServletRequestParameterException.class,
        MethodArgumentTypeMismatchException.class
    })
    public ResponseEntity<ErrorResponse> handleParameterError(Exception ex) {
        String message;
        if (ex instanceof MissingServletRequestParameterException missingParam) {
            message = "Missing required parameter: " + missingParam.getParameterName();
        } else if (ex instanceof MethodArgumentTypeMismatchException typeMismatch) {
            message = "Invalid parameter value: " + (typeMismatch.getName() != null ? typeMismatch.getName() : "unknown");
        } else {
            message = "Invalid parameter";
        }
        
        return ErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST)
                .message(message)
                .build();
    }

    /* =======================================================================
     * 401 / 403 - Security & Authorization
     * ======================================================================= */

    /** Handles authentication failures. Returns generic message to prevent enumeration. */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthentication(AuthenticationException ex) {
        return ErrorResponse.builder()
                .status(HttpStatus.UNAUTHORIZED)
                .message("Authentication required")
                .build();
    }

    /** Handles authorization failures. Returns generic message to prevent enumeration. */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAuthorization(AccessDeniedException ex) {
        return ErrorResponse.builder()
                .status(HttpStatus.FORBIDDEN)
                .message("Access denied")
                .build();
    }

    /* =======================================================================
     * 404 - Resource Not Found
     * ======================================================================= */

    /** Handles resource lookup failures from repositories and service layer. */
    @ExceptionHandler({NoSuchElementException.class, IllegalArgumentException.class})
    public ResponseEntity<ErrorResponse> handleNotFound(RuntimeException ex) {
        String message = (ex.getMessage() != null && !ex.getMessage().isBlank())
            ? ex.getMessage()
            : "Resource not found";
        
        return ErrorResponse.builder()
                .status(HttpStatus.NOT_FOUND)
                .message(sanitize(message))
                .build();
    }

    /** Handles missing static resources (CSS, JS, images) with no response body. */
    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public void handleStaticResource() {
        // No body - standard 404 for static resources
    }

    /* =======================================================================
     * 409 - Data Conflicts
     * ======================================================================= */

    /** Handles database constraint violations. Sanitizes SQL to prevent disclosure. */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrity(DataIntegrityViolationException ex) {
        return ErrorResponse.builder()
                .status(HttpStatus.CONFLICT)
                .message("Data conflict - constraint violation")
                .build();
    }

    /** Handles JPA optimistic locking failures during concurrent updates. */
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ErrorResponse> handleOptimisticLock(ObjectOptimisticLockingFailureException ex) {
        return ErrorResponse.builder()
                .status(HttpStatus.CONFLICT)
                .message("Concurrent update detected - please refresh and retry")
                .build();
    }

    /* =======================================================================
     * Pass-Through & Fallback
     * ======================================================================= */

    /** Handles explicit {@link ResponseStatusException}. Preserves original status. */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleResponseStatus(ResponseStatusException ex,
                                                               HttpServletRequest request) {
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        String reason = ex.getReason();  // Store to avoid multiple null-check warnings
        String message = (reason != null && !reason.isBlank())
            ? reason
            : (status != null ? status.getReasonPhrase() : "Request failed");
        
        return ErrorResponse.builder()
                .status(status != null ? status : HttpStatus.INTERNAL_SERVER_ERROR)
                .message(sanitize(message))
                .build();
    }

    /** 
     * Enterprise safety net for unhandled exceptions. Prevents stack trace exposure.
     * <p><strong>Production</strong>: Add ERROR-level logging with correlation ID.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex) {
        return ErrorResponse.builder()
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .message("Unexpected server error")
                .build();
    }

    /* =======================================================================
     * Security - Message Sanitization
     * ======================================================================= */

    /**
     * Sanitizes error messages to prevent sensitive information disclosure.
     * Removes file paths, class names, SQL fragments, and credentials.
     */
    private String sanitize(String message) {
        if (message == null) return "Unknown error";
        
        return message
            .replaceAll("\\b[A-Za-z]:\\\\[\\w\\\\.-]+", "[PATH]")           // Windows paths
            .replaceAll("/[\\w/.-]+\\.(java|class)", "[INTERNAL]")         // Unix paths
            .replaceAll("\\bcom\\.smartsupplypro\\.[\\w.]+", "[INTERNAL]") // Package names
            .replaceAll("(?i)\\bSQL.*", "Database operation failed")       // SQL fragments
            .replaceAll("(?i)\\bPassword.*", "Authentication failed")      // Credentials
            .replaceAll("(?i)\\bToken.*", "Authentication failed")         // Tokens
            .trim();
    }
}
