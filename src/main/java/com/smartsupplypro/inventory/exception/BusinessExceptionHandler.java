package com.smartsupplypro.inventory.exception;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.smartsupplypro.inventory.exception.dto.ErrorResponse;

/**
 * Business exception handler for domain-specific application logic failures.
 *
 * <p>Complements {@link GlobalExceptionHandler} by focusing exclusively on
 * Smart Supply Pro business rules, validation logic, and domain constraints.
 * Provides context-rich error messages for business operations while maintaining
 * consistent REST API error response structure.
 *
 * <p><strong>Scope</strong>: Domain exceptions (DuplicateResourceException,
 * InvalidRequestException, IllegalStateException for business rules).
 *
 * <p><strong>Response Format</strong>: Delegates to {@link ErrorResponse} builder
 * for consistent JSON structure with correlation tracking.
 *
 * <p><strong>Handled Business Scenarios</strong>:
 * <ul>
 *   <li>Duplicate entity creation (email, SKU, supplier name conflicts)</li>
 *   <li>Custom validation failures (business rule violations)</li>
 *   <li>State transition conflicts (e.g., deleting supplier with active inventory)</li>
 * </ul>
 *
 * @author Smart Supply Pro Development Team
 * @version 1.0.0
 * @since 2.0.0
 * @see GlobalExceptionHandler
 * @see ErrorResponse
 */
@Order(Ordered.HIGHEST_PRECEDENCE)  // Runs before GlobalExceptionHandler to catch business exceptions first
@RestControllerAdvice
public class BusinessExceptionHandler {

    /* =======================================================================
     * 400 - Business Validation Errors
     * ======================================================================= */

    /**
     * Handles custom application validation failures with business context.
     * Extracts field-level errors when available for detailed client feedback.
     *
     * <p><strong>Example Scenarios</strong>:
     * <ul>
     *   <li>Invalid SKU format (must match pattern)</li>
     *   <li>Quantity below minimum threshold</li>
     *   <li>Price validation failures</li>
     * </ul>
     *
     * @param ex application-specific validation exception with optional field errors
     * @return 400 with business validation details
     */
    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<ErrorResponse> handleInvalidRequest(InvalidRequestException ex) {
        String message = ex.hasFieldErrors()
            ? "Validation failed: " + ex.getFieldErrors().size() + " field error(s)"
            : (ex.getMessage() != null ? ex.getMessage() : "Invalid request");
        
        return ErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST)
                .message(message)
                .build();
    }

    /* =======================================================================
     * 409 - Business Conflicts
     * ======================================================================= */

    /**
     * Handles enterprise duplicate resource violations with conflict resolution context.
     * Provides specific conflict details when available for client-side handling.
     *
     * <p><strong>Example Scenarios</strong>:
     * <ul>
     *   <li>Email already registered for user account</li>
     *   <li>Product SKU already exists in catalog</li>
     *   <li>Supplier name conflict in database</li>
     * </ul>
     *
     * @param ex business rule uniqueness constraint exception
     * @return 409 with resource conflict details
     */
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateResource(DuplicateResourceException ex) {
        String message = ex.hasDetailedContext()
            ? ex.getClientMessage()
            : (ex.getMessage() != null ? ex.getMessage() : "Duplicate resource");
        
        return ErrorResponse.builder()
                .status(HttpStatus.CONFLICT)
                .message(message)
                .build();
    }

    /**
     * Handles business state violations with operational context preservation.
     * Focuses on domain-specific state transitions and business rule conflicts.
     *
     * <p><strong>Example Scenarios</strong>:
     * <ul>
     *   <li>Deleting supplier with active product inventory</li>
     *   <li>Canceling order in "shipped" status</li>
     *   <li>Modifying locked financial records</li>
     * </ul>
     *
     * <p><strong>Note</strong>: This handler captures IllegalStateException from
     * service layer business logic, not framework-level state exceptions.
     *
     * @param ex illegal state exception indicating business rule violation
     * @return 409 with business context details
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleBusinessStateConflict(IllegalStateException ex) {
        String message = (ex.getMessage() != null && !ex.getMessage().isBlank())
            ? ex.getMessage()
            : "Business rule conflict";
        
        return ErrorResponse.builder()
                .status(HttpStatus.CONFLICT)
                .message(message)
                .build();
    }
}
