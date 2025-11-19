[⬅️ Back to Config Overview](./index.md)

# Spring Configuration Classes

## Overview

Spring `@Configuration` classes define **beans** — managed objects that implement application behavior. In the Inventory Service, configuration classes primarily handle:

- **Security**: OAuth2 login, authorization rules, CORS
- **Properties**: Loading custom app settings (demo mode, frontend URLs)
- **Filters**: Request detection (API vs browser)
- **SpEL integration**: Allowing security expressions to access configuration

## Configuration Classes

### AppProperties

**File:** `src/main/java/.../config/AppProperties.java`

**Purpose:** Custom application properties, not part of Spring Framework defaults.

**Beans created:** None directly; instead, binds properties to a managed object.

**Key Properties:**

```java
@ConfigurationProperties(prefix = "app")
public class AppProperties {
    private boolean isDemoReadonly = false;      // Demo read-only mode
    private final Frontend frontend = new Frontend();
    
    public static class Frontend {
        private String baseUrl = "http://localhost:8081";
        private String landingPath = "/auth";
    }
}
```

**Usage in the codebase:**

- **`SecurityConfig`**: Checks `props.isDemoReadonly()` to decide whether to permit unauthenticated GET requests
- **`OAuth2LoginSuccessHandler`**: Uses `props.getFrontend().getBaseUrl()` to redirect after login

**Configuration sources:**

```yaml
app:
  demo-readonly: ${APP_DEMO_READONLY:true}
  frontend:
    base-url: ${APP_FRONTEND_BASE_URL:https://localhost:5173}
    landing-path: /auth
```

---

### SecurityConfig

**File:** `src/main/java/.../config/SecurityConfig.java`

**Purpose:** Core OAuth2 and method-level security configuration.

**Key Beans:**

#### 1. `securityFilterChain()`

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .cors(Customizer.withDefaults())
        .authorizeHttpRequests(auth -> {...})
        .oauth2Login(oauth2 -> {...})
        .logout(logout -> {...})
        .sessionManagement(session -> {...});
    
    return http.build();
}
```

**What it does:**

- Enables CORS (cross-origin requests)
- Configures which endpoints require authentication
- Enables Google OAuth2 login
- Manages sessions with secure cookies
- Supports demo mode read-only access

**Related helpers:** Uses `SecurityAuthorizationHelper`, `SecurityEntryPointHelper`, `SecurityFilterHelper`

#### 2. `corsConfigurationSource()`

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("http://localhost:5173", ...));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
    config.setAllowCredentials(true);  // Cookies allowed
    
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
}
```

**What it does:**

- Allows frontend to make cross-origin API calls
- Permits credentials (OAuth2 session cookies)
- Restricts to approved methods and origins

#### 3. `cookieSerializer()`

```java
@Bean
public CookieSerializer cookieSerializer() {
    DefaultCookieSerializer serializer = new DefaultCookieSerializer();
    serializer.setCookieName("JSESSIONID");
    serializer.setCookiePath("/");
    serializer.setUseHttpOnlyCookie(true);
    serializer.setUseBase64Encoding(true);
    return serializer;
}
```

**What it does:**

- Configures session cookie security (HttpOnly, Base64 encoding)
- Prevents JavaScript access to session tokens

---

### SecuritySpelBridgeConfig

**File:** `src/main/java/.../config/SecuritySpelBridgeConfig.java`

**Purpose:** Exposes `AppProperties` to SpEL (Spring Expression Language) for method-level security.

**Bean:**

```java
@Bean("appProperties")
@Primary
public AppProperties appPropertiesPrimary(AppProperties props) {
    return props;  // Alias for SpEL access
}
```

**Usage in annotations:**

```java
@PreAuthorize("hasRole('ADMIN') || @appProperties.demoReadonly()")
public void deleteSupplier(String id) {
    // Allows deletion if user is ADMIN OR demo mode is enabled
}
```

**Why it's needed:**

- SpEL expressions don't have direct access to autowired properties
- This bean makes `AppProperties` available by name (`@appProperties`)
- Enables declarative security rules that reference configuration

---

### Helper Classes

These are `@Component` classes (automatically created beans) that break down security configuration into manageable pieces.

#### SecurityAuthorizationHelper

