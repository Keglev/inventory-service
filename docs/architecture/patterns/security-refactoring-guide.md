# Security Layer Refactoring Guide

## Overview

This document provides comprehensive refactoring guidelines for the Security layer components, focusing on OAuth2 authentication patterns, stateless session management, and enterprise security implementation. These guidelines ensure maintainable, scalable, and secure authentication flows.

## OAuth2LoginSuccessHandler Refactoring Patterns

### 1. User Provisioning Refactoring

#### Current Implementation Analysis
```java
// Current pattern: Inline user provisioning logic
try {
    userRepository.findById(email).orElseGet(() -> {
        log.info("Enterprise OAuth2: Creating new user account: {}", email);
        AppUser newUser = new AppUser(email, name);
        newUser.setRole(Role.USER);
        newUser.setCreatedAt(LocalDateTime.now());
        return userRepository.save(newUser);
    });
} catch (DataIntegrityViolationException e) {
    log.warn("Enterprise OAuth2: Concurrent user creation resolved for: {}", email);
    userRepository.findByEmail(email).orElseThrow(() ->
        new IllegalStateException("User already exists but cannot be loaded."));
}
```

#### Refactoring Recommendation: Extract User Provisioning Service
```java
// Refactored pattern: Dedicated user provisioning service
@Service
public class OAuth2UserProvisioningService {
    
    private final UserRepository userRepository;
    
    /**
     * Enterprise provisioning: Safe user creation with concurrency handling
     */
    public AppUser provisionUser(String email, String name) {
        try {
            return userRepository.findById(email).orElseGet(() -> {
                log.info("Enterprise OAuth2: Creating new user account: {}", email);
                AppUser newUser = new AppUser(email, name);
                newUser.setRole(Role.USER);
                newUser.setCreatedAt(LocalDateTime.now());
                return userRepository.save(newUser);
            });
        } catch (DataIntegrityViolationException e) {
            log.warn("Enterprise OAuth2: Concurrent user creation resolved for: {}", email);
            return userRepository.findByEmail(email).orElseThrow(() ->
                new IllegalStateException("User already exists but cannot be loaded: " + email));
        }
    }
}

// Updated success handler usage
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
    
    private final OAuth2UserProvisioningService provisioningService;
    
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, 
                                      HttpServletResponse response,
                                      Authentication authentication) throws IOException {
        // Simplified handler logic
        OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) authentication;
        String email = token.getPrincipal().getAttribute("email");
        String name = token.getPrincipal().getAttribute("name");
        
        provisioningService.provisionUser(email, name);
        
        // Continue with redirect logic...
    }
}
```

**Refactoring Benefits:**
- **Single Responsibility**: User provisioning separated from authentication flow
- **Testability**: Isolated user creation logic for unit testing
- **Reusability**: Provisioning service can be used by other OAuth2 providers
- **Maintainability**: Changes to user creation don't affect authentication flow

### 2. Return URL Security Refactoring

#### Current Implementation Analysis
```java
// Current pattern: Inline allowlist validation
List<String> allowed = List.of(
    "http://localhost:5173",
    "https://localhost:5173",
    props.getFrontend().getBaseUrl()
);

for (Cookie c : cookies) {
    if ("SSP_RETURN".equals(c.getName())) {
        String candidate = c.getValue();
        if (candidate != null && allowed.contains(candidate)) {
            target = candidate + "/auth";
        }
    }
}
```

