package com.smartsupplypro.inventory.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

/** Verifies the CORS policy decisions in {@link CorsConfig}. */
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
    void should_expose_no_response_headers_when_cors_is_configured() {
        // Browsers never expose Set-Cookie to scripts, and the frontend reads no other header
        assertThat(getCors().getExposedHeaders()).isNullOrEmpty();
    }

    @Test
    void should_allow_all_standard_http_methods_when_cors_is_configured() {
        assertThat(getCors().getAllowedMethods())
                .contains("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS");
    }

    private CorsConfiguration getCors() {
        return config.corsConfigurationSource()
                .getCorsConfiguration(new MockHttpServletRequest("GET", "/api"));
    }
}
