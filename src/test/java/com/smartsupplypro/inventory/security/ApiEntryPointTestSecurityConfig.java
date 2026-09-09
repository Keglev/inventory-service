package com.smartsupplypro.inventory.security;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.RequestMatcher;

/** Test-only dual-chain security config that mirrors the production entry-point split. */
@TestConfiguration
@EnableMethodSecurity
class ApiEntryPointTestSecurityConfig {

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
