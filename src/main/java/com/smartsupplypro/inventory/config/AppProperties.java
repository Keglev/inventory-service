package com.smartsupplypro.inventory.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Application configuration properties with environment-specific settings.
 *
 * <p>Centralizes demo mode flags, frontend URL configuration for OAuth2 redirects,
 * and CORS allowed origins so each deployment environment can override them
 * without code changes.</p>
 */
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private boolean isDemoReadonly = false;
    private final Frontend frontend = new Frontend();
    private final Cors cors = new Cors();
    private final Cookie cookie = new Cookie();

    public boolean isDemoReadonly() { return isDemoReadonly; }
    public void setDemoReadonly(boolean demoReadonly) { this.isDemoReadonly = demoReadonly; }

    public Frontend getFrontend() { return frontend; }
    public Cors getCors() { return cors; }
    public Cookie getCookie() { return cookie; }

    /** Frontend OAuth2 redirect and base URL configuration. */
    public static class Frontend {
        private String baseUrl = "http://localhost:8081";
        private String landingPath = "/auth";

        public String getBaseUrl() { return baseUrl; }
        public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }

        public String getLandingPath() { return landingPath; }
        public void setLandingPath(String landingPath) { this.landingPath = landingPath; }
    }

    /** CORS allowed origins, one per environment. Replaces hardcoded origin lists in config classes. */
    public static class Cors {
        private List<String> allowedOrigins = List.of("http://localhost:5173");

        public List<String> getAllowedOrigins() { return allowedOrigins; }
        public void setAllowedOrigins(List<String> allowedOrigins) { this.allowedOrigins = allowedOrigins; }
    }

    /** OAuth2 authorization request cookie settings for the stateless login flow. */
    public static class Cookie {
        private String authRequestName = "OAUTH2_AUTH_REQUEST";
        private int authRequestMaxAge = 180;

        public String getAuthRequestName() { return authRequestName; }
        public void setAuthRequestName(String authRequestName) { this.authRequestName = authRequestName; }
        public int getAuthRequestMaxAge() { return authRequestMaxAge; }
        public void setAuthRequestMaxAge(int authRequestMaxAge) { this.authRequestMaxAge = authRequestMaxAge; }
    }
}
