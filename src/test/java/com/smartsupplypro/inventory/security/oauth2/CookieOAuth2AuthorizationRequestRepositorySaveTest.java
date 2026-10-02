package com.smartsupplypro.inventory.security.oauth2;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import ch.qos.logback.classic.Level;

import com.smartsupplypro.inventory.config.AppProperties;
import com.smartsupplypro.inventory.security.CookieOAuth2AuthorizationRequestRepository;
import com.smartsupplypro.inventory.testsupport.LogCapture;

/**
 * Unit tests for the save behavior of {@link CookieOAuth2AuthorizationRequestRepository}:
 * cookie attributes, allowlist enforcement for the return-URL cookie, null-request deletion,
 * and a rejected return value that stays on one log line.
 */
class CookieOAuth2AuthorizationRequestRepositorySaveTest {

    private final CookieOAuth2AuthorizationRequestRepository repo = repoWithAllOrigins();

    private static CookieOAuth2AuthorizationRequestRepository repoWithAllOrigins() {
        AppProperties props = new AppProperties();
        props.getCors().setAllowedOrigins(List.of(
            "http://localhost:5173",
            "https://localhost:5173",
            "https://www.smartsupplypro.de"
        ));
        return new CookieOAuth2AuthorizationRequestRepository(props);
    }

    /**
     * Behavior when the request passed to save is null.
     */
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
                .anyMatch(h -> h.contains("SameSite=Lax"))
                .anyMatch(h -> h.contains("Secure"));
        }
    }

    /**
     * Behavior for the optional SSP_RETURN origin cookie.
     */
    @Nested
    class WhenReturnParamIsProvided {

        @ParameterizedTest
        @ValueSource(strings = {
            "http://localhost:5173",
            "https://localhost:5173",
            "https://www.smartsupplypro.de"
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
                .contains("SameSite=Lax").contains("Secure").doesNotContain("HttpOnly");
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

        @Test
        void should_log_the_rejected_origin_on_one_line_when_it_carries_line_breaks() {
            MockHttpServletRequest req =
                    CookieOAuth2AuthorizationRequestRepositoryTestSupport.forwardedHttpsRequest();
            req.setParameter("return", "x" + (char) 13 + (char) 10 + "FORGED");

            try (LogCapture log = LogCapture.of(CookieOAuth2AuthorizationRequestRepository.class, Level.WARN)) {
                repo.saveAuthorizationRequest(
                    CookieOAuth2AuthorizationRequestRepositoryTestSupport.sampleAuthorizationRequest(),
                    req, new MockHttpServletResponse());

                assertThat(log.messages()).singleElement().asString()
                    .endsWith("x__FORGED").doesNotContain(String.valueOf((char) 13), String.valueOf((char) 10));
            }
        }
    }

    /**
     * Behavior when the request is not over HTTPS.
     */
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
