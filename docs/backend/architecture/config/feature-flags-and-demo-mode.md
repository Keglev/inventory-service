[⬅️ Back to Config Overview](./index.md)

# Feature Flags and Demo Mode

## Overview

**Feature flags** allow toggling application behavior without code changes or redeployment. The Inventory Service implements **demo mode** as a feature flag — a read-only environment for testing and demonstration.

---

## Demo Mode

### What is Demo Mode?

Demo mode allows **unauthenticated users to read inventory data** without logging in. All write operations (create, update, delete) still require authentication and ADMIN role.

### Configuration

#### Property Definition

**File:** `src/main/resources/application.yml`

```yaml
app:
  demo-readonly: ${APP_DEMO_READONLY:true}
```

- **Environment variable:** `APP_DEMO_READONLY` (required)
- **Default value:** `true` (demo mode ON by default)

#### How to Toggle Demo Mode

```bash
# Enable demo mode
export APP_DEMO_READONLY="true"

# Disable demo mode (production default)
export APP_DEMO_READONLY="false"

# Without setting env var, uses default (true)
```

### Demo Mode in Action

#### When Demo Mode is ON

```
GET /api/inventory/items              ✅ Allowed (no login)
GET /api/suppliers                    ✅ Allowed (no login)
GET /api/analytics/trends             ✅ Allowed (no login)

POST /api/inventory/items             ❌ Requires ADMIN role
PUT /api/inventory/items/123          ❌ Requires ADMIN role
DELETE /api/inventory/items/123       ❌ Requires ADMIN role
```

**Use case:** Showcase the application without requiring users to create accounts or log in.

#### When Demo Mode is OFF

```
GET /api/inventory/items              ❌ Requires login
GET /api/suppliers                    ❌ Requires login
GET /api/analytics/trends             ❌ Requires login

POST /api/inventory/items             ❌ Requires ADMIN role
PUT /api/inventory/items/123          ❌ Requires ADMIN role
DELETE /api/inventory/items/123       ❌ Requires ADMIN role
```

**Use case:** Production environment; all access controlled.

---

## How Demo Mode is Implemented

### 1. Property Binding

`AppProperties` class binds the configuration:

```java
@ConfigurationProperties(prefix = "app")
public class AppProperties {
  private boolean isDemoReadonly = false;
  
  public boolean isDemoReadonly() {
    return isDemoReadonly;
  }
  
  public void setDemoReadonly(boolean demoReadonly) {
    this.isDemoReadonly = demoReadonly;
  }
}
```

**Spring loads the value** from `APP_DEMO_READONLY` environment variable and stores it in the `isDemoReadonly` field.

### 2. SpEL Bridge Configuration

To use `AppProperties` in security annotations, it's exposed to SpEL:

**File:** `src/main/java/.../config/SecuritySpelBridgeConfig.java`

```java
@Configuration
public class SecuritySpelBridgeConfig {
  
  @Bean("appProperties")
  @Primary
  public AppProperties appPropertiesPrimary(AppProperties props) {
    return props;  // Alias for SpEL access
  }
}
```

This allows security expressions to reference `@appProperties`.

### 3. Authorization Configuration

`SecurityConfig` uses demo mode flag when building filter chain:

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {
  
  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http, AppProperties props) {
    auth.authorizeHttpRequests(config -> {
      // Demo mode: allow read without login
      if (props.isDemoReadonly()) {
        config.requestMatchers(HttpMethod.GET, "/api/inventory/**").permitAll();
        config.requestMatchers(HttpMethod.GET, "/api/analytics/**").permitAll();
        config.requestMatchers(HttpMethod.GET, "/api/suppliers/**").permitAll();
      }
    });
  }
}
```

### 4. Method-Level Security

Alternatively, can use SpEL in method annotations:

```java
@Service
public class InventoryItemService {
  
  @Transactional
  @PreAuthorize("hasRole('ADMIN') || @appProperties.isDemoReadonly()")
  public void deleteItem(String id) {
    // Allow ADMIN or if demo mode is ON
  }
}
```

---

## Profile-Specific Demo Mode

### Default (Local Development)

```yaml
app:
  demo-readonly: ${APP_DEMO_READONLY:true}  # ON by default
```

**Useful for:** Local testing, easy first-time experience.

### Production (Fly.io)

**File:** `fly.toml`

```toml
[env]
  SPRING_PROFILES_ACTIVE = "prod"
  APP_DEMO_READONLY = "true"              # Still ON in Fly demo
```

Can toggle for production environment:

```bash
fly secrets set APP_DEMO_READONLY="false"  # Turn off demo mode
```

### Test Profile

No special handling; tests can override:

```java
@SpringBootTest(properties = {
  "app.demo-readonly=true",
  "app.frontend.base-url=http://localhost:3000"
})
public class DemoModeSecurityTest {
  
