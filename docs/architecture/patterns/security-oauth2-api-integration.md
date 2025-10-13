# Security OAuth2 API Integration Guide

## Overview

This document provides comprehensive API integration guidelines for OAuth2 authentication flows in the SmartSupplyPro inventory management system. It covers frontend integration patterns, authentication flows, security considerations, and troubleshooting guides for seamless OAuth2 implementation.

## OAuth2 Authentication Flow Integration

### 1. Frontend Authentication Initiation

#### Standard OAuth2 Login Flow
```typescript
// React/TypeScript frontend integration
interface OAuth2Config {
  authUrl: string;
  returnUrl?: string;
  state?: string;
}

class OAuth2AuthService {
  private readonly API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';
  
  /**
   * Enterprise OAuth2: Initiate authentication with optional return URL
   * 
   * Starts the OAuth2 flow by redirecting to the backend OAuth2 endpoint
   * with optional return URL for post-authentication routing.
   */
  initiateAuthentication(config: OAuth2Config): void {
    const params = new URLSearchParams();
    
    // Enterprise Security: Include return URL for post-auth routing
    if (config.returnUrl) {
      params.append('return', config.returnUrl);
    }
    
    // Enterprise State: Include CSRF protection state
    if (config.state) {
      params.append('state', config.state);
    }
    
    const authUrl = `${this.API_BASE}/oauth2/authorization/google?${params.toString()}`;
    
    console.log('Enterprise OAuth2: Initiating authentication flow', {
      returnUrl: config.returnUrl,
      state: config.state
    });
    
    // Redirect to backend OAuth2 endpoint
    window.location.href = authUrl;
  }
  
  /**
   * Enterprise OAuth2: Handle post-authentication redirect
   * 
   * Processes the return from OAuth2 flow and handles routing
   * to the appropriate application page.
   */
  handleAuthenticationReturn(): string | null {
    // Enterprise Routing: Check for return URL cookie
    const returnUrl = this.getReturnUrlFromCookie();
    
    if (returnUrl) {
      console.log('Enterprise OAuth2: Found return URL, cleaning up', { returnUrl });
      this.clearReturnUrlCookie();
      return returnUrl;
    }
    
    // Default post-authentication destination
    return '/dashboard';
  }
  
  private getReturnUrlFromCookie(): string | null {
    const match = document.cookie.match(/SSP_RETURN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }
  
  private clearReturnUrlCookie(): void {
    document.cookie = 'SSP_RETURN=; Path=/; Max-Age=0; SameSite=None; Secure';
  }
}
```

#### React Component Integration
```tsx
// React component with OAuth2 integration
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface AuthenticationProps {
  children: React.ReactNode;
}

export const AuthenticationGuard: React.FC<AuthenticationProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const oauth2Service = new OAuth2AuthService();
  
  useEffect(() => {
    checkAuthenticationStatus();
  }, [location.pathname]);
  
  /**
   * Enterprise Security: Check current authentication status
   */
  const checkAuthenticationStatus = async (): Promise<void> => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/auth/status`, {
        method: 'GET',
        credentials: 'include', // Include cookies for session
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const authData = await response.json();
        setIsAuthenticated(authData.authenticated);
        
        // Enterprise Routing: Handle post-authentication return
        if (authData.authenticated && location.pathname === '/auth') {
          const returnUrl = oauth2Service.handleAuthenticationReturn();
          navigate(returnUrl || '/dashboard', { replace: true });
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Enterprise OAuth2: Authentication check failed', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Enterprise OAuth2: Initiate login with current page as return URL
   */
  const handleLogin = (): void => {
    const returnUrl = `${window.location.origin}${location.pathname}`;
    oauth2Service.initiateAuthentication({ 
      returnUrl,
      state: generateCSRFToken() 
    });
  };
  
  const generateCSRFToken = (): string => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  };
  
  if (isLoading) {
    return <div className="loading-spinner">Checking authentication...</div>;
  }
  
  if (!isAuthenticated) {
    return (
      <div className="login-required">
        <h2>Authentication Required</h2>
        <p>Please log in to access this application.</p>
        <button 
          onClick={handleLogin}
          className="oauth2-login-button"
        >
          Sign in with Google
        </button>
      </div>
    );
  }
  
  return <>{children}</>;
};
```

### 2. Backend API Endpoints

#### Authentication Status Endpoint
```java
// Spring Boot controller for authentication status
@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = {"http://localhost:5173", "https://localhost:5173", "https://inventory-service.koyeb.app"})
public class AuthenticationController {
    
