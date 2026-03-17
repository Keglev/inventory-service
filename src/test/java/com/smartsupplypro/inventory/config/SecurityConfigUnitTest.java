package com.smartsupplypro.inventory.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.slf4j.LoggerFactory;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import com.smartsupplypro.inventory.security.CookieOAuth2AuthorizationRequestRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Unit tests for bean factory/helper methods in {@link SecurityConfig}.
 *
 * <h2>Why these tests exist</h2>
 * {@link SecurityConfig} mixes framework wiring (best exercised via MVC slice tests) with small,
 * deterministic helper/bean methods that are faster and clearer to validate as plain unit tests.
 *
 * <h2>Design</h2>
 * <ul>
 *   <li>No Spring context is started (fast, deterministic, minimal environment coupling).</li>
 *   <li>Assertions focus on the externally observable configuration contract that other components rely on.</li>
 * </ul>
 *
 * <h2>Non-goals</h2>
 * <ul>
 *   <li>Validating the full security filter chain and authorization rules (covered elsewhere via MVC tests).</li>
 *   <li>Re-testing Spring/Spring Session internals beyond the configuration surface we depend on.</li>
 * </ul>
 */
class SecurityConfigUnitTest {

    private final SecurityConfig config = new SecurityConfig();

    private static AutoCloseable suppressSecurityConfigWarnLogs() {
        // These unit tests intentionally trigger the OAuth failure handler, which logs at WARN.
        // That is correct behavior in production, but it is noisy in unit test output.
        org.slf4j.Logger logger = LoggerFactory.getLogger(SecurityConfig.class);
        if (logger instanceof ch.qos.logback.classic.Logger logbackLogger) {
            ch.qos.logback.classic.Level original = logbackLogger.getLevel();
            logbackLogger.setLevel(ch.qos.logback.classic.Level.ERROR);
            return () -> logbackLogger.setLevel(original);
        }

        return () -> {
            // No-op when Logback is not the active backend in this test runtime.
        };
    }

    @Test
    @DisplayName("CORS source exposes expected origins/methods/credentials")
    void corsConfigurationSource_hasExpectedPolicy() {
        // Contract: frontend applications must be able to call the API with credentials (cookies),
        // including dev origins.
        CorsConfigurationSource source = config.corsConfigurationSource();

        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/admin/ping");
        CorsConfiguration cors = source.getCorsConfiguration(req);
        assertNotNull(cors);

        CorsConfiguration nonNullCors = cors;
        assertThat(nonNullCors.getAllowedOrigins())
            .contains("http://localhost:5173", "http://127.0.0.1:5173", "https://localhost:5173", "https://inventory-service.koyeb.app");
        assertThat(nonNullCors.getAllowedMethods()).contains("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS");
        assertThat(nonNullCors.getAllowedHeaders()).contains("*");
        assertThat(nonNullCors.getExposedHeaders()).contains("Set-Cookie");
        assertThat(nonNullCors.getAllowCredentials()).isTrue();
        assertThat(nonNullCors.getMaxAge()).isEqualTo(3600L);
    }

    @Test
    @DisplayName("CookieSerializer uses SameSite=None and secure cookies")
    void cookieSerializer_setsSecureCrossSiteDefaults() {
        CookieSerializer serializer = config.cookieSerializer();

        assertThat(serializer).isInstanceOf(DefaultCookieSerializer.class);
        DefaultCookieSerializer s = (DefaultCookieSerializer) serializer;

        // DefaultCookieSerializer does not consistently expose getters across Spring Session versions.
        // Reflection-based assertions keep this test stable while still validating our configuration intent.
        assertThat(ReflectionTestUtils.getField(s, "sameSite")).isEqualTo("None");
        assertThat(ReflectionTestUtils.getField(s, "useSecureCookie")).isEqualTo(Boolean.TRUE);
    }

    @Test
    @DisplayName("OAuth failure handler redirects to frontend login when response not committed")
    void oauthFailureHandler_whenNotCommitted_redirects() throws Exception {
        // Contract: if OAuth login fails before the response is committed, redirect the browser
        // back to the frontend login page with an error indicator.
        AutoCloseable suppression = suppressSecurityConfigWarnLogs();
        try {
            AppProperties props = new AppProperties();
            props.getFrontend().setBaseUrl("https://frontend.test");

            AuthenticationFailureHandler handler = config.oauthFailureHandler(props);

            jakarta.servlet.http.HttpServletRequest req = Mockito.mock(HttpServletRequest.class);
            jakarta.servlet.http.HttpServletResponse res = Mockito.mock(HttpServletResponse.class);
            when(res.isCommitted()).thenReturn(false);

            handler.onAuthenticationFailure(req, res, new org.springframework.security.core.AuthenticationException("fail") { });

            verify(res).sendRedirect("https://frontend.test/login?error=oauth");
        } finally {
            // Log suppression is best-effort; a restore failure should not mask test assertions.
            try {
                suppression.close();
            } catch (Exception ignored) {
                // ignore
            }
        }
    }

    @Test
    @DisplayName("OAuth failure handler does not redirect when response already committed")
    void oauthFailureHandler_whenCommitted_doesNotRedirect() throws Exception {
        // Safety: avoid writing to the response after it has been committed.
        AutoCloseable suppression = suppressSecurityConfigWarnLogs();
        try {
            AppProperties props = new AppProperties();
            props.getFrontend().setBaseUrl("https://frontend.test");

            AuthenticationFailureHandler handler = config.oauthFailureHandler(props);

            jakarta.servlet.http.HttpServletRequest req = Mockito.mock(HttpServletRequest.class);
            jakarta.servlet.http.HttpServletResponse res = Mockito.mock(HttpServletResponse.class);
            when(res.isCommitted()).thenReturn(true);

            handler.onAuthenticationFailure(req, res, new org.springframework.security.core.AuthenticationException("fail") { });

            verify(res, never()).sendRedirect(Mockito.anyString());
        } finally {
            // Log suppression is best-effort; a restore failure should not mask test assertions.
            try {
                suppression.close();
            } catch (Exception ignored) {
                // ignore
            }
        }
    }

    @Test
    @DisplayName("Authorization request repository uses cookie-backed implementation")
    void authorizationRequestRepository_isCookieBased() {
        assertThat(config.authorizationRequestRepository())
            .isInstanceOf(CookieOAuth2AuthorizationRequestRepository.class);
    }
}
