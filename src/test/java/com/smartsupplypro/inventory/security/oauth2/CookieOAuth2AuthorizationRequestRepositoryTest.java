package com.smartsupplypro.inventory.security.oauth2;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import com.smartsupplypro.inventory.config.AppProperties;
import com.smartsupplypro.inventory.security.CookieOAuth2AuthorizationRequestRepository;

import jakarta.servlet.http.Cookie;

/**
 * Unit tests for {@link CookieOAuth2AuthorizationRequestRepository}
 * cookie serialization and deserialization behavior.
 */
class CookieOAuth2AuthorizationRequestRepositoryTest {

    private final CookieOAuth2AuthorizationRequestRepository repo =
            new CookieOAuth2AuthorizationRequestRepository(new AppProperties());

    /**
     * Behavior when the authorization request cookie is present and valid.
     */
    @Nested
    class WhenCookieIsValid {

        @Test
        void should_round_trip_authorization_request_through_cookie() {
            MockHttpServletRequest req = new MockHttpServletRequest();
            req.setSecure(true);
            MockHttpServletResponse res = new MockHttpServletResponse();

            OAuth2AuthorizationRequest original =
                    CookieOAuth2AuthorizationRequestRepositoryTestSupport.sampleAuthorizationRequest();
            repo.saveAuthorizationRequest(original, req, res);

            String encoded = CookieOAuth2AuthorizationRequestRepositoryTestSupport.cookieValueFromSetCookieHeaders(
                res.getHeaders(CookieOAuth2AuthorizationRequestRepositoryTestSupport.HEADER_SET_COOKIE),
                CookieOAuth2AuthorizationRequestRepositoryTestSupport.AUTH_COOKIE);
            assertThat(encoded).isNotBlank();

            MockHttpServletRequest followUp = new MockHttpServletRequest();
            followUp.setCookies(new Cookie(
                CookieOAuth2AuthorizationRequestRepositoryTestSupport.AUTH_COOKIE, encoded));

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
    }

    /**
     * Behavior when the authorization request cookie is removed.
     */
    @Nested
    class WhenCookieIsRemoved {

        @Test
        void should_return_existing_request_and_write_deletion_cookie() {
            OAuth2AuthorizationRequest original =
                    CookieOAuth2AuthorizationRequestRepositoryTestSupport.sampleAuthorizationRequest();

            MockHttpServletRequest saveReq =
                    CookieOAuth2AuthorizationRequestRepositoryTestSupport.forwardedHttpsRequest();
            MockHttpServletResponse saveRes = new MockHttpServletResponse();
            repo.saveAuthorizationRequest(original, saveReq, saveRes);

            String encoded = CookieOAuth2AuthorizationRequestRepositoryTestSupport.cookieValueFromSetCookieHeaders(
                saveRes.getHeaders(CookieOAuth2AuthorizationRequestRepositoryTestSupport.HEADER_SET_COOKIE),
                CookieOAuth2AuthorizationRequestRepositoryTestSupport.AUTH_COOKIE);
            assertThat(encoded).isNotBlank();

            MockHttpServletRequest req =
                    CookieOAuth2AuthorizationRequestRepositoryTestSupport.forwardedHttpsRequest();
            req.setCookies(new Cookie(
                CookieOAuth2AuthorizationRequestRepositoryTestSupport.AUTH_COOKIE, encoded));

            MockHttpServletResponse res = new MockHttpServletResponse();
            OAuth2AuthorizationRequest removed = repo.removeAuthorizationRequest(req, res);

            assertThat(removed).isNotNull();
            assertThat(removed.getClientId()).isEqualTo(original.getClientId());
            assertThat(res.getHeaders(CookieOAuth2AuthorizationRequestRepositoryTestSupport.HEADER_SET_COOKIE))
                .anyMatch(h -> h.startsWith(
                    CookieOAuth2AuthorizationRequestRepositoryTestSupport.AUTH_COOKIE + "=")
                    && h.contains("Max-Age=0"));
        }
    }
}