    /**
     * Enterprise API: Get current authentication status
     * 
     * Returns the current user's authentication status and profile information
     * for frontend authentication state management.
     */
    @GetMapping("/status")
    public ResponseEntity<AuthenticationStatusResponse> getAuthenticationStatus(
            HttpServletRequest request, Authentication authentication) {
        
        if (authentication == null || !authentication.isAuthenticated() || 
            authentication instanceof AnonymousAuthenticationToken) {
            
            return ResponseEntity.ok(AuthenticationStatusResponse.builder()
                .authenticated(false)
                .build());
        }
        
        // Enterprise User Context: Extract user information from OAuth2 token
        String email = null;
        String name = null;
        String role = null;
        
        if (authentication.getPrincipal() instanceof OAuth2User oauth2User) {
            email = oauth2User.getAttribute("email");
            name = oauth2User.getAttribute("name");
            
            // Get role from custom user service
            if (oauth2User instanceof CustomOAuth2User customUser) {
                role = customUser.getAppUser().getRole().name();
            }
        }
        
        log.info("Enterprise API: Authentication status requested - user: {}", email);
        
        return ResponseEntity.ok(AuthenticationStatusResponse.builder()
            .authenticated(true)
            .email(email)
            .name(name)
            .role(role)
            .sessionId(request.getSession(false)?.getId())
            .build());
    }
    
    /**
     * Enterprise API: Logout endpoint with session cleanup
     * 
     * Terminates the user session and clears authentication cookies
     * for complete logout functionality.
     */
    @PostMapping("/logout")
    public ResponseEntity<LogoutResponse> logout(HttpServletRequest request, 
                                               HttpServletResponse response) {
        
        String userEmail = SecurityContextManager.getCurrentUserEmail();
        log.info("Enterprise API: Logout requested - user: {}", userEmail);
        
        // Enterprise Security: Clear session and authentication
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        
        // Enterprise Cleanup: Clear authentication cookies
        clearAuthenticationCookies(request, response);
        
        // Clear Spring Security context
        SecurityContextHolder.clearContext();
        
        return ResponseEntity.ok(LogoutResponse.builder()
            .success(true)
            .message("Logout successful")
            .timestamp(LocalDateTime.now())
            .build());
    }
    
    private void clearAuthenticationCookies(HttpServletRequest request, HttpServletResponse response) {
        // Clear session cookie
        Cookie sessionCookie = new Cookie("JSESSIONID", "");
        sessionCookie.setPath("/");
        sessionCookie.setMaxAge(0);
        sessionCookie.setSecure(isSecureOrForwardedHttps(request));
        sessionCookie.setHttpOnly(true);
        response.addCookie(sessionCookie);
        
        // Clear any OAuth2 state cookies
        Cookie oauth2Cookie = new Cookie("OAUTH2_AUTH_REQUEST", "");
        oauth2Cookie.setPath("/");
        oauth2Cookie.setMaxAge(0);
        oauth2Cookie.setSecure(isSecureOrForwardedHttps(request));
        oauth2Cookie.setHttpOnly(true);
        response.addCookie(oauth2Cookie);
    }
    
    private boolean isSecureOrForwardedHttps(HttpServletRequest request) {
        if (request.isSecure()) return true;
        String xfProto = request.getHeader("X-Forwarded-Proto");
        return xfProto != null && xfProto.equalsIgnoreCase("https");
    }
}
```

#### API Response Models
```java
// Enterprise API: Authentication response models
@Builder
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthenticationStatusResponse {
    private boolean authenticated;
    private String email;
    private String name;
    private String role;
    private String sessionId;
    private LocalDateTime timestamp = LocalDateTime.now();
}

@Builder
@Data
public class LogoutResponse {
    private boolean success;
    private String message;
    private LocalDateTime timestamp;
}
```

### 3. HTTP Client Integration

#### JavaScript/TypeScript Fetch API
```typescript
// Enterprise HTTP client with authentication
class AuthenticatedApiClient {
  private readonly baseUrl: string;
  
