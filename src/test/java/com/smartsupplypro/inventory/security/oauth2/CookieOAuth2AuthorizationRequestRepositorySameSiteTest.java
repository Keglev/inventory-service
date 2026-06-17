package com.smartsupplypro.inventory.security.oauth2;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletResponse;

import com.smartsupplypro.inventory.security.CookieOAuth2AuthorizationRequestRepository;

import jakarta.servlet.http.Cookie;

/**
 * Unit tests for the private SameSite cookie-header formatter in
 * {@link CookieOAuth2AuthorizationRequestRepository}, exercised via reflection.
 */
class CookieOAuth2AuthorizationRequestRepositorySameSiteTest {

    private static final String HEADER_SET_COOKIE = "Set-Cookie";

    @Test
    void should_format_cookie_with_safe_defaults_for_null_value_and_blank_same_site() throws Exception {
        // Directly targeting the private helper is the only practical path to branch coverage here.
        Method m = CookieOAuth2AuthorizationRequestRepository.class.getDeclaredMethod(
            "addCookieWithSameSite",
            jakarta.servlet.http.HttpServletResponse.class,
            Cookie.class,
            String.class);
        m.setAccessible(true);

        MockHttpServletResponse res = new MockHttpServletResponse();
        Cookie cookie = new Cookie("EDGE", null);
        cookie.setHttpOnly(false);
        cookie.setSecure(false);

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
