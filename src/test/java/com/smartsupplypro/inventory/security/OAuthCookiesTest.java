package com.smartsupplypro.inventory.security;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import jakarta.servlet.http.HttpServletResponse;

/**
 * Unit tests for {@link OAuthCookies}: the exact Set-Cookie header of the OAuth2 login cookies.
 */
class OAuthCookiesTest {

    // A mocked response keeps the header as written; MockHttpServletResponse re-renders it
    private final HttpServletResponse response = mock(HttpServletResponse.class);

    @Test
    void should_write_a_secure_http_only_lax_cookie_when_the_connection_is_https() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setSecure(true);

        OAuthCookies.write(request, response, "SSP_RETURN", "https://app.example", 300);

        verify(response).addHeader("Set-Cookie",
            "SSP_RETURN=https://app.example; Path=/; Max-Age=300; Secure; HttpOnly; SameSite=Lax");
    }

    @Test
    void should_mark_the_cookie_secure_when_the_proxy_forwards_https_in_any_case() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Forwarded-Proto", "HTTPS");

        OAuthCookies.write(request, response, "OAUTH2_AUTH_REQUEST", "", 0);

        verify(response).addHeader("Set-Cookie",
            "OAUTH2_AUTH_REQUEST=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax");
    }

    @Test
    void should_omit_secure_when_the_request_is_plain_http() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Forwarded-Proto", "http");

        OAuthCookies.write(request, response, "SSP_RETURN", "", 0);

        verify(response).addHeader("Set-Cookie", "SSP_RETURN=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax");
    }

    @Test
    void should_omit_max_age_when_it_is_negative() {
        OAuthCookies.write(new MockHttpServletRequest(), response, "OAUTH2_AUTH_REQUEST", "v", -1);

        verify(response).addHeader("Set-Cookie", "OAUTH2_AUTH_REQUEST=v; Path=/; HttpOnly; SameSite=Lax");
    }
}
