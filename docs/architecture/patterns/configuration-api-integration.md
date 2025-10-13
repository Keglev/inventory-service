# Configuration & API Integration

Placeholder for configuration-based integration notes (environment-based feature flags, external API integration patterns).
# Configuration Layer API Integration Patterns

## Overview

The Configuration layer serves as the foundation for all API integrations within the SmartSupplyPro system. This document details how OAuth2 security, CORS policies, and session management configurations enable seamless integration with frontend applications, external APIs, and enterprise systems.

## OAuth2 API Integration Architecture

### 1. Google OAuth2 Provider Integration

#### Configuration Interface
```yaml
# OAuth2 provider configuration
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID}
            client-secret: ${GOOGLE_CLIENT_SECRET}
            scope: openid,profile,email
            redirect-uri: "{baseUrl}/login/oauth2/code/{registrationId}"
        provider:
          google:
            authorization-uri: https://accounts.google.com/o/oauth2/v2/auth
            token-uri: https://oauth2.googleapis.com/token
            user-info-uri: https://openidconnect.googleapis.com/v1/userinfo
            jwk-set-uri: https://www.googleapis.com/oauth2/v3/certs
```

#### Integration Flow
```java
// Custom OIDC user service integration
@Autowired
private CustomOidcUserService customOidcUserService;

// OAuth2 configuration with custom user processing
.oauth2Login(oauth -> oauth
    .userInfoEndpoint(ui -> ui
        .oidcUserService(customOidcUserService)  // Custom user provisioning
        .userService(customOAuth2UserService)    // Non-OIDC provider support
    )
    .successHandler(successHandler)              // Post-login processing
    .failureHandler(oauthFailureHandler(props))  // Error handling
)
```

**Enterprise Integration Benefits:**
- **Single Sign-On (SSO)**: Enterprise Google Workspace integration
- **User Provisioning**: Automatic user creation with role assignment
- **Session Management**: Stateless authentication for microservice architectures

### 2. Frontend Application Integration

#### CORS Configuration for SPA Integration
```java
// Production-ready CORS configuration
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    
    // Explicit origin allowlist for security
    config.setAllowedOrigins(List.of(
        "http://localhost:5173",                    // Vite dev server
        "https://localhost:5173",                   // HTTPS dev server
        "https://inventory-service.koyeb.app"       // Production frontend
    ));
    
    // RESTful API methods support
    config.setAllowedMethods(List.of(
        "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
    ));
    
    // Credential support for authenticated sessions
    config.setAllowCredentials(true);
    config.setAllowedHeaders(List.of("*"));
    config.setExposedHeaders(List.of("Set-Cookie"));
    
    return source;
}
```

#### Frontend Authentication Flow
```javascript
// Frontend integration pattern
const authFlow = {
    // 1. Initiate OAuth2 login
    login: () => {
        window.location.href = '/oauth2/authorization/google';
    },
    
    // 2. Handle successful authentication
    checkAuthStatus: async () => {
        const response = await fetch('/api/auth/user', {
            credentials: 'include'  // Include session cookies
        });
        return response.ok ? response.json() : null;
    },
    
    // 3. Logout with proper session cleanup
    logout: async () => {
        await fetch('/logout', {
            method: 'POST',
            credentials: 'include'
        });
        window.location.href = '/login';
    }
};
```

**Integration Features:**
- **Credentialed Requests**: Session cookies transmitted securely
- **Preflight Optimization**: 1-hour cache for OPTIONS requests
- **Error Handling**: Structured error responses for API calls

## API Security Integration Patterns

### 1. Dual Authentication Entry Point Integration

#### API Request Classification
```java
// Request classification filter for API integration
OncePerRequestFilter apiFlagFilter = new OncePerRequestFilter() {
    @Override
    protected void doFilterInternal(
        @NonNull HttpServletRequest req,
        @NonNull HttpServletResponse res,
        @NonNull FilterChain chain
    ) throws ServletException, IOException {
        
        String accept = req.getHeader("Accept");
        String uri = req.getRequestURI();
        
        // Classify API requests for appropriate error handling
        if (uri.startsWith("/api/") && 
            accept != null && accept.contains("application/json")) {
            req.setAttribute("IS_API_REQUEST", true);
        }
        
        chain.doFilter(req, res);
    }
};
```

#### Authentication Response Integration
```java
// Context-aware authentication entry points
RequestMatcher apiMatcher = request -> 
    Boolean.TRUE.equals(request.getAttribute("IS_API_REQUEST"));

// JSON API error responses
AuthenticationEntryPoint apiEntry = (req, res, ex) -> {
    res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    res.setContentType("application/json");
    res.getWriter().write("{\"message\":\"Unauthorized\",\"code\":401}");
};

// Browser redirect for OAuth2 login
AuthenticationEntryPoint webEntry = (req, res, ex) -> {
    String target = props.getFrontend().getBaseUrl() + "/login";
    res.sendRedirect(target);
};
```

**API Integration Benefits:**
- **REST API Compliance**: Proper HTTP status codes and JSON responses
- **Browser Compatibility**: Seamless OAuth2 login flows for web applications
- **Client Type Detection**: Automatic handling based on request characteristics