  constructor(baseUrl: string = process.env.REACT_APP_API_URL || 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }
  
  /**
   * Enterprise API: Authenticated HTTP request wrapper
   * 
   * Automatically includes credentials and handles authentication errors
   * with proper error handling and retry logic.
   */
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      credentials: 'include', // Include cookies for session
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest', // CSRF protection
        ...options.headers,
      },
      ...options,
    };
    
    try {
      const response = await fetch(url, defaultOptions);
      
      // Enterprise Security: Handle authentication errors
      if (response.status === 401) {
        console.warn('Enterprise API: Authentication required, redirecting to login');
        this.handleAuthenticationRequired();
        throw new Error('Authentication required');
      }
      
      if (response.status === 403) {
        console.warn('Enterprise API: Access forbidden');
        throw new Error('Access forbidden');
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text() as unknown as T;
      }
      
    } catch (error) {
      console.error('Enterprise API: Request failed', { url, error });
      throw error;
    }
  }
  
  /**
   * Enterprise Security: Handle authentication required
   */
  private handleAuthenticationRequired(): void {
    const oauth2Service = new OAuth2AuthService();
    const currentUrl = window.location.href;
    oauth2Service.initiateAuthentication({ returnUrl: currentUrl });
  }
  
  // HTTP method helpers
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }
  
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Usage example
const apiClient = new AuthenticatedApiClient();

// Fetch authenticated data
const inventoryItems = await apiClient.get<InventoryItem[]>('/api/v1/inventory/items');

// Create new item (admin only)
const newItem = await apiClient.post<InventoryItem>('/api/v1/inventory/items', {
  name: 'New Product',
  quantity: 100,
  price: 29.99
});
```

#### Axios Integration
```typescript
// Alternative: Axios-based HTTP client
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

class AuthenticatedAxiosClient {
  private readonly client: AxiosInstance;
  private readonly oauth2Service: OAuth2AuthService;
  
