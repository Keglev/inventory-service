package com.smartsupplypro.inventory.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Bind properties under "app" prefix to this class.
 * Used in SecurityConfig and LoginSuccessHandler.
 */
@ConfigurationProperties(prefix = "app")
public class AppProperties {
  private boolean isDemoReadonly = false;
  private final Frontend frontend = new Frontend();

  /*
    * Getters and setters
  */
  public boolean isDemoReadonly() { return isDemoReadonly; }
  public void setDemoReadonly(boolean demoReadonly) { this.isDemoReadonly = demoReadonly; }
  public Frontend getFrontend() { return frontend; }

  // Nested class for frontend properties
  public static class Frontend {
    private String baseUrl = "http://localhost:8081";
    private String landingPath = "/api/me";
    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
    public String getLandingPath() { return landingPath; }
    public void setLandingPath(String landingPath) { this.landingPath = landingPath; }
  }
}
