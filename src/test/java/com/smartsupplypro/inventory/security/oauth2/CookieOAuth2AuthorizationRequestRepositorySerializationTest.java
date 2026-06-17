package com.smartsupplypro.inventory.security.oauth2;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import com.smartsupplypro.inventory.config.AppProperties;
import com.smartsupplypro.inventory.security.CookieOAuth2AuthorizationRequestRepository;

/**
 * Unit tests for serialization failure handling in {@link CookieOAuth2AuthorizationRequestRepository}:
 * the repository must not crash the login flow when attributes cannot be serialized.
 */
class CookieOAuth2AuthorizationRequestRepositorySerializationTest {

    private final CookieOAuth2AuthorizationRequestRepository repo =
            new CookieOAuth2AuthorizationRequestRepository(new AppProperties());

    static final class SelfRef {
        public SelfRef getSelf() {
            return this;
        }
    }

    @Test
    void should_fall_back_to_empty_json_when_serialization_fails() {
        // Cyclic reference triggers JSON serialization failure; repository must write a benign payload.
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
            CookieOAuth2AuthorizationRequestRepositoryTestSupport.AUTH_COOKIE);
        assertThat(encoded).isNotBlank();
        assertThat(CookieOAuth2AuthorizationRequestRepositoryTestSupport.base64UrlDecodeUtf8(encoded))
            .isEqualTo("{}");
    }
}
