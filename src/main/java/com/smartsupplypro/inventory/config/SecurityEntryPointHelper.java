package com.smartsupplypro.inventory.config;

import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletResponse;

/**
 * Factory for authentication entry points and logout response handlers.
 *
 * <p>Centralizes the API-vs-browser response strategy: API calls receive JSON status codes
 * while browser requests receive redirects to the configured frontend.</p>
 */
@Component
public class SecurityEntryPointHelper {

    /** Returns 401 JSON for unauthenticated API requests so clients can handle it programmatically. */
    public AuthenticationEntryPoint createApiEntryPoint() {
        return (req, res, ex) -> {
            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            res.setContentType("application/json");
            res.getWriter().write("{\"message\":\"Unauthorized\"}");
        };
    }

    public AuthenticationEntryPoint createWebEntryPoint(String frontendBaseUrl) {
        return (req, res, ex) -> res.sendRedirect(frontendBaseUrl + "/login");
    }

    /**
     * Returns 204 for API logout or redirects the browser to the logout-success page.
     * The {@code return} query parameter is accepted only when it shares the configured
     * base URL to prevent open-redirect attacks.
     */
    public LogoutSuccessHandler createLogoutSuccessHandler(AppProperties props) {
        return (req, res, auth) -> {
            boolean isApi = Boolean.TRUE.equals(req.getAttribute("IS_API_REQUEST"));
            if (isApi) {
                res.setStatus(HttpServletResponse.SC_NO_CONTENT);
                return;
            }
            String base = props.getFrontend().getBaseUrl();
            String ret = req.getParameter("return");
            // Only honour the return param if it stays within our own frontend — prevents open redirects
            String target = (ret != null && ret.startsWith(base)) ? ret : base + "/logout-success";
            res.sendRedirect(target);
        };
    }
}
