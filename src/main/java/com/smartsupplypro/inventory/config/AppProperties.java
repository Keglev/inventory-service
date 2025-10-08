package com.smartsupplypro.inventory.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Application configuration properties with environment-specific settings.
 * 
 * <p>Centralizes demo mode flags and frontend URL configuration for
 * OAuth2 redirects and CORS policy management.</p>
 */
@ConfigurationProperties(prefix = "app")
public class AppProperties {
  /** Demo mode flag for read-only public access to inventory data. */
  private boolean isDemoReadonly = false;
  
  /** Frontend configuration for OAuth2 redirects and base URL resolution. */
  private final Frontend frontend = new Frontend();

  /** Gets demo read-only mode status for conditional access control. */
  public boolean isDemoReadonly() { return isDemoReadonly; }
  
  /** Sets demo read-only mode for development and testing environments. */
  public void setDemoReadonly(boolean demoReadonly) { this.isDemoReadonly = demoReadonly; }
  
  /** Gets frontend configuration object containing base URLs and paths. */
  public Frontend getFrontend() { return frontend; }

  /**
   * Frontend-specific configuration properties.
   * Contains OAuth2 redirect URLs and application landing paths.
   */
  public static class Frontend {
    /** Base URL for frontend application, used in OAuth2 redirects and CORS configuration. */
    private String baseUrl = "http://localhost:8081";
    
    /** Default landing path after successful authentication. */
    private String landingPath = "/auth";
    
    /** Gets frontend base URL for redirect and CORS configuration. */
    public String getBaseUrl() { return baseUrl; }
    
    /** Sets frontend base URL for environment-specific deployment. */
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
    
    /** Gets post-authentication landing path. */
    public String getLandingPath() { return landingPath; }
    
    /** Sets post-authentication landing path for custom routing. */
    public void setLandingPath(String landingPath) { this.landingPath = landingPath; }
  }
}
