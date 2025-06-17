package com.smartsupplypro.inventory.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.RequestMatcher;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@TestConfiguration
public class TestSecurityConfig {

    @Bean
    public SecurityFilterChain testSecurityFilterChain(HttpSecurity http) throws Exception {
        // Match only JSON-based API requests
        RequestMatcher apiRequestMatcher = request -> {
            String accept = request.getHeader("Accept");
            return request.getRequestURI().startsWith("/api/") &&
                   accept != null && accept.contains("application/json");
        };

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
            .csrf(csrf -> csrf.disable())
            .oauth2Login(oauth -> oauth.disable()); // Disable OAuth2 for unit tests

        return http.build();
    }
}
