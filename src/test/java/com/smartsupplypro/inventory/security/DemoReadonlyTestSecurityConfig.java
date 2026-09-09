package com.smartsupplypro.inventory.security;

import java.io.IOException;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.preauth.AbstractPreAuthenticatedProcessingFilter;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Minimal security chain for demo-readonly mode:
 * permits GET on inventory/analytics; blocks writes with JSON 401.
 */
@TestConfiguration
@EnableMethodSecurity
class DemoReadonlyTestSecurityConfig {

    @Bean
    @SuppressWarnings("null") // quiet IDE nullness analysis on doFilterInternal parameters
    SecurityFilterChain testSecurityFilterChain(HttpSecurity http) throws Exception {

        // Flag API JSON requests so the entry point can distinguish them from browser requests.
        OncePerRequestFilter apiFlagFilter = new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(HttpServletRequest req,
                                            HttpServletResponse res,
                                            FilterChain chain)
                    throws ServletException, IOException {
                String accept = req.getHeader("Accept");
                if (req.getRequestURI().startsWith("/api/")
                        && accept != null && accept.contains("application/json")) {
                    req.setAttribute("IS_API_REQUEST", Boolean.TRUE);
                }
                chain.doFilter(req, res);
            }
        };

        RequestMatcher apiMatcher = request ->
            Boolean.TRUE.equals(request.getAttribute("IS_API_REQUEST"));

        AuthenticationEntryPoint apiEntry = (req, res, ex) -> {
            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            res.setContentType("application/json");
            res.getWriter().write("{\"message\":\"Unauthorized\"}");
        };

        http
            .addFilterBefore(apiFlagFilter, AbstractPreAuthenticatedProcessingFilter.class)
            .authorizeHttpRequests(auth -> {
                auth.requestMatchers(HttpMethod.GET, "/api/inventory/**").permitAll();
                auth.requestMatchers("/api/analytics/**").permitAll();
                auth.requestMatchers("/api/**").authenticated();
                auth.anyRequest().authenticated();
            })
            .exceptionHandling(e -> e
                .defaultAuthenticationEntryPointFor(apiEntry, apiMatcher)
                .authenticationEntryPoint(apiEntry))
            .csrf(csrf -> csrf.disable());

        return http.build();
    }
}
