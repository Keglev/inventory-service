package com.smartsupplypro.inventory.security.oauth2;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import com.smartsupplypro.inventory.security.CookieOAuth2AuthorizationRequestRepository;

import jakarta.servlet.http.Cookie;

/**
 * Unit tests for {@link CookieOAuth2AuthorizationRequestRepository}.
 *
 * <p><strong>Scope</strong>:</p>
 * <ul>
 *   <li>Exercise cookie persistence behavior for {@code OAuth2AuthorizationRequest} without a Spring context.</li>
 *   <li>Validate that we can serialize → store → load a request reliably ("round-trip" behavior).</li>
 *   <li>Validate remove behavior returns the existing request and clears the cookie.</li>
 * </ul>
 *
 * <p><strong>Why a unit test (not an integration test)</strong>:</p>
 * <ul>
 *   <li>This repository is pure servlet-cookie logic; starting a Spring context would add cost without increasing
 *       confidence for these code paths.</li>
 *   <li>Cookies are validated by inspecting {@code Set-Cookie} headers on a mock servlet response.</li>
 * </ul>
 *
 * <p><strong>Behavior Coverage</strong>:</p>
 * <ul>
 *   <li><b>Round-trip:</b> after saving, the cookie content can be loaded into an equivalent authorization request.</li>
 *   <li><b>Remove:</b> removing returns the existing request and emits a deletion cookie header.</li>
 * </ul>
 *
 * <p><strong>Note</strong>:</p>
 * The finer-grained behaviors (save flags, load invalid cookies, SameSite formatting, serialization fallback)
 * are intentionally split into focused test classes in this package for maintainability.
 */
class CookieOAuth2AuthorizationRequestRepositoryTest {

    private final CookieOAuth2AuthorizationRequestRepository repo = new CookieOAuth2AuthorizationRequestRepository();

    @Test
    @DisplayName("save+load: round-trips authorization request through cookie")
    void saveAndLoad_roundTripsAuthorizationRequest() {
        // Scenario: persist an authorization request into a cookie, then later load it back.
        // Expected: loaded request matches the original request fields we rely on (clientId, redirectUri, scopes, etc.).
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.setSecure(true);
        MockHttpServletResponse res = new MockHttpServletResponse();

        OAuth2AuthorizationRequest original = CookieOAuth2AuthorizationRequestRepositoryTestSupport.sampleAuthorizationRequest();
        repo.saveAuthorizationRequest(original, req, res);

        String encoded = CookieOAuth2AuthorizationRequestRepositoryTestSupport.cookieValueFromSetCookieHeaders(
            res.getHeaders(CookieOAuth2AuthorizationRequestRepositoryTestSupport.HEADER_SET_COOKIE),
            CookieOAuth2AuthorizationRequestRepositoryTestSupport.AUTH_COOKIE
        );
        assertThat(encoded).isNotBlank();

        MockHttpServletRequest followUp = new MockHttpServletRequest();
        followUp.setCookies(new Cookie(
            CookieOAuth2AuthorizationRequestRepositoryTestSupport.AUTH_COOKIE,
            encoded
        ));

        OAuth2AuthorizationRequest loaded = repo.loadAuthorizationRequest(followUp);

        assertThat(loaded).isNotNull();
        assertThat(loaded.getAuthorizationUri()).isEqualTo(original.getAuthorizationUri());
        assertThat(loaded.getClientId()).isEqualTo(original.getClientId());
        assertThat(loaded.getRedirectUri()).isEqualTo(original.getRedirectUri());
        assertThat(loaded.getState()).isEqualTo(original.getState());
        assertThat(loaded.getScopes()).containsExactlyInAnyOrderElementsOf(original.getScopes());
        assertThat(loaded.getAdditionalParameters()).containsEntry("prompt", "consent");
        assertThat(loaded.getAttributes()).containsEntry("nonce", "nonce-abc");
        assertThat(loaded.getAuthorizationRequestUri()).isEqualTo(original.getAuthorizationRequestUri());
    }

    @Test
    @DisplayName("removeAuthorizationRequest: returns existing request and writes deletion cookie")
    void removeAuthorizationRequest_returnsExistingAndDeletesCookie() {
        // Scenario: an existing cookie is present and we ask the repository to remove it.
        // Expected:
        //  - method returns the parsed request (so downstream handlers can use it)
        //  - response includes a deletion Set-Cookie header (Max-Age=0) to clear client state
        OAuth2AuthorizationRequest original = CookieOAuth2AuthorizationRequestRepositoryTestSupport.sampleAuthorizationRequest();

        MockHttpServletRequest saveReq = CookieOAuth2AuthorizationRequestRepositoryTestSupport.forwardedHttpsRequest();
        MockHttpServletResponse saveRes = new MockHttpServletResponse();
        repo.saveAuthorizationRequest(original, saveReq, saveRes);

        String encoded = CookieOAuth2AuthorizationRequestRepositoryTestSupport.cookieValueFromSetCookieHeaders(
            saveRes.getHeaders(CookieOAuth2AuthorizationRequestRepositoryTestSupport.HEADER_SET_COOKIE),
            CookieOAuth2AuthorizationRequestRepositoryTestSupport.AUTH_COOKIE
        );
        assertThat(encoded).isNotBlank();

        MockHttpServletRequest req = CookieOAuth2AuthorizationRequestRepositoryTestSupport.forwardedHttpsRequest();
        req.setCookies(new Cookie(
            CookieOAuth2AuthorizationRequestRepositoryTestSupport.AUTH_COOKIE,
            encoded
        ));

        MockHttpServletResponse res = new MockHttpServletResponse();
        OAuth2AuthorizationRequest removed = repo.removeAuthorizationRequest(req, res);

        assertThat(removed).isNotNull();
        assertThat(removed.getClientId()).isEqualTo(original.getClientId());
        assertThat(res.getHeaders(CookieOAuth2AuthorizationRequestRepositoryTestSupport.HEADER_SET_COOKIE)).anyMatch(h ->
            h.startsWith(CookieOAuth2AuthorizationRequestRepositoryTestSupport.AUTH_COOKIE + "=") && h.contains("Max-Age=0"));
    }
}
