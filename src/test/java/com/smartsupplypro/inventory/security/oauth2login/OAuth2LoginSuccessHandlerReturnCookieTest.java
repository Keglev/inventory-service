package com.smartsupplypro.inventory.security.oauth2login;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import com.smartsupplypro.inventory.config.AppProperties;
import com.smartsupplypro.inventory.security.OAuth2LoginSuccessHandler;

/**
 * Unit tests for {@link OAuth2LoginSuccessHandler} SSP_RETURN cookie
 * and redirect allowlist behavior.
 */
@ExtendWith(MockitoExtension.class)
class OAuth2LoginSuccessHandlerReturnCookieTest {

    @InjectMocks
    OAuth2LoginSuccessHandler handler;

    @Mock
    AppProperties props;

    @Mock
    AppProperties.Frontend frontend;

    @Mock
    AppProperties.Cors cors;

    private void stubFrontend(String baseUrl, String landingPath) {
        when(props.getFrontend()).thenReturn(frontend);
        when(frontend.getBaseUrl()).thenReturn(baseUrl);
        when(frontend.getLandingPath()).thenReturn(landingPath);
    }

    private void stubCors(String... origins) {
        when(props.getCors()).thenReturn(cors);
        when(cors.getAllowedOrigins()).thenReturn(List.of(origins));
    }

    /**
     * Behavior when the SSP_RETURN cookie contains an allowlisted origin.
     */
    @Nested
    class WhenReturnCookieIsAllowlisted {

        @Test
        void should_redirect_to_return_url_and_clear_cookie_with_secure_via_forwarded_https()
                throws Exception {
            String baseUrl = "https://localhost:8081";
            stubFrontend(baseUrl, "/api/me");
            stubCors(baseUrl);

            MockHttpServletRequest req =
                    OAuth2LoginSuccessHandlerTestSupport.requestWithReturnCookie(baseUrl);
            req.addHeader("X-Forwarded-Proto", "https");
            MockHttpServletResponse res =
                    new OAuth2LoginSuccessHandlerTestSupport.LenientRedirectResponse();

            handler.onAuthenticationSuccess(req, res,
                OAuth2LoginSuccessHandlerTestSupport.token("u@example.com", "U"));

            assertThat(res.getRedirectedUrl()).isEqualTo(baseUrl + "/auth");
            assertThat(res.getHeaders("Set-Cookie")).anySatisfy(h -> assertThat(h)
                .contains("SSP_RETURN=").contains("Path=/").contains("Max-Age=0")
                .contains("SameSite=None").contains("Secure").doesNotContain("HttpOnly"));
        }

        @Test
        void should_set_secure_on_cookie_clear_when_request_is_direct_https() throws Exception {
            String baseUrl = "https://localhost:8081";
            stubFrontend(baseUrl, "/api/me");
            stubCors(baseUrl);

            MockHttpServletRequest req =
                    OAuth2LoginSuccessHandlerTestSupport.requestWithReturnCookie(baseUrl);
            req.setSecure(true);
            MockHttpServletResponse res =
                    new OAuth2LoginSuccessHandlerTestSupport.LenientRedirectResponse();

            handler.onAuthenticationSuccess(req, res,
                OAuth2LoginSuccessHandlerTestSupport.token("u4@example.com", "U4"));

            assertThat(res.getRedirectedUrl()).isEqualTo(baseUrl + "/auth");
            assertThat(res.getHeaders("Set-Cookie")).anySatisfy(h ->
                assertThat(h).contains("Secure"));
        }

        @Test
        void should_not_set_secure_on_cookie_clear_when_forwarded_proto_is_http() throws Exception {
            String baseUrl = "https://localhost:8081";
            stubFrontend(baseUrl, "/api/me");
            stubCors(baseUrl);

            MockHttpServletRequest req =
                    OAuth2LoginSuccessHandlerTestSupport.requestWithReturnCookie(baseUrl);
            req.addHeader("X-Forwarded-Proto", "http");
            MockHttpServletResponse res =
                    new OAuth2LoginSuccessHandlerTestSupport.LenientRedirectResponse();

            handler.onAuthenticationSuccess(req, res,
                OAuth2LoginSuccessHandlerTestSupport.token("u5@example.com", "U5"));

            assertThat(res.getRedirectedUrl()).isEqualTo(baseUrl + "/auth");
            assertThat(res.getHeaders("Set-Cookie")).anySatisfy(h ->
                assertThat(h).doesNotContain("Secure"));
        }
    }

    /**
     * Behavior when the SSP_RETURN cookie is present but rejected.
     */
    @Nested
    class WhenReturnCookieIsRejected {

        @Test
        void should_keep_default_redirect_and_clear_cookie_when_origin_not_allowlisted()
                throws Exception {
            String baseUrl = "https://localhost:8081";
            stubFrontend(baseUrl, "/api/me");
            stubCors(baseUrl);

            MockHttpServletRequest req =
                    OAuth2LoginSuccessHandlerTestSupport.requestWithReturnCookie("https://evil.example.com");
            MockHttpServletResponse res =
                    new OAuth2LoginSuccessHandlerTestSupport.LenientRedirectResponse();

            handler.onAuthenticationSuccess(req, res,
                OAuth2LoginSuccessHandlerTestSupport.token("u2@example.com", "U2"));

            assertThat(res.getRedirectedUrl()).isEqualTo(baseUrl + "/api/me");
            assertThat(res.getHeaders("Set-Cookie")).anySatisfy(h -> assertThat(h)
                .contains("SSP_RETURN=").contains("Max-Age=0")
                .contains("SameSite=None").doesNotContain("Secure"));
        }

        @Test
        void should_keep_default_redirect_and_clear_cookie_when_return_value_is_empty()
                throws Exception {
            String baseUrl = "https://localhost:8081";
            stubFrontend(baseUrl, "/api/me");

            MockHttpServletRequest req =
                    OAuth2LoginSuccessHandlerTestSupport.requestWithReturnCookie("");
            MockHttpServletResponse res =
                    new OAuth2LoginSuccessHandlerTestSupport.LenientRedirectResponse();

            handler.onAuthenticationSuccess(req, res,
                OAuth2LoginSuccessHandlerTestSupport.token("u3@example.com", "U3"));

            assertThat(res.getRedirectedUrl()).isEqualTo(baseUrl + "/api/me");
            assertThat(res.getHeaders("Set-Cookie")).anySatisfy(h ->
                assertThat(h).contains("SSP_RETURN=").contains("SameSite=None"));
        }
    }

    /**
     * Behavior when no SSP_RETURN cookie is present.
     */
    @Nested
    class WhenReturnCookieIsAbsent {

        @Test
        void should_not_write_any_set_cookie_header_when_no_ssp_return_cookie_present()
                throws Exception {
            String baseUrl = "https://localhost:8081";
            stubFrontend(baseUrl, "/api/me");

            MockHttpServletRequest req = new MockHttpServletRequest();
            req.setCookies(new jakarta.servlet.http.Cookie("OTHER", "x"));
            MockHttpServletResponse res =
                    new OAuth2LoginSuccessHandlerTestSupport.LenientRedirectResponse();

            handler.onAuthenticationSuccess(req, res,
                OAuth2LoginSuccessHandlerTestSupport.token("u6@example.com", "U6"));

            assertThat(res.getRedirectedUrl()).isEqualTo(baseUrl + "/api/me");
            assertThat(res.getHeaders("Set-Cookie")).isEmpty();
        }
    }
}
