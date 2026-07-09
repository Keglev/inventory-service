package com.smartsupplypro.inventory.exception;

import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.smartsupplypro.inventory.config.TestSecurityConfig;

import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests {@link GlobalExceptionHandler} mapping of malformed or missing request data (400)
 * and the status-derivation edge cases for {@link ResponseStatusException}.
 */
@WebMvcTest(GlobalExceptionHandlerBadRequestTest.ThrowingController.class)
@Import(TestSecurityConfig.class)
@WithMockUser
class GlobalExceptionHandlerBadRequestTest {

    @Autowired MockMvc mockMvc;

    // Endpoint parameters exist only to trigger Spring binding/validation; they are intentionally unread.
    @RestController @RequestMapping("/err")
    @SuppressWarnings("unused")
    static class ThrowingController {
        @GetMapping("/param-missing") void paramMissing(@RequestParam String q) { }
        @GetMapping("/param-type")    void paramType(@RequestParam int n) { }
        @GetMapping("/rse-noreason")  void rseNoReason() { throw new ResponseStatusException(HttpStatus.BAD_REQUEST); }
        @GetMapping("/rse-blank")     void rseBlank() { throw new ResponseStatusException(HttpStatus.NOT_FOUND, "   "); }
        @GetMapping("/rse-badstatus") void rseBadStatus() { throw new ResponseStatusException(HttpStatusCode.valueOf(499)); }
        @GetMapping("/constraint")    void constraint() { throw new ConstraintViolationException("bad", Set.of()); }
        @PostMapping("/parse")        void parse(@RequestBody Map<String, Object> body) { }
        @PostMapping("/valid")        void valid(@Valid @RequestBody Sample dto) { }

        record Sample(@NotBlank String name) {}
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
