package com.smartsupplypro.inventory.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Unit tests for {@link SecurityFilterHelper}.
 *
 * <h2>Purpose</h2>
 * {@link SecurityConfig} relies on a small request-classification filter to distinguish API calls from
 * browser navigation. That distinction controls how authentication failures are handled:
 * <ul>
 *   <li><b>API</b> requests should get an HTTP {@code 401} response (JSON), suitable for SPA clients.</li>
 *   <li><b>Browser</b> requests should be redirected to the login route.</li>
 * </ul>
 *
 * <h2>Design</h2>
 * <ul>
 *   <li>Pure unit tests: no Spring context needed, just servlet mocks.</li>
 *   <li>Validate the branching logic: URI prefix + {@code Accept: application/json} header.</li>
 * </ul>
 */
class SecurityFilterHelperTest {

    private final SecurityFilterHelper helper = new SecurityFilterHelper();

    private OncePerRequestFilter newFilter() {
        return helper.createApiDetectionFilter();
    }

    @Test
    @DisplayName("API filter sets IS_API_REQUEST when uri starts with /api/ and Accept contains application/json")
    void apiDetectionFilter_apiJsonRequest_setsAttribute() throws Exception {
        // This is the "API-shaped" request used throughout the security configuration:
        // - path under /api/
        // - Accept includes application/json
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/admin/ping");
        req.addHeader("Accept", "application/json");
        MockHttpServletResponse res = new MockHttpServletResponse();

        newFilter().doFilter(req, res, new MockFilterChain());

        assertEquals(Boolean.TRUE, req.getAttribute("IS_API_REQUEST"));
    }

    @Test
    @DisplayName("API filter does not set attribute when Accept is missing")
    void apiDetectionFilter_missingAccept_doesNotSetAttribute() throws Exception {
        // Without an explicit JSON Accept header, treat the request as browser navigation.
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/admin/ping");
        MockHttpServletResponse res = new MockHttpServletResponse();

        newFilter().doFilter(req, res, new MockFilterChain());

        assertNull(req.getAttribute("IS_API_REQUEST"));
    }

    @Test
    @DisplayName("API filter does not set attribute when Accept is present but not JSON")
    void apiDetectionFilter_nonJsonAccept_doesNotSetAttribute() throws Exception {
        // Accept:text/html is a strong signal that the request expects a redirect-based UX.
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/admin/ping");
        req.addHeader("Accept", "text/html");
        MockHttpServletResponse res = new MockHttpServletResponse();

        newFilter().doFilter(req, res, new MockFilterChain());

        assertNull(req.getAttribute("IS_API_REQUEST"));
    }

    @Test
    @DisplayName("API filter does not set attribute when request is not under /api/")
    void apiDetectionFilter_nonApiUri_doesNotSetAttribute() throws Exception {
        // Non-API endpoints (e.g., /logout) should not be treated as JSON API requests by default.
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/logout");
        req.addHeader("Accept", "application/json");
        MockHttpServletResponse res = new MockHttpServletResponse();

        newFilter().doFilter(req, res, new MockFilterChain());

        assertNull(req.getAttribute("IS_API_REQUEST"));
    }
}
