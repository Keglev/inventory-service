package com.smartsupplypro.inventory.config;

import java.io.IOException;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Security filter helper for API request detection and flagging.
 * 
 * <p>Flags JSON API requests so authentication failures can return 401 instead of redirecting.</p>
 */
@Component
public class SecurityFilterHelper {

    /**
     * Creates filter that flags API requests accepting JSON responses.
     * 
     * <p>Sets IS_API_REQUEST attribute for downstream authentication handlers.</p>
     */
    public OncePerRequestFilter createApiDetectionFilter() {
        return new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(@NonNull HttpServletRequest req,
                                            @NonNull HttpServletResponse res,
                                            @NonNull FilterChain chain)
                    throws ServletException, IOException {
                String accept = req.getHeader("Accept");
                if (req.getRequestURI().startsWith("/api/")
                        && accept != null && accept.contains("application/json")) {
                    req.setAttribute("IS_API_REQUEST", true);
                }
                chain.doFilter(req, res);
            }
        };
    }
}