  constructor(baseUrl: string = process.env.REACT_APP_API_URL || 'http://localhost:8080') {
    this.oauth2Service = new OAuth2AuthService();
    
    this.client = axios.create({
      baseURL: baseUrl,
      withCredentials: true, // Include cookies
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
    
    this.setupInterceptors();
  }
  
  /**
   * Enterprise Security: Setup request/response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.debug('Enterprise API: Outgoing request', {
          method: config.method,
          url: config.url,
          timestamp: new Date().toISOString()
        });
        return config;
      },
      (error) => {
        console.error('Enterprise API: Request error', error);
        return Promise.reject(error);
      }
    );
    
    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.debug('Enterprise API: Response received', {
          status: response.status,
          url: response.config.url,
          timestamp: new Date().toISOString()
        });
        return response;
      },
      (error) => {
        console.error('Enterprise API: Response error', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message
        });
        
        // Enterprise Security: Handle authentication errors
        if (error.response?.status === 401) {
          console.warn('Enterprise API: Authentication required, redirecting to login');
          this.oauth2Service.initiateAuthentication({
            returnUrl: window.location.href
          });
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  // HTTP method wrappers
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }
  
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }
  
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }
  
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}
```

## Cross-Origin Resource Sharing (CORS) Configuration

### 1. Backend CORS Configuration

#### Spring Security CORS Setup
```java
// Enterprise CORS: Comprehensive cross-origin configuration
@Configuration
@EnableWebSecurity
public class CorsSecurityConfig {
    
    @Value("${app.cors.allowed-origins}")
    private List<String> allowedOrigins;
    
    /**
     * Enterprise CORS: Global CORS configuration
     * 
     * Configures cross-origin resource sharing for OAuth2 authentication
     * and API access from separate frontend domains.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Enterprise Security: Explicit origin allowlist
        configuration.setAllowedOrigins(allowedOrigins);
        
        // Enterprise API: Allowed HTTP methods
        configuration.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"
        ));
        
        // Enterprise Headers: Allowed request headers
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization", "Cache-Control", "Content-Type", 
            "X-Requested-With", "Accept", "Origin", "Access-Control-Request-Method",
            "Access-Control-Request-Headers"
        ));
        
        // Enterprise Security: Exposed response headers
        configuration.setExposedHeaders(Arrays.asList(
            "Access-Control-Allow-Origin", "Access-Control-Allow-Credentials"
        ));
        
        // Enterprise Cookies: Allow credentials for OAuth2
        configuration.setAllowCredentials(true);
        
        // Enterprise Cache: Preflight cache duration
        configuration.setMaxAge(3600L); // 1 hour
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        
        return source;
    }
}
```

#### Environment-Specific CORS
```yaml
# CORS configuration per environment
spring:
  profiles: dev
app:
  cors:
    allowed-origins:
      - "http://localhost:3000"
      - "http://localhost:5173"
      - "https://localhost:5173"

---
spring:
  profiles: prod
app:
  cors:
    allowed-origins:
      - "https://inventory-service.koyeb.app"
      - "${FRONTEND_DOMAIN:https://app.smartsupplypro.com}"
```

### 2. Frontend CORS Handling

#### Development Proxy Configuration
```javascript
// Vite proxy configuration for development
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Enterprise Proxy: Error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Enterprise Proxy: Request', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Enterprise Proxy: Response', proxyRes.statusCode, req.url);
          });
        },
      },
      '/oauth2': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/login': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
```

## Error Handling and Troubleshooting

### 1. Common OAuth2 Integration Issues

#### Authentication Flow Errors
```typescript
// Enterprise Error Handling: OAuth2 flow error detection
class OAuth2ErrorHandler {
  
  /**
   * Enterprise Diagnostics: Detect OAuth2 flow issues
   */
  static diagnoseAuthenticationIssue(): void {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    
    // Check for OAuth2 error parameters
    const error = params.get('error');
    const errorDescription = params.get('error_description');
    const state = params.get('state');
    
    if (error) {
      console.error('Enterprise OAuth2: Authentication error detected', {
        error,
        description: errorDescription,
        state,
        url: window.location.href
      });
      
      this.handleOAuth2Error(error, errorDescription);
    }
    
    // Check for missing cookies
    this.checkRequiredCookies();
    
    // Check CORS issues
    this.checkCorsConfiguration();
  }
  
  private static handleOAuth2Error(error: string, description?: string): void {
    const errorMessages: Record<string, string> = {
      'access_denied': 'User denied authorization request',
      'invalid_request': 'Invalid OAuth2 request parameters',
      'unauthorized_client': 'Client not authorized for this grant type',
      'unsupported_response_type': 'Authorization server does not support response type',
      'invalid_scope': 'Requested scope is invalid or unknown',
      'server_error': 'Authorization server encountered an error',
      'temporarily_unavailable': 'Authorization server is temporarily unavailable'
    };
    
    const message = errorMessages[error] || 'Unknown OAuth2 error';
    
    // Display user-friendly error
    alert(`Authentication failed: ${message}${description ? '\n\nDetails: ' + description : ''}`);
    
    // Redirect to login page
    window.location.href = '/';
  }
  
  private static checkRequiredCookies(): void {
    const cookies = document.cookie;
    console.debug('Enterprise OAuth2: Available cookies', cookies);
    
    if (!cookies.includes('JSESSIONID')) {
      console.warn('Enterprise OAuth2: Missing session cookie, authentication may fail');
    }
  }
  
  private static checkCorsConfiguration(): void {
    const origin = window.location.origin;
    console.debug('Enterprise OAuth2: Current origin', origin);
    
    // Test CORS with OPTIONS request
    fetch(`${process.env.REACT_APP_API_URL}/api/v1/auth/status`, {
      method: 'OPTIONS',
      credentials: 'include'
    }).catch(error => {
      console.error('Enterprise OAuth2: CORS preflight failed', error);
      console.warn('Enterprise OAuth2: Check CORS configuration on backend');
    });
  }
}

// Use in main application
OAuth2ErrorHandler.diagnoseAuthenticationIssue();
```

### 2. Backend Error Handling

#### OAuth2 Exception Handler
```java
// Enterprise Error Handling: OAuth2-specific exception handling
@ControllerAdvice
public class OAuth2ExceptionHandler {
    
    /**
     * Enterprise Security: Handle OAuth2 authentication failures
     */
    @ExceptionHandler(OAuth2AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleOAuth2AuthenticationException(
            OAuth2AuthenticationException ex, HttpServletRequest request) {
        
        String clientIp = getClientIpAddress(request);
        String userAgent = request.getHeader("User-Agent");
        
        log.error("Enterprise OAuth2: Authentication failed - ip: {}, userAgent: {}, error: {}", 
            clientIp, userAgent, ex.getMessage());
        
        ErrorResponse error = ErrorResponse.builder()
            .error("OAUTH2_AUTHENTICATION_FAILED")
            .message("OAuth2 authentication failed")
            .details(ex.getError() != null ? ex.getError().getDescription() : null)
            .timestamp(LocalDateTime.now())
            .path(request.getRequestURI())
            .build();
            
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }
    
    /**
     * Enterprise Security: Handle OAuth2 authorization failures
     */
    @ExceptionHandler(OAuth2AuthorizationException.class)
    public ResponseEntity<ErrorResponse> handleOAuth2AuthorizationException(
            OAuth2AuthorizationException ex, HttpServletRequest request) {
        
        log.error("Enterprise OAuth2: Authorization failed - error: {}", ex.getMessage());
        
        ErrorResponse error = ErrorResponse.builder()
            .error("OAUTH2_AUTHORIZATION_FAILED")
            .message("OAuth2 authorization failed")
            .details(ex.getError() != null ? ex.getError().getDescription() : null)
            .timestamp(LocalDateTime.now())
            .path(request.getRequestURI())
            .build();
            
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }
    
    /**
     * Enterprise Diagnostics: OAuth2 configuration error handler
     */
    @ExceptionHandler(ClientRegistrationException.class)
    public ResponseEntity<ErrorResponse> handleClientRegistrationException(
            ClientRegistrationException ex, HttpServletRequest request) {
        
        log.error("Enterprise OAuth2: Client registration error - error: {}", ex.getMessage());
        
        ErrorResponse error = ErrorResponse.builder()
            .error("OAUTH2_CONFIG_ERROR")
            .message("OAuth2 client configuration error")
            .details("Check OAuth2 client registration configuration")
            .timestamp(LocalDateTime.now())
            .path(request.getRequestURI())
            .build();
            
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
    
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
```

## API Testing and Validation

### 1. Authentication Flow Testing

#### End-to-End Testing with Playwright
```typescript
// Enterprise Testing: OAuth2 flow testing
import { test, expect, Page } from '@playwright/test';

class OAuth2TestHelper {
  
  /**
   * Enterprise Testing: Mock OAuth2 authentication for testing
   */
  static async mockAuthentication(page: Page, userEmail: string = 'test@example.com'): Promise<void> {
    // Intercept OAuth2 redirect
    await page.route('**/oauth2/authorization/google**', async route => {
      // Simulate successful OAuth2 flow
      const returnUrl = new URL(route.request().url()).searchParams.get('return');
      const redirectUrl = returnUrl ? `${returnUrl}/auth` : 'http://localhost:5173/dashboard';
      
      // Set authentication cookies
      await page.context().addCookies([
        {
          name: 'JSESSIONID',
          value: 'mock-session-' + Math.random().toString(36),
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          secure: false
        }
      ]);
      
      await route.fulfill({
        status: 302,
        headers: {
          'Location': redirectUrl
        }
      });
    });
    
    // Mock authentication status endpoint
    await page.route('**/api/v1/auth/status', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          authenticated: true,
          email: userEmail,
          name: 'Test User',
          role: 'USER',
          timestamp: new Date().toISOString()
        })
      });
    });
  }
}

