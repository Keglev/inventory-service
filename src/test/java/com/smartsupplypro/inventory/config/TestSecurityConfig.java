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
 * Test-only Spring Security configuration for controller tests.
 *
 * <p><b>What it does</b>
 * <ul>
 *   <li>Disables OAuth2 and CSRF for simplified MockMvc testing.</li>
 *   <li>Requires authentication by default; APIs without auth receive JSON 401.</li>
 * </ul>
 *
 * <p><b>Usage</b>
 * <ul>
 *   <li>Import with {@code @Import(TestSecurityConfig.class)} in @WebMvcTest slices.</li>
 *   <li>Use {@code @WithMockUser} or {@code .with(authentication(...))} to simulate auth.</li>
 * </ul>
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
                .authenticationEntryPoint(jsonEntryPoint) // default for everything else in slice tests
            )
            .csrf(csrf -> csrf.disable())          // Disable CSRF for test context
            .oauth2Login(oauth -> oauth.disable()) // Disable OAuth2 to allow simple mocking
            .headers(headers -> headers.frameOptions(frame -> frame.disable())); // Allow H2 console if needed

        return http.build();
    }
}