#### Refactoring Recommendation: Extract URL Validation Service
```java
// Refactored pattern: Dedicated URL validation service
@Service
@ConfigurationProperties(prefix = "app.security.oauth2")
public class OAuth2SecurityService {
    
    private List<String> allowedOrigins = List.of();
    
    /**
     * Enterprise security: Validate return URL against allowlist
     */
    public boolean isValidReturnUrl(String url) {
        return url != null && allowedOrigins.contains(url);
    }
    
    /**
     * Enterprise security: Extract and validate return URL from cookies
     */
    public Optional<String> getValidatedReturnUrl(Cookie[] cookies) {
        if (cookies == null) return Optional.empty();
        
        return Arrays.stream(cookies)
            .filter(c -> "SSP_RETURN".equals(c.getName()))
            .map(Cookie::getValue)
            .filter(this::isValidReturnUrl)
            .findFirst();
    }
    
    /**
     * Enterprise routing: Build authenticated redirect URL
     */
    public String buildAuthenticatedRedirectUrl(String baseUrl) {
        return baseUrl + "/auth";
    }
    
    // Getters and setters for configuration binding
    public List<String> getAllowedOrigins() { return allowedOrigins; }
    public void setAllowedOrigins(List<String> allowedOrigins) { this.allowedOrigins = allowedOrigins; }
}

// Configuration
app:
  security:
    oauth2:
      allowed-origins:
        - "http://localhost:5173"
        - "https://localhost:5173"
        - "${FRONTEND_BASE_URL:https://inventory-service.koyeb.app}"
```

**Refactoring Benefits:**
- **Configuration Externalization**: Allowlist configurable via properties
- **Environment Flexibility**: Different URLs per environment
- **Security Centralization**: All URL validation in one place
- **Testing**: Easy to mock and test URL validation logic

### 3. Cookie Management Refactoring

#### Current Implementation Analysis
```java
// Current pattern: Inline cookie manipulation
Cookie clear = new Cookie("SSP_RETURN", "");
clear.setPath("/");
clear.setMaxAge(0);
clear.setSecure(isSecureOrForwardedHttps(request));
clear.setHttpOnly(false);
addCookieWithSameSite(response, clear, "None");
```

#### Refactoring Recommendation: Extract Cookie Utility Service
```java
// Refactored pattern: Dedicated cookie management utility
@Component
public class SecureCookieManager {
    
    /**
     * Enterprise cookie: Create secure return URL cookie
     */
    public Cookie createReturnUrlCookie(String url, HttpServletRequest request) {
        Cookie cookie = new Cookie("SSP_RETURN", url);
        cookie.setHttpOnly(false);  // Frontend needs read access
        cookie.setSecure(isSecureOrForwardedHttps(request));
        cookie.setPath("/");
        cookie.setMaxAge(300);  // 5 minutes
        return cookie;
    }
    
    /**
     * Enterprise cleanup: Create cookie deletion cookie
     */
    public Cookie createDeletionCookie(String name, HttpServletRequest request) {
        Cookie cookie = new Cookie(name, "");
        cookie.setPath("/");
        cookie.setMaxAge(0);
        cookie.setSecure(isSecureOrForwardedHttps(request));
        cookie.setHttpOnly(false);  // Match original HttpOnly setting
        return cookie;
    }
    
    /**
     * Enterprise security: Add cookie with SameSite attribute
     */
    public void addSecureCookie(HttpServletResponse response, Cookie cookie, String sameSite) {
        StringBuilder sb = new StringBuilder();
        sb.append(cookie.getName()).append('=').append(cookie.getValue());
        sb.append("; Path=").append(cookie.getPath());
        if (cookie.getMaxAge() >= 0) sb.append("; Max-Age=").append(cookie.getMaxAge());
        if (cookie.getSecure()) sb.append("; Secure");
        if (cookie.isHttpOnly()) sb.append("; HttpOnly");
        if (sameSite != null && !sameSite.isBlank()) sb.append("; SameSite=").append(sameSite);
        response.addHeader("Set-Cookie", sb.toString());
    }
    
    private boolean isSecureOrForwardedHttps(HttpServletRequest request) {
        if (request.isSecure()) return true;
        String xfProto = request.getHeader("X-Forwarded-Proto");
        return xfProto != null && xfProto.equalsIgnoreCase("https");
    }
}
```

**Refactoring Benefits:**
- **Reusability**: Cookie utilities shared across security components
- **Consistency**: Standardized cookie security attributes
- **Maintainability**: Single place for cookie security logic
- **Testing**: Easier to test cookie creation and security

## CookieOAuth2AuthorizationRequestRepository Refactoring Patterns

### 1. JSON Serialization Refactoring

