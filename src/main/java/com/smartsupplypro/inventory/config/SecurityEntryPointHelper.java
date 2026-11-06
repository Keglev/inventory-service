package com.smartsupplypro.inventory.config;

import java.net.URI;
import java.net.URISyntaxException;
import java.time.Instant;

import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;
import org.springframework.stereotype.Component;

import com.smartsupplypro.inventory.exception.dto.ErrorResponse;

import jakarta.servlet.http.HttpServletResponse;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

/**
 * Factory for authentication entry points and logout response handlers.
 *
 * <p>Centralizes the API-vs-browser response strategy: API calls receive JSON status codes
 * while browser requests receive redirects to the configured frontend.</p>
 */
@Component
public class SecurityEntryPointHelper {

    private static final ObjectMapper MAPPER = new JsonMapper();

    /**
     * Returns 401 with the ErrorResponse envelope for unauthenticated API requests. The entry
     * point runs in the filter chain, before any controller advice, so it writes the envelope
     * itself; the message equals the advice's 401 message.
     */
    public AuthenticationEntryPoint createApiEntryPoint() {
        return (req, res, ex) -> {
            ErrorResponse body = new ErrorResponse("unauthorized", "Authentication required",
                Instant.now().toString(), null);
            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            res.setContentType("application/json");
            res.getWriter().write(MAPPER.writeValueAsString(body));
        };
    }

    /** Sends unauthenticated browser requests to the frontend login page. */
    public AuthenticationEntryPoint createWebEntryPoint(String frontendBaseUrl) {
        return (req, res, ex) -> res.sendRedirect(frontendBaseUrl + "/login");
    }

    /**
     * Redirects the browser to the logout-success page after POST /logout.
     * The {@code return} query parameter is honoured only when its origin (scheme, host
     * and port) equals the origin of the configured frontend base URL.
     */
    public LogoutSuccessHandler createLogoutSuccessHandler(AppProperties props) {
        return (req, res, auth) -> {
            String base = props.getFrontend().getBaseUrl();
            String ret = req.getParameter("return");
            String target = isSameOrigin(ret, base) ? ret : base + "/logout-success";
            res.sendRedirect(target);
        };
    }

    // /logout takes cross-site form posts, so this check alone stops an open redirect. A prefix
    // is no origin (https://app.example.attacker.test, https://app.example@attacker.test);
    // user info is refused too, as the frontend never sends it.
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
