package com.smartsupplypro.inventory.exception;

import java.time.Instant;
import java.util.NoSuchElementException;
import java.util.LinkedHashMap;
import java.util.Map;

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
 * Fallback exception handler for framework-level exceptions not covered by {@link BusinessExceptionHandler}.
 */
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
@RestControllerAdvice
public class GlobalExceptionHandler {

    /** Handles {@code @Valid} validation failures; reports every field error. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(fe ->
            fieldErrors.putIfAbsent(fe.getField(), sanitize(fe.getDefaultMessage())));
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(fe -> fe.getField() + " " + fe.getDefaultMessage())
                .orElse("Validation failed");
        return respond(HttpStatus.BAD_REQUEST, sanitize(message),
            fieldErrors.isEmpty() ? null : fieldErrors);
    }

    /** Handles JSR-380 constraint violations ({@code @NotNull}, {@code @Size}). */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraint(ConstraintViolationException ex) {
        String message = ex.getConstraintViolations().stream()
                .findFirst()
                .map(v -> v.getPropertyPath() + " " + v.getMessage())
                .orElse("Constraint violation");
        return respond(HttpStatus.BAD_REQUEST, sanitize(message));
    }

    /** Handles malformed JSON payloads and deserialization errors. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleParsingError(HttpMessageNotReadableException ex) {
        return respond(HttpStatus.BAD_REQUEST, "Request body is invalid or unreadable");
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
        return respond(HttpStatus.BAD_REQUEST, message);
    }

    /** Returns a generic 401 to prevent authentication mechanism enumeration. */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthentication(AuthenticationException ex) {
        return respond(HttpStatus.UNAUTHORIZED, "Authentication required");
    }

    /** Returns a generic 403; detects demo-mode restriction for a user-friendly message. */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        String message = (ex.getMessage() != null && ex.getMessage().contains("principal.isDemo"))
            ? "You are in demo mode and cannot perform this operation."
            : "You are not allowed to perform this operation.";
        return respond(HttpStatus.FORBIDDEN, sanitize(message));
    }

    /** Handles resource lookup failures from repositories and the service layer. */
    @ExceptionHandler({NoSuchElementException.class, IllegalArgumentException.class})
    public ResponseEntity<ErrorResponse> handleNotFound(RuntimeException ex) {
        String message = (ex.getMessage() != null && !ex.getMessage().isBlank())
            ? ex.getMessage()
            : "Resource not found";
        return respond(HttpStatus.NOT_FOUND, sanitize(message));
    }

    /** Handles missing static resources with no response body. */
    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public void handleStaticResource() {
        // No body — standard 404 for static assets
    }

    /** Sanitizes SQL details before returning a conflict message. */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrity(DataIntegrityViolationException ex) {
        return respond(HttpStatus.CONFLICT, "Data conflict - constraint violation");
    }

    /** Handles JPA optimistic locking failures during concurrent updates. */
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ErrorResponse> handleOptimisticLock(ObjectOptimisticLockingFailureException ex) {
        return respond(HttpStatus.CONFLICT, "Concurrent update detected - please refresh and retry");
    }

    /** Handles explicit {@link ResponseStatusException}; preserves the original status. */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleResponseStatus(ResponseStatusException ex,
                                                               HttpServletRequest request) {
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        String reason = ex.getReason();
        String message = (reason != null && !reason.isBlank())
            ? reason
            : (status != null ? status.getReasonPhrase() : "Request failed");
        return respond(status != null ? status : HttpStatus.INTERNAL_SERVER_ERROR, sanitize(message));
    }

    /** Prevents stack trace exposure for unhandled exceptions. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex) {
        return respond(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected server error");
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

    /** Strips file paths, class names, SQL fragments, and credentials from error messages. */
    private String sanitize(String message) {
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
