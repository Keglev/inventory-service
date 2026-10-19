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
        OAuthCookies.write(request, response, cookieName, encoded, cookieMaxAge);
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
            log.warn("Rejected non-allowlisted return origin: {}", LogSanitizer.sanitize(ret));
            return;
        }
        OAuthCookies.write(request, response, OAuthCookies.RETURN_COOKIE, ret, 300);
    }

    private void deleteCookie(HttpServletRequest request, HttpServletResponse response) {
        OAuthCookies.write(request, response, cookieName, "", 0);
    }
}
