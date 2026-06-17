package com.smartsupplypro.inventory.security;

import java.io.IOException;
import java.net.URI;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.smartsupplypro.inventory.config.AppProperties;
import com.smartsupplypro.inventory.service.UserProvisioningService;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Handles successful OAuth2 authentication by provisioning
 * the user and redirecting to the frontend application.
 *
 * <p>Delegates user creation and role assignment to
 * {@link UserProvisioningService} to keep this handler
 * focused on the authentication flow.</p>
 *
 * @see CookieOAuth2AuthorizationRequestRepository
 * @see SecurityConfig
 */
@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final Logger log = LoggerFactory.getLogger(OAuth2LoginSuccessHandler.class);

    private final AppProperties props;
    private final UserProvisioningService userProvisioningService;

    public OAuth2LoginSuccessHandler(AppProperties props, UserProvisioningService userProvisioningService) {
        this.props = props;
        this.userProvisioningService = userProvisioningService;
    }

    /**
     * Provisions the authenticated user and redirects to the frontend.
     *
     * <p>Guards against duplicate invocations in the same request cycle.
     * Validates that email and name are present before delegating to
     * {@link UserProvisioningService}. Redirect target is resolved from
     * the optional {@code SSP_RETURN} cookie, validated against the
     * configured CORS allowed origins.</p>
     *
     * @param request        current HTTP request
     * @param response       current HTTP response
     * @param authentication successful OAuth2 authentication token
     */
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {
        if (request.getAttribute("OAUTH2_SUCCESS_REDIRECT_DONE") != null) {
            log.debug("Success redirect already performed; skipping.");
            return;
        }
        request.setAttribute("OAUTH2_SUCCESS_REDIRECT_DONE", Boolean.TRUE);

        OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) authentication;
        String email = token.getPrincipal().getAttribute("email");
        String name = token.getPrincipal().getAttribute("name");
        if (email == null || name == null) {
            throw new IllegalStateException("Email or name not provided by OAuth2 provider");
        }

        userProvisioningService.provisionIfAbsent(email, name);

        String target = resolveRedirectTarget(request, response);
        log.info("Authentication success, redirecting to: {}", target);
        setAlwaysUseDefaultTargetUrl(true);
        setDefaultTargetUrl(URI.create(target).toString());
        super.onAuthenticationSuccess(request, response, authentication);
    }

    private String resolveRedirectTarget(HttpServletRequest request, HttpServletResponse response) {
        String target = props.getFrontend().getBaseUrl() + props.getFrontend().getLandingPath();
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return target;
        for (Cookie c : cookies) {
            if (!"SSP_RETURN".equals(c.getName())) continue;
            String candidate = c.getValue();
            if (candidate != null && !candidate.isBlank()) {
                // Redirect URL construction: validate against allowed origins to prevent open redirect
                if (props.getCors().getAllowedOrigins().contains(candidate)) {
                    target = candidate + "/auth";
                } else {
                    log.warn("Rejected non-allowlisted return URL: {}", candidate);
                }
            }
            clearReturnCookie(request, response);
            break;
        }
        return target;
    }

    private void clearReturnCookie(HttpServletRequest request, HttpServletResponse response) {
        Cookie clear = new Cookie("SSP_RETURN", "");
        clear.setPath("/");
        clear.setMaxAge(0);
        clear.setSecure(isSecureOrForwardedHttps(request));
        // Not HttpOnly: frontend created it non-HttpOnly so clearing must match
        clear.setHttpOnly(false);
        addCookieWithSameSite(response, clear, "None");
    }

    private static boolean isSecureOrForwardedHttps(HttpServletRequest request) {
        if (request.isSecure()) return true;
        String xfProto = request.getHeader("X-Forwarded-Proto");
        return xfProto != null && xfProto.equalsIgnoreCase("https");
    }

    private static void addCookieWithSameSite(HttpServletResponse response, Cookie cookie, String sameSite) {
        StringBuilder sb = new StringBuilder();
        sb.append(cookie.getName()).append('=').append(cookie.getValue() == null ? "" : cookie.getValue());
        sb.append("; Path=").append(cookie.getPath() == null ? "/" : cookie.getPath());
        if (cookie.getMaxAge() >= 0) sb.append("; Max-Age=").append(cookie.getMaxAge());
        if (cookie.getSecure()) sb.append("; Secure");
        if (cookie.isHttpOnly()) sb.append("; HttpOnly");
        if (sameSite != null && !sameSite.isBlank()) sb.append("; SameSite=").append(sameSite);
        response.addHeader("Set-Cookie", sb.toString());
    }
}
