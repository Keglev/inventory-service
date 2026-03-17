package com.smartsupplypro.inventory.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.web.AuthenticationEntryPoint;

/**
 * Unit tests for {@link SecurityEntryPointHelper}.
 *
 * <h2>Purpose</h2>
 * The application uses different authentication entry points for API and browser traffic.
 * These entry points are part of the user-facing contract and must remain stable:
 * <ul>
 *   <li><b>API</b> requests should receive a JSON {@code 401 Unauthorized} response.</li>
 *   <li><b>Web</b> requests should be redirected to the frontend login route.</li>
 * </ul>
 *
 * <h2>Design</h2>
 * <ul>
 *   <li>No Spring context; servlet mocks only.</li>
 *   <li>Assertions focus on HTTP status, response headers, and payload/redirect location.</li>
 * </ul>
 */
class SecurityEntryPointHelperTest {

    private final SecurityEntryPointHelper helper = new SecurityEntryPointHelper();

    @Test
    @DisplayName("API entry point returns 401 JSON payload")
    void apiEntryPoint_returns401Json() throws Exception {
        // Contract: API clients expect a JSON response body for 401s (not a redirect).
        AuthenticationEntryPoint entryPoint = helper.createApiEntryPoint();

        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/inventory/demo-ok");
        MockHttpServletResponse res = new MockHttpServletResponse();

        entryPoint.commence(req, res, new BadCredentialsException("no auth"));

        assertEquals(401, res.getStatus());
        assertNotNull(res.getContentType());
        assertEquals("application/json", res.getContentType());
        assertEquals("{\"message\":\"Unauthorized\"}", res.getContentAsString());
    }

    @Test
    @DisplayName("Web entry point redirects to {frontendBaseUrl}/login")
    void webEntryPoint_redirectsToLogin() throws Exception {
        // Contract: browser navigation flows must redirect to the frontend login route.
        AuthenticationEntryPoint entryPoint = helper.createWebEntryPoint("https://frontend.example");

        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/admin/ping");
        MockHttpServletResponse res = new MockHttpServletResponse();

        entryPoint.commence(req, res, new BadCredentialsException("no auth"));

        assertEquals(302, res.getStatus());
        assertEquals("https://frontend.example/login", res.getRedirectedUrl());
    }
}