```java
@Component
public class SecurityAuthorizationHelper {
    public void configureAuthorization(
        AuthorizeHttpRequestsConfigurer<HttpSecurity>.AuthorizationManagerRequestMatcherRegistry auth,
        boolean isDemoReadonly) {
        
        // Public endpoints
        auth.requestMatchers("/", "/login/**", "/oauth2/**").permitAll();
        
        // Demo mode: allow GET without login
        if (isDemoReadonly) {
            auth.requestMatchers(HttpMethod.GET, "/api/inventory/**").permitAll();
        }
        
        // Protected: require authentication for reads
        auth.requestMatchers(HttpMethod.GET, "/api/inventory/**").authenticated();
        
        // Admin-only: writes require ADMIN role
        auth.requestMatchers(HttpMethod.POST, "/api/inventory/**").hasRole("ADMIN");
    }
}
```

#### SecurityEntryPointHelper

Handles authentication failures:

- **API requests** → return JSON error (`401 Unauthorized`)
- **Browser requests** → redirect to login page

```java
@Component
public class SecurityEntryPointHelper {
    public AuthenticationEntryPoint createApiEntryPoint() {
        return (request, response, exception) -> {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
        };
    }
    
    public AuthenticationEntryPoint createWebEntryPoint(String frontendUrl) {
        return (request, response, exception) -> {
            response.sendRedirect(frontendUrl + "/login");
        };
    }
}
```

#### SecurityFilterHelper

Creates a filter that marks API requests:

```java
@Component
public class SecurityFilterHelper {
    public OncePerRequestFilter createApiDetectionFilter() {
        return new OncePerRequestFilter() {
            protected void doFilterInternal(HttpServletRequest request, ...) {
                boolean isApi = request.getRequestURI().startsWith("/api/");
                request.setAttribute("IS_API_REQUEST", isApi);
                filterChain.doFilter(request, response);
            }
        };
    }
}
```

**Why this matters:**

- The `SecurityEntryPointHelper` uses the `IS_API_REQUEST` attribute to decide how to handle auth failures
- API errors are JSON; web errors redirect to login

---

## Bean Dependency Graph

```
AppProperties
    ↓
    ├─ Used by: SecurityConfig
    │            SecurityAuthorizationHelper
    │
    ├─ Aliased by: SecuritySpelBridgeConfig
    │               (exposes as @appProperties for SpEL)

SecurityConfig
    ↓
    ├─ Uses: AppProperties
    ├─ Uses: SecurityAuthorizationHelper
    ├─ Uses: SecurityEntryPointHelper
    ├─ Uses: SecurityFilterHelper
    ├─ Uses: CustomOAuth2UserService
    ├─ Uses: CustomOidcUserService
    │
    └─ Creates: SecurityFilterChain (main bean)
               CorsConfigurationSource
               CookieSerializer
```

---

## How Configuration Classes Are Loaded

1. **Classpath scanning**: Spring detects `@Configuration` classes at startup
2. **Bean creation**: Methods marked `@Bean` are invoked to create beans
3. **Dependency injection**: Dependencies (like `AppProperties`) are autowired
4. **Bean lifecycle**: Beans are stored in the application context and injected where needed
5. **Property binding**: `@ConfigurationProperties` classes bind YAML/env values to fields

**Key configuration points that activate this:**

```yaml
# In application.yml
spring:
  main:
    allow-bean-definition-overriding: true  # Allow multiple configs
```

---

## Testing Configuration Classes

Test configuration can override beans:

```java
@SpringBootTest(properties = {
    "app.demo-readonly=false",
    "app.frontend.base-url=http://localhost:3000"
})
public class SecurityConfigTest {
    
    @Autowired
    private AppProperties props;
    
    @Test
    void testDemoModeDisabledInTest() {
        assertThat(props.isDemoReadonly()).isFalse();
    }
}
```

---

## Summary

| Class | Purpose | Main Beans |
|-------|---------|-----------|
| **AppProperties** | Custom app settings | (none; used by SpEL) |
| **SecurityConfig** | OAuth2 & authorization | `SecurityFilterChain`, `CorsConfigurationSource` |
| **SecuritySpelBridgeConfig** | SpEL integration | `appProperties` alias |
| **SecurityAuthorizationHelper** | Authorization rules | (helper; no public beans) |
| **SecurityEntryPointHelper** | Auth failure handling | (helper; no public beans) |
| **SecurityFilterHelper** | Request detection | (helper; no public beans) |

---

[⬅️ Back to Config Overview](./index.md)
