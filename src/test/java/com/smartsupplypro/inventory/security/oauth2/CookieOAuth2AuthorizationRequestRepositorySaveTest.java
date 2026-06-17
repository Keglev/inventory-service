package com.smartsupplypro.inventory.security.oauth2;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import com.smartsupplypro.inventory.config.AppProperties;
import com.smartsupplypro.inventory.security.CookieOAuth2AuthorizationRequestRepository;

/**
 * Unit tests for the save behavior of {@link CookieOAuth2AuthorizationRequestRepository}:
 * cookie attributes, allowlist enforcement for the return-URL cookie, and null-request deletion.
 */
class CookieOAuth2AuthorizationRequestRepositorySaveTest {

    private final CookieOAuth2AuthorizationRequestRepository repo = repoWithAllOrigins();

    private static CookieOAuth2AuthorizationRequestRepository repoWithAllOrigins() {
        AppProperties props = new AppProperties();
        props.getCors().setAllowedOrigins(List.of(
            "http://localhost:5173",
            "https://localhost:5173",
            "https://inventory-service.koyeb.app"
        ));
        return new CookieOAuth2AuthorizationRequestRepository(props);
    }

    /**
     * Behavior when the request passed to save is null.
     */
    @SuppressWarnings("unused")
    @Nested
    class WhenRequestIsNull {

        @Test
        void should_write_deletion_cookie_when_saved_request_is_null() {
            MockHttpServletRequest req =
                    CookieOAuth2AuthorizationRequestRepositoryTestSupport.forwardedHttpsRequest();
            MockHttpServletResponse res = new MockHttpServletResponse();

            repo.saveAuthorizationRequest(null, req, res);

            List<String> headers = res.getHeaders(
                    CookieOAuth2AuthorizationRequestRepositoryTestSupport.HEADER_SET_COOKIE);
            assertThat(headers)
                .anyMatch(h -> h.startsWith(
                    CookieOAuth2AuthorizationRequestRepositoryTestSupport.AUTH_COOKIE + "="))
                .anyMatch(h -> h.contains("Max-Age=0"))
                .anyMatch(h -> h.contains("HttpOnly"))
                .anyMatch(h -> h.contains("SameSite=None"))
                .anyMatch(h -> h.contains("Secure"));
        }
    }

    /**
     * Behavior for the optional SSP_RETURN origin cookie.
     */
    @SuppressWarnings("unused")
    @Nested
    class WhenReturnParamIsProvided {

        @ParameterizedTest
        @ValueSource(strings = {
            "http://localhost:5173",
            "https://localhost:5173",
            "https://inventory-service.koyeb.app"
        })
        void should_set_return_cookie_when_origin_is_allowlisted(String returnOrigin) {
            MockHttpServletRequest req =
                    CookieOAuth2AuthorizationRequestRepositoryTestSupport.forwardedHttpsRequest();
            req.setParameter("return", returnOrigin);
            MockHttpServletResponse res = new MockHttpServletResponse();
            repo.saveAuthorizationRequest(
                CookieOAuth2AuthorizationRequestRepositoryTestSupport.sampleAuthorizationRequest(), req, res);

            List<String> setCookies = res.getHeaders(
                    CookieOAuth2AuthorizationRequestRepositoryTestSupport.HEADER_SET_COOKIE);
            String returnHdr = setCookies.stream()
                .filter(h -> h.startsWith(
                    CookieOAuth2AuthorizationRequestRepositoryTestSupport.RETURN_COOKIE + "="))
                .findFirst().orElse("");
            String authHdr = setCookies.stream()
                .filter(h -> h.startsWith(
                    CookieOAuth2AuthorizationRequestRepositoryTestSupport.AUTH_COOKIE + "="))
                .findFirst().orElse("");

            assertThat(returnHdr).startsWith(
                CookieOAuth2AuthorizationRequestRepositoryTestSupport.RETURN_COOKIE + "=" + returnOrigin)
                .contains("SameSite=None").contains("Secure").doesNotContain("HttpOnly");
            assertThat(authHdr).contains("HttpOnly").contains("Max-Age=180");
        }

        @Test
        void should_not_set_return_cookie_when_origin_is_not_allowlisted() {
            MockHttpServletRequest req =
                    CookieOAuth2AuthorizationRequestRepositoryTestSupport.forwardedHttpsRequest();
            req.setParameter("return", "https://evil.example.test");
            MockHttpServletResponse res = new MockHttpServletResponse();
            repo.saveAuthorizationRequest(
                CookieOAuth2AuthorizationRequestRepositoryTestSupport.sampleAuthorizationRequest(), req, res);

            List<String> headers = res.getHeaders(
                    CookieOAuth2AuthorizationRequestRepositoryTestSupport.HEADER_SET_COOKIE);
            assertThat(headers).noneMatch(h -> h.startsWith(
                CookieOAuth2AuthorizationRequestRepositoryTestSupport.RETURN_COOKIE + "="));
            assertThat(headers).anyMatch(h -> h.startsWith(
                CookieOAuth2AuthorizationRequestRepositoryTestSupport.AUTH_COOKIE + "="));
        }
    }

    /**
     * Behavior when the request is not over HTTPS.
     */
    @SuppressWarnings("unused")
    @Nested
    class WhenRequestIsInsecure {

        @Test
        void should_omit_secure_flag_when_request_is_not_https() {
            MockHttpServletRequest req = new MockHttpServletRequest();
            req.setSecure(false);
            MockHttpServletResponse res = new MockHttpServletResponse();

            repo.saveAuthorizationRequest(
                CookieOAuth2AuthorizationRequestRepositoryTestSupport.sampleAuthorizationRequest(), req, res);

            String authHdr = res.getHeaders(
                    CookieOAuth2AuthorizationRequestRepositoryTestSupport.HEADER_SET_COOKIE).stream()
                .filter(h -> h.startsWith(
                    CookieOAuth2AuthorizationRequestRepositoryTestSupport.AUTH_COOKIE + "="))
                .findFirst().orElse("");

            assertThat(authHdr).isNotBlank().doesNotContain("Secure").contains("HttpOnly");
        }
    }
}
