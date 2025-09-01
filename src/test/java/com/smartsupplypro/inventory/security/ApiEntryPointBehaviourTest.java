package com.smartsupplypro.inventory.security;

import static org.hamcrest.Matchers.containsString;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Verifies entry-point behavior:
 * - /api/** with Accept: application/json → 401 JSON body
 * - Non-API (or API without JSON Accept) → 302 redirect to OAuth login
 */
@WebMvcTest(controllers = ApiEntryPointBehaviourTest.StubController.class)
@AutoConfigureMockMvc(addFilters = true)
@Import(ApiEntryPointBehaviourTest.TestSecurityConfig.class)
class ApiEntryPointBehaviourTest {

    @Resource
    private MockMvc mockMvc;

    // -------- Tests --------

    @Test
    @DisplayName("API JSON request (unauth) → 401 with JSON body")
    void apiJsonRequest_unauth_returns401Json() throws Exception {
        mockMvc.perform(get("/api/protected").accept(MediaType.APPLICATION_JSON))
               .andExpect(status().isUnauthorized())
               .andExpect(content().contentType(MediaType.APPLICATION_JSON))
               .andExpect(content().json("{\"message\":\"Unauthorized\"}"));
    }

    @Test
    @DisplayName("Web request (unauth) → 302 redirect to /oauth2/authorization/google")
    void webRequest_unauth_redirectsToLogin() throws Exception {
        mockMvc.perform(get("/web/home").accept(MediaType.TEXT_HTML))
               .andExpect(status().is3xxRedirection())
               .andExpect(header().string("Location", containsString("/oauth2/authorization/google")));
    }

    @Test
    @DisplayName("API without JSON Accept (unauth) behaves like web → 302 redirect")
    void apiWithoutJsonAccept_behavesLikeWeb_redirects() throws Exception {
        mockMvc.perform(get("/api/protected").accept(MediaType.TEXT_HTML))
               .andExpect(status().is3xxRedirection())
               .andExpect(header().string("Location", containsString("/oauth2/authorization/google")));
    }

    // -------- Minimal stub endpoints (never actually reached when unauthenticated) --------

    @RestController
    @SuppressWarnings("unused") // never actually reached when unauthenticated
    static class StubController {
        @GetMapping("/api/protected")
        String api() { return "{\"ok\":true}"; }

        @GetMapping("/web/home")
        String web() { return "<html><body>home</body></html>"; }
    }

    // -------- Test-only security chain that mirrors your entry-point logic --------

    @TestConfiguration
    @EnableMethodSecurity
    @SuppressWarnings("unused") // loaded via @Import; IDE cannot see direct calls 
    static class TestSecurityConfig {

       @Bean
        SecurityFilterChain testSecurityFilterChain(HttpSecurity http) throws Exception {
            // Match: path starts with /api/ AND Accept contains application/json
            var apiJsonMatcher = (RequestMatcher) request -> {
                String accept = request.getHeader("Accept");
                String uri = request.getRequestURI();
                return uri != null
                        && uri.startsWith("/api/")
                        && accept != null
                        && accept.contains(MediaType.APPLICATION_JSON_VALUE);
            };

            AuthenticationEntryPoint apiEntry = (req, res, ex) -> {
                res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                res.setContentType(MediaType.APPLICATION_JSON_VALUE);
                res.getWriter().write("{\"message\":\"Unauthorized\"}");
            };

            AuthenticationEntryPoint webEntry =
                new LoginUrlAuthenticationEntryPoint("/oauth2/authorization/google");

            http
                .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
                .exceptionHandling(e -> e
                    .defaultAuthenticationEntryPointFor(apiEntry, apiJsonMatcher) // /api/** + JSON → 401 JSON
                    .authenticationEntryPoint(webEntry)                           // everything else → 302 redirect
                )
                .csrf(csrf -> csrf.disable());

            return http.build();
        }
    }
}
