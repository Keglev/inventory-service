package com.smartsupplypro.inventory.config;

import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer;
import org.springframework.stereotype.Component;

/**
 * Security authorization helper for HTTP request authorization rules.
 * 
 * <p>Centralizes authorization logic for demo mode and role-based access control.</p>
 */
@Component
public class SecurityAuthorizationHelper {

    /**
     * Configures authorization rules with demo mode support.
     * 
     * <p>Applies public access, demo read-only, and role-based patterns.</p>
     */
    public void configureAuthorization(
            AuthorizeHttpRequestsConfigurer<HttpSecurity>.AuthorizationManagerRequestMatcherRegistry auth,
            boolean isDemoReadonly) {
        
        // CORS preflight and public endpoints
        auth.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll();
        auth.requestMatchers("/logout").permitAll();
        auth.requestMatchers(
                "/", "/actuator/**", "/health/**",
                "/oauth2/**", "/login/oauth2/**", "/login/**", "/error"
        ).permitAll();

        // Demo mode: allow read-only endpoints without login
        if (isDemoReadonly) {
            auth.requestMatchers(HttpMethod.GET, "/api/inventory/**").permitAll();
            auth.requestMatchers(HttpMethod.GET, "/api/analytics/**").permitAll();
            auth.requestMatchers(HttpMethod.GET, "/api/suppliers/**").permitAll();
        }

        // Default: authenticated users may READ these resources
        auth.requestMatchers(HttpMethod.GET, "/api/inventory/**").authenticated();
        auth.requestMatchers(HttpMethod.GET, "/api/suppliers/**").authenticated();
        auth.requestMatchers(HttpMethod.GET, "/api/analytics/**").authenticated();

        // Admin-only area (role-protected)
        auth.requestMatchers("/api/admin/**").hasRole("ADMIN");
        auth.requestMatchers(HttpMethod.POST, "/api/inventory/**").hasRole("ADMIN");
        auth.requestMatchers(HttpMethod.PUT, "/api/inventory/**").hasRole("ADMIN");
        auth.requestMatchers(HttpMethod.PATCH, "/api/inventory/**").hasRole("ADMIN");
        auth.requestMatchers(HttpMethod.DELETE, "/api/inventory/**").hasRole("ADMIN");
        auth.requestMatchers(HttpMethod.POST, "/api/suppliers/**").hasRole("ADMIN");
        auth.requestMatchers(HttpMethod.PUT, "/api/suppliers/**").hasRole("ADMIN");
        auth.requestMatchers(HttpMethod.PATCH, "/api/suppliers/**").hasRole("ADMIN");
        auth.requestMatchers(HttpMethod.DELETE, "/api/suppliers/**").hasRole("ADMIN");

        // Everything else under /api/** must be authenticated
        auth.requestMatchers("/api/**").authenticated();

        // Default: everything else authenticated
        auth.anyRequest().authenticated();
    }
}
