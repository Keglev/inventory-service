package com.smartsupplypro.inventory.security;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.Set;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Stateless OAuth2 authorization request repository using secure HTTP cookies.
 * Stores OAuth2AuthorizationRequest in an HttpOnly, Secure cookie with Base64-encoded JSON.
 * Handles serialization, deserialization, and secure cookie attributes.
 * @see AuthorizationRequestRepository
 * @see OAuth2AuthorizationRequest
 */
public class CookieOAuth2AuthorizationRequestRepository
        implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

    /** OAuth2 authorization request cookie name. */
    public static final String AUTH_REQUEST_COOKIE_NAME = "OAUTH2_AUTH_REQUEST";
    
    /** Cookie expiration (3 minutes). */
    private static final int COOKIE_EXPIRE_SECONDS = 180;

    /** Logger for OAuth2 events. */
    private static final Logger log = LoggerFactory.getLogger(CookieOAuth2AuthorizationRequestRepository.class);

    /** JSON mapper for request serialization. */
    private static final ObjectMapper MAPPER = new ObjectMapper();

    /** Loads authorization request from cookie. */
    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
        return read(request).orElse(null);
    }

    /**
     * Saves OAuth2 authorization request to secure cookie.
     * If null, deletes existing cookie.
     * @param authorizationRequest the OAuth2 authorization request
     * @param request the HTTP servlet request
     * @param response the HTTP servlet response
     */
    @Override
    public void saveAuthorizationRequest(OAuth2AuthorizationRequest authorizationRequest,
                                         HttpServletRequest request,
                                         HttpServletResponse response) {
        if (authorizationRequest == null) {
            deleteCookie(request, response);
            return;
        }
        // Handle optional return URL for post-login redirection
        // (only allow known origins for security)
        String ret = request.getParameter("return");
        if (ret != null && !ret.isBlank()) {
            List<String> allowed = List.of(
                "http://localhost:5173",
                "https://localhost:5173",
                "https://inventory-service.koyeb.app"
            );
            if (allowed.contains(ret)) {
                Cookie r = new Cookie("SSP_RETURN", ret);
                r.setHttpOnly(false);
                r.setSecure(isSecureOrForwardedHttps(request));
                r.setPath("/");
                r.setMaxAge(300);
                addCookieWithSameSite(response, r, "None");
            } else {
                log.warn("Enterprise OAuth2: Rejected non-allowlisted return origin: {}", ret);
            }
        }
        // Serialize and store authorization request in cookie
        String json = writeJson(authorizationRequest);
        String encoded = Base64.getUrlEncoder()
                .encodeToString(json.getBytes(StandardCharsets.UTF_8));

        Cookie cookie = new Cookie(AUTH_REQUEST_COOKIE_NAME, encoded);
        cookie.setHttpOnly(true);
        cookie.setSecure(isSecureOrForwardedHttps(request));
        cookie.setPath("/");
        cookie.setMaxAge(COOKIE_EXPIRE_SECONDS);

        addCookieWithSameSite(response, cookie, "None");
    }

    /**
     * Removes authorization request after authentication.
     * @return the removed OAuth2 authorization request
     * @param request the HTTP servlet request
     * @param response the HTTP servlet response
     */
    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(HttpServletRequest request,
                                                                 HttpServletResponse response) {
        OAuth2AuthorizationRequest existing = read(request).orElse(null);
        deleteCookie(request, response);
        return existing;
    }

    /**
     * Reads authorization request from cookie with error resilience.
     * @return optional OAuth2 authorization request
     * @param request the HTTP servlet request
     */
    private Optional<OAuth2AuthorizationRequest> read(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return Optional.empty();
        }
        // Search for the specific authorization request cookie
        for (Cookie c : request.getCookies()) {
            if (AUTH_REQUEST_COOKIE_NAME.equals(c.getName())) {
                try {
                    String json = new String(Base64.getUrlDecoder().decode(c.getValue()), StandardCharsets.UTF_8);
                    OAuth2AuthorizationRequest o = readJson(json);
                    if (o != null) {
                        return Optional.of(o);
                    }
                } catch (Exception e) {
                    log.warn("OAuth2: Malformed authorization request cookie ignored");
                }
            }
        }
        
        return Optional.empty();
    }

    /**
     * Securely removes authorization request cookie.
     * @param request the HTTP servlet request
     * @param response the HTTP servlet response
     */
    private void deleteCookie(HttpServletRequest request, HttpServletResponse response) {
        Cookie cookie = new Cookie(AUTH_REQUEST_COOKIE_NAME, "");
        cookie.setHttpOnly(true);
        cookie.setSecure(isSecureOrForwardedHttps(request));
        cookie.setPath("/");
        cookie.setMaxAge(0);
        addCookieWithSameSite(response, cookie, "None");
    }

    /**
     * Adds SameSite attribute for cross-origin compatibility.
     * @param response the HTTP servlet response
     * @param cookie the cookie to add
     * @param sameSite the SameSite attribute value
     */
    private static void addCookieWithSameSite(HttpServletResponse response, Cookie cookie, String sameSite) {
        StringBuilder sb = new StringBuilder();
        sb.append(cookie.getName()).append('=').append(cookie.getValue() == null ? "" : cookie.getValue());
        sb.append("; Path=").append(cookie.getPath() == null ? "/" : cookie.getPath());
        if (cookie.getMaxAge() >= 0) {
            sb.append("; Max-Age=").append(cookie.getMaxAge());
        }
        if (cookie.getSecure()) {
            sb.append("; Secure");
        }
        if (cookie.isHttpOnly()) {
            sb.append("; HttpOnly");
        }
        if (sameSite != null && !sameSite.isBlank()) {
            sb.append("; SameSite=").append(sameSite);
        }
        response.addHeader("Set-Cookie", sb.toString());
    }

    /**
     * Reconstructs OAuth2 authorization request from JSON.
     * @return the OAuth2 authorization request
     * @param json the JSON string representing the authorization request
     * @throws IllegalArgumentException if JSON is invalid
     * @SuppressWarnings("unchecked")
     */
    @SuppressWarnings("unchecked")
    private static OAuth2AuthorizationRequest readJson(String json) {
        try {
            Map<String, Object> m = MAPPER.readValue(json, new TypeReference<Map<String, Object>>() {});
            String authorizationUri = (String) m.get("authorizationUri");
            String clientId        = (String) m.get("clientId");
            String redirectUri     = (String) m.get("redirectUri");
            String state           = (String) m.get("state");

            // Extract scopes
            Set<String> scopes = new HashSet<>();
            Object sc = m.get("scopes");
            if (sc instanceof Iterable<?> it) {
                for (Object s : it) {
                    if (s != null) scopes.add(String.valueOf(s));
                }
            }

            // Extract additional parameters and attributes
            Map<String, Object> additionalParameters =
                    (Map<String, Object>) m.getOrDefault("additionalParameters", Map.of());
            Map<String, Object> attributes =
                    (Map<String, Object>) m.getOrDefault("attributes", Map.of());
            // Build OAuth2AuthorizationRequest
            OAuth2AuthorizationRequest.Builder b =
                    OAuth2AuthorizationRequest.authorizationCode()
                            .authorizationUri(authorizationUri)
                            .clientId(clientId)
                            .redirectUri(redirectUri)
                            .scopes(scopes)
                            .state(state)
                            .additionalParameters(additionalParameters)
                            .attributes(attrs -> attrs.putAll(attributes));

            Object authReqUri = m.get("authorizationRequestUri");
            if (authReqUri instanceof String s && !s.isBlank()) {
                b.authorizationRequestUri(s);
            }

            return b.build();
        } catch (IllegalArgumentException | java.io.IOException e) {
            return null;
        }
    }

    /**
     * Converts OAuth2 authorization request to JSON format.
     * @return JSON string representation
     * @param r the OAuth2 authorization request
     * @throws JsonProcessingException if serialization fails
     */
    private static String writeJson(OAuth2AuthorizationRequest r) {
        try {
            Map<String, Object> m = Map.of(
                "authorizationUri",        r.getAuthorizationUri(),
                "clientId",                r.getClientId(),
                "redirectUri",             r.getRedirectUri(),
                "scopes",                  r.getScopes(),
                "state",                   r.getState(),
                "responseType",            r.getResponseType() != null ? r.getResponseType().getValue() : "code",
                "additionalParameters",    r.getAdditionalParameters(),
                "attributes",              r.getAttributes(),
                "authorizationRequestUri", r.getAuthorizationRequestUri()
            );
            return MAPPER.writeValueAsString(m);
        } catch (JsonProcessingException e) {
        return "{}";
        }
    }

    /**
     * Detects HTTPS context including load balancer forwarding.
     * @param request the HTTP servlet request
     * @return true if request is secure or forwarded as HTTPS
     */
    private static boolean isSecureOrForwardedHttps(HttpServletRequest request) {
        if (request.isSecure()) return true;
        String xfProto = request.getHeader("X-Forwarded-Proto");
        return xfProto != null && xfProto.equalsIgnoreCase("https");
    }
}