### 2. Role-Based API Authorization Integration

#### Endpoint Security Configuration
```java
// Hierarchical API authorization
.authorizeHttpRequests(auth -> {
    
    // Public endpoints - no authentication required
    auth.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll();
    auth.requestMatchers("/", "/actuator/health", "/oauth2/**").permitAll();
    
    // Demo mode - conditional read-only access
    if (props.isDemoReadonly()) {
        auth.requestMatchers(HttpMethod.GET, "/api/inventory/**").permitAll();
        auth.requestMatchers(HttpMethod.GET, "/api/analytics/**").permitAll();
        auth.requestMatchers(HttpMethod.GET, "/api/suppliers/**").permitAll();
    }
    
    // Authenticated users - read access
    auth.requestMatchers(HttpMethod.GET, "/api/inventory/**").authenticated();
    auth.requestMatchers(HttpMethod.GET, "/api/suppliers/**").authenticated();
    auth.requestMatchers(HttpMethod.GET, "/api/analytics/**").authenticated();
    
    // Admin users - full CRUD operations
    auth.requestMatchers("/api/admin/**").hasRole("ADMIN");
    auth.requestMatchers(HttpMethod.POST, "/api/inventory/**").hasRole("ADMIN");
    auth.requestMatchers(HttpMethod.PUT, "/api/inventory/**").hasRole("ADMIN");
    auth.requestMatchers(HttpMethod.PATCH, "/api/inventory/**").hasRole("ADMIN");
    auth.requestMatchers(HttpMethod.DELETE, "/api/inventory/**").hasRole("ADMIN");
    
    // Default - require authentication
    auth.requestMatchers("/api/**").authenticated();
    auth.anyRequest().authenticated();
})
```

#### Method-Level Security Integration
```java
// Service layer integration with configuration
@Service
public class InventoryService {
    
    // SpEL integration with configuration layer
    @PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
    public List<InventoryItem> getAllItems() {
        // Business logic with conditional access
    }
    
    // Admin-only operations
    @PreAuthorize("hasRole('ADMIN')")
    public InventoryItem createItem(CreateInventoryItemRequest request) {
        // Admin-restricted functionality
    }
}
```

**Authorization Integration Features:**
- **Declarative Security**: Configuration-driven access control
- **Method-Level Granularity**: Fine-grained permission control
- **Runtime Configuration**: Demo mode controlled by application properties

## Session Management API Integration

### 1. Stateless Session Architecture

#### Cookie-Based Session Integration
```java
// Cross-site session cookie configuration
@Bean
public CookieSerializer cookieSerializer() {
    DefaultCookieSerializer serializer = new DefaultCookieSerializer();
    
    // Cross-site compatibility for microservice architecture
    serializer.setSameSite("None");
    serializer.setUseSecureCookie(true);    // HTTPS requirement
    serializer.setCookiePath("/");          // Application-wide scope
    serializer.setCookieName("SESSION");    // Spring Session default
    
    return serializer;
}
```

#### Session State Management
```java
// Stateless OAuth2 authorization request storage
@Bean
public AuthorizationRequestRepository<OAuth2AuthorizationRequest> authorizationRequestRepository() {
    return new CookieOAuth2AuthorizationRequestRepository();
}
```

**Session Integration Benefits:**
- **Microservice Ready**: No session affinity requirements
- **High Availability**: Sessions work across multiple instances
- **Cross-Origin Support**: Essential for SPA and mobile applications

### 2. Logout and Session Cleanup Integration

#### Comprehensive Logout Configuration
```java
.logout(logout -> logout
    .logoutUrl("/logout")
    .logoutSuccessHandler((req, res, auth) -> {
        boolean isApi = Boolean.TRUE.equals(req.getAttribute("IS_API_REQUEST"));
        
        if (isApi) {
            res.setStatus(HttpServletResponse.SC_NO_CONTENT); // 204 for API clients
            return;
        }
        
        // Browser redirect with allowlist validation
        String base = props.getFrontend().getBaseUrl();
        String returnUrl = req.getParameter("return");
        String target = base + "/logout-success";
        
        // Security: validate return URL against allowlist
        if (returnUrl != null && returnUrl.startsWith(base)) {
            target = returnUrl;
        }
        
        res.sendRedirect(target);
    })
    .invalidateHttpSession(true)
    .deleteCookies("JSESSIONID", "SESSION")  // Complete session cleanup
    .permitAll()
)
```

**Logout Integration Features:**
- **Multi-Client Support**: Different responses for API vs browser clients
- **Security Validation**: Return URL allowlist prevents open redirects
- **Complete Cleanup**: All session artifacts removed

## External System Integration Patterns

### 1. Actuator and Monitoring Integration

#### Health Check Security Configuration
```java
// Public health endpoints for load balancers
auth.requestMatchers("/actuator/health", "/actuator/info").permitAll();

// Secured management endpoints
auth.requestMatchers("/actuator/**").hasRole("ADMIN");
```

