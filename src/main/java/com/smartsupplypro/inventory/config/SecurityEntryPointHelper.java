package com.smartsupplypro.inventory.config;

import java.net.URI;
import java.net.URISyntaxException;

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

    /** Sends unauthenticated browser requests to the frontend login page. */
    public AuthenticationEntryPoint createWebEntryPoint(String frontendBaseUrl) {
        return (req, res, ex) -> res.sendRedirect(frontendBaseUrl + "/login");
    }

    /**
     * Returns 204 for API logout or redirects the browser to the logout-success page.
     * The {@code return} query parameter is honoured only when its origin (scheme, host
     * and port) equals the origin of the configured frontend base URL.
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
            String target = isSameOrigin(ret, base) ? ret : base + "/logout-success";
            res.sendRedirect(target);
        };
    }

    // /logout accepts cross-site form posts, so this check is all that stands between
    // the parameter and an open redirect. A string prefix is not an origin:
    // https://app.example is a prefix of https://app.example.attacker.test and of
    // https://app.example@attacker.test. User info is refused as well: the frontend never
    // sends it, and a return URL has no use for credentials.
    private static boolean isSameOrigin(String candidate, String base) {
        if (candidate == null) return false;
        try {
            URI target = new URI(candidate);
            URI origin = new URI(base);
            return target.getRawUserInfo() == null
                && origin.getScheme().equalsIgnoreCase(target.getScheme())
                && origin.getHost().equalsIgnoreCase(target.getHost())
                && origin.getPort() == target.getPort();
        } catch (URISyntaxException e) {
            return false;
        }
    }
}
