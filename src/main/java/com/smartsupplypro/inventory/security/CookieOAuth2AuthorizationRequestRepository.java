package com.smartsupplypro.inventory.security;

import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import com.smartsupplypro.inventory.config.AppProperties;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Persists OAuth2 authorization requests in HTTP cookies
 * to support stateless authorization code flow.
 *
 * <p>Replaces the default session-based
 * {@link org.springframework.security.oauth2.client.web.HttpSessionOAuth2AuthorizationRequestRepository}
 * for deployments where session affinity cannot be guaranteed.</p>
 *
 * @see SecurityConfig
 * @see OAuth2LoginSuccessHandler
 */
public class CookieOAuth2AuthorizationRequestRepository
        implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

    /** Default name; matches {@link AppProperties.Cookie} default value. */
    public static final String AUTH_REQUEST_COOKIE_NAME = "OAUTH2_AUTH_REQUEST";
    private static final Logger log = LoggerFactory.getLogger(CookieOAuth2AuthorizationRequestRepository.class);

    private final String cookieName;
    private final int cookieMaxAge;
    private final List<String> allowedReturnOrigins;

    public CookieOAuth2AuthorizationRequestRepository(AppProperties props) {
        this.cookieName = props.getCookie().getAuthRequestName();
        this.cookieMaxAge = props.getCookie().getAuthRequestMaxAge();
        this.allowedReturnOrigins = props.getCors().getAllowedOrigins();
    }

    /**
     * Loads the authorization request from the incoming cookie.
     *
     * <p>Returns {@code null} if the cookie is absent or cannot
     * be deserialized, triggering a new authorization flow.</p>
     *
     * @param request current HTTP request
     * @return deserialized authorization request, or {@code null}
     */
    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
        return read(request).orElse(null);
    }

    /**
     * Saves the authorization request to a secure HttpOnly cookie.
     * Also captures an optional {@code return} parameter to support
     * post-login redirect. A {@code null} request clears the cookie.
     *
     * @param authorizationRequest the request, or {@code null} to clear
     * @param request  current HTTP request
     * @param response current HTTP response
     */
    @Override
    public void saveAuthorizationRequest(OAuth2AuthorizationRequest authorizationRequest,
                                         HttpServletRequest request,
                                         HttpServletResponse response) {
        if (authorizationRequest == null) {
            deleteCookie(request, response);
            return;
        }
        saveReturnCookie(request, response);
        String encoded = OAuth2AuthorizationRequestCookieSerializer.serialize(authorizationRequest);
        Cookie cookie = new Cookie(cookieName, encoded);
        cookie.setHttpOnly(true);
        cookie.setSecure(isSecureOrForwardedHttps(request));
        cookie.setPath("/");
        cookie.setMaxAge(cookieMaxAge);
        // SameSite=None required for cross-origin OAuth2 redirect from Google
        // Secure=true enforced when HTTPS to comply with SameSite=None browser requirements
        addCookieWithSameSite(response, cookie, "None");
    }

    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(HttpServletRequest request,
                                                                 HttpServletResponse response) {
        OAuth2AuthorizationRequest existing = read(request).orElse(null);
        deleteCookie(request, response);
        return existing;
    }

    private Optional<OAuth2AuthorizationRequest> read(HttpServletRequest request) {
        if (request.getCookies() == null) return Optional.empty();
        for (Cookie c : request.getCookies()) {
            if (cookieName.equals(c.getName())) {
                OAuth2AuthorizationRequest r = OAuth2AuthorizationRequestCookieSerializer.deserialize(c.getValue());
                if (r != null) return Optional.of(r);
            }
        }
        return Optional.empty();
    }

    private void saveReturnCookie(HttpServletRequest request, HttpServletResponse response) {
        String ret = request.getParameter("return");
        if (ret == null || ret.isBlank()) return;
        if (!allowedReturnOrigins.contains(ret)) {
            log.warn("Rejected non-allowlisted return origin: {}", ret);
            return;
        }
        Cookie r = new Cookie("SSP_RETURN", ret);
        // Not HttpOnly so frontend JS can read and restore post-login destination
        r.setHttpOnly(false);
        r.setSecure(isSecureOrForwardedHttps(request));
        r.setPath("/");
        r.setMaxAge(300);
        addCookieWithSameSite(response, r, "None");
    }

    private void deleteCookie(HttpServletRequest request, HttpServletResponse response) {
        Cookie cookie = new Cookie(cookieName, "");
        cookie.setHttpOnly(true);
        cookie.setSecure(isSecureOrForwardedHttps(request));
        cookie.setPath("/");
        cookie.setMaxAge(0);
        addCookieWithSameSite(response, cookie, "None");
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

    private static boolean isSecureOrForwardedHttps(HttpServletRequest request) {
        if (request.isSecure()) return true;
        String xfProto = request.getHeader("X-Forwarded-Proto");
        return xfProto != null && xfProto.equalsIgnoreCase("https");
    }
}
