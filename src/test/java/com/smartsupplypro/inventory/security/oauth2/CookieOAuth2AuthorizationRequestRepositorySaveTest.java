package com.smartsupplypro.inventory.security.oauth2;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import com.smartsupplypro.inventory.security.CookieOAuth2AuthorizationRequestRepository;

/**
 * Unit tests for the "save" behavior of {@link CookieOAuth2AuthorizationRequestRepository}.
 *
 * <p><strong>Scope</strong>:</p>
 * <ul>
 *   <li>Verify which cookies are written when saving an {@code OAuth2AuthorizationRequest}.</li>
 *   <li>Validate security attributes on {@code Set-Cookie} headers (e.g., {@code Secure}, {@code HttpOnly},
 *       {@code SameSite}).</li>
 *   <li>Validate allow-list logic for the optional {@code return} parameter cookie.</li>
 * </ul>
 *
 * <p><strong>Why this matters</strong>:</p>
 * Cookies participate directly in the OAuth2 login redirect flow. Incorrect attributes can cause authentication
 * failures (cookie not sent) or security regressions (cookie accessible from script).
 */
class CookieOAuth2AuthorizationRequestRepositorySaveTest {

    private final CookieOAuth2AuthorizationRequestRepository repo = new CookieOAuth2AuthorizationRequestRepository();

    @Test
    @DisplayName("saveAuthorizationRequest(null): writes a deletion Set-Cookie")
    void saveAuthorizationRequest_null_deletesCookie() {
        // Scenario: caller saves a null request.
        // Expected: repository writes a deletion Set-Cookie for the auth-request cookie.
        MockHttpServletRequest req = CookieOAuth2AuthorizationRequestRepositoryTestSupport.forwardedHttpsRequest();
        MockHttpServletResponse res = new MockHttpServletResponse();

        repo.saveAuthorizationRequest(null, req, res);

        List<String> headers = res.getHeaders(CookieOAuth2AuthorizationRequestRepositoryTestSupport.HEADER_SET_COOKIE);
        assertThat(headers)
            .anyMatch(h -> h.startsWith(CookieOAuth2AuthorizationRequestRepositoryTestSupport.AUTH_COOKIE + "="))
            .anyMatch(h -> h.contains("Max-Age=0"))
            .anyMatch(h -> h.contains("HttpOnly"))
            .anyMatch(h -> h.contains("SameSite=None"))
            .anyMatch(h -> h.contains("Secure"));
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "http://localhost:5173",
        "https://localhost:5173",
        "https://inventory-service.koyeb.app"
    })
    @DisplayName("saveAuthorizationRequest: sets SSP_RETURN only for allow-listed return origins")
    void saveAuthorizationRequest_setsReturnCookie_whenAllowlisted(String returnOrigin) {
        // Scenario: caller provides a "return" origin that is allow-listed.
        // Expected:
        //  - SSP_RETURN cookie is written and is not HttpOnly (frontend reads it)
        //  - cookies are emitted with SameSite=None and Secure when behind HTTPS (forwarded)
        MockHttpServletRequest req = CookieOAuth2AuthorizationRequestRepositoryTestSupport.forwardedHttpsRequest();
        req.setParameter("return", returnOrigin);

        MockHttpServletResponse res = new MockHttpServletResponse();
        repo.saveAuthorizationRequest(CookieOAuth2AuthorizationRequestRepositoryTestSupport.sampleAuthorizationRequest(), req, res);

        List<String> headers = res.getHeaders(CookieOAuth2AuthorizationRequestRepositoryTestSupport.HEADER_SET_COOKIE);
        String returnHeader = headers.stream().filter(h -> h.startsWith(CookieOAuth2AuthorizationRequestRepositoryTestSupport.RETURN_COOKIE + "="))
            .findFirst()
            .orElse("");
        String authHeader = headers.stream().filter(h -> h.startsWith(CookieOAuth2AuthorizationRequestRepositoryTestSupport.AUTH_COOKIE + "="))
            .findFirst()
            .orElse("");

        assertThat(returnHeader).startsWith(CookieOAuth2AuthorizationRequestRepositoryTestSupport.RETURN_COOKIE + "=" + returnOrigin);
        assertThat(returnHeader).contains("SameSite=None");
        assertThat(returnHeader).contains("Secure");
        assertThat(returnHeader).doesNotContain("HttpOnly");

        assertThat(authHeader).contains("HttpOnly");
        assertThat(authHeader).contains("Max-Age=180");
    }

    @Test
    @DisplayName("saveAuthorizationRequest: does not set SSP_RETURN for non-allowlisted return")
    void saveAuthorizationRequest_doesNotSetReturnCookie_whenNotAllowlisted() {
        // Scenario: caller provides a "return" origin that is NOT allow-listed.
        // Expected: SSP_RETURN cookie is not written (open redirect prevention), but the auth-request cookie is.
        MockHttpServletRequest req = CookieOAuth2AuthorizationRequestRepositoryTestSupport.forwardedHttpsRequest();
        req.setParameter("return", "https://evil.example.test");

        MockHttpServletResponse res = new MockHttpServletResponse();
        repo.saveAuthorizationRequest(CookieOAuth2AuthorizationRequestRepositoryTestSupport.sampleAuthorizationRequest(), req, res);

        List<String> headers = res.getHeaders(CookieOAuth2AuthorizationRequestRepositoryTestSupport.HEADER_SET_COOKIE);
        assertThat(headers).noneMatch(h -> h.startsWith(CookieOAuth2AuthorizationRequestRepositoryTestSupport.RETURN_COOKIE + "="));
        assertThat(headers).anyMatch(h -> h.startsWith(CookieOAuth2AuthorizationRequestRepositoryTestSupport.AUTH_COOKIE + "="));
    }

    @Test
    @DisplayName("saveAuthorizationRequest: non-secure, non-forwarded requests write cookies without Secure")
    void saveAuthorizationRequest_insecureRequest_doesNotAddSecureFlag() {
        // Scenario: request is not secure and is not behind a trusted HTTPS proxy.
        // Expected: repository does not add the Secure attribute (browser would drop cookie on http).
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.setSecure(false);
        MockHttpServletResponse res = new MockHttpServletResponse();

        repo.saveAuthorizationRequest(CookieOAuth2AuthorizationRequestRepositoryTestSupport.sampleAuthorizationRequest(), req, res);

        String authHeader = res.getHeaders(CookieOAuth2AuthorizationRequestRepositoryTestSupport.HEADER_SET_COOKIE).stream()
            .filter(h -> h.startsWith(CookieOAuth2AuthorizationRequestRepositoryTestSupport.AUTH_COOKIE + "="))
            .findFirst()
            .orElse("");

        assertThat(authHeader).isNotBlank();
        assertThat(authHeader).doesNotContain("Secure");
        assertThat(authHeader).contains("HttpOnly");
    }
}
