# Security Architecture Patterns

## Overview

The SmartSupplyPro inventory system implements enterprise-grade security patterns with OAuth2 authentication, role-based authorization, and cross-origin resource sharing. This document outlines the comprehensive security architecture patterns used throughout the application.

## Core Security Patterns

### 1. OAuth2 Authentication Flow

#### Pattern: Session-based OAuth2 with Stateless Authorization Requests

```java
// SecurityConfig.java - Stateless OAuth2 authorization request persistence
@Bean
public AuthorizationRequestRepository<OAuth2AuthorizationRequest> authorizationRequestRepository() {
    return new CookieOAuth2AuthorizationRequestRepository();
}
```

**Enterprise Benefits:**
- **Stateless Scalability**: No sticky sessions required in load-balanced deployments
- **High Availability**: OAuth2 callbacks work across multiple application instances
- **Security**: HttpOnly cookies prevent XSS attacks on authorization state

**Implementation Details:**
- Google OAuth2 integration with custom user provisioning
- Authorization requests stored in secure, HttpOnly cookies
- Custom success handler creates local user records on first login
- Failure handler provides user-friendly error messages with frontend redirect

### 2. Dual Authentication Entry Points

#### Pattern: Context-Aware Authentication Responses

```java
// Request classification filter
OncePerRequestFilter apiFlagFilter = new OncePerRequestFilter() {
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) {
        String accept = req.getHeader("Accept");
        if (req.getRequestURI().startsWith("/api/") && accept != null && accept.contains("application/json")) {
            req.setAttribute("IS_API_REQUEST", true);
        }
        chain.doFilter(req, res);
    }
};
```

**Enterprise Benefits:**
- **API-First Design**: JSON APIs receive structured 401 responses
- **Browser Compatibility**: Web requests redirect to OAuth2 login flows
- **Developer Experience**: Clear separation between programmatic and user interfaces

**Authentication Response Matrix:**
| Request Type | Accept Header | Failure Response |
|--------------|---------------|------------------|
| API Request | `application/json` | JSON 401 with error message |
| Browser Request | `text/html` | Redirect to OAuth2 login |
| Preflight (OPTIONS) | Any | Allow without authentication |

### 3. Role-Based Authorization Model

#### Pattern: Hierarchical Permission Structure

```java
// Role-based endpoint protection
auth.requestMatchers("/api/admin/**").hasRole("ADMIN");
auth.requestMatchers(HttpMethod.POST, "/api/inventory/**").hasRole("ADMIN");
auth.requestMatchers(HttpMethod.GET, "/api/inventory/**").authenticated();
```

**Permission Hierarchy:**
1. **Public Access**: Health checks, OAuth2 endpoints
2. **Demo Mode**: Conditional read-only access via SpEL expressions
3. **Authenticated Users**: Read access to inventory and analytics
4. **Admin Users**: Full CRUD operations on all resources

**Enterprise Security Features:**
- Method-level security with `@PreAuthorize` annotations
- SpEL integration for conditional access control
- Demo mode with read-only public access for showcasing

### 4. Cross-Origin Resource Sharing (CORS)

#### Pattern: Secure Cross-Domain Communication

```java
// CORS configuration with explicit origin allowlist
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of(
        "http://localhost:5173",    // Development
        "https://localhost:5173",   // Development HTTPS
        "https://inventory-service.koyeb.app"  // Production
    ));
    config.setAllowCredentials(true);
    config.setMaxAge(3600L);
    return config;
}
```

**Security Controls:**
- **Explicit Origin Allowlist**: Prevents CORS bypass attacks
- **Credential Support**: Enables authenticated cookie transmission
- **Preflight Caching**: 1-hour cache for OPTIONS requests reduces latency
- **Exposed Headers**: `Set-Cookie` header exposure for session management

### 5. Session Management and Cookie Security

#### Pattern: Secure Cross-Site Session Cookies

```java
// Cookie configuration for cross-site compatibility
@Bean
public CookieSerializer cookieSerializer() {
    DefaultCookieSerializer serializer = new DefaultCookieSerializer();
    serializer.setSameSite("None");      // Cross-site compatibility
    serializer.setUseSecureCookie(true); // HTTPS requirement
    serializer.setCookiePath("/");       // Application-wide scope
    return serializer;
}
```

