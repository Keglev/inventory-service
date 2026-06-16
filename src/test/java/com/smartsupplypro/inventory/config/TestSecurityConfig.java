package com.smartsupplypro.inventory.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.RequestMatcher;

import com.smartsupplypro.inventory.service.SecurityService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Test-only security configuration for {@code @WebMvcTest} slices.
 * Disables OAuth2 and CSRF, and returns a JSON 401 for unauthenticated API requests.
 * Import with {@code @Import(TestSecurityConfig.class)}; use {@code @WithMockUser} to simulate roles.
 */
@TestConfiguration
@EnableMethodSecurity
public class TestSecurityConfig {

    /**
     * Replaces the production filter chain with a minimal configuration suitable for controller slices:
     * OAuth2 is disabled, CSRF is disabled, and unauthenticated API requests receive a JSON 401
     * instead of a redirect so MockMvc assertions remain predictable.
     */
    @Bean
    public SecurityFilterChain testSecurityFilterChain(HttpSecurity http) throws Exception {
        RequestMatcher apiRequestMatcher = request -> {
            String accept = request.getHeader("Accept");
            return request.getRequestURI().startsWith("/api/")
                    && accept != null && accept.contains("application/json");
        };

        AuthenticationEntryPoint jsonEntryPoint = (HttpServletRequest req,
                                                   HttpServletResponse res,
                                                   org.springframework.security.core.AuthenticationException ex) -> {
            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            res.setContentType("application/json");
            res.getWriter().write("{\"message\":\"Unauthorized\"}");
        };

        http
            .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
            .exceptionHandling(ex -> ex
                .defaultAuthenticationEntryPointFor(jsonEntryPoint, apiRequestMatcher)
                .authenticationEntryPoint(jsonEntryPoint)
            )
            .csrf(csrf -> csrf.disable())
            .oauth2Login(oauth -> oauth.disable())
            .headers(headers -> headers.frameOptions(frame -> frame.disable()));

        return http.build();
    }

    /** Enables {@code @securityService.isDemo()} SpEL in {@code @PreAuthorize} during slice tests. */
    @Bean
    public SecurityService securityService() {
        return new SecurityService();
    }
}
