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
     * Configure URL-based authorization rules.
     *
     * @param auth         Spring Security authorization registry
     * @param demoReadonly global demo flag (currently leveraged via method security –
     *                     this method keeps URL rules simple and role-based)
     */
    public void configureAuthorization(
            AuthorizeHttpRequestsConfigurer<HttpSecurity>.AuthorizationManagerRequestMatcherRegistry auth,
            boolean isDemoReadonly) {
        
        /* -------------------- Public / health / OAuth2 endpoints -------------------- */

        // Health/info endpoints – keep publicly readable
        auth.requestMatchers("/actuator/health", "/actuator/info").permitAll();

        // Public API health endpoint (used by Fly.io HTTP health check)
        auth.requestMatchers("/api/health", "/api/health/**").permitAll();

        // Static / root / error pages (adapt if you have a different frontend setup)
        auth.requestMatchers("/", "/index.html", "/error").permitAll();

        // OAuth2 login and logout endpoints
        auth.requestMatchers("/oauth2/**", "/login/**", "/logout/**").permitAll();

        // If you have a public auth/user info endpoint for debugging/demo,
        // you can open it here; otherwise it will fall under /api/** below.

        /* ----------------------- Inventory API (read) ----------------------- */

        // Allow any authenticated user (including demo) to read inventory:
        // - list endpoint
        // - get-by-id
        auth.requestMatchers(HttpMethod.GET, "/api/inventory", "/api/inventory/**")
                .authenticated();

        /* ----------------------- Supplier API (read) ------------------------ */

        // Allow any authenticated user to read suppliers
        auth.requestMatchers(HttpMethod.GET, "/api/suppliers", "/api/suppliers/**")
                .authenticated();

        /* -------------------- Inventory API (mutations) --------------------- */
        // NOTE:
        // - Method-level @PreAuthorize on InventoryItemController already enforces:
        //   - create: hasRole('ADMIN') and !@securityService.isDemo()
        //   - adjustQuantity: hasAnyRole('USER','ADMIN') and !@securityService.isDemo()
        //   - changePrice: similar pattern
        // - Here we keep URL rules role-based; demo is blocked by method security.

        auth.requestMatchers(HttpMethod.POST, "/api/inventory/**")
                .hasAnyRole("USER", "ADMIN");
        auth.requestMatchers(HttpMethod.PUT, "/api/inventory/**")
                .hasAnyRole("USER", "ADMIN");
        auth.requestMatchers(HttpMethod.PATCH, "/api/inventory/**")
                .hasAnyRole("USER", "ADMIN");
        auth.requestMatchers(HttpMethod.DELETE, "/api/inventory/**")
                .hasAnyRole("USER", "ADMIN");

        /* -------------------- Supplier API (mutations) ---------------------- */

        auth.requestMatchers(HttpMethod.POST, "/api/suppliers/**")
                .hasAnyRole("USER", "ADMIN");
        auth.requestMatchers(HttpMethod.PUT, "/api/suppliers/**")
                .hasAnyRole("USER", "ADMIN");
        auth.requestMatchers(HttpMethod.PATCH, "/api/suppliers/**")
                .hasAnyRole("USER", "ADMIN");
        auth.requestMatchers(HttpMethod.DELETE, "/api/suppliers/**")
                .hasAnyRole("USER", "ADMIN");

        /* ---------------------- All other API endpoints --------------------- */

        // Everything else under /api/** requires authentication
        auth.requestMatchers("/api/**").authenticated();

        // Default: everything else must be authenticated
        auth.anyRequest().authenticated();
    }
}