#### Current Implementation Analysis
```java
// Current pattern: Inline JSON handling with ObjectMapper
private String writeJson(OAuth2AuthorizationRequest request) {
    try {
        Map<String, Object> m = Map.of(
            "authorizationUri", request.getAuthorizationUri(),
            "clientId", request.getClientId(),
            // ... more fields
        );
        return objectMapper.writeValueAsString(m);
    } catch (Exception e) {
        throw new IllegalStateException("Failed to serialize OAuth2AuthorizationRequest", e);
    }
}
```

#### Refactoring Recommendation: Extract Serialization Service
```java
// Refactored pattern: Dedicated OAuth2 serialization service
@Service
public class OAuth2SerializationService {
    
    private final ObjectMapper objectMapper;
    
    /**
     * Enterprise serialization: Convert OAuth2 request to minimal JSON
     */
    public String serializeAuthorizationRequest(OAuth2AuthorizationRequest request) {
        try {
            OAuth2RequestData data = OAuth2RequestData.from(request);
            return objectMapper.writeValueAsString(data);
        } catch (JsonProcessingException e) {
            throw new OAuth2SerializationException("Failed to serialize authorization request", e);
        }
    }
    
    /**
     * Enterprise deserialization: Restore OAuth2 request from JSON
     */
    public OAuth2AuthorizationRequest deserializeAuthorizationRequest(String json) {
        try {
            OAuth2RequestData data = objectMapper.readValue(json, OAuth2RequestData.class);
            return data.toOAuth2AuthorizationRequest();
        } catch (JsonProcessingException e) {
            throw new OAuth2SerializationException("Failed to deserialize authorization request", e);
        }
    }
    
    /**
     * Enterprise data transfer: Minimal OAuth2 request representation
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class OAuth2RequestData {
        public String authorizationUri;
        public String clientId;
        public String redirectUri;
        public Set<String> scopes;
        public String state;
        public String responseType;
        public Map<String, Object> additionalParameters;
        public Map<String, Object> attributes;
        public String authorizationRequestUri;
        
        public static OAuth2RequestData from(OAuth2AuthorizationRequest request) {
            OAuth2RequestData data = new OAuth2RequestData();
            data.authorizationUri = request.getAuthorizationUri();
            data.clientId = request.getClientId();
            data.redirectUri = request.getRedirectUri();
            data.scopes = request.getScopes();
            data.state = request.getState();
            data.responseType = request.getResponseType().getValue();
            data.additionalParameters = request.getAdditionalParameters();
            data.attributes = request.getAttributes();
            data.authorizationRequestUri = request.getAuthorizationRequestUri();
            return data;
        }
        
        public OAuth2AuthorizationRequest toOAuth2AuthorizationRequest() {
            return OAuth2AuthorizationRequest.authorizationCode()
                .authorizationUri(authorizationUri)
                .clientId(clientId)
                .redirectUri(redirectUri)
                .scopes(scopes)
                .state(state)
                .additionalParameters(additionalParameters)
                .attributes(attributes)
                .authorizationRequestUri(authorizationRequestUri)
                .build();
        }
    }
}

// Custom exception for serialization errors
public class OAuth2SerializationException extends RuntimeException {
    public OAuth2SerializationException(String message, Throwable cause) {
        super(message, cause);
    }
}
```

**Refactoring Benefits:**
- **Type Safety**: Dedicated data classes for OAuth2 serialization
- **Error Handling**: Specific exceptions for serialization failures
- **Maintainability**: Changes to serialization format isolated
- **Performance**: Optimized JSON structure for minimal cookie size

### 2. Cookie State Management Refactoring

#### Current Implementation Analysis
```java
// Current pattern: Direct cookie manipulation
public void saveAuthorizationRequest(OAuth2AuthorizationRequest authorizationRequest,
                                   HttpServletRequest request,
                                   HttpServletResponse response) {
    // Mixed concerns: return URL handling + authorization request storage
    String ret = request.getParameter("return");
    // ... return URL logic
    
    // Authorization request serialization
    String json = writeJson(authorizationRequest);
    String encoded = Base64.getUrlEncoder().encodeToString(json.getBytes(StandardCharsets.UTF_8));
    
    // Cookie creation
    Cookie cookie = new Cookie(AUTH_REQUEST_COOKIE_NAME, encoded);
    // ... cookie configuration
}
```

