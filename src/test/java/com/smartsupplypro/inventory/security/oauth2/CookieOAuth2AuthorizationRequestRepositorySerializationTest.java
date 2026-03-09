package com.smartsupplypro.inventory.security.oauth2;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import com.smartsupplypro.inventory.security.CookieOAuth2AuthorizationRequestRepository;

/**
 * Unit tests for serialization edge cases in {@link CookieOAuth2AuthorizationRequestRepository}.
 *
 * <p><strong>Scope</strong>:</p>
 * <ul>
 *   <li>Verify that unexpected serialization failures do not crash the login flow.</li>
 *   <li>Validate the fallback behavior: serialization failure produces a minimal "{}" payload.</li>
 * </ul>
 *
 * <p><strong>Why this matters</strong>:</p>
 * OAuth2 authorization requests may contain attributes that are not JSON-serializable. The repository
 * intentionally fails closed by emitting a benign payload rather than throwing and breaking authentication.
 */
class CookieOAuth2AuthorizationRequestRepositorySerializationTest {

    private final CookieOAuth2AuthorizationRequestRepository repo = new CookieOAuth2AuthorizationRequestRepository();

    static final class SelfRef {
        public SelfRef getSelf() {
            return this;
        }
    }

    @Test
    @DisplayName("saveAuthorizationRequest: serialization failure falls back to '{}' JSON")
    void saveAuthorizationRequest_serializationFailureFallsBackToEmptyJson() {
        // Scenario: request attributes contain a cyclic reference which typical JSON serializers cannot handle.
        // Expected: repository catches the serialization error and writes "{}" as the cookie payload.
        OAuth2AuthorizationRequest r = OAuth2AuthorizationRequest.authorizationCode()
            .authorizationUri("https://accounts.example.test/oauth2/auth")
            .clientId("client-123")
            .redirectUri("https://app.example.test/callback")
            .scopes(Set.of("openid"))
            .state("state-xyz")
            .attributes(attrs -> attrs.put("cycle", new SelfRef()))
            .build();

        MockHttpServletRequest req = new MockHttpServletRequest();
        MockHttpServletResponse res = new MockHttpServletResponse();
        repo.saveAuthorizationRequest(r, req, res);

        String encoded = CookieOAuth2AuthorizationRequestRepositoryTestSupport.cookieValueFromSetCookieHeaders(
            res.getHeaders(CookieOAuth2AuthorizationRequestRepositoryTestSupport.HEADER_SET_COOKIE),
            CookieOAuth2AuthorizationRequestRepositoryTestSupport.AUTH_COOKIE
        );
        assertThat(encoded).isNotBlank();
        assertThat(CookieOAuth2AuthorizationRequestRepositoryTestSupport.base64UrlDecodeUtf8(encoded)).isEqualTo("{}");
    }
}
