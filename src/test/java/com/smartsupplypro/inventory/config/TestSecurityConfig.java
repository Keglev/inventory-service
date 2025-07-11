package com.smartsupplypro.inventory.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.RequestMatcher;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * {@code TestSecurityConfig} defines a lightweight, test-specific Spring Security configuration
 * for isolating and verifying behavior of secured endpoints during unit and integration tests.
 * <p>
 * This configuration disables OAuth2 and CSRF, enforces authentication for API requests, and
 * provides a consistent {@code application/json} response structure for unauthorized access.
 * <p>
 * It is active only within the {@code @TestConfiguration} scope and ensures isolation from the
 * production-level security chain during automated testing.
 *
 * <p><b>Use Cases:</b></p>
 * <ul>
 *   <li>MockMvc-based controller testing</li>
 *   <li>Security exception handling verification</li>
 *   <li>Disabling OAuth2 to test authentication-agnostic components</li>
 * </ul>
 *
 * @author
 */
@TestConfiguration
@EnableMethodSecurity
public class TestSecurityConfig {

    /**
     * Defines a test-specific {@link SecurityFilterChain} bean that disables OAuth2 and CSRF,
     * and returns a consistent JSON error structure on unauthorized API access.
     *
     * @param http the Spring Security {@link HttpSecurity} builder
     * @return the customized {@link SecurityFilterChain} for test execution
     * @throws Exception if the security chain cannot be built
     */
    @Bean
    public SecurityFilterChain testSecurityFilterChain(HttpSecurity http) throws Exception {
        // Matches requests to API endpoints that accept application/json
        RequestMatcher apiRequestMatcher = request -> {
            String accept = request.getHeader("Accept");
            return request.getRequestURI().startsWith("/api/")
                    && accept != null && accept.contains("application/json");
        };

        // Custom entry point to return JSON error instead of redirect for unauthorized access
        AuthenticationEntryPoint jsonEntryPoint = (HttpServletRequest req,
                                                   HttpServletResponse res,
                                                   org.springframework.security.core.AuthenticationException ex) -> {
            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            res.setContentType("application/json");
            res.getWriter().write("{\"message\":\"Unauthorized\"}");
        };

        http
            .authorizeHttpRequests(auth -> auth
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex
                .defaultAuthenticationEntryPointFor(jsonEntryPoint, apiRequestMatcher)
            )
            .csrf(csrf -> csrf.disable())          // Disable CSRF for test context
            .oauth2Login(oauth -> oauth.disable()); // Disable OAuth2 to allow simple mocking

        return http.build();
    }
}
