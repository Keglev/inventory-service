package com.smartsupplypro.inventory.security.oauth2login;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletResponse;

import com.smartsupplypro.inventory.security.OAuth2LoginSuccessHandler;

import jakarta.servlet.http.Cookie;

/**
 * Branch-coverage tests for the private cookie-header formatter in
 * {@link OAuth2LoginSuccessHandler}, exercised via reflection.
 */
class OAuth2LoginSuccessHandlerCookieHeaderBuilderTest {

    @Test
    void should_format_cookie_with_path_default_flags_and_no_blank_same_site() throws Exception {
        // Directly targeting the private helper is the only practical path to full branch coverage.
        Method m = OAuth2LoginSuccessHandler.class.getDeclaredMethod(
            "addCookieWithSameSite",
            jakarta.servlet.http.HttpServletResponse.class,
            Cookie.class,
            String.class);
        m.setAccessible(true);

        MockHttpServletResponse res = new MockHttpServletResponse();
        Cookie c = new Cookie("X", "y");
        c.setPath(null);
        c.setMaxAge(-1);
        c.setSecure(true);
        c.setHttpOnly(true);

        m.invoke(null, res, c, " ");

        String header = res.getHeader("Set-Cookie");
        assertThat(header)
            .contains("X=y")
            .contains("Path=/")
            .contains("Secure")
            .contains("HttpOnly")
            .doesNotContain("Max-Age=")
            .doesNotContain("SameSite=");
    }
}
