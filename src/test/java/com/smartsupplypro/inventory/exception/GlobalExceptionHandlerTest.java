package com.smartsupplypro.inventory.exception;

import java.util.NoSuchElementException;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.smartsupplypro.inventory.config.TestSecurityConfig;
import com.smartsupplypro.inventory.testsupport.LogCapture;

import ch.qos.logback.classic.Level;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests HTTP error response mapping in {@link GlobalExceptionHandler}.
 */
@WebMvcTest(GlobalExceptionHandlerTest.ThrowingController.class)
@Import(TestSecurityConfig.class)
@WithMockUser
class GlobalExceptionHandlerTest {

    @Autowired MockMvc mockMvc;

    // Endpoint parameters exist only to trigger Spring binding/validation; they are intentionally unread.
    @RestController @RequestMapping("/err")
    @SuppressWarnings("unused")
    static class ThrowingController {
        @GetMapping("/nse")    void nse()    { throw new NoSuchElementException(); }
        @GetMapping("/nse-m")  void nseMsg() { throw new NoSuchElementException("Item 1 not found"); }
        @GetMapping("/iae")    void iae()    { throw new IllegalArgumentException("Failed to evaluate expression"); }
        @GetMapping("/auth")   void auth()   { throw new BadCredentialsException("bad"); }
        @GetMapping("/denied") void denied() { throw new AccessDeniedException("Denied"); }
        @GetMapping("/data")   void data()   { throw new DataIntegrityViolationException("dup"); }
        @GetMapping("/lock")   void lock()   { throw new ObjectOptimisticLockingFailureException(Object.class, 1L); }
        @GetMapping("/rse")    void rse()    { throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Supplier not found"); }
        @GetMapping("/boom")   void boom()   { throw new RuntimeException("boom"); }
        @PostMapping(value = "/json-only", consumes = MediaType.APPLICATION_JSON_VALUE)
        void jsonOnly(@RequestBody String body) { }
        @GetMapping("/ise")    void ise()    { throw new IllegalStateException("Expected numeric type but got: oracle.sql.NUMBER@1f"); }
    }

    /** 404 Not Found responses. */
    @Nested class WhenNotFound {
        @Test void should_fall_back_to_the_default_when_the_not_found_error_has_no_message() throws Exception {
            mockMvc.perform(get("/err/nse"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Resource not found"));
        }
        @Test void should_pass_the_message_through_when_the_not_found_error_has_one() throws Exception {
            mockMvc.perform(get("/err/nse-m"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Item 1 not found"));
        }
    }

    /** Spring MVC's own 4xx rejections keep their status and do not log a stack trace. */
    @Nested class WhenRequestRejectedByTheFramework {
        @Test void should_return_405_with_allow_and_no_error_log_when_the_method_is_wrong() throws Exception {
            try (LogCapture log = LogCapture.of(GlobalExceptionHandler.class, Level.ERROR)) {
                mockMvc.perform(get("/err/json-only"))
                    .andExpect(status().isMethodNotAllowed())
                    .andExpect(header().string("Allow", "POST"))
                    .andExpect(jsonPath("$.error").value("method_not_allowed"));
                assertThat(log.messages()).isEmpty();
            }
        }
        @Test void should_return_415_and_no_error_log_when_the_media_type_is_unsupported() throws Exception {
            try (LogCapture log = LogCapture.of(GlobalExceptionHandler.class, Level.ERROR)) {
                mockMvc.perform(post("/err/json-only").with(csrf())
                        .contentType(MediaType.TEXT_PLAIN).content("x"))
                    .andExpect(status().isUnsupportedMediaType())
                    .andExpect(jsonPath("$.error").value("unsupported_media_type"));
                assertThat(log.messages()).isEmpty();
            }
        }
    }

    /** 401 and 403 security responses. */
    @Nested class WhenSecurityViolated {
        @Test void should_return_401_when_authentication_fails() throws Exception {
            mockMvc.perform(get("/err/auth"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Authentication required"));
        }
        @Test void should_return_403_when_access_is_denied() throws Exception {
            mockMvc.perform(get("/err/denied"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("You are not allowed to perform this operation."));
        }
    }

    /** 409 Conflict responses. */
    @Nested class WhenConflict {
        @Test void should_return_409_when_data_integrity_is_violated() throws Exception {
            mockMvc.perform(get("/err/data"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Data conflict - constraint violation"));
        }
        @Test void should_return_409_when_an_optimistic_lock_fails() throws Exception {
            mockMvc.perform(get("/err/lock"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Concurrent update detected - please refresh and retry"));
        }
    }

    /** Pass-through and fallback responses. */
    @Nested class WhenPassThrough {
        @Test void should_preserve_the_status_and_message_when_a_response_status_exception_is_thrown() throws Exception {
            mockMvc.perform(get("/err/rse"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Supplier not found"));
        }
        @Test void should_return_500_when_an_exception_is_unhandled() throws Exception {
            mockMvc.perform(get("/err/boom"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("Unexpected server error"));
        }
        // Rejected client input is an InvalidRequestException; an IllegalArgumentException that
        // escapes comes from the framework or a programming error (a failed security expression).
        @Test void should_return_a_generic_500_when_an_illegal_argument_escapes() throws Exception {
            mockMvc.perform(get("/err/iae"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("Unexpected server error"));
        }
        // An internal fault, not a business conflict: it must not answer 409 with its raw text.
        @Test void should_return_a_generic_500_when_an_internal_state_error_escapes() throws Exception {
            mockMvc.perform(get("/err/ise"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("Unexpected server error"));
        }
    }
}