#### Refactoring Recommendation: Separate Concerns with Strategy Pattern
```java
// Refactored pattern: Separate authorization storage and return URL handling
@Component
public class OAuth2StateManager {
    
    private final OAuth2SerializationService serializationService;
    private final SecureCookieManager cookieManager;
    private final OAuth2SecurityService securityService;
    
    /**
     * Enterprise state: Save OAuth2 authorization request
     */
    public void saveAuthorizationRequest(OAuth2AuthorizationRequest request,
                                       HttpServletRequest httpRequest,
                                       HttpServletResponse httpResponse) {
        if (request == null) {
            clearAuthorizationRequest(httpRequest, httpResponse);
            return;
        }
        
        // Serialize and encode authorization request
        String json = serializationService.serializeAuthorizationRequest(request);
        String encoded = Base64.getUrlEncoder().encodeToString(json.getBytes(StandardCharsets.UTF_8));
        
        // Create and add secure cookie
        Cookie cookie = new Cookie(AUTH_REQUEST_COOKIE_NAME, encoded);
        cookie.setHttpOnly(true);
        cookie.setSecure(cookieManager.isSecureRequest(httpRequest));
        cookie.setPath("/");
        cookie.setMaxAge(COOKIE_EXPIRE_SECONDS);
        
        cookieManager.addSecureCookie(httpResponse, cookie, "None");
    }
    
    /**
     * Enterprise state: Handle return URL parameter
     */
    public void handleReturnUrl(String returnUrl, HttpServletRequest request, HttpServletResponse response) {
        if (returnUrl != null && !returnUrl.isBlank()) {
            if (securityService.isValidReturnUrl(returnUrl)) {
                Cookie returnCookie = cookieManager.createReturnUrlCookie(returnUrl, request);
                cookieManager.addSecureCookie(response, returnCookie, "None");
            } else {
                log.warn("Enterprise OAuth2: Rejected non-allowlisted return origin: {}", returnUrl);
            }
        }
    }
    
    /**
     * Enterprise state: Load OAuth2 authorization request
     */
    public Optional<OAuth2AuthorizationRequest> loadAuthorizationRequest(HttpServletRequest request) {
        return findAuthorizationRequestCookie(request)
            .map(this::decodeAndDeserialize)
            .filter(Objects::nonNull);
    }
    
    private Optional<Cookie> findAuthorizationRequestCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return Optional.empty();
        
        return Arrays.stream(request.getCookies())
            .filter(c -> AUTH_REQUEST_COOKIE_NAME.equals(c.getName()))
            .findFirst();
    }
    
    private OAuth2AuthorizationRequest decodeAndDeserialize(Cookie cookie) {
        try {
            String json = new String(Base64.getUrlDecoder().decode(cookie.getValue()), StandardCharsets.UTF_8);
            return serializationService.deserializeAuthorizationRequest(json);
        } catch (Exception e) {
            log.warn("Enterprise OAuth2: Malformed authorization request cookie ignored");
            return null;
        }
    }
}

// Updated repository implementation
@Component
public class CookieOAuth2AuthorizationRequestRepository implements OAuth2AuthorizationRequestRepository<OAuth2AuthorizationRequest> {
    
    private final OAuth2StateManager stateManager;
    
    @Override
    public void saveAuthorizationRequest(OAuth2AuthorizationRequest authorizationRequest,
                                       HttpServletRequest request,
                                       HttpServletResponse response) {
        stateManager.saveAuthorizationRequest(authorizationRequest, request, response);
        stateManager.handleReturnUrl(request.getParameter("return"), request, response);
    }
    
    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
        return stateManager.loadAuthorizationRequest(request).orElse(null);
    }
    
    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(HttpServletRequest request,
                                                               HttpServletResponse response) {
        OAuth2AuthorizationRequest existing = loadAuthorizationRequest(request);
        stateManager.clearAuthorizationRequest(request, response);
        return existing;
    }
}
```

**Refactoring Benefits:**
- **Single Responsibility**: Each component handles one concern
- **Testability**: Individual components can be tested in isolation
- **Flexibility**: Easy to change serialization or cookie strategies
- **Maintainability**: Clear separation of OAuth2 state management concerns

## Architecture Refactoring Patterns

### 1. Configuration-Driven Security

