package com.smartsupplypro.inventory.security.oauth2login;

import java.io.IOException;
import static java.util.Collections.singletonList;
import java.util.Map;

import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;

import jakarta.servlet.http.Cookie;

/**
 * Shared test utilities for {@code OAuth2LoginSuccessHandler} unit tests.
 *
 * <h2>Scope</h2>
 * <ul>
 *   <li>Build minimal {@link OAuth2AuthenticationToken} principals with email/name attributes.</li>
 *   <li>Build {@link MockHttpServletRequest} instances with the {@code SSP_RETURN} cookie.</li>
 *   <li>Provide a lenient {@link MockHttpServletResponse} variant that tolerates duplicate redirects.</li>
 * </ul>
 *
 * <h2>Design</h2>
 * <ul>
 *   <li>Package-private and colocated with tests so helpers stay discoverable and do not leak into
 *       production code.</li>
 *   <li>Helpers are intentionally small and deterministic to keep Mockito tests readable.</li>
 * </ul>
 */
@SuppressWarnings("unused")
final class OAuth2LoginSuccessHandlerTestSupport {

    private OAuth2LoginSuccessHandlerTestSupport() {
    }

    /**
     * Utility: build an OAuth2 token with {email, name} and a {@code ROLE_USER} authority.
     *
     * <p>This mirrors what the handler expects from typical OAuth2 providers.</p>
     */
    static OAuth2AuthenticationToken token(String email, String name) {
        OAuth2User principal = new DefaultOAuth2User(
            singletonList(() -> "ROLE_USER"),
            Map.of("email", email, "name", name),
            "email"
        );
        return new OAuth2AuthenticationToken(principal, principal.getAuthorities(), "google");
    }

    /** Create a request pre-populated with the single-use {@code SSP_RETURN} cookie. */
    static MockHttpServletRequest requestWithReturnCookie(String returnUrl) {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.setCookies(new Cookie("SSP_RETURN", returnUrl));
        return req;
    }

    /**
     * Response that ignores subsequent redirects once committed.
     *
     * <p>Some authentication success flows can trigger more than one redirect in a single call chain.
     * Spring’s {@link MockHttpServletResponse} throws on the second call; this variant intentionally
     * records the first redirect and swallows the rest so tests can assert the redirect target.</p>
     */
    static class LenientRedirectResponse extends MockHttpServletResponse {
        @Override
        public void sendRedirect(String location) {
            if (isCommitted()) {
                return;
            }
            try {
                super.sendRedirect(location);
            } catch (IOException ignored) {
                // Mock behaviour shouldn't propagate here in tests.
            }
        }
    }
}