test('OAuth2 authentication flow', async ({ page }) => {
  // Setup authentication mock
  await OAuth2TestHelper.mockAuthentication(page);
  
  // Navigate to protected page
  await page.goto('http://localhost:5173/inventory');
  
  // Should redirect to OAuth2 login
  await page.click('button:has-text("Sign in with Google")');
  
  // Should complete authentication and redirect
  await expect(page).toHaveURL(/.*\/dashboard/);
  
  // Should show authenticated user info
  await expect(page.locator('[data-testid="user-email"]')).toContainText('test@example.com');
});

test('API request with authentication', async ({ page }) => {
  await OAuth2TestHelper.mockAuthentication(page);
  
  // Mock API endpoint
  await page.route('**/api/v1/inventory/items', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, name: 'Test Item', quantity: 100, price: 29.99 }
      ])
    });
  });
  
  await page.goto('http://localhost:5173/inventory');
  
  // Should load inventory items
  await expect(page.locator('[data-testid="inventory-item"]')).toHaveCount(1);
  await expect(page.locator('[data-testid="item-name"]')).toContainText('Test Item');
});
```

### 2. API Contract Testing

#### OpenAPI Integration Testing
```typescript
// Enterprise Testing: API contract validation
import { OpenAPIV3 } from 'openapi-types';
import SwaggerParser from '@apidevtools/swagger-parser';