#### Current Implementation Analysis
```java
// Current pattern: Hardcoded configuration values
List<String> allowed = List.of(
    "http://localhost:5173",
    "https://localhost:5173", 
    "https://inventory-service.koyeb.app"
);
```

#### Refactoring Recommendation: Externalized Configuration
```java
// Refactored pattern: Configuration properties
@ConfigurationProperties(prefix = "app.security.oauth2")
@Component
public class OAuth2SecurityProperties {
    
    private List<String> allowedOrigins = new ArrayList<>();
    private Cookie cookie = new Cookie();
    private ReturnUrl returnUrl = new ReturnUrl();
    
    public static class Cookie {
        private int authRequestExpirySeconds = 180;  // 3 minutes
        private int returnUrlExpirySeconds = 300;    // 5 minutes
        private boolean secure = true;
        private String sameSite = "None";
        
        // Getters and setters
    }
    
    public static class ReturnUrl {
        private String authPath = "/auth";
        private boolean required = false;
        
        // Getters and setters
    }
    
    // Getters and setters
}

// Configuration file
app:
  security:
    oauth2:
      allowed-origins:
        - "${FRONTEND_DEV_URL:http://localhost:5173}"
        - "${FRONTEND_DEV_HTTPS_URL:https://localhost:5173}"
        - "${FRONTEND_PROD_URL:https://inventory-service.koyeb.app}"
      cookie:
        auth-request-expiry-seconds: 180
        return-url-expiry-seconds: 300
        secure: true
        same-site: "None"
      return-url:
        auth-path: "/auth"
        required: false
```

### 2. Event-Driven Security Auditing

#### Refactoring Recommendation: Security Event System
```java
// Event-driven security auditing
@Component
public class SecurityEventPublisher {
    
    private final ApplicationEventPublisher eventPublisher;
    
    public void publishAuthenticationSuccess(String email, String returnUrl) {
        eventPublisher.publishEvent(new OAuth2AuthenticationSuccessEvent(email, returnUrl));
    }
    
    public void publishUserProvisioned(String email, boolean isNewUser) {
        eventPublisher.publishEvent(new UserProvisionedEvent(email, isNewUser));
    }
    
    public void publishSecurityViolation(String type, String details) {
        eventPublisher.publishEvent(new SecurityViolationEvent(type, details));
    }
}

@EventListener
@Component
public class SecurityAuditListener {
    
    private final AuditService auditService;
    private final SecurityMetricsService metricsService;
    
    @EventListener
    public void handleAuthenticationSuccess(OAuth2AuthenticationSuccessEvent event) {
        auditService.logAuthenticationSuccess(event.getEmail(), event.getReturnUrl());
        metricsService.recordSuccessfulAuthentication();
    }
    
    @EventListener
    public void handleUserProvisioned(UserProvisionedEvent event) {
        auditService.logUserProvisioning(event.getEmail(), event.isNewUser());
        if (event.isNewUser()) {
            metricsService.recordNewUserCreated();
        }
    }
    
    @EventListener
    public void handleSecurityViolation(SecurityViolationEvent event) {
        auditService.logSecurityViolation(event.getType(), event.getDetails());
        metricsService.recordSecurityViolation(event.getType());
    }
}
```

## Testing Refactoring Patterns

### 1. Component Testing Strategy

```java
// Refactored testing approach: Component-specific tests
@SpringBootTest
class OAuth2UserProvisioningServiceTest {
    
    @MockBean private UserRepository userRepository;
    @Autowired private OAuth2UserProvisioningService provisioningService;
    
    @Test
    void shouldCreateNewUserWhenNotExists() {
        // Given
        when(userRepository.findById("user@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(AppUser.class))).thenAnswer(i -> i.getArgument(0));
        
        // When
        AppUser result = provisioningService.provisionUser("user@example.com", "Test User");
        
        // Then
        assertThat(result.getEmail()).isEqualTo("user@example.com");
        assertThat(result.getRole()).isEqualTo(Role.USER);
        verify(userRepository).save(any(AppUser.class));
    }
    
    @Test
    void shouldHandleConcurrentUserCreation() {
        // Given
        when(userRepository.findById("user@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(AppUser.class))).thenThrow(DataIntegrityViolationException.class);
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(existingUser));
        
        // When
        AppUser result = provisioningService.provisionUser("user@example.com", "Test User");
        
        // Then
        assertThat(result).isEqualTo(existingUser);
        verify(userRepository).findByEmail("user@example.com");
    }
}
```