#### Integration with External Monitoring
```yaml
# Actuator configuration for external monitoring
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: when-authorized
      roles: ADMIN
```

### 2. API Gateway Integration

#### Load Balancer Configuration
```java
// Stateless design enables load balancer integration
// No sticky sessions required
// OAuth2 state in cookies works across instances

// Health check endpoints for load balancer
auth.requestMatchers("/actuator/health").permitAll();
```

#### Reverse Proxy Headers
```yaml
# Trust proxy headers for HTTPS detection
server:
  forward-headers-strategy: framework
  use-forward-headers: true
```

## Demo Mode API Integration

### 1. Conditional Access Configuration

#### SpEL Integration Pattern
```java
// Configuration layer exposes demo mode flag
@ConfigurationProperties(prefix = "app")
public class AppProperties {
    private boolean isDemoReadonly = false;
    
    // SpEL bridge for method-level security
    @Bean("appProperties")
    @Primary
    public AppProperties appPropertiesPrimary(AppProperties props) {
        return props;
    }
}
```

#### Service Layer Integration
```java
// Method-level conditional access
@PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
public Page<InventoryItem> searchItems(SearchCriteria criteria) {
    // Conditional access based on configuration
}

// Always secured operations
@PreAuthorize("hasRole('ADMIN')")
public void deleteItem(Long itemId) {
    // Admin-only operations never affected by demo mode
}
```

### 2. Environment-Specific API Behavior

#### Configuration Override Pattern
```yaml
# Development environment - demo mode enabled
# application-dev.yml
app:
  demo-readonly: true
  frontend:
    base-url: "http://localhost:5173"

# Production environment - demo mode disabled  
# application-prod.yml
app:
  demo-readonly: false
  frontend:
    base-url: "https://production-domain.com"
```

**Demo Mode Integration Benefits:**
- **Sales Enablement**: Public read-only access for demonstrations
- **Security by Default**: Write operations always require authentication
- **Environment Flexibility**: Different behavior per deployment environment

## Error Handling and API Response Integration

### 1. OAuth2 Error Integration

#### Failure Handler Configuration
```java
@Bean
public AuthenticationFailureHandler oauthFailureHandler(AppProperties props) {
    return (request, response, exception) -> {
        // Enterprise audit logging
        LoggerFactory.getLogger(SecurityConfig.class)
            .warn("OAuth2 failure: {}", exception.toString());
        
        // Frontend error page with error parameter
        String target = props.getFrontend().getBaseUrl() + "/login?error=oauth";
        if (!response.isCommitted()) {
            response.sendRedirect(target);
        }
    };
}
```

#### Frontend Error Handling Integration
```javascript
// Frontend OAuth2 error handling
const handleOAuthError = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    
    if (error === 'oauth') {
        showErrorMessage('Authentication failed. Please try again.');
    }
};
```

### 2. API Error Response Standardization

#### Consistent Error Format
```java
// API authentication entry point
AuthenticationEntryPoint apiEntry = (req, res, ex) -> {
    res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    res.setContentType("application/json");
    
    // Standardized error response format
    String errorResponse = """
        {
            "message": "Unauthorized",
            "code": 401,
            "timestamp": "%s",
            "path": "%s"
        }
        """.formatted(Instant.now(), req.getRequestURI());
    
    res.getWriter().write(errorResponse);
};
```

## Performance and Scalability Integration

### 1. CORS Preflight Optimization

#### Cache Configuration
```java
// Optimize preflight requests for SPA performance
config.setMaxAge(3600L); // 1-hour cache duration

// Reduce OPTIONS request frequency
config.setAllowedHeaders(List.of("*")); // Broad header allowance
```

### 2. Session Creation Optimization

#### Conditional Session Creation
```java
.sessionManagement(session -> session
    .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
)
```

**Performance Benefits:**
- **Memory Efficiency**: Sessions created only when needed
- **Reduced Overhead**: No unnecessary session allocation
- **Scalability**: Lower memory footprint per request

## Integration Testing Patterns

### 1. Security Configuration Testing

#### Test Configuration Override
```java
@TestConfiguration
public class TestSecurityConfig {
    
    @Bean
    @Primary
    public SecurityFilterChain testSecurityFilterChain(HttpSecurity http) {
        // Simplified security for integration tests
        return http
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
            .csrf(csrf -> csrf.disable())
            .build();
    }
}
```

### 2. OAuth2 Mock Integration

#### Test OAuth2 Configuration
```java
@WithMockUser(roles = "ADMIN")
@Test
public void testAdminEndpoint() {
    // Test with mocked authentication
}

@Test
public void testDemoModeAccess() {
    // Test conditional access patterns
}
```

## Related Documentation

- **Security Architecture**: See `security-patterns.md` for comprehensive security patterns
- **Controller Layer**: API endpoint implementation patterns
- **Service Layer**: Method-level security integration
- **Frontend Integration**: Authentication flow and error handling

---

*This document provides comprehensive API integration patterns for the Configuration layer, enabling seamless integration with frontend applications, external systems, and enterprise infrastructure.*