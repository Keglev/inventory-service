package com.smartsupplypro.inventory.exception;

import java.lang.reflect.Method;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.Set;
import java.util.function.Supplier;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import org.springframework.core.MethodParameter;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.mock.http.MockHttpInputMessage;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

import com.smartsupplypro.inventory.exception.dto.ErrorResponse;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Path;

/**
 * Unit tests for {@link GlobalExceptionHandler}.
 *
 * <h2>Scope</h2>
 * Validates the handler’s contract for mapping framework-level exceptions to a standardized
 * {@link ErrorResponse} payload (HTTP status + client-facing message), including the private
 * sanitization rules that prevent sensitive information disclosure.
 *
 * <h2>Why this matters</h2>
 * This advice class is a security and UX boundary:
 * <ul>
 *   <li>Security: sanitization must prevent leaking file paths, package names, SQL fragments, tokens.</li>
 *   <li>Consistency: client applications rely on stable messages/status codes for predictable behavior.</li>
 *   <li>Coverage: controller slice tests typically only verify wiring and do not exercise all branches.</li>
 * </ul>
 *
 * <h2>Test strategy</h2>
 * Uses a single parameterized “case table” to cover the many simple status/message mappings without
 * repeating boilerplate. Special cases (sanitization assertions and the private {@code sanitize(...)}
 * rules) remain as dedicated tests.
 *
 * <h2>Reflection usage</h2>
 * {@code sanitize(...)} is private; reflection is used only to cover and lock down its behavior.
 * This does not test reflection itself.
 */
class GlobalExceptionHandlerTest {

    private static final GlobalExceptionHandler HANDLER = new GlobalExceptionHandler();

    private static final MethodParameter DUMMY_PARAM = dummyMethodParameter();

    private static ErrorResponse body(ResponseEntity<ErrorResponse> response) {
        return Objects.requireNonNull(response.getBody(), "Response body should not be null");
    }

    private static void assertResponse(ResponseEntity<ErrorResponse> response, HttpStatus expectedStatus, String expectedMessage) {
        assertEquals(expectedStatus, response.getStatusCode());
        assertEquals(expectedMessage, body(response).getMessage());
    }

    private static Arguments c(String name, HttpStatus status, String message, Supplier<ResponseEntity<ErrorResponse>> call) {
        return Arguments.of(name, status, message, call);
    }

    private static String sanitizeViaReflection(GlobalExceptionHandler handler, String message) {
        try {
            Method sanitize = GlobalExceptionHandler.class.getDeclaredMethod("sanitize", String.class);
            sanitize.setAccessible(true);
            return (String) sanitize.invoke(handler, message);
        } catch (ReflectiveOperationException | SecurityException e) {
            throw new IllegalStateException("Unable to invoke GlobalExceptionHandler#sanitize via reflection", e);
        }
    }

    // A tiny target used to create MethodParameter instances.
    @SuppressWarnings("unused")
    private static final class DummyTarget {
        void method(String value) {
            // no-op
        }
    }

    private static MethodParameter dummyMethodParameter() {
        try {
            Method m = DummyTarget.class.getDeclaredMethod("method", String.class);
            return new MethodParameter(m, 0);
        } catch (NoSuchMethodException e) {
            throw new IllegalStateException(e);
        }
    }

