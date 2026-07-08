package com.smartsupplypro.inventory.security;

import static org.hamcrest.Matchers.containsString;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
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
 * Tests for entry-point behavior: API JSON requests return 401 JSON;
 * non-API or non-JSON requests redirect to the OAuth2 login endpoint.
 */
@WebMvcTest(controllers = ApiEntryPointBehaviourTest.StubController.class)
@AutoConfigureMockMvc(addFilters = true)
@Import(ApiEntryPointBehaviourTest.TestSecurityConfig.class)
class ApiEntryPointBehaviourTest {

    @Resource
    private MockMvc mockMvc;

    /**
     * Behavior when the request is unauthenticated and targets an API endpoint.
     */
    @Nested
    class WhenRequestIsUnauthenticatedApi {

        @Test
        void apiJsonRequest_unauth_returns401Json() throws Exception {
            mockMvc.perform(get("/api/protected").accept(MediaType.APPLICATION_JSON))
                   .andExpect(status().isUnauthorized())
                   .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                   .andExpect(content().json("{\"message\":\"Unauthorized\"}"));
        }

        @Test
        void apiWithoutJsonAccept_behavesLikeWeb_redirects() throws Exception {
            mockMvc.perform(get("/api/protected").accept(MediaType.TEXT_HTML))
                   .andExpect(status().is3xxRedirection())
                   .andExpect(header().string("Location",
                       containsString("/oauth2/authorization/google")));
        }
    }

    /**
     * Behavior when the request is unauthenticated and targets a web (non-API) endpoint.
     */
    @Nested
    class WhenRequestIsUnauthenticatedWeb {

        @Test
        void webRequest_unauth_redirectsToLogin() throws Exception {
            mockMvc.perform(get("/web/home").accept(MediaType.TEXT_HTML))
                   .andExpect(status().is3xxRedirection())
                   .andExpect(header().string("Location",
                       containsString("/oauth2/authorization/google")));
        }
    }

    /** Minimal stub endpoints Ã¢â‚¬â€ never actually reached when unauthenticated. */
    @RestController
    static class StubController {
        @GetMapping("/api/protected")
        String api() { return "{\"ok\":true}"; }

        @GetMapping("/web/home")
        String web() { return "<html><body>home</body></html>"; }
    }

    /** Test-only dual-chain security config that mirrors the production entry-point split. */
    @TestConfiguration
    @EnableMethodSecurity
    static class TestSecurityConfig {

        @Bean
        @Order(1)
        SecurityFilterChain apiJsonChain(HttpSecurity http) throws Exception {
            RequestMatcher apiPath = new org.springframework.security.web.util.matcher
                    .RegexRequestMatcher("^/api/.*", null);
            RequestMatcher acceptsJson = request -> {
                String accept = request.getHeader("Accept");
                return accept != null && accept.contains(MediaType.APPLICATION_JSON_VALUE);
            };
            RequestMatcher apiJson = new org.springframework.security.web.util.matcher
                    .AndRequestMatcher(apiPath, acceptsJson);

            org.springframework.security.web.AuthenticationEntryPoint apiEntry = (req, res, ex) -> {
                res.setStatus(jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED);
                res.setContentType(MediaType.APPLICATION_JSON_VALUE);
                res.getWriter().write("{\"message\":\"Unauthorized\"}");
            };

            return http
                .securityMatcher(apiJson)
                .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
                .exceptionHandling(e -> e.authenticationEntryPoint(apiEntry))
                .csrf(csrf -> csrf.disable())
                .build();
        }

        @Bean
        @Order(2)
        SecurityFilterChain webChain(HttpSecurity http) throws Exception {
            var webEntry = new org.springframework.security.web.authentication
                    .LoginUrlAuthenticationEntryPoint("/oauth2/authorization/google");

            return http
                .securityMatcher("/**")
                .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
                .exceptionHandling(e -> e.authenticationEntryPoint(webEntry))
                .csrf(csrf -> csrf.disable())
                .build();
        }
    }
}
