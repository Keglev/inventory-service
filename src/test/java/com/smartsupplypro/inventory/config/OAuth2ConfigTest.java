package com.smartsupplypro.inventory.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.AuthenticationException;

import com.smartsupplypro.inventory.security.CookieOAuth2AuthorizationRequestRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/** Verifies OAuth2 infrastructure bean decisions in {@link OAuth2Config}. */
class OAuth2ConfigTest {

    private final AppProperties props = buildProps("https://frontend.test");
    private final OAuth2Config config = new OAuth2Config(props);

    // The failure handler logs at WARN by design; suppress to keep test output clean
    private ch.qos.logback.classic.Logger oauthLogger;
    private ch.qos.logback.classic.Level originalLevel;

    @BeforeEach
    void suppressFailureHandlerLogs() {
        org.slf4j.Logger log = LoggerFactory.getLogger(OAuth2Config.class);
        if (log instanceof ch.qos.logback.classic.Logger lb) {
            oauthLogger = lb;
            originalLevel = lb.getLevel();
            lb.setLevel(ch.qos.logback.classic.Level.ERROR);
        }
    }

    @AfterEach
    void restoreFailureHandlerLogs() {
        if (oauthLogger != null) oauthLogger.setLevel(originalLevel);
    }

    @Test
    void should_redirectToFrontendLoginWithError_when_oauthFailsAndResponseNotCommitted() throws Exception {
        HttpServletRequest req = Mockito.mock(HttpServletRequest.class);
        HttpServletResponse res = Mockito.mock(HttpServletResponse.class);
        when(res.isCommitted()).thenReturn(false);

        config.oauthFailureHandler().onAuthenticationFailure(req, res, authException());

        verify(res).sendRedirect("https://frontend.test/login?error=oauth");
    }

    @Test
    void should_notRedirect_when_oauthFailsButResponseAlreadyCommitted() throws Exception {
        HttpServletRequest req = Mockito.mock(HttpServletRequest.class);
        HttpServletResponse res = Mockito.mock(HttpServletResponse.class);
        when(res.isCommitted()).thenReturn(true);

        config.oauthFailureHandler().onAuthenticationFailure(req, res, authException());

        verify(res, never()).sendRedirect(Mockito.anyString());
    }

    @Test
    void should_redirectWithUnauthorizedError_when_failureIsAccessDenied() throws Exception {
        HttpServletRequest req = Mockito.mock(HttpServletRequest.class);
        HttpServletResponse res = Mockito.mock(HttpServletResponse.class);
        when(res.isCommitted()).thenReturn(false);

        var denied = new org.springframework.security.oauth2.core.OAuth2AuthenticationException(
                new org.springframework.security.oauth2.core.OAuth2Error("access_denied"));

        config.oauthFailureHandler().onAuthenticationFailure(req, res, denied);

        verify(res).sendRedirect("https://frontend.test/login?error=unauthorized");
    }

    @Test
    void should_useCookieBasedRepository_when_authorizationRequestRepositoryCreated() {
        assertThat(config.authorizationRequestRepository())
                .isInstanceOf(CookieOAuth2AuthorizationRequestRepository.class);
    }

    private static AppProperties buildProps(String frontendBaseUrl) {
        AppProperties p = new AppProperties();
        p.getFrontend().setBaseUrl(frontendBaseUrl);
        return p;
    }

    private static AuthenticationException authException() {
        return new AuthenticationException("fail") {};
    }
}
