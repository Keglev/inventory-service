package com.smartsupplypro.inventory.exception;

import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for {@link InvalidRequestException}.
 *
 * <h2>Scope</h2>
 * Validates the exception's internal contract:
 * <ul>
 *   <li>Default values (severity + validation code) for the simple constructor</li>
 *   <li>Explicit severity/code behavior for the detailed constructor</li>
 *   <li>Defensive copying and immutable views for {@code fieldErrors}/{@code generalErrors}</li>
 *   <li>Conditional shaping of {@link InvalidRequestException#getValidationDetails()} payload</li>
 *   <li>Static factory methods for common validation scenarios</li>
 * </ul>
 *
 * <h2>Why this matters</h2>
 * {@link InvalidRequestException} is not a "dumb" marker exception: it carries structured validation
 * information that downstream exception handlers serialize for clients. When this contract drifts,
 * clients can mis-handle errors (e.g., missing codes/severity, missing field error details).
 *
 * <h2>Test strategy</h2>
 * These are pure unit tests with no Spring context.
 *
 * <h2>Reflection usage</h2>
 * The production type currently has no public API to add a general error after construction.
 * Reflection is used only to exercise the {@code generalErrors} serialization branch in
 * {@link InvalidRequestException#getValidationDetails()} and does not validate reflection behavior itself.
 */
class InvalidRequestExceptionTest {

    @Test
    @DisplayName("Defaults: message + MEDIUM severity + INVALID_REQUEST code")
    void defaults_areApplied() {
        InvalidRequestException ex = new InvalidRequestException("bad request");

        assertEquals("bad request", ex.getMessage());
        assertEquals(InvalidRequestException.ValidationSeverity.MEDIUM, ex.getSeverity());
        assertEquals("INVALID_REQUEST", ex.getValidationCode());

        assertFalse(ex.hasFieldErrors());
        assertFalse(ex.hasGeneralErrors());
        assertEquals(0, ex.getErrorCount());
        assertFalse(ex.isCritical());

        Map<String, Object> details = ex.getValidationDetails();
        assertEquals("INVALID_REQUEST", details.get("validationCode"));
        assertEquals("MEDIUM", details.get("severity"));
        assertEquals("bad request", details.get("message"));
        assertEquals(0, details.get("errorCount"));

        assertFalse(details.containsKey("fieldErrors"));
        assertFalse(details.containsKey("generalErrors"));
    }

    @Test
    @DisplayName("Constructor: explicit severity/code and critical detection")
    void explicitSeverityAndCode_areUsed() {
        InvalidRequestException ex = new InvalidRequestException(
            "security issue",
            InvalidRequestException.ValidationSeverity.CRITICAL,
            "SECURITY_VIOLATION"
        );

        assertEquals(InvalidRequestException.ValidationSeverity.CRITICAL, ex.getSeverity());
        assertEquals("SECURITY_VIOLATION", ex.getValidationCode());
        assertTrue(ex.isCritical());

        Map<String, Object> details = ex.getValidationDetails();
        assertEquals("SECURITY_VIOLATION", details.get("validationCode"));
        assertEquals("CRITICAL", details.get("severity"));
    }

    @Test
    @DisplayName("Constructor: fieldErrors are copied and exposed immutably")
    void fieldErrors_constructorCopiesInput_andReturnsUnmodifiableMap() {
        Map<String, String> input = new HashMap<>();
        input.put("email", "must not be blank");

        InvalidRequestException ex = new InvalidRequestException("validation failed", input);

        // defensive copy: mutate input after construction, should not affect exception
        input.put("name", "must not be blank");

        assertEquals("FIELD_VALIDATION_FAILED", ex.getValidationCode());
        assertTrue(ex.hasFieldErrors());
        assertFalse(ex.hasGeneralErrors());

        Map<String, String> fieldErrors = ex.getFieldErrors();
        assertEquals(Map.of("email", "must not be blank"), fieldErrors);
        UnsupportedOperationException fieldErrorsUnmodifiable =
            assertThrows(UnsupportedOperationException.class, () -> fieldErrors.put("x", "y"));
        assertEquals(UnsupportedOperationException.class, fieldErrorsUnmodifiable.getClass());

        Map<String, Object> details = ex.getValidationDetails();
        assertEquals(1, details.get("errorCount"));
        assertTrue(details.containsKey("fieldErrors"));
        assertFalse(details.containsKey("generalErrors"));
    }

    @Test
    @DisplayName("Constructor: null fieldErrors results in empty fieldErrors")
    void fieldErrors_nullInput_defaultsToEmptyMap() {
        InvalidRequestException ex = new InvalidRequestException("validation failed", (Map<String, String>) null);

        assertFalse(ex.hasFieldErrors());
        assertEquals(0, ex.getFieldErrors().size());
        assertEquals(0, ex.getErrorCount());

        Map<String, Object> details = ex.getValidationDetails();
        assertFalse(details.containsKey("fieldErrors"));
        assertEquals(0, details.get("errorCount"));
    }

    @Test
    @DisplayName("Factory methods: requiredField/invalidFormat/valueOutOfRange populate fieldErrors")
    void factoryMethods_fieldValidation() {
        InvalidRequestException required = InvalidRequestException.requiredField("supplierId");
        assertEquals("FIELD_VALIDATION_FAILED", required.getValidationCode());
        assertEquals(Map.of("supplierId", "This field is required"), required.getFieldErrors());
        assertTrue(required.getMessage().contains("supplierId"));

        InvalidRequestException format = InvalidRequestException.invalidFormat("email", "user@domain");
        assertEquals("FIELD_VALIDATION_FAILED", format.getValidationCode());
        assertEquals("Invalid format. Expected: user@domain", format.getFieldErrors().get("email"));

        InvalidRequestException range = InvalidRequestException.valueOutOfRange("qty", 1, 10);
        assertEquals("FIELD_VALIDATION_FAILED", range.getValidationCode());
        assertTrue(range.getFieldErrors().get("qty").contains("between 1 and 10"));
    }

    @Test
    @DisplayName("Factory methods: businessRuleViolation and securityViolation set severity/code")
    void factoryMethods_severityAndCode() {
        InvalidRequestException business = InvalidRequestException.businessRuleViolation("cannot delete audited item");
        assertEquals("BUSINESS_RULE_VIOLATION", business.getValidationCode());
        assertEquals(InvalidRequestException.ValidationSeverity.HIGH, business.getSeverity());
        assertFalse(business.isCritical());

        InvalidRequestException security = InvalidRequestException.securityViolation("returnUrl is not allowlisted");
        assertEquals("SECURITY_VIOLATION", security.getValidationCode());
        assertEquals(InvalidRequestException.ValidationSeverity.CRITICAL, security.getSeverity());
        assertTrue(security.isCritical());
    }

    @Test
    @DisplayName("Validation details: includes generalErrors when present (reflection-assisted)")
    void validationDetails_includesGeneralErrorsWhenPresent() throws Exception {
        InvalidRequestException ex = new InvalidRequestException("multiple issues");

        // The production class currently has no mutator for generalErrors.
        // Reflection is used here solely to exercise the conditional serialization branch.
        Field generalErrorsField = InvalidRequestException.class.getDeclaredField("generalErrors");
        generalErrorsField.setAccessible(true);

        @SuppressWarnings("unchecked")
        List<String> generalErrors = (List<String>) generalErrorsField.get(ex);
        generalErrors.add("Something went wrong");

        assertTrue(ex.hasGeneralErrors());
        assertEquals(1, ex.getGeneralErrors().size());
        UnsupportedOperationException generalErrorsUnmodifiable =
            assertThrows(UnsupportedOperationException.class, () -> ex.getGeneralErrors().add("x"));
        assertEquals(UnsupportedOperationException.class, generalErrorsUnmodifiable.getClass());

        Map<String, Object> details = ex.getValidationDetails();
        assertTrue(details.containsKey("generalErrors"));
        assertEquals(1, details.get("errorCount"));
    }
}
