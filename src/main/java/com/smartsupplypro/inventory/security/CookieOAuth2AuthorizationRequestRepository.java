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
 * 
 * <p>Enables OAuth2 flows across load-balanced deployments by storing authorization
 * requests in short-lived, HttpOnly cookies instead of server sessions. Prevents
 * "authorization_request_not_found" errors in multi-instance environments.</p>
 * 
 * <p><strong>Enterprise Benefits:</strong> Stateless scalability, high availability,
 * secure cookie management with SameSite=None, and configurable return URL handling.</p>
 */
public class CookieOAuth2AuthorizationRequestRepository
        implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

    /** OAuth2 authorization request cookie name for stateless persistence. */
    public static final String AUTH_REQUEST_COOKIE_NAME = "OAUTH2_AUTH_REQUEST";
    
    /** Cookie expiration time in seconds (3 minutes for OAuth2 flow completion). */
    private static final int COOKIE_EXPIRE_SECONDS = 180;

    /** Logger for OAuth2 authorization request lifecycle events. */
    private static final Logger log = LoggerFactory.getLogger(CookieOAuth2AuthorizationRequestRepository.class);

    /** JSON object mapper for authorization request serialization. */
    private static final ObjectMapper MAPPER = new ObjectMapper();

    /** Loads OAuth2 authorization request from secure cookie storage. */
    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
        return read(request).orElse(null);
    }

    /**
     * Saves OAuth2 authorization request to secure cookie with return URL handling.
     * 
     * <p>Stores authorization state in HttpOnly cookie and optionally captures
     * return URL for post-authentication redirect with origin allowlist security.</p>
     */
    @Override
    public void saveAuthorizationRequest(OAuth2AuthorizationRequest authorizationRequest,
                                         HttpServletRequest request,
                                         HttpServletResponse response) {
        if (authorizationRequest == null) {
            // Enterprise Cleanup: Clear cookie when authorization request is null
            deleteCookie(request, response);
            return;
        }

        // Enterprise Return URL: Capture optional return destination with security validation
        String ret = request.getParameter("return");
        if (ret != null && !ret.isBlank()) {
            // Enterprise Security: Origin allowlist prevents open redirect attacks
            List<String> allowed = List.of(
                "http://localhost:5173",     // Development environment
                "https://localhost:5173",    // Development HTTPS
                "https://inventory-service.koyeb.app"  // Production frontend
            );
            if (allowed.contains(ret)) {
                // Enterprise State Management: Store return URL for success handler
                Cookie r = new Cookie("SSP_RETURN", ret);
                r.setHttpOnly(false);  // Frontend needs read access for custom routing
                r.setSecure(isSecureOrForwardedHttps(request));
                r.setPath("/");
                r.setMaxAge(300); // Enterprise timeout: 5 minutes for OAuth2 flow completion
                addCookieWithSameSite(response, r, "None");
                log.debug("Set SSP_RETURN cookie for {}", ret);
            } else {
                log.warn("Ignored non-whitelisted return origin: {}", ret);
            }
        }
        
        // Enterprise Serialization: Convert authorization request to secure cookie format
        String json = writeJson(authorizationRequest);
        String encoded = Base64.getUrlEncoder()
                .encodeToString(json.getBytes(StandardCharsets.UTF_8));

        // Enterprise Cookie Security: HttpOnly, Secure, SameSite=None for cross-origin flows
        Cookie cookie = new Cookie(AUTH_REQUEST_COOKIE_NAME, encoded);
        cookie.setHttpOnly(true);  // Enterprise Security: Prevent XSS access
        cookie.setSecure(isSecureOrForwardedHttps(request));
        cookie.setPath("/");
        cookie.setMaxAge(COOKIE_EXPIRE_SECONDS);  // Enterprise timeout: 3 minutes for OAuth2 completion

        addCookieWithSameSite(response, cookie, "None");
        log.debug("Saved {} cookie. secure={}, maxAge={}, sameSite=None",
            AUTH_REQUEST_COOKIE_NAME, cookie.getSecure(), cookie.getMaxAge());
    }

    /**
     * Removes OAuth2 authorization request after successful authentication.
     * Returns the existing request for processing while cleaning up cookie state.
     */
    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(HttpServletRequest request,
                                                                 HttpServletResponse response) {
        OAuth2AuthorizationRequest existing = read(request).orElse(null);
        deleteCookie(request, response);  // Enterprise Cleanup: Remove single-use authorization state
        return existing;
    }

    /**
     * Enterprise Helper: Reads authorization request from cookie with error resilience.
     * Handles Base64 decoding and JSON deserialization with graceful failure handling.
     */
    private Optional<OAuth2AuthorizationRequest> read(HttpServletRequest request) {
        if (request.getCookies() == null) return Optional.empty();
        for (Cookie c : request.getCookies()) {
            if (AUTH_REQUEST_COOKIE_NAME.equals(c.getName())) {
                try {
                    // Enterprise Security: Base64 decode with charset safety
                    String json = new String(Base64.getUrlDecoder().decode(c.getValue()), StandardCharsets.UTF_8);
                    OAuth2AuthorizationRequest o = readJson(json);
                    if (o != null) {
                        return Optional.of(o);
                    }
                } catch (Exception ignored) {
                    // Enterprise Resilience: Ignore malformed cookies, continue search
                }
            }
        }
        return Optional.empty();
    }

    /**
     * Enterprise Cookie Cleanup: Securely removes authorization request cookie.
     * Ensures proper cleanup of OAuth2 state with secure cookie attributes.
     */
    private void deleteCookie(HttpServletRequest request, HttpServletResponse response) {
        Cookie cookie = new Cookie(AUTH_REQUEST_COOKIE_NAME, "");
        cookie.setHttpOnly(true);  // Enterprise Security: Maintain HttpOnly for cleanup
        cookie.setSecure(isSecureOrForwardedHttps(request));
        cookie.setPath("/");
        cookie.setMaxAge(0);  // Enterprise Pattern: Immediate expiration for state cleanup
        addCookieWithSameSite(response, cookie, "None");
        log.debug("Deleted {} cookie.", AUTH_REQUEST_COOKIE_NAME);
    }

    /**
     * Enterprise Cookie Security: Adds SameSite attribute for cross-origin compatibility.
     * Essential for OAuth2 flows between frontend and backend on different domains.
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
     * Enterprise Deserialization: Reconstructs OAuth2 authorization request from JSON.
     * Handles complex object graph reconstruction with error resilience and type safety.
     */
    @SuppressWarnings("unchecked")
    private static OAuth2AuthorizationRequest readJson(String json) {
        try {
            // Enterprise State Recovery: Parse persisted authorization request structure
            Map<String, Object> m = MAPPER.readValue(json, new TypeReference<Map<String, Object>>() {});
            String authorizationUri = (String) m.get("authorizationUri");
            String clientId        = (String) m.get("clientId");
            String redirectUri     = (String) m.get("redirectUri");
            String state           = (String) m.get("state");

            // Enterprise Collection Handling: Safely convert scopes array to Set
            Set<String> scopes = new HashSet<>();
            Object sc = m.get("scopes");
            if (sc instanceof Iterable<?> it) {
                for (Object s : it) {
                    if (s != null) scopes.add(String.valueOf(s));  // Enterprise null safety
                }
            }

            // Enterprise Parameter Recovery: Restore additional OAuth2 parameters and attributes
            Map<String, Object> additionalParameters =
                    (Map<String, Object>) m.getOrDefault("additionalParameters", Map.of());
            Map<String, Object> attributes =
                    (Map<String, Object>) m.getOrDefault("attributes", Map.of());

            // Enterprise Builder Pattern: Reconstruct OAuth2 authorization request
            OAuth2AuthorizationRequest.Builder b =
                    OAuth2AuthorizationRequest.authorizationCode()
                            .authorizationUri(authorizationUri)
                            .clientId(clientId)
                            .redirectUri(redirectUri)
                            .scopes(scopes)
                            .state(state)
                            .additionalParameters(additionalParameters)
                            .attributes(attrs -> attrs.putAll(attributes));

            // Enterprise Optional Field: Handle authorization request URI if present
            Object authReqUri = m.get("authorizationRequestUri");
            if (authReqUri instanceof String s && !s.isBlank()) {
                b.authorizationRequestUri(s);
            }

            // Enterprise Compatibility: Default to authorization code flow for OAuth2 standard compliance
            return b.build();
        } catch (IllegalArgumentException | java.io.IOException e) {
            return null; // Enterprise Resilience: Graceful degradation on parse errors
        }
    }

    /**
     * Enterprise Serialization: Converts OAuth2 authorization request to JSON format.
     * Preserves all essential OAuth2 state for stateless cookie-based persistence.
     */
    private static String writeJson(OAuth2AuthorizationRequest r) {
        try {
            // Enterprise State Persistence: Capture complete OAuth2 authorization context
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
        // Enterprise Fallback: Empty JSON structure for graceful error handling
        return "{}";
        }
    }

    /**
     * Enterprise Security: Detects HTTPS context including load balancer forwarding.
     * Essential for secure cookie configuration in enterprise deployment scenarios.
     */
    private static boolean isSecureOrForwardedHttps(HttpServletRequest request) {
        if (request.isSecure()) return true;
        String xfProto = request.getHeader("X-Forwarded-Proto");  // Enterprise load balancer support
        return xfProto != null && xfProto.equalsIgnoreCase("https");
    }
}
