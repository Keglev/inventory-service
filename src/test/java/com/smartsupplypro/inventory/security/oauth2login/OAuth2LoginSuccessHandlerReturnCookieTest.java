package com.smartsupplypro.inventory.security.oauth2login;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import com.smartsupplypro.inventory.config.AppProperties;
import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.repository.AppUserRepository;
import com.smartsupplypro.inventory.security.OAuth2LoginSuccessHandler;

/**
 * Unit tests for {@link OAuth2LoginSuccessHandler} focused on the {@code SSP_RETURN} cookie and
 * redirect allowlist behavior.
 *
 * <h2>Scope</h2>
 * <ul>
 *   <li>Allowlisted return URL overrides the default target to {@code {return}/auth}.</li>
 *   <li>Non-allowlisted return URL is rejected and default redirect is used.</li>
 *   <li>The {@code SSP_RETURN} cookie is cleared as a single-use token after processing.</li>
 *   <li>Cookie clearing sets {@code Secure} only when HTTPS is detected (direct or forwarded).</li>
 * </ul>
 *
 * <h2>Design</h2>
 * <ul>
 *   <li>No Spring context: pure Mockito tests.</li>
 *   <li>Redirect assertions use a lenient response to avoid failures from multiple redirects.</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class OAuth2LoginSuccessHandlerReturnCookieTest {

    @InjectMocks
    OAuth2LoginSuccessHandler handler;

    @Mock
    AppUserRepository userRepository;

    @Mock
    AppProperties props;

    @Mock
    AppProperties.Frontend frontend;

    private void stubFrontend(String baseUrl, String landingPath) {
        when(props.getFrontend()).thenReturn(frontend);
        when(frontend.getBaseUrl()).thenReturn(baseUrl);
        when(frontend.getLandingPath()).thenReturn(landingPath);
    }

    @Test
    @DisplayName("SSP_RETURN allowlisted: overrides redirect to {return}/auth and clears cookie (Secure via X-Forwarded-Proto)")
    void returnCookieAllowlistedOverridesAndClears_withForwardedHttps() throws Exception {
        String baseUrl = "https://localhost:8081";
        stubFrontend(baseUrl, "/api/me");
        when(userRepository.findById("u@example.com")).thenReturn(Optional.of(new AppUser("u@example.com", "U")));

        MockHttpServletRequest req = OAuth2LoginSuccessHandlerTestSupport.requestWithReturnCookie(baseUrl);
        req.addHeader("X-Forwarded-Proto", "https");
        MockHttpServletResponse res = new OAuth2LoginSuccessHandlerTestSupport.LenientRedirectResponse();

        handler.onAuthenticationSuccess(req, res, OAuth2LoginSuccessHandlerTestSupport.token("u@example.com", "U"));

        assertThat(res.getRedirectedUrl()).isEqualTo(baseUrl + "/auth");
        assertThat(res.getHeaders("Set-Cookie"))
            .anySatisfy(h -> assertThat(h)
                .contains("SSP_RETURN=")
                .contains("Path=/")
                .contains("Max-Age=0")
                .contains("SameSite=None")
                .contains("Secure")
                .doesNotContain("HttpOnly"));
    }

    @Test
    @DisplayName("SSP_RETURN not allowlisted: keeps default redirect but still clears cookie (no Secure when http)")
    void returnCookieRejectedKeepsDefaultAndClears_withoutSecure() throws Exception {
        String baseUrl = "https://localhost:8081";
        String landingPath = "/api/me";
        stubFrontend(baseUrl, landingPath);
        when(userRepository.findById("u2@example.com")).thenReturn(Optional.of(new AppUser("u2@example.com", "U2")));

        MockHttpServletRequest req = OAuth2LoginSuccessHandlerTestSupport.requestWithReturnCookie("https://evil.example.com");
        MockHttpServletResponse res = new OAuth2LoginSuccessHandlerTestSupport.LenientRedirectResponse();

        handler.onAuthenticationSuccess(req, res, OAuth2LoginSuccessHandlerTestSupport.token("u2@example.com", "U2"));

        assertThat(res.getRedirectedUrl()).isEqualTo(baseUrl + landingPath);
        assertThat(res.getHeaders("Set-Cookie"))
            .anySatisfy(h -> assertThat(h)
                .contains("SSP_RETURN=")
                .contains("Path=/")
                .contains("Max-Age=0")
                .contains("SameSite=None")
                .doesNotContain("Secure"));
    }

    @Test
    @DisplayName("SSP_RETURN present but empty: treated as rejected and clears cookie")
    void returnCookieEmptyValueClears() throws Exception {
        String baseUrl = "https://localhost:8081";
        String landingPath = "/api/me";
        stubFrontend(baseUrl, landingPath);
        when(userRepository.findById("u3@example.com")).thenReturn(Optional.of(new AppUser("u3@example.com", "U3")));

        MockHttpServletRequest req = OAuth2LoginSuccessHandlerTestSupport.requestWithReturnCookie("");
        MockHttpServletResponse res = new OAuth2LoginSuccessHandlerTestSupport.LenientRedirectResponse();

        handler.onAuthenticationSuccess(req, res, OAuth2LoginSuccessHandlerTestSupport.token("u3@example.com", "U3"));

        assertThat(res.getRedirectedUrl()).isEqualTo(baseUrl + landingPath);
        assertThat(res.getHeaders("Set-Cookie"))
            .anySatisfy(h -> assertThat(h)
                .contains("SSP_RETURN=")
                .contains("SameSite=None"));
    }

    @Test
    @DisplayName("SSP_RETURN allowlisted: Secure cookie when request.isSecure() is true")
    void returnCookieClears_withDirectHttpsRequest() throws Exception {
        String baseUrl = "https://localhost:8081";
        stubFrontend(baseUrl, "/api/me");
        when(userRepository.findById("u4@example.com")).thenReturn(Optional.of(new AppUser("u4@example.com", "U4")));

        MockHttpServletRequest req = OAuth2LoginSuccessHandlerTestSupport.requestWithReturnCookie(baseUrl);
        req.setSecure(true);
        MockHttpServletResponse res = new OAuth2LoginSuccessHandlerTestSupport.LenientRedirectResponse();

        handler.onAuthenticationSuccess(req, res, OAuth2LoginSuccessHandlerTestSupport.token("u4@example.com", "U4"));

        assertThat(res.getRedirectedUrl()).isEqualTo(baseUrl + "/auth");
        assertThat(res.getHeaders("Set-Cookie"))
            .anySatisfy(h -> assertThat(h).contains("Secure"));
    }

    @Test
    @DisplayName("SSP_RETURN allowlisted but X-Forwarded-Proto=http: cookie clear is not Secure")
    void returnCookieClears_withForwardedHttpNotSecure() throws Exception {
        String baseUrl = "https://localhost:8081";
        stubFrontend(baseUrl, "/api/me");
        when(userRepository.findById("u5@example.com")).thenReturn(Optional.of(new AppUser("u5@example.com", "U5")));

        MockHttpServletRequest req = OAuth2LoginSuccessHandlerTestSupport.requestWithReturnCookie(baseUrl);
        req.addHeader("X-Forwarded-Proto", "http");
        MockHttpServletResponse res = new OAuth2LoginSuccessHandlerTestSupport.LenientRedirectResponse();

        handler.onAuthenticationSuccess(req, res, OAuth2LoginSuccessHandlerTestSupport.token("u5@example.com", "U5"));

        assertThat(res.getRedirectedUrl()).isEqualTo(baseUrl + "/auth");
        assertThat(res.getHeaders("Set-Cookie"))
            .anySatisfy(h -> assertThat(h).doesNotContain("Secure"));
    }

    @Test
    @DisplayName("Cookies present but no SSP_RETURN: no cookie clearing header")
    void cookiesPresentWithoutReturnCookie_doesNotClear() throws Exception {
        String baseUrl = "https://localhost:8081";
        String landingPath = "/api/me";
        stubFrontend(baseUrl, landingPath);
        when(userRepository.findById("u6@example.com")).thenReturn(Optional.of(new AppUser("u6@example.com", "U6")));

        MockHttpServletRequest req = new MockHttpServletRequest();
        req.setCookies(new jakarta.servlet.http.Cookie("OTHER", "x"));
        MockHttpServletResponse res = new OAuth2LoginSuccessHandlerTestSupport.LenientRedirectResponse();

        handler.onAuthenticationSuccess(req, res, OAuth2LoginSuccessHandlerTestSupport.token("u6@example.com", "U6"));

        assertThat(res.getRedirectedUrl()).isEqualTo(baseUrl + landingPath);
        assertThat(res.getHeaders("Set-Cookie")).isEmpty();
    }
}