    /**
     * Case table for the parameterized status/message assertions.
     *
     * <p>JUnit invokes {@code @MethodSource} providers reflectively, so the method may look “unused”
     * to static analyzers.
     */
    @SuppressWarnings("unused")
    private static Stream<Arguments> simpleCases() {
        return Stream.of(
            c("handleValidation: first field error",
                HttpStatus.BAD_REQUEST,
                "name must not be blank",
                () -> {
                    BeanPropertyBindingResult br = new BeanPropertyBindingResult(new Object(), "obj");
                    br.addError(new FieldError("obj", "name", "must not be blank"));
                    return HANDLER.handleValidation(new MethodArgumentNotValidException(DUMMY_PARAM, br));
                }),

            c("handleValidation: no field errors",
                HttpStatus.BAD_REQUEST,
                "Validation failed",
                () -> {
                    BeanPropertyBindingResult br = new BeanPropertyBindingResult(new Object(), "obj");
                    return HANDLER.handleValidation(new MethodArgumentNotValidException(DUMMY_PARAM, br));
                }),

            c("handleConstraint: first violation",
                HttpStatus.BAD_REQUEST,
                "dto.email must not be blank",
                () -> {
                    @SuppressWarnings("unchecked")
                    ConstraintViolation<Object> violation = mock(ConstraintViolation.class);
                    Path path = mock(Path.class);
                    when(path.toString()).thenReturn("dto.email");
                    when(violation.getPropertyPath()).thenReturn(path);
                    when(violation.getMessage()).thenReturn("must not be blank");
                    return HANDLER.handleConstraint(new ConstraintViolationException(Set.of(violation)));
                }),

            c("handleConstraint: no violations",
                HttpStatus.BAD_REQUEST,
                "Constraint violation",
                () -> HANDLER.handleConstraint(new ConstraintViolationException(Set.of()))),

            c("handleParsingError",
                HttpStatus.BAD_REQUEST,
                "Request body is invalid or unreadable",
                () -> HANDLER.handleParsingError(new HttpMessageNotReadableException(
                    "bad json",
                    new MockHttpInputMessage(new byte[0])
                ))),

            c("handleParameterError: missing servlet param",
                HttpStatus.BAD_REQUEST,
                "Missing required parameter: limit",
                () -> HANDLER.handleParameterError(new MissingServletRequestParameterException("limit", "int"))),

            c("handleParameterError: type mismatch name present",
                HttpStatus.BAD_REQUEST,
                "Invalid parameter value: qty",
                () -> {
                    MethodArgumentTypeMismatchException ex = mock(MethodArgumentTypeMismatchException.class);
                    when(ex.getName()).thenReturn("qty");
                    return HANDLER.handleParameterError(ex);
                }),

            c("handleParameterError: type mismatch name null",
                HttpStatus.BAD_REQUEST,
                "Invalid parameter value: unknown",
                () -> {
                    MethodArgumentTypeMismatchException ex = mock(MethodArgumentTypeMismatchException.class);
                    when(ex.getName()).thenReturn(null);
                    return HANDLER.handleParameterError(ex);
                }),

            c("handleParameterError: defensive fallback",
                HttpStatus.BAD_REQUEST,
                "Invalid parameter",
                () -> HANDLER.handleParameterError(new Exception("x"))),

            c("handleAuthentication",
                HttpStatus.UNAUTHORIZED,
                "Authentication required",
                () -> HANDLER.handleAuthentication(new BadCredentialsException("nope"))),

            c("handleAccessDenied: demo mode",
                HttpStatus.FORBIDDEN,
                "You are in demo mode and cannot perform this operation.",
                () -> HANDLER.handleAccessDenied(new AccessDeniedException("Denied by expression: principal.isDemo == false"))),

            c("handleAccessDenied: generic",
                HttpStatus.FORBIDDEN,
                "You are not allowed to perform this operation.",
                () -> HANDLER.handleAccessDenied(new AccessDeniedException("Denied"))),

            c("handleAccessDenied: null message",
                HttpStatus.FORBIDDEN,
                "You are not allowed to perform this operation.",
                () -> HANDLER.handleAccessDenied(new AccessDeniedException("ignored") {
                    @Override
                    public String getMessage() {
                        // Explicitly cover the short-circuit branch when the exception message is null.
                        return null;
                    }
                })),

            c("handleNotFound: NoSuchElementException fallback",
                HttpStatus.NOT_FOUND,
                "Resource not found",
                () -> HANDLER.handleNotFound(new NoSuchElementException())),

            c("handleNotFound: blank message fallback",
                HttpStatus.NOT_FOUND,
                "Resource not found",
                () -> HANDLER.handleNotFound(new IllegalArgumentException("   "))),

            c("handleDataIntegrity",
                HttpStatus.CONFLICT,
                "Data conflict - constraint violation",
                () -> HANDLER.handleDataIntegrity(new DataIntegrityViolationException("dup"))),

            c("handleOptimisticLock",
                HttpStatus.CONFLICT,
                "Concurrent update detected - please refresh and retry",
                () -> HANDLER.handleOptimisticLock(new ObjectOptimisticLockingFailureException(Object.class, "id"))),

            c("handleResponseStatus: reason present",
                HttpStatus.BAD_REQUEST,
                "bad input",
                () -> HANDLER.handleResponseStatus(new ResponseStatusException(HttpStatus.BAD_REQUEST, "bad input"), mock(HttpServletRequest.class))),

            c("handleResponseStatus: blank reason uses reason phrase",
                HttpStatus.NOT_FOUND,
                "Not Found",
                () -> HANDLER.handleResponseStatus(new ResponseStatusException(HttpStatus.NOT_FOUND, "  "), mock(HttpServletRequest.class))),

            c("handleResponseStatus: unknown status code",
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Request failed",
                () -> HANDLER.handleResponseStatus(new ResponseStatusException(HttpStatusCode.valueOf(599), null), mock(HttpServletRequest.class))),

            c("handleUnexpected",
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Unexpected server error",
                () -> HANDLER.handleUnexpected(new RuntimeException("boom")))
        );
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("simpleCases")
    void simple_statusAndMessageCases(String name, HttpStatus status, String message, Supplier<ResponseEntity<ErrorResponse>> call) {
        assertResponse(call.get(), status, message);
    }

    @Test
    @org.junit.jupiter.api.DisplayName("handleStaticResource: advice returns void and does not throw")
    void handleStaticResource_doesNotThrow() {
        assertDoesNotThrow(HANDLER::handleStaticResource);
    }

    @Test
    @org.junit.jupiter.api.DisplayName("handleNotFound: message is sanitized (paths, packages, credentials)")
    void handleNotFound_messagePassThrough_andSanitize() {
        String raw = "C:\\secret\\file.java com.smartsupplypro.inventory.SomeClass Password=abc";
        ResponseEntity<ErrorResponse> response = HANDLER.handleNotFound(new IllegalArgumentException(raw));

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        String msg = body(response).getMessage();
        assertTrue(msg.contains("[PATH]") || msg.contains("[INTERNAL]") || msg.contains("Authentication failed"));
        assertFalse(msg.contains("C:\\secret"));
        assertFalse(msg.contains("com.smartsupplypro"));
        assertFalse(msg.toLowerCase().contains("password"));
    }

    @Test
    @org.junit.jupiter.api.DisplayName("sanitize: private sanitization rules are applied (reflection-assisted)")
    void sanitize_reflectionCoverage() {
        // Reflection is used only to exercise the private sanitize(...) implementation.
        assertEquals("Unknown error", sanitizeViaReflection(HANDLER, null));
        assertTrue(sanitizeViaReflection(HANDLER, "C:\\Users\\carlo\\secrets\\x.txt").contains("[PATH]"));
        assertTrue(sanitizeViaReflection(HANDLER, "/tmp/a/b/Thing.java").contains("[INTERNAL]"));
        assertTrue(sanitizeViaReflection(HANDLER, "com.smartsupplypro.inventory.service.Foo").contains("[INTERNAL]"));
        assertEquals("Database operation failed", sanitizeViaReflection(HANDLER, "SQL SELECT * FROM users WHERE id=1"));
        assertEquals("Authentication failed", sanitizeViaReflection(HANDLER, "Password=abc"));
        assertEquals("Authentication failed", sanitizeViaReflection(HANDLER, "Token=xyz"));
        assertEquals("hello", sanitizeViaReflection(HANDLER, "  hello  "));
    }
}
