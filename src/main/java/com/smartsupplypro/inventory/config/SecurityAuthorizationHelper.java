package com.smartsupplypro.inventory.config;

import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer;
import org.springframework.stereotype.Component;

/**
 * Centralizes HTTP authorization rules so {@link SecurityConfig} stays focused
 * on filter chain wiring.
 *
 * <p>When demo mode is active, read-only inventory, analytics, and supplier endpoints
 * are public so prospective users can explore data without logging in.</p>
 */
@Component
public class SecurityAuthorizationHelper {

    /**
     * Applies public-access, optional demo read-only, and role-based authorization rules
     * in the order Spring Security evaluates them (most-specific first).
     */
    public void configureAuthorization(
            AuthorizeHttpRequestsConfigurer<HttpSecurity>.AuthorizationManagerRequestMatcherRegistry auth,
            boolean isDemoReadonly
    ) {
        // CORS preflight and public endpoints
        auth.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll();
        auth.requestMatchers("/logout").permitAll();
        auth.requestMatchers(
                "/",
                "/actuator/**",
                "/health/**",
                "/api/health/**",
                "/oauth2/**",
                "/login/oauth2/**",
                "/login/**",
                "/error"
        ).permitAll();

        if (isDemoReadonly) {
            auth.requestMatchers(HttpMethod.GET, "/api/inventory/**").permitAll();
            auth.requestMatchers(HttpMethod.GET, "/api/analytics/**").permitAll();
            auth.requestMatchers(HttpMethod.GET, "/api/suppliers/**").permitAll();
        }

        auth.requestMatchers(HttpMethod.GET, "/api/inventory/**").authenticated();
        auth.requestMatchers(HttpMethod.GET, "/api/suppliers/**").authenticated();
        auth.requestMatchers(HttpMethod.GET, "/api/analytics/**").authenticated();

        auth.requestMatchers("/api/admin/**").hasRole("ADMIN");

        // Inventory & supplier mutations require an active USER or ADMIN role
        auth.requestMatchers(HttpMethod.POST,   "/api/inventory/**").hasAnyRole("USER", "ADMIN");
        auth.requestMatchers(HttpMethod.PUT,    "/api/inventory/**").hasAnyRole("USER", "ADMIN");
        auth.requestMatchers(HttpMethod.PATCH,  "/api/inventory/**").hasAnyRole("USER", "ADMIN");
        auth.requestMatchers(HttpMethod.DELETE, "/api/inventory/**").hasAnyRole("USER", "ADMIN");

        auth.requestMatchers(HttpMethod.POST,   "/api/suppliers/**").hasAnyRole("USER", "ADMIN");
        auth.requestMatchers(HttpMethod.PUT,    "/api/suppliers/**").hasAnyRole("USER", "ADMIN");
        auth.requestMatchers(HttpMethod.PATCH,  "/api/suppliers/**").hasAnyRole("USER", "ADMIN");
        auth.requestMatchers(HttpMethod.DELETE, "/api/suppliers/**").hasAnyRole("USER", "ADMIN");

        auth.requestMatchers("/api/**").authenticated();
        auth.anyRequest().authenticated();
    }
}
