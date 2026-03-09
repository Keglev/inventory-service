package com.smartsupplypro.inventory.security.oauth2;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import com.smartsupplypro.inventory.security.CookieOAuth2AuthorizationRequestRepository;

import jakarta.servlet.http.Cookie;

/**
 * Unit tests for the "load" behavior of {@link CookieOAuth2AuthorizationRequestRepository}.
 *
 * <p><strong>Scope</strong>:</p>
 * <ul>
 *   <li>Verify that missing or malformed cookies are handled safely (return {@code null} rather than throwing).</li>
 *   <li>Verify defensive parsing behavior for schema deviations (e.g., {@code scopes} not being an iterable).</li>
 * </ul>
 *
 * <p><strong>Why this matters</strong>:</p>
 * Cookie values are untrusted input (clients can delete or tamper with them). The repository must be resilient
 * to decode/JSON failures and treat them as "no authorization request".
 */
class CookieOAuth2AuthorizationRequestRepositoryLoadTest {

    private final CookieOAuth2AuthorizationRequestRepository repo = new CookieOAuth2AuthorizationRequestRepository();

    @Test
    @DisplayName("loadAuthorizationRequest: returns null when request has no cookies")
    void loadAuthorizationRequest_returnsNull_whenNoCookies() {
        // Scenario: request contains no cookies.
        // Expected: repository reports "no auth request" (null).
        assertThat(repo.loadAuthorizationRequest(new MockHttpServletRequest())).isNull();
    }

    @ParameterizedTest
    @MethodSource("com.smartsupplypro.inventory.security.oauth2.CookieOAuth2AuthorizationRequestRepositoryTestSupport#invalidAuthCookieValues")
    @DisplayName("loadAuthorizationRequest: ignores malformed base64 and invalid JSON cookies")
    void loadAuthorizationRequest_ignoresInvalidCookies(String cookieValue) {
        // Scenario: cookie is present but cannot be base64url-decoded or parsed as JSON.
        // Expected: repository returns null (treat as missing cookie) without propagating exceptions.
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.setCookies(new Cookie(CookieOAuth2AuthorizationRequestRepositoryTestSupport.AUTH_COOKIE, cookieValue));
        assertThat(repo.loadAuthorizationRequest(req)).isNull();
    }

    @Test
    @DisplayName("loadAuthorizationRequest: handles non-iterable scopes by producing an empty scope set")
    void loadAuthorizationRequest_handlesNonIterableScopes() {
        // Scenario: cookie JSON is structurally valid, but "scopes" is not a JSON array/collection.
        // Expected: repository loads the request and defensively treats scopes as empty.
        String json = "{" +
            "\"authorizationUri\":\"https://accounts.example.test/oauth2/auth\"," +
            "\"clientId\":\"client-123\"," +
            "\"redirectUri\":\"https://app.example.test/callback\"," +
            "\"state\":\"state-xyz\"," +
            "\"scopes\":\"openid\"," +
            "\"additionalParameters\":{\"prompt\":\"consent\"}," +
            "\"attributes\":{\"nonce\":\"n\"}" +
            "}";

        MockHttpServletRequest req = new MockHttpServletRequest();
        req.setCookies(new Cookie(
            CookieOAuth2AuthorizationRequestRepositoryTestSupport.AUTH_COOKIE,
            CookieOAuth2AuthorizationRequestRepositoryTestSupport.base64UrlEncodeUtf8(json)
        ));

        OAuth2AuthorizationRequest loaded = repo.loadAuthorizationRequest(req);
        assertThat(loaded).isNotNull();
        assertThat(loaded.getScopes()).isEmpty();
    }
}
