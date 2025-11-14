package com.smartsupplypro.inventory.config;

import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletResponse;

/**
 * Security entry point helper for authentication failure handling.
 * 
 * <p>Creates entry points that return JSON 401 for API requests or redirect for browser requests.</p>
 */
@Component
public class SecurityEntryPointHelper {

    /**
     * Creates entry point that returns JSON 401 for API requests.
     */
    public AuthenticationEntryPoint createApiEntryPoint() {
        return (req, res, ex) -> {
            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            res.setContentType("application/json");
            res.getWriter().write("{\"message\":\"Unauthorized\"}");
        };
    }

    /**
     * Creates entry point that redirects to frontend login page.
     */
    public AuthenticationEntryPoint createWebEntryPoint(String frontendBaseUrl) {
        return (req, res, ex) -> {
            String target = frontendBaseUrl + "/login";
            res.sendRedirect(target);
        };
    }
}
