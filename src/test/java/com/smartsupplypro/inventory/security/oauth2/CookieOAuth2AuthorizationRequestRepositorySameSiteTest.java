package com.smartsupplypro.inventory.security.oauth2;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletResponse;

import com.smartsupplypro.inventory.security.CookieOAuth2AuthorizationRequestRepository;

import jakarta.servlet.http.Cookie;

/**
 * Unit tests for internal cookie header formatting logic in
 * {@link CookieOAuth2AuthorizationRequestRepository}.
 *
 * <p><strong>Scope</strong>:</p>
 * <ul>
 *   <li>Directly exercise the private {@code addCookieWithSameSite(...)} helper via reflection.</li>
 *   <li>Validate defensive defaults for null/blank inputs and session-cookie behavior.</li>
 * </ul>
 *
 * <p><strong>Why reflection is acceptable here</strong>:</p>
 * <ul>
 *   <li>This is a narrow, high-value branch-coverage test for a private formatting helper that is otherwise
 *       difficult to hit deterministically through public APIs.</li>
 *   <li>The test asserts only observable output (the {@code Set-Cookie} header format) and keeps assumptions
 *       minimal to reduce brittleness.</li>
 * </ul>
 */
class CookieOAuth2AuthorizationRequestRepositorySameSiteTest {

    private static final String HEADER_SET_COOKIE = "Set-Cookie";

    @Test
    @DisplayName("addCookieWithSameSite: formats cookies defensively for null value/path and session cookies")
    void addCookieWithSameSite_formatsEdgeCases() throws Exception {
        // Scenario: cookie value is null, path is not explicitly set, maxAge is default (-1), and SameSite is blank.
        // Expected:
        //  - header still has a safe Path=/
        //  - does not emit Max-Age for session cookies
        //  - omits SameSite when blank
        MockHttpServletResponse res = new MockHttpServletResponse();

        Method m = CookieOAuth2AuthorizationRequestRepository.class.getDeclaredMethod(
            "addCookieWithSameSite",
            jakarta.servlet.http.HttpServletResponse.class,
            Cookie.class,
            String.class
        );
        m.setAccessible(true);

        Cookie cookie = new Cookie("EDGE", null);
        cookie.setHttpOnly(false);
        cookie.setSecure(false);

        // blank SameSite should omit attribute
        m.invoke(null, res, cookie, " ");

        String header = res.getHeaders(HEADER_SET_COOKIE).stream()
            .filter(h -> h.startsWith("EDGE="))
            .findFirst()
            .orElse("");

        assertThat(header).startsWith("EDGE=");
        assertThat(header).contains("Path=/");
        assertThat(header).doesNotContain("Max-Age=");
        assertThat(header).doesNotContain("Secure");
        assertThat(header).doesNotContain("HttpOnly");
        assertThat(header).doesNotContain("SameSite=");
    }
}
