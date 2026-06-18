package com.smartsupplypro.inventory.exception;

import java.util.NoSuchElementException;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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

    @RestController @RequestMapping("/err")
    static class ThrowingController {
        @GetMapping("/nse")    void nse()    { throw new NoSuchElementException(); }
        @GetMapping("/iae-m")  void iaeMsg() { throw new IllegalArgumentException("Item 1 not found"); }
        @GetMapping("/auth")   void auth()   { throw new BadCredentialsException("bad"); }
        @GetMapping("/denied") void denied() { throw new AccessDeniedException("Denied"); }
        @GetMapping("/demo")   void demo()   { throw new AccessDeniedException("principal.isDemo"); }
        @GetMapping("/data")   void data()   { throw new DataIntegrityViolationException("dup"); }
        @GetMapping("/lock")   void lock()   { throw new ObjectOptimisticLockingFailureException(Object.class, 1L); }
        @GetMapping("/rse")    void rse()    { throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Supplier not found"); }
        @GetMapping("/boom")   void boom()   { throw new RuntimeException("boom"); }
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
        @Test void demoMode_returnsFriendlyMessage() throws Exception {
            mockMvc.perform(get("/err/demo"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("You are in demo mode and cannot perform this operation."));
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
}
