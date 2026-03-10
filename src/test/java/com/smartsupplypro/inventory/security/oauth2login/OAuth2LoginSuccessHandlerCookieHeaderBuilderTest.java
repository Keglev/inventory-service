package com.smartsupplypro.inventory.security.oauth2login;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletResponse;

import com.smartsupplypro.inventory.security.OAuth2LoginSuccessHandler;

import jakarta.servlet.http.Cookie;

/**
 * High-value branch-coverage test for the private cookie header formatting helper in
 * {@link OAuth2LoginSuccessHandler}.
 *
 * <h2>Scope</h2>
 * <ul>
 *   <li>Exercise defensive defaults: {@code Path=/} when path is unset.</li>
 *   <li>Exercise session-cookie behavior: omit {@code Max-Age} when {@code maxAge &lt; 0}.</li>
 *   <li>Exercise flag output: {@code Secure} and {@code HttpOnly} attributes.</li>
 *   <li>Exercise blank SameSite handling: omit {@code SameSite} when blank.</li>
 * </ul>
 *
 * <h2>Why reflection is acceptable here</h2>
 * <ul>
 *   <li>The helper is private and formatting-specific; reaching all branches through public flows
 *       is brittle and depends on servlet container behavior.</li>
 *   <li>The test asserts only observable output (the {@code Set-Cookie} header) and keeps
 *       assumptions minimal.</li>
 * </ul>
 */
class OAuth2LoginSuccessHandlerCookieHeaderBuilderTest {

    @Test
    @DisplayName("addCookieWithSameSite: formats Path default, HttpOnly/Secure, and omits blank SameSite")
    void addCookieWithSameSite_reflectionCoverage() throws Exception {
        Method m = OAuth2LoginSuccessHandler.class.getDeclaredMethod(
            "addCookieWithSameSite",
            jakarta.servlet.http.HttpServletResponse.class,
            jakarta.servlet.http.Cookie.class,
            String.class
        );
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