  @Test
  void testDemoModeReadOnlyAccess() {
    // Test anonymous GET access
  }
}
```

---

## Other Application Properties

Beyond demo mode, `AppProperties` also manages:

### Frontend URL Configuration

```java
public static class Frontend {
  private String baseUrl = "http://localhost:8081";
  private String landingPath = "/auth";
}
```

**Used for:**
- OAuth2 redirect URIs
- CORS configuration
- Post-login navigation

**Configuration:**

```yaml
app:
  frontend:
    base-url: ${APP_FRONTEND_BASE_URL:https://localhost:5173}
    landing-path: /auth
```

**Examples:**

```bash
# Local development
export APP_FRONTEND_BASE_URL="http://localhost:5173"

# Production (Fly.io)
export APP_FRONTEND_BASE_URL="https://inventoryservice-ui.fly.dev"
```

---

## Future Feature Flags Pattern

To add more feature flags following the same pattern:

### 1. Add Property

```java
@ConfigurationProperties(prefix = "app")
public class AppProperties {
  private boolean isDemoReadonly = false;
  private boolean featureAdvancedAnalytics = true;  // New flag
  private boolean featureBulkUpload = false;         // New flag
  
  public boolean isFeatureAdvancedAnalytics() {
    return featureAdvancedAnalytics;
  }
}
```

### 2. Add YAML Configuration

```yaml
app:
  demo-readonly: ${APP_DEMO_READONLY:true}
  feature-advanced-analytics: ${FEATURE_ADVANCED_ANALYTICS:true}
  feature-bulk-upload: ${FEATURE_BULK_UPLOAD:false}
```

### 3. Use in Code

```java
@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {
  
  @Autowired
  private AppProperties appProperties;
  
  @GetMapping("/advanced")
  public ResponseEntity<?> getAdvancedAnalytics() {
    if (!appProperties.isFeatureAdvancedAnalytics()) {
      throw new FeatureNotEnabledException("Advanced analytics not available");
    }
    // ... return analytics
  }
}
```

Or with SpEL:

```java
@PreAuthorize("@appProperties.isFeatureAdvancedAnalytics()")
@GetMapping("/advanced")
public ResponseEntity<?> getAdvancedAnalytics() {
  // ...
}
```

---

## Testing Feature Flags

### Unit Test with Feature Off

```java
@SpringBootTest(properties = {
  "app.demo-readonly=false",
  "app.feature-advanced-analytics=false"
})
public class FeatureFlagsTest {
  
  @Autowired
  private AnalyticsController controller;
  
  @Test
  void testAdvancedAnalyticsDisabled() {
    assertThrows(FeatureNotEnabledException.class, () -> {
      controller.getAdvancedAnalytics();
    });
  }
}
```

### Mock Feature Flag

```java
@SpringBootTest
public class FeatureFlagsTest {
  
  @MockBean
  private AppProperties appProperties;
  
  @Test
  void testFeatureToggleOn() {
    when(appProperties.isFeatureAdvancedAnalytics()).thenReturn(true);
    // Test with feature enabled
  }
  
  @Test
  void testFeatureToggleOff() {
    when(appProperties.isFeatureAdvancedAnalytics()).thenReturn(false);
    // Test with feature disabled
  }
}
```

---

## Admin Email Allow-List

Another feature-like configuration stored in environment variables:

**Environment variable:** `APP_ADMIN_EMAILS` (comma-separated)

**Example:**

```bash
export APP_ADMIN_EMAILS="admin@company.com,manager@company.com"
```

Used in OAuth2 success handler to assign ADMIN role:

```java
@Component
public class OAuth2LoginSuccessHandler {
  
  @Value("${app.admin-emails:}")
  private String adminEmails;
  
  public void onAuthenticationSuccess(OAuth2User user) {
    String email = (String) user.getAttributes().get("email");
    
    if (adminEmails.contains(email.toLowerCase())) {
      // Grant ADMIN role
    }
  }
}
```

---

## Summary: Demo Mode & Feature Flags

| Aspect | Detail |
|--------|--------|
| **Primary Feature Flag** | Demo mode (`app.demo-readonly`) |
| **Default** | ON (`true`) in all profiles |
| **Environment Variable** | `APP_DEMO_READONLY` |
| **Controlled By** | `AppProperties` class |
| **Used In** | `SecurityConfig` and `@PreAuthorize` annotations |
| **Access Pattern** | `@appProperties.isDemoReadonly()` (SpEL) |
| **Impact** | Allows GET requests without login when ON |
| **Production Default** | ON (can be disabled with env var) |
| **Testing** | Overridable via `@SpringBootTest` properties |

---

[⬅️ Back to Config Overview](./index.md)