class ApiContractValidator {
  private schema: OpenAPIV3.Document;
  
  constructor(private apiClient: AuthenticatedApiClient) {}
  
  /**
   * Enterprise Testing: Load and validate API schema
   */
  async loadSchema(schemaUrl: string): Promise<void> {
    this.schema = await SwaggerParser.validate(schemaUrl) as OpenAPIV3.Document;
    console.log('Enterprise Testing: API schema loaded', {
      title: this.schema.info.title,
      version: this.schema.info.version
    });
  }
  
  /**
   * Enterprise Testing: Validate API response against schema
   */
  async validateResponse(endpoint: string, method: string, response: any): Promise<boolean> {
    const pathItem = this.schema.paths[endpoint] as OpenAPIV3.PathItemObject;
    if (!pathItem) {
      throw new Error(`Endpoint ${endpoint} not found in schema`);
    }
    
    const operation = pathItem[method.toLowerCase() as keyof OpenAPIV3.PathItemObject] as OpenAPIV3.OperationObject;
    if (!operation) {
      throw new Error(`Method ${method} not found for endpoint ${endpoint}`);
    }
    
    const responseSchema = operation.responses['200'] as OpenAPIV3.ResponseObject;
    if (!responseSchema) {
      throw new Error(`No 200 response defined for ${method} ${endpoint}`);
    }
    
    // Validate response structure (simplified validation)
    const mediaType = (responseSchema.content?.['application/json'] as OpenAPIV3.MediaTypeObject);
    if (mediaType?.schema) {
      return this.validateJsonSchema(response, mediaType.schema);
    }
    
    return true;
  }
  
  private validateJsonSchema(data: any, schema: OpenAPIV3.SchemaObject): boolean {
    // Simplified schema validation - in practice, use a proper JSON schema validator
    if (schema.type === 'object' && typeof data !== 'object') {
      return false;
    }
    if (schema.type === 'array' && !Array.isArray(data)) {
      return false;
    }
    
    // Validate required properties
    if (schema.required && schema.properties) {
      for (const required of schema.required) {
        if (!(required in data)) {
          console.error(`Required property ${required} missing from response`);
          return false;
        }
      }
    }
    
    return true;
  }
}

// Usage in tests
test('API contract validation', async () => {
  const validator = new ApiContractValidator(apiClient);
  await validator.loadSchema('http://localhost:8080/v3/api-docs');
  
  const response = await apiClient.get('/api/v1/inventory/items');
  const isValid = await validator.validateResponse('/api/v1/inventory/items', 'GET', response);
  
  expect(isValid).toBe(true);
});
```

## Production Deployment Considerations

### 1. Environment Configuration

#### Docker Compose Configuration
```yaml
# Enterprise Deployment: Docker compose with OAuth2 configuration
version: '3.8'
services:
  backend:
    image: inventory-service:latest
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - FRONTEND_BASE_URL=${FRONTEND_BASE_URL}
      - DATABASE_URL=${DATABASE_URL}
      - APP_CORS_ALLOWED_ORIGINS=${FRONTEND_BASE_URL}
    ports:
      - "8080:8080"
    networks:
      - app-network
    
  frontend:
    image: inventory-frontend:latest
    environment:
      - REACT_APP_API_URL=${BACKEND_BASE_URL}
      - REACT_APP_ENVIRONMENT=production
    ports:
      - "80:80"
      - "443:443"
    networks:
      - app-network
    depends_on:
      - backend

networks:
  app-network:
    driver: bridge