**Cookie Security Features:**
- **SameSite=None**: Enables cross-site authentication flows
- **Secure Flag**: Requires HTTPS for cookie transmission
- **HttpOnly**: Automatic protection against XSS (via Spring Session)
- **Path Scope**: Application-wide cookie access

## Demo Mode Integration

### Pattern: Conditional Access with SpEL Expressions

#### SpEL Bridge Configuration

```java
// SecuritySpelBridgeConfig.java - SpEL integration
@Bean("appProperties")
@Primary
public AppProperties appPropertiesPrimary(AppProperties props) {
    return props; // Exposes as named bean for SpEL
}
```

#### Method-Level Security

```java
// Example usage in service methods
@PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
public List<InventoryItem> getAllItems() {
    // Business logic
}
```

**Enterprise Benefits:**
- **Flexible Access Control**: Runtime configuration changes without code deployment
- **Showcase Capability**: Public read-only access for demonstrations
- **Security by Default**: Write operations always require authentication

## Security Configuration Patterns

### Environment-Specific Configuration

```yaml
# application-dev.yml
app:
  demo-readonly: true
  frontend:
    base-url: "http://localhost:5173"

# application-prod.yml  
app:
  demo-readonly: false
  frontend:
    base-url: "https://inventory-service.koyeb.app"
```

### OAuth2 Provider Configuration

```yaml
# OAuth2 client configuration
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
```

## Security Audit and Monitoring

### Pattern: Comprehensive Security Logging

**Authentication Events:**
- OAuth2 login successes and failures
- Authorization request state management
- Role-based access control decisions

**Session Management:**
- Cookie creation and invalidation
- Cross-origin request handling
- Demo mode access patterns

**Security Headers:**
- CORS policy enforcement
- Secure cookie transmission
- CSRF protection status

## Production Deployment Considerations

### HTTPS Requirements

1. **Secure Cookies**: `Secure` flag requires HTTPS in production
2. **OAuth2 Redirects**: Google OAuth2 requires HTTPS redirect URIs
3. **SameSite=None**: Only works with Secure cookies over HTTPS

### Load Balancer Configuration

1. **Session Affinity**: Not required due to stateless OAuth2 design
2. **Health Checks**: Use `/actuator/health` endpoint
3. **SSL Termination**: Configure proper `X-Forwarded-Proto` headers

### Environment Variables

```bash
# Required OAuth2 configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Application configuration
APP_DEMO_READONLY=false
APP_FRONTEND_BASE_URL=https://your-frontend-domain.com
```

## Related Documentation

- **Configuration Layer**: See [Configuration Patterns](configuration-patterns.md) for refactoring methodology
- **API Integration**: See [Configuration API Integration](configuration-api-integration.md) for implementation details
- **Controller Security**: See [Controller Patterns](../architecture/patterns/controller-patterns.md) for endpoint security
- **Service Security**: See [Service Layer Patterns](../architecture/patterns/service-patterns.md) for method-level security
- **DTO Validation**: See [DTO Patterns](../architecture/patterns/dto-patterns.md) for data validation security
- **OAuth2 Integration**: See `OAuth2LoginSuccessHandler` for user provisioning patterns
- **Frontend Integration**: See CORS configuration for allowed origins
- **Testing**: See `TestSecurityConfig` for test-specific security overrides

## Security Best Practices

### 1. Authentication
- Use OAuth2 with established providers (Google)
- Store authorization state in secure, HttpOnly cookies
- Implement proper error handling with user-friendly messages

### 2. Authorization
- Apply principle of least privilege
- Use role-based access control consistently
- Implement method-level security for sensitive operations

### 3. Session Management
- Use secure session cookies with appropriate flags
- Implement proper logout with session invalidation
- Configure session timeout policies

### 4. CORS and Cross-Origin Security
- Use explicit origin allowlists, never wildcards with credentials
- Cache preflight responses for performance
- Expose only necessary headers

### 5. Production Security
- Enforce HTTPS for all authentication flows
- Use environment-specific configuration
- Implement comprehensive security monitoring and logging

---

*This document provides comprehensive security architecture patterns for the SmartSupplyPro inventory management system. For implementation details, refer to the source code and related configuration files.*