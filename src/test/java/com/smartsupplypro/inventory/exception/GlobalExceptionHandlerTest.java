package com.smartsupplypro.inventory.exception;

import java.util.NoSuchElementException;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.smartsupplypro.inventory.config.TestSecurityConfig;

import java.util.Map;
import java.util.Set;

import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
        @GetMapping("/iae-m")  void iaeMsg() { throw new IllegalArgumentException("Item 1 not found"); }
        @GetMapping("/auth")   void auth()   { throw new BadCredentialsException("bad"); }
        @GetMapping("/denied") void denied() { throw new AccessDeniedException("Denied"); }
        @GetMapping("/data")   void data()   { throw new DataIntegrityViolationException("dup"); }
        @GetMapping("/lock")   void lock()   { throw new ObjectOptimisticLockingFailureException(Object.class, 1L); }
        @GetMapping("/rse")    void rse()    { throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Supplier not found"); }
        @GetMapping("/boom")   void boom()   { throw new RuntimeException("boom"); }
        @GetMapping("/iae-blank") void iaeBlank() { throw new IllegalArgumentException("   "); }
        @GetMapping("/rse-blank") void rseBlank() { throw new ResponseStatusException(HttpStatus.NOT_FOUND, "   "); }

        @GetMapping("/param-missing") void paramMissing(@RequestParam String q) { }
        @GetMapping("/param-type")    void paramType(@RequestParam int n) { }
        @GetMapping("/rse-noreason")  void rseNoReason() { throw new ResponseStatusException(HttpStatus.BAD_REQUEST); }
        @GetMapping("/rse-badstatus") void rseBadStatus() { throw new ResponseStatusException(HttpStatusCode.valueOf(499)); }
        @GetMapping("/constraint")    void constraint() { throw new ConstraintViolationException("bad", Set.of()); }
        @PostMapping("/parse")        void parse(@RequestBody Map<String, Object> body) { }
        @PostMapping("/valid")        void valid(@Valid @RequestBody Sample dto) { }

        record Sample(@NotBlank String name) {}
    }

    /** 404 Not Found responses. */
    @Nested class WhenNotFound {
        @Test void noMessage_fallsBackToDefault() throws Exception {
            mockMvc.perform(get("/err/nse"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Resource not found"));
        }
        @Test void withMessage_passesThrough() throws Exception {
            mockMvc.perform(get("/err/iae-m"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Item 1 not found"));
        }
        @Test void blankMessage_fallsBackToDefault() throws Exception {
            mockMvc.perform(get("/err/iae-blank"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Resource not found"));
        }
    }

    /** 401 and 403 security responses. */
    @Nested class WhenSecurityViolated {
        @Test void authenticationException_returns401() throws Exception {
            mockMvc.perform(get("/err/auth"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Authentication required"));
        }
        @Test void accessDenied_returns403() throws Exception {
            mockMvc.perform(get("/err/denied"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("You are not allowed to perform this operation."));
        }
    }

    /** 409 Conflict responses. */
    @Nested class WhenConflict {
        @Test void dataIntegrity_returns409() throws Exception {
            mockMvc.perform(get("/err/data"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Data conflict - constraint violation"));
        }
        @Test void optimisticLock_returns409() throws Exception {
            mockMvc.perform(get("/err/lock"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Concurrent update detected - please refresh and retry"));
        }
    }

    /** Pass-through and fallback responses. */
    @Nested class WhenPassThrough {
        @Test void responseStatusException_preservesStatusAndMessage() throws Exception {
            mockMvc.perform(get("/err/rse"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Supplier not found"));
        }
        @Test void unhandledException_returns500() throws Exception {
            mockMvc.perform(get("/err/boom"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("Unexpected server error"));
        }
    }

    /** 400 Bad Request for malformed or missing request data. */
    @Nested class WhenBadRequest {
        @Test void missingParameter_returns400() throws Exception {
            mockMvc.perform(get("/err/param-missing"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Missing required parameter: q"));
        }
        @Test void parameterTypeMismatch_returns400() throws Exception {
            mockMvc.perform(get("/err/param-type").param("n", "abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid parameter value: n"));
        }
        @Test void unreadableBody_returns400() throws Exception {
            mockMvc.perform(post("/err/parse").contentType(MediaType.APPLICATION_JSON).content("{"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Request body is invalid or unreadable"));
        }
        @Test void constraintViolation_returns400() throws Exception {
            mockMvc.perform(get("/err/constraint"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Constraint violation"));
        }
        @Test void beanValidation_returns400WithFieldErrors() throws Exception {
            mockMvc.perform(post("/err/valid").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("bad_request"))
                .andExpect(jsonPath("$.fieldErrors.name").exists());
        }
    }

    /** Status-derivation edge cases. */
    @Nested class WhenEdgeCases {
        @Test void responseStatusWithoutReason_usesStatusPhrase() throws Exception {
            mockMvc.perform(get("/err/rse-noreason"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Bad Request"));
        }
        @Test void responseStatusWithBlankReason_usesStatusPhrase() throws Exception {
            mockMvc.perform(get("/err/rse-blank"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Not Found"));
        }
        @Test void responseStatusWithUnresolvableStatus_returns500() throws Exception {
            mockMvc.perform(get("/err/rse-badstatus"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("Request failed"));
        }
    }
}
