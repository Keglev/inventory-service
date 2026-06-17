package com.smartsupplypro.inventory.security;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

/**
 * Serializes and deserializes {@link OAuth2AuthorizationRequest} to and from
 * a Base64URL-encoded JSON string for HTTP cookie storage.
 *
 * <p>Uses a manually constructed {@link Map} rather than direct Jackson binding
 * because {@code OAuth2AuthorizationRequest} is not Jackson-serializable by default.</p>
 */
final class OAuth2AuthorizationRequestCookieSerializer {

    private static final Logger log = LoggerFactory.getLogger(OAuth2AuthorizationRequestCookieSerializer.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private OAuth2AuthorizationRequestCookieSerializer() {}

    static String serialize(OAuth2AuthorizationRequest r) {
        try {
            // Base64+JSON chosen over Java serialization for readability and cross-version safety
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
            return Base64.getUrlEncoder()
                    .encodeToString(MAPPER.writeValueAsString(m).getBytes(StandardCharsets.UTF_8));
        } catch (JsonProcessingException e) {
            return Base64.getUrlEncoder().encodeToString("{}".getBytes(StandardCharsets.UTF_8));
        }
    }

    static OAuth2AuthorizationRequest deserialize(String encoded) {
        try {
            String json = new String(Base64.getUrlDecoder().decode(encoded), StandardCharsets.UTF_8);
            Map<String, Object> m = MAPPER.readValue(json, new TypeReference<Map<String, Object>>() {});
            return buildRequest(m);
        } catch (IllegalArgumentException | java.io.IOException e) {
            log.warn("Malformed authorization request cookie ignored");
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private static OAuth2AuthorizationRequest buildRequest(Map<String, Object> m) {
        Map<String, Object> additionalParameters =
                (Map<String, Object>) m.getOrDefault("additionalParameters", Map.of());
        Map<String, Object> attributes =
                (Map<String, Object>) m.getOrDefault("attributes", Map.of());
        OAuth2AuthorizationRequest.Builder b = OAuth2AuthorizationRequest.authorizationCode()
                .authorizationUri((String) m.get("authorizationUri"))
                .clientId((String) m.get("clientId"))
                .redirectUri((String) m.get("redirectUri"))
                .scopes(extractScopes(m.get("scopes")))
                .state((String) m.get("state"))
                .additionalParameters(additionalParameters)
                .attributes(attrs -> attrs.putAll(attributes));
        Object authReqUri = m.get("authorizationRequestUri");
        if (authReqUri instanceof String s && !s.isBlank()) b.authorizationRequestUri(s);
        return b.build();
    }

    private static Set<String> extractScopes(Object sc) {
        Set<String> scopes = new HashSet<>();
        if (sc instanceof Iterable<?> it) {
            for (Object s : it) {
                if (s != null) scopes.add(String.valueOf(s));
            }
        }
        return scopes;
    }
}
