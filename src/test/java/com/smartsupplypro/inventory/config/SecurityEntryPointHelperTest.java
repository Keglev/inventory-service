package com.smartsupplypro.inventory.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;

/** Verifies entry point and logout response decisions in {@link SecurityEntryPointHelper}. */
class SecurityEntryPointHelperTest {

    private final SecurityEntryPointHelper helper = new SecurityEntryPointHelper();

    @Test
    void should_return401Json_when_apiEntryPointInvoked() throws Exception {
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
    void should_redirectToFrontendLogin_when_webEntryPointInvoked() throws Exception {
        AuthenticationEntryPoint entryPoint = helper.createWebEntryPoint("https://frontend.example");

        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/admin/ping");
        MockHttpServletResponse res = new MockHttpServletResponse();

        entryPoint.commence(req, res, new BadCredentialsException("no auth"));

        assertEquals(302, res.getStatus());
        assertEquals("https://frontend.example/login", res.getRedirectedUrl());
    }

    @Test
    void should_return204_when_logoutHandlerInvokedWithApiRequestAttribute() throws Exception {
        LogoutSuccessHandler handler = helper.createLogoutSuccessHandler(propsWithBase("https://frontend.test"));

        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/logout");
        req.setAttribute("IS_API_REQUEST", Boolean.TRUE);
        MockHttpServletResponse res = new MockHttpServletResponse();

        handler.onLogoutSuccess(req, res, null);

        assertEquals(204, res.getStatus());
    }

    @Test
    void should_redirectToLogoutSuccess_when_logoutHandlerInvokedFromBrowser() throws Exception {
        LogoutSuccessHandler handler = helper.createLogoutSuccessHandler(propsWithBase("https://frontend.test"));

        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/logout");
        MockHttpServletResponse res = new MockHttpServletResponse();

        handler.onLogoutSuccess(req, res, null);

        assertEquals("https://frontend.test/logout-success", res.getRedirectedUrl());
    }

    @Test
    void should_redirectToReturnParam_when_returnParamMatchesFrontendBase() throws Exception {
        LogoutSuccessHandler handler = helper.createLogoutSuccessHandler(propsWithBase("https://frontend.test"));

        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/logout");
        req.setParameter("return", "https://frontend.test/custom");
        MockHttpServletResponse res = new MockHttpServletResponse();

        handler.onLogoutSuccess(req, res, null);

        assertEquals("https://frontend.test/custom", res.getRedirectedUrl());
    }

    @Test
    void should_redirectToSafeDefault_when_returnParamIsExternalUrl() throws Exception {
        LogoutSuccessHandler handler = helper.createLogoutSuccessHandler(propsWithBase("https://frontend.test"));

        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/logout");
        req.setParameter("return", "https://evil.example/phish");
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
