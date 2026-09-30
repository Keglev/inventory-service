package com.smartsupplypro.inventory.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;

/** Verifies entry point and logout response decisions in {@link SecurityEntryPointHelper}. */
class SecurityEntryPointHelperTest {

    private final SecurityEntryPointHelper helper = new SecurityEntryPointHelper();

    @Test
    void should_return_401_json_when_the_api_entry_point_is_invoked() throws Exception {
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
    void should_redirect_to_the_frontend_login_when_the_web_entry_point_is_invoked() throws Exception {
        AuthenticationEntryPoint entryPoint = helper.createWebEntryPoint("https://frontend.example");

        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/admin/ping");
        MockHttpServletResponse res = new MockHttpServletResponse();

        entryPoint.commence(req, res, new BadCredentialsException("no auth"));

        assertEquals(302, res.getStatus());
        assertEquals("https://frontend.example/login", res.getRedirectedUrl());
    }

    @Test
    void should_return_204_when_the_logout_handler_sees_the_api_request_attribute() throws Exception {
        LogoutSuccessHandler handler = helper.createLogoutSuccessHandler(propsWithBase("https://frontend.test"));

        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/logout");
        req.setAttribute("IS_API_REQUEST", Boolean.TRUE);
        MockHttpServletResponse res = new MockHttpServletResponse();

        handler.onLogoutSuccess(req, res, null);

        assertEquals(204, res.getStatus());
    }

    @Test
    void should_redirect_to_the_logout_success_page_when_the_logout_comes_from_a_browser() throws Exception {
        LogoutSuccessHandler handler = helper.createLogoutSuccessHandler(propsWithBase("https://frontend.test"));

        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/logout");
        MockHttpServletResponse res = new MockHttpServletResponse();

        handler.onLogoutSuccess(req, res, null);

        assertEquals("https://frontend.test/logout-success", res.getRedirectedUrl());
    }

    @Test
    void should_redirect_to_the_return_param_when_it_matches_the_frontend_base() throws Exception {
        LogoutSuccessHandler handler = helper.createLogoutSuccessHandler(propsWithBase("https://frontend.test"));

        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/logout");
        req.setParameter("return", "https://frontend.test/custom");
        MockHttpServletResponse res = new MockHttpServletResponse();

        handler.onLogoutSuccess(req, res, null);

        assertEquals("https://frontend.test/custom", res.getRedirectedUrl());
    }

    // Each value defeats a weaker check: a foreign host, a prefix match, user info on
    // either side of the @, another port, another scheme, or text the URI parser rejects.
    @ParameterizedTest
    @ValueSource(strings = {
        "https://evil.example/phish",
        "https://frontend.test.attacker.example/phish",
        "https://frontend.test@evil.example/phish",
        "https://evil@frontend.test/phish",
        "https://frontend.test:8443/phish",
        "http://frontend.test/phish",
        "https://frontend.test/a b"
    })
    void should_redirect_to_a_safe_default_when_the_return_param_is_not_the_frontend_origin(String returnUrl)
            throws Exception {
        LogoutSuccessHandler handler = helper.createLogoutSuccessHandler(propsWithBase("https://frontend.test"));

        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/logout");
        req.setParameter("return", returnUrl);
        MockHttpServletResponse res = new MockHttpServletResponse();

        handler.onLogoutSuccess(req, res, null);

        assertEquals("https://frontend.test/logout-success", res.getRedirectedUrl());
    }

    private static AppProperties propsWithBase(String baseUrl) {
        AppProperties p = new AppProperties();
        p.getFrontend().setBaseUrl(baseUrl);
        return p;
    }
}
