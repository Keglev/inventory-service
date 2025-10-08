
package com.smartsupplypro.inventory.exception;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Enterprise exception for client request validation failures.
 * 
 * <p>Enforces API contract compliance through parameter validation, business rule
 * verification, and data integrity constraints for reliable service operations.
 * 
 * <p>Key integrations: Request validation, Service layer checks, Controller parameters.
 * 
 * @author Smart Supply Pro Development Team
 * @version 1.0.0
 * @since 1.0.0
 * @see GlobalExceptionHandler
 */
public class InvalidRequestException extends RuntimeException {
    
    private final ValidationSeverity severity;
    private final String validationCode;
    private final Map<String, String> fieldErrors;
    private final List<String> generalErrors;

    /**
     * Creates invalid request exception with validation details.
     * 
     * @param message specific validation failure description
     */
    public InvalidRequestException(String message) { 
        super(message);
        this.severity = ValidationSeverity.MEDIUM;
        this.validationCode = "INVALID_REQUEST";
        this.fieldErrors = new HashMap<>();
        this.generalErrors = new ArrayList<>();
    }

    /**
     * Creates invalid request exception with detailed validation context.
     * 
     * @param message specific validation failure description
     * @param severity validation failure severity level
     * @param validationCode specific validation code for client handling
     */
    public InvalidRequestException(String message, ValidationSeverity severity, String validationCode) {
        super(message);
        this.severity = severity;
        this.validationCode = validationCode;
        this.fieldErrors = new HashMap<>();
        this.generalErrors = new ArrayList<>();
    }

    /**
     * Creates invalid request exception with field-specific errors.
     * 
     * @param message general validation failure description
     * @param fieldErrors map of field names to specific error messages
     */
    public InvalidRequestException(String message, Map<String, String> fieldErrors) {
        super(message);
        this.severity = ValidationSeverity.MEDIUM;
        this.validationCode = "FIELD_VALIDATION_FAILED";
        this.fieldErrors = fieldErrors != null ? new HashMap<>(fieldErrors) : new HashMap<>();
        this.generalErrors = new ArrayList<>();
    }

    // Enterprise utility methods for enhanced validation handling

    /**
     * Gets the severity level of this validation failure.
     * 
     * @return validation severity classification
     */
    public ValidationSeverity getSeverity() {
        return severity;
    }

    /**
     * Gets the specific validation code for client error handling.
     * 
     * @return validation code identifier
     */
    public String getValidationCode() {
        return validationCode;
    }

    /**
     * Gets field-specific validation errors.
     * 
     * @return immutable map of field errors
     */
    public Map<String, String> getFieldErrors() {
        return Map.copyOf(fieldErrors);
    }

    /**
     * Gets general validation errors not tied to specific fields.
     * 
     * @return immutable list of general errors
     */
    public List<String> getGeneralErrors() {
        return List.copyOf(generalErrors);
    }

    /**
     * Checks if this exception has field-specific validation errors.
     * 
     * @return true if field errors are present
     */
    public boolean hasFieldErrors() {
        return !fieldErrors.isEmpty();
    }

    /**
     * Checks if this exception has general validation errors.
     * 
     * @return true if general errors are present
     */
    public boolean hasGeneralErrors() {
        return !generalErrors.isEmpty();
    }

    /**
     * Gets the total number of validation errors.
     * 
     * @return sum of field and general errors
     */
    public int getErrorCount() {
        return fieldErrors.size() + generalErrors.size();
    }

    /**
     * Checks if this is a critical validation failure requiring immediate attention.
     * 
     * @return true if severity is CRITICAL
     */
    public boolean isCritical() {
        return severity == ValidationSeverity.CRITICAL;
    }

    /**
     * Creates a structured error response for API clients.
     * 
     * @return map containing validation details for client consumption
     */
    public Map<String, Object> getValidationDetails() {
        Map<String, Object> details = new HashMap<>();
        details.put("validationCode", validationCode);
        details.put("severity", severity.name());
        details.put("message", getMessage());
        
        if (hasFieldErrors()) {
            details.put("fieldErrors", fieldErrors);
        }
        
        if (hasGeneralErrors()) {
            details.put("generalErrors", generalErrors);
        }
        
        details.put("errorCount", getErrorCount());
        return details;
    }

    // Static factory methods for common validation scenarios

    /**
     * Creates exception for required field validation failures.
     * 
     * @param fieldName the missing required field
     * @return configured exception instance
     */
    public static InvalidRequestException requiredField(String fieldName) {
        Map<String, String> fieldErrors = Map.of(fieldName, "This field is required");
        return new InvalidRequestException(
            "Required field missing: " + fieldName, 
            fieldErrors
        );
    }

    /**
     * Creates exception for invalid format validation failures.
     * 
     * @param fieldName the field with invalid format
     * @param expectedFormat description of expected format
     * @return configured exception instance
     */
    public static InvalidRequestException invalidFormat(String fieldName, String expectedFormat) {
        Map<String, String> fieldErrors = Map.of(fieldName, "Invalid format. Expected: " + expectedFormat);
        return new InvalidRequestException(
            "Invalid format for field: " + fieldName, 
            fieldErrors
        );
    }

    /**
     * Creates exception for value range validation failures.
     * 
     * @param fieldName the field with out-of-range value
     * @param minValue minimum allowed value
     * @param maxValue maximum allowed value
     * @return configured exception instance
     */
    public static InvalidRequestException valueOutOfRange(String fieldName, Object minValue, Object maxValue) {
        Map<String, String> fieldErrors = Map.of(fieldName, 
            String.format("Value must be between %s and %s", minValue, maxValue));
        return new InvalidRequestException(
            "Value out of range for field: " + fieldName, 
            fieldErrors
        );
    }

    /**
     * Creates exception for business rule validation failures.
     * 
     * @param businessRule description of violated business rule
     * @return configured exception instance
     */
    public static InvalidRequestException businessRuleViolation(String businessRule) {
        return new InvalidRequestException(
            "Business rule violation: " + businessRule,
            ValidationSeverity.HIGH,
            "BUSINESS_RULE_VIOLATION"
        );
    }

    /**
     * Creates exception for critical security validation failures.
     * 
     * @param securityIssue description of security validation failure
     * @return configured exception instance with CRITICAL severity
     */
    public static InvalidRequestException securityViolation(String securityIssue) {
        return new InvalidRequestException(
            "Security validation failed: " + securityIssue,
            ValidationSeverity.CRITICAL,
            "SECURITY_VIOLATION"
        );
    }

    // Nested enum for validation severity classification
    public enum ValidationSeverity {
        LOW,      // Minor validation issues, warnings
        MEDIUM,   // Standard validation failures
        HIGH,     // Business rule violations
        CRITICAL  // Security or data integrity issues
    }
}

