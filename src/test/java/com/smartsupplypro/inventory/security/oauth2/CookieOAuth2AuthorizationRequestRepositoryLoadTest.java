package com.smartsupplypro.inventory.security.oauth2;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import com.smartsupplypro.inventory.config.AppProperties;
import com.smartsupplypro.inventory.security.CookieOAuth2AuthorizationRequestRepository;

import jakarta.servlet.http.Cookie;

/**
 * Unit tests for the load behavior of {@link CookieOAuth2AuthorizationRequestRepository},
 * covering absent, malformed, and schema-edge-case cookies.
 */
class CookieOAuth2AuthorizationRequestRepositoryLoadTest {

    private final CookieOAuth2AuthorizationRequestRepository repo =
            new CookieOAuth2AuthorizationRequestRepository(new AppProperties());

    /**
     * Behavior when the authorization request cookie is absent or malformed.
     */
    @SuppressWarnings("unused")
    @Nested
    class WhenCookieIsAbsentOrMalformed {

        @Test
        void should_return_null_when_no_cookies_present() {
            assertThat(repo.loadAuthorizationRequest(new MockHttpServletRequest())).isNull();
        }

        @ParameterizedTest
        @MethodSource("com.smartsupplypro.inventory.security.oauth2.CookieOAuth2AuthorizationRequestRepositoryTestSupport#invalidAuthCookieValues")
        void should_return_null_when_cookie_cannot_be_decoded_or_parsed(String cookieValue) {
            MockHttpServletRequest req = new MockHttpServletRequest();
            req.setCookies(new Cookie(
                CookieOAuth2AuthorizationRequestRepositoryTestSupport.AUTH_COOKIE, cookieValue));
            assertThat(repo.loadAuthorizationRequest(req)).isNull();
        }
    }

    /**
     * Behavior when the cookie is present but contains schema deviations.
     */
    @SuppressWarnings("unused")
    @Nested
    class WhenCookieHasSchemaDeviations {

        @Test
        void should_produce_empty_scope_set_when_scopes_field_is_not_an_array() {
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
                CookieOAuth2AuthorizationRequestRepositoryTestSupport.base64UrlEncodeUtf8(json)));

            OAuth2AuthorizationRequest loaded = repo.loadAuthorizationRequest(req);
            assertThat(loaded).isNotNull();
            assertThat(loaded.getScopes()).isEmpty();
        }
    }
}
