package com.smartsupplypro.inventory.config;

import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer;
import org.springframework.stereotype.Component;

/**
 * Centralizes HTTP authorization rules so {@link SecurityConfig} stays focused
 * on filter chain wiring.
 *
 * <p>This layer decides only who must be signed in: public endpoints, the demo
 * read-only permits, and authentication for everything else. Roles are enforced in
 * one place, by {@code @PreAuthorize} on each controller method, so the two layers
 * cannot disagree; ApiAuthorizationContractTest fails for any {@code /api} handler
 * without one.</p>
 *
 * <p>When demo mode is active, read-only inventory, analytics, and supplier endpoints
 * are public so prospective users can explore data without logging in; the method
 * rules still decide which of those reads an anonymous caller may make.</p>
 */
@Component
public class SecurityAuthorizationHelper {

    /**
     * Applies public-access, optional demo read-only, and authentication rules in the
     * order Spring Security evaluates them (most-specific first).
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
                // Named rather than /actuator/**: only these two are meant to be
                // public. The wildcard also published the discovery index, and it
                // would silently expose anything later added to the exposure list.
                "/actuator/health",
                "/actuator/info",
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

        auth.anyRequest().authenticated();
    }
}
