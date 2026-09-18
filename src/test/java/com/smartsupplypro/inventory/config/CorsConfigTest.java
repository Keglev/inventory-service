package com.smartsupplypro.inventory.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

/** Verifies CORS policy and session cookie decisions in {@link CorsConfig}. */
class CorsConfigTest {

    private final AppProperties props = buildProps(
            "http://localhost:5173", "http://127.0.0.1:5173", "https://localhost:5173");
    private final CorsConfig config = new CorsConfig(props);

    private static AppProperties buildProps(String... origins) {
        AppProperties p = new AppProperties();
        p.getCors().setAllowedOrigins(List.of(origins));
        return p;
    }

    @Test
    void should_allow_configured_origins_when_the_cors_source_is_queried() {
        CorsConfigurationSource source = config.corsConfigurationSource();
        CorsConfiguration cors = source.getCorsConfiguration(new MockHttpServletRequest("GET", "/api/ping"));

        assertNotNull(cors);
        assertThat(cors.getAllowedOrigins())
                .contains("http://localhost:5173", "http://127.0.0.1:5173", "https://localhost:5173");
    }

    @Test
    void should_require_credentials_when_cors_is_configured() {
        CorsConfiguration cors = getCors();
        assertThat(cors.getAllowCredentials()).isTrue();
    }

    @Test
    void should_expose_the_set_cookie_header_when_cors_is_configured() {
        assertThat(getCors().getExposedHeaders()).contains("Set-Cookie");
    }

    @Test
    void should_allow_all_standard_http_methods_when_cors_is_configured() {
        assertThat(getCors().getAllowedMethods())
                .contains("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS");
    }

    @Test
    void should_use_a_same_site_lax_and_secure_cookie_when_the_serializer_is_created() {
        CookieSerializer serializer = config.cookieSerializer();

        assertThat(serializer).isInstanceOf(DefaultCookieSerializer.class);
        DefaultCookieSerializer s = (DefaultCookieSerializer) serializer;
        // DefaultCookieSerializer lacks public getters across Spring Session versions — reflection required
        assertThat(ReflectionTestUtils.getField(s, "sameSite")).isEqualTo("Lax");
        assertThat(ReflectionTestUtils.getField(s, "useSecureCookie")).isEqualTo(Boolean.TRUE);
    }

    private CorsConfiguration getCors() {
        return config.corsConfigurationSource()
                .getCorsConfiguration(new MockHttpServletRequest("GET", "/api"));
    }
}
