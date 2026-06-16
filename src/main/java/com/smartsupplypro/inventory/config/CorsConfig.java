package com.smartsupplypro.inventory.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * CORS and session cookie configuration for cross-origin frontend access.
 *
 * <p>Allowed origins are driven by {@code app.cors.allowed-origins} so each environment
 * (dev, prod) can declare its own list without touching this class.</p>
 */
@Configuration
public class CorsConfig {

    private final AppProperties props;

    public CorsConfig(AppProperties props) {
        this.props = props;
    }

    /**
     * Registers the allowed origins from {@code app.cors.allowed-origins}.
     * Credentials must be allowed because the session cookie is required on every cross-origin request.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(props.getCors().getAllowedOrigins());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Set-Cookie"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    /**
     * SameSite=None is required so the browser sends the session cookie on cross-origin requests.
     * Secure=true is mandatory when SameSite=None per the browser spec.
     */
    @Bean
    public CookieSerializer cookieSerializer() {
        DefaultCookieSerializer serializer = new DefaultCookieSerializer();
        serializer.setSameSite("None");
        serializer.setUseSecureCookie(true);
        serializer.setCookiePath("/");
        return serializer;
    }
}
