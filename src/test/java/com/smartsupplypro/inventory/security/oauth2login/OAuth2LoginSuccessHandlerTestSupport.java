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
 * Package-private; helpers must remain deterministic and side-effect free.
 */
final class OAuth2LoginSuccessHandlerTestSupport {

    private OAuth2LoginSuccessHandlerTestSupport() {
    }

    /** Builds an OAuth2 token with {@code email} and {@code name} attributes and a {@code ROLE_USER} authority. */
    static OAuth2AuthenticationToken token(String email, String name) {
        OAuth2User principal = new DefaultOAuth2User(
            singletonList(() -> "ROLE_USER"),
            Map.of("email", email, "name", name),
            "email"
        );
        return new OAuth2AuthenticationToken(principal, principal.getAuthorities(), "google");
    }

    /** Builds a request pre-populated with the single-use {@code SSP_RETURN} cookie. */
    static MockHttpServletRequest requestWithReturnCookie(String returnUrl) {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.setCookies(new Cookie("SSP_RETURN", returnUrl));
        return req;
    }

    /**
     * Response that silently drops redirect calls after the first commit.
     * Some authentication success flows trigger more than one redirect in a single call chain;
     * this variant records the first and swallows the rest so tests can assert the redirect target.
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
                // Swallow mock IOException so tests can assert the redirect target.
            }
        }
    }
}
