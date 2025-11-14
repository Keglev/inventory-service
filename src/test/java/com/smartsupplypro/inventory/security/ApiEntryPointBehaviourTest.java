package com.smartsupplypro.inventory.security;


import static org.hamcrest.Matchers.containsString;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.annotation.Resource;

/**
 * Verifies entry-point behavior:
 * - /api/** with Accept: application/json → 401 JSON body
 * - Non-API (or API without JSON Accept) → 302 redirect to OAuth login
 */
@SuppressWarnings("unused")
@WebMvcTest(controllers = ApiEntryPointBehaviourTest.StubController.class)
@AutoConfigureMockMvc(addFilters = true)
@Import(ApiEntryPointBehaviourTest.TestSecurityConfig.class)
class ApiEntryPointBehaviourTest {

    @Resource
    private MockMvc mockMvc;

    // -------- Tests --------

    /* API JSON request (unauth) → 401 with JSON body */
    @Test
    @DisplayName("API JSON request (unauth) → 401 with JSON body")
    void apiJsonRequest_unauth_returns401Json() throws Exception {
        mockMvc.perform(get("/api/protected").accept(MediaType.APPLICATION_JSON))
               .andExpect(status().isUnauthorized())
               .andExpect(content().contentType(MediaType.APPLICATION_JSON))
               .andExpect(content().json("{\"message\":\"Unauthorized\"}"));
    }

    /* Web request (unauth) → 302 redirect to /oauth2/authorization/google */
    @Test
    @DisplayName("Web request (unauth) → 302 redirect to /oauth2/authorization/google")
    void webRequest_unauth_redirectsToLogin() throws Exception {
        mockMvc.perform(get("/web/home").accept(MediaType.TEXT_HTML))
               .andExpect(status().is3xxRedirection())
               .andExpect(header().string("Location", containsString("/oauth2/authorization/google")));
    }

    /* API without JSON Accept (unauth) behaves like web → 302 redirect */
    @Test
    @DisplayName("API without JSON Accept (unauth) behaves like web → 302 redirect")
    void apiWithoutJsonAccept_behavesLikeWeb_redirects() throws Exception {
        mockMvc.perform(get("/api/protected").accept(MediaType.TEXT_HTML))
               .andExpect(status().is3xxRedirection())
               .andExpect(header().string("Location", containsString("/oauth2/authorization/google")));
    }

    // -------- Minimal stub endpoints (never actually reached when unauthenticated) --------

    /* API endpoint */
    @RestController
    @SuppressWarnings("unused") // never actually reached when unauthenticated
    static class StubController {
        @GetMapping("/api/protected")
        String api() { return "{\"ok\":true}"; }

        @GetMapping("/web/home")
        String web() { return "<html><body>home</body></html>"; }
    }

    // -------- Test-only security chain that mirrors your entry-point logic --------

    /* API JSON request (unauth) → 401 with JSON body */
    @TestConfiguration
    @EnableMethodSecurity
    @SuppressWarnings("unused") // loaded via @Import; IDE cannot see direct calls 
    static class TestSecurityConfig {

        /**
         * API JSON request (unauth) → 401 with JSON body
         */
        @Bean
        @Order(1)
        SecurityFilterChain apiJsonChain(HttpSecurity http) throws Exception {
            // Match /api/** using regex (no deprecated APIs)
            RequestMatcher apiPath = new org.springframework.security.web.util.matcher.RegexRequestMatcher("^/api/.*", null);

            // Match Accept header containing application/json
            RequestMatcher acceptsJson = request -> {
                String accept = request.getHeader("Accept");
                return accept != null && accept.contains(org.springframework.http.MediaType.APPLICATION_JSON_VALUE);
            };

            // Combine both: /api/** AND Accept: application/json
            RequestMatcher apiJson = new org.springframework.security.web.util.matcher.AndRequestMatcher(apiPath, acceptsJson);

            // 401 JSON response
            org.springframework.security.web.AuthenticationEntryPoint apiEntry = (req, res, ex) -> {
                res.setStatus(jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED);
                res.setContentType(org.springframework.http.MediaType.APPLICATION_JSON_VALUE);
                res.getWriter().write("{\"message\":\"Unauthorized\"}");
            };

            // 401 JSON response
            return http
                .securityMatcher(apiJson)                              // only API+JSON hits this chain
                .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
                .exceptionHandling(e -> e.authenticationEntryPoint(apiEntry)) // 401 JSON
                .csrf(csrf -> csrf.disable())
                .build();
        }

        /** Web request (unauth) → 302 redirect */
        @Bean
        @Order(2)
        SecurityFilterChain webChain(HttpSecurity http) throws Exception {
            var webEntry = new org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint(
                    "/oauth2/authorization/google"
            );

            return http
                .securityMatcher("/**")                                // everything else (incl. /api without JSON)
                .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
                .exceptionHandling(e -> e.authenticationEntryPoint(webEntry)) // 302 redirect
                .csrf(csrf -> csrf.disable())
                .build();
        }
    }
}