### 2. Integration Testing Strategy

```java
// Refactored integration testing: End-to-end OAuth2 flows
@SpringBootTest
@AutoConfigureTestDatabase
@TestPropertySource(properties = {
    "app.security.oauth2.allowed-origins[0]=http://localhost:3000",
    "app.security.oauth2.cookie.auth-request-expiry-seconds=60"
})
class OAuth2SecurityIntegrationTest {
    
    @Autowired private OAuth2StateManager stateManager;
    @Autowired private OAuth2SecurityService securityService;
    
    @Test
    void shouldCompleteOAuth2FlowWithReturnUrl() {
        // Given: OAuth2 authorization request with return URL
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        request.setParameter("return", "http://localhost:3000");
        
        OAuth2AuthorizationRequest authRequest = OAuth2AuthorizationRequest.authorizationCode()
            .clientId("test-client")
            .authorizationUri("https://oauth.provider.com/auth")
            .redirectUri("http://localhost:8080/callback")
            .state("test-state")
            .build();
        
        // When: Save authorization request
        stateManager.saveAuthorizationRequest(authRequest, request, response);
        
        // Then: Should save both auth request and return URL
        Optional<OAuth2AuthorizationRequest> loaded = stateManager.loadAuthorizationRequest(request);
        assertThat(loaded).isPresent();
        assertThat(loaded.get().getState()).isEqualTo("test-state");
        
        // And: Return URL should be validated and stored
        Optional<String> returnUrl = securityService.getValidatedReturnUrl(request.getCookies());
        assertThat(returnUrl).hasValue("http://localhost:3000");
    }
}
```

## Migration Strategy

### Phase 1: Extract Services (Low Risk)
1. **OAuth2UserProvisioningService** - Extract user creation logic
2. **SecureCookieManager** - Extract cookie utilities
3. **OAuth2SerializationService** - Extract JSON handling

### Phase 2: Refactor Configuration (Medium Risk)
1. **OAuth2SecurityProperties** - Externalize configuration
2. **Environment-specific settings** - Configure per environment
3. **Validation improvements** - Enhanced security checks

### Phase 3: Architecture Changes (High Risk)
1. **OAuth2StateManager** - Separate state management concerns
2. **Event-driven auditing** - Implement security events
3. **Comprehensive testing** - Add component and integration tests

### Phase 4: Performance Optimization (Medium Risk)
1. **Caching strategies** - Cache user lookups
2. **Cookie optimization** - Minimize cookie size
3. **Monitoring integration** - Add security metrics

## Best Practices for Refactoring

### 1. Incremental Refactoring
- **Small Changes**: Refactor one component at a time
- **Backward Compatibility**: Maintain existing interfaces during transition
- **Feature Flags**: Use feature toggles for new implementations
- **Rollback Strategy**: Keep old implementation until new one is proven

### 2. Testing Strategy
- **Test Coverage**: Maintain or improve test coverage during refactoring
- **Integration Tests**: Test OAuth2 flows end-to-end
- **Security Tests**: Verify security features still work
- **Performance Tests**: Ensure refactoring doesn't degrade performance

### 3. Documentation Updates
- **Architecture Documentation**: Update system architecture diagrams
- **Configuration Guide**: Document new configuration options
- **Migration Guide**: Provide step-by-step migration instructions
- **Troubleshooting**: Document common issues and solutions

## Related Documentation

- **Security Patterns**: See [Security Implementation Patterns](security-implementation-patterns.md)
- **OAuth2 Architecture**: See [OAuth2 Security Architecture](oauth2-security-architecture.md)
- **Configuration Patterns**: See [Configuration Patterns](configuration-patterns.md)
- **Testing Strategies**: See [Security Testing Guide](security-testing-guide.md)

---

*This refactoring guide provides systematic approaches to improve the Security layer architecture while maintaining enterprise-grade security, performance, and maintainability.*