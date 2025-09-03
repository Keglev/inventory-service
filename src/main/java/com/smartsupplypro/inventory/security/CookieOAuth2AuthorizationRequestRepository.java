package com.smartsupplypro.inventory.security;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashSet;
import java.util.Optional;
import java.util.Map;
import java.util.Set;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Stores the OAuth2 AuthorizationRequest in a short-lived, HttpOnly cookie.
 * Avoids "authorization_request_not_found" when the callback lands on a different instance.
 *
 * Cookie name: OAUTH2_AUTH_REQUEST
 *  - HttpOnly; Secure (mirrors request.isSecure()); SameSite=None; Path=/; Max-Age ~3m
 *
 * NOTE: This implementation matches Spring Security's AuthorizationRequestRepository
 * where removeAuthorizationRequest(HttpServletRequest, HttpServletResponse) returns T.
 */
public class CookieOAuth2AuthorizationRequestRepository
        implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

    public static final String AUTH_REQUEST_COOKIE_NAME = "OAUTH2_AUTH_REQUEST";
    private static final int COOKIE_EXPIRE_SECONDS = 180; // 3 minutes

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
        return read(request).orElse(null);
    }

    @Override
    public void saveAuthorizationRequest(OAuth2AuthorizationRequest authorizationRequest,
                                         HttpServletRequest request,
                                         HttpServletResponse response) {
        if (authorizationRequest == null) {
            // Clear cookie if saving null
            deleteCookie(request, response);
            return;
        }
        String json = writeJson(authorizationRequest);
        String encoded = Base64.getUrlEncoder()
                .encodeToString(json.getBytes(StandardCharsets.UTF_8));

        Cookie cookie = new Cookie(AUTH_REQUEST_COOKIE_NAME, encoded);
        cookie.setHttpOnly(true);
        cookie.setSecure(request.isSecure());
        cookie.setPath("/");
        cookie.setMaxAge(COOKIE_EXPIRE_SECONDS);

        addCookieWithSameSite(response, cookie, "None");
    }

    /**
     * Spring Security variant where the two-argument remove method returns the request.
     * (No single-argument remove method in this version.)
     */
    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(HttpServletRequest request,
                                                                 HttpServletResponse response) {
        OAuth2AuthorizationRequest existing = read(request).orElse(null);
        deleteCookie(request, response);
        return existing;
    }

    // ------------ helpers ------------

    private Optional<OAuth2AuthorizationRequest> read(HttpServletRequest request) {
        if (request.getCookies() == null) return Optional.empty();
        for (Cookie c : request.getCookies()) {
            if (AUTH_REQUEST_COOKIE_NAME.equals(c.getName())) {
                try {
                    String json = new String(Base64.getUrlDecoder().decode(c.getValue()), StandardCharsets.UTF_8);
                    OAuth2AuthorizationRequest o = readJson(json);
                    if (o != null) {
                        return Optional.of(o);
                    }
                } catch (Exception ignored) {
                }
            }
        }
        return Optional.empty();
    }

    private void deleteCookie(HttpServletRequest request, HttpServletResponse response) {
        Cookie cookie = new Cookie(AUTH_REQUEST_COOKIE_NAME, "");
        cookie.setHttpOnly(true);
        cookie.setSecure(request.isSecure());
        cookie.setPath("/");
        cookie.setMaxAge(0);
        addCookieWithSameSite(response, cookie, "None");
    }

    /**
     * Adds a Set-Cookie header with an explicit SameSite directive.
     * (Servlet Cookie API doesn't have a portable setter for SameSite yet.)
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

    @SuppressWarnings("unchecked")
    private static OAuth2AuthorizationRequest readJson(String json) {
        try {
            // Shape we persisted in writeJson()
            Map<String, Object> m = MAPPER.readValue(json, new TypeReference<Map<String, Object>>() {});
            String authorizationUri = (String) m.get("authorizationUri");
            String clientId        = (String) m.get("clientId");
            String redirectUri     = (String) m.get("redirectUri");
            String state           = (String) m.get("state");

            // scopes array -> Set<String>
            Set<String> scopes = new HashSet<>();
            Object sc = m.get("scopes");
            if (sc instanceof Iterable<?> it) {
                for (Object s : it) {
                    if (s != null) scopes.add(String.valueOf(s));
                }
            }

            Map<String, Object> additionalParameters =
                    (Map<String, Object>) m.getOrDefault("additionalParameters", Map.of());
            Map<String, Object> attributes =
                    (Map<String, Object>) m.getOrDefault("attributes", Map.of());

            // Rebuild the request
            OAuth2AuthorizationRequest.Builder b =
                    OAuth2AuthorizationRequest.authorizationCode()
                            .authorizationUri(authorizationUri)
                            .clientId(clientId)
                            .redirectUri(redirectUri)
                            .scopes(scopes)
                            .state(state)
                            .additionalParameters(additionalParameters)
                            .attributes(attrs -> attrs.putAll(attributes));

            // Optional field we stored; safe to ignore if absent
            Object authReqUri = m.get("authorizationRequestUri");
            if (authReqUri instanceof String s && !s.isBlank()) {
                b.authorizationRequestUri(s);
            }

            // If responseType was stored and differs, you could adapt here.
            // (Authorization Code is the default we build above.)

            return b.build();
        } catch (IllegalArgumentException | java.io.IOException e) {
            return null; // Base64 decode error or JSON parse error -> treat as absent
        }
    }

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
        // Fallback: empty JSON; caller will still Base64 it
        return "{}";
        }
    }
}