```

#### Kubernetes Deployment
```yaml
# Enterprise Deployment: Kubernetes configuration
apiVersion: apps/v1
kind: Deployment
metadata:
  name: inventory-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: inventory-service
  template:
    metadata:
      labels:
        app: inventory-service
    spec:
      containers:
      - name: inventory-service
        image: inventory-service:latest
        ports:
        - containerPort: 8080
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "prod"
        - name: GOOGLE_CLIENT_ID
          valueFrom:
            secretKeyRef:
              name: oauth2-secrets
              key: google-client-id
        - name: GOOGLE_CLIENT_SECRET
          valueFrom:
            secretKeyRef:
              name: oauth2-secrets
              key: google-client-secret
        - name: APP_CORS_ALLOWED_ORIGINS
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: frontend-url
        readinessProbe:
          httpGet:
            path: /actuator/health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /actuator/health
            port: 8080
          initialDelaySeconds: 60
          periodSeconds: 30

---
apiVersion: v1
kind: Secret
metadata:
  name: oauth2-secrets
type: Opaque
data:
  google-client-id: <base64-encoded-client-id>
  google-client-secret: <base64-encoded-client-secret>

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  frontend-url: "https://app.smartsupplypro.com"
```

### 2. Security Configuration

#### SSL/TLS Configuration
```nginx
# Enterprise Security: NGINX SSL configuration
server {
    listen 443 ssl http2;
    server_name app.smartsupplypro.com;
    
    # SSL certificates
    ssl_certificate /etc/ssl/certs/smartsupplypro.crt;
    ssl_certificate_key /etc/ssl/private/smartsupplypro.key;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # OAuth2 and API proxy
    location /oauth2/ {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # OAuth2 cookie handling
        proxy_cookie_path / /;
        proxy_cookie_flags ~ secure samesite=none;
    }
    
    location /api/ {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Frontend static files
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name app.smartsupplypro.com;
    return 301 https://$server_name$request_uri;
}
```

## Monitoring and Analytics

### 1. OAuth2 Metrics Collection

#### Custom Metrics Implementation
```java
// Enterprise Monitoring: OAuth2 metrics collection
@Component
public class OAuth2MetricsCollector {
    
    private final MeterRegistry meterRegistry;
    private final Counter authenticationAttempts;
    private final Counter authenticationSuccesses;
    private final Counter authenticationFailures;
    private final Timer authenticationDuration;
    private final Gauge activeUsers;
    
    public OAuth2MetricsCollector(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        this.authenticationAttempts = Counter.builder("oauth2.authentication.attempts")
            .description("Total OAuth2 authentication attempts")
            .register(meterRegistry);
        this.authenticationSuccesses = Counter.builder("oauth2.authentication.successes")
            .description("Successful OAuth2 authentications")
            .register(meterRegistry);
        this.authenticationFailures = Counter.builder("oauth2.authentication.failures")
            .description("Failed OAuth2 authentications")
            .register(meterRegistry);
        this.authenticationDuration = Timer.builder("oauth2.authentication.duration")
            .description("OAuth2 authentication flow duration")
            .register(meterRegistry);
        this.activeUsers = Gauge.builder("oauth2.users.active")
            .description("Currently active authenticated users")
            .register(meterRegistry, this, OAuth2MetricsCollector::getActiveUserCount);
    }
    
    public void recordAuthenticationAttempt() {
        authenticationAttempts.increment();
    }
    
    public void recordAuthenticationSuccess(Duration duration) {
        authenticationSuccesses.increment();
        authenticationDuration.record(duration);
    }
    
    public void recordAuthenticationFailure() {
        authenticationFailures.increment();
    }
    
    private double getActiveUserCount() {
        // Implementation to count active sessions
        return SessionRegistry.getAllSessions().size();
    }
}
```

## Related Documentation

- **Security Architecture**: See [OAuth2 Security Architecture](oauth2-security-architecture.md)
- **Implementation Patterns**: See [Security Implementation Patterns](security-implementation-patterns.md)
- **Cross-Cutting Patterns**: See [Security Cross-Cutting Patterns](security-cross-cutting-patterns.md)
- **API Documentation**: See [REST API Documentation](../../api/README.md)

---

*This API integration guide provides comprehensive guidance for implementing OAuth2 authentication flows, handling cross-origin requests, and ensuring secure API communication in the SmartSupplyPro inventory management system.*