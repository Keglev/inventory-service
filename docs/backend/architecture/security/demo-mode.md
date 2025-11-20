[⬅️ Back to Security Index](./index.html)

# Demo Mode (Read-Only Public Access)

## Overview

Smart Supply Pro supports a **read-only demo mode** for public showcases, product demonstrations, and evaluation. Demo mode:

- Disables all write operations (POST, PUT, DELETE)
- Allows anonymous GET access to inventory data
- Overrides role-based access control (RBAC)
- Useful for live product demos and trial accounts
- Can be toggled via environment variable

---

## Demo Mode Configuration

### Enable/Disable Demo Mode

**Environment Variable:**
```bash
APP_DEMO_READONLY=true   # Enable read-only mode
APP_DEMO_READONLY=false  # Disable (default)
```

**Application Properties:**
```yaml
# application.yml (shared)
app:
  demo-readonly: ${APP_DEMO_READONLY:false}
```

**Fly.io Production (fly.toml):**
```toml
[env]
  SPRING_PROFILES_ACTIVE = "prod"
  APP_DEMO_READONLY = "true"  # Demo enabled in production
```

**Docker Runtime:**
```bash
docker run \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e APP_DEMO_READONLY=true \
  -p 8081:8081 \
  inventory-service:latest
```

**Kubernetes:**
```yaml
env:
- name: APP_DEMO_READONLY
  value: "true"
```

---

## Authorization Override

### How Authorization Changes

**Normal Mode (demo-readonly=false):**
```
User Role (ADMIN/USER) → Request Authorization → HTTP 403 if unauthorized
```

**Demo Mode (demo-readonly=true):**
```
GET Request? → Allow (all users, anonymous)
            ↓
Write Request? → Deny with "Demo Mode" message
            ↓
            HTTP 403 (Forbidden)
```

### Implementation

**SecuritySpelBridgeConfig.java:**
```java
@Configuration
public class SecuritySpelBridgeConfig {

    @Bean
    public SpELSecurityBridge spelSecurityBridge(AppProperties appProperties) {
        return new SpELSecurityBridge(appProperties);
    }
}

public class SpELSecurityBridge {
    private final boolean demoReadonly;

    public SpELSecurityBridge(AppProperties appProperties) {
        this.demoReadonly = appProperties.isDemoReadonly();
    }

    /**
     * Check if request is allowed in demo mode
     * Demo mode: GET allowed (read), write operations denied
     */
    public boolean isDemoModeAllowed(String httpMethod) {
        if (!demoReadonly) {
            return true;  // Demo mode disabled, allow normally
        }
        return "GET".equalsIgnoreCase(httpMethod);  // Demo: only GET allowed
    }
}
```

**SecurityAuthorizationHelper.java:**
```java
@Configuration
public class SecurityAuthorizationHelper {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) {
        http.authorizeHttpRequests(authz -> authz
            // GET requests - allowed in demo mode
            .requestMatchers(HttpMethod.GET, "/api/**")
            .permitAll()
            
            // Write operations - require ADMIN or disallow in demo mode
            .requestMatchers(HttpMethod.POST, "/api/**")
            .access("hasRole('ADMIN') and @spelSecurityBridge.isDemoModeAllowed('POST')")
            
            .requestMatchers(HttpMethod.PUT, "/api/**")
            .access("hasRole('ADMIN') and @spelSecurityBridge.isDemoModeAllowed('PUT')")
            
            .requestMatchers(HttpMethod.DELETE, "/api/**")
            .access("hasRole('ADMIN') and @spelSecurityBridge.isDemoModeAllowed('DELETE')")
        );
    }
}
```

### @PreAuthorize with Demo Mode

**Controller Methods:**
```java
@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    @GetMapping
    @PreAuthorize("permitAll()")  // Always allowed
    public ResponseEntity<?> listInventory() {
        return ResponseEntity.ok(inventoryService.getAll());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') and @spelSecurityBridge.isDemoModeAllowed('POST')")
    public ResponseEntity<?> createInventory(@RequestBody InventoryItemRequest req) {
        return ResponseEntity.ok(inventoryService.create(req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') and @spelSecurityBridge.isDemoModeAllowed('DELETE')")
    public ResponseEntity<?> deleteInventory(@PathVariable Long id) {
        inventoryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

---

## Demo Mode Authorization Flow

```
User Request
    ↓
┌─────────────────────────────────┐
│ Is it a GET request?             │
└─────────────────────────────────┘
    ↓ YES              ↓ NO
[Return Data]      [Check Authorization]
                       ↓
                  ┌──────────────────────┐
                  │ Demo Mode Enabled?   │
                  └──────────────────────┘
                    ↓ YES              ↓ NO
              [403 Forbidden]     [Check User Role]
             (Demo Mode blocks)        ↓
                            ┌──────────────────────┐
                            │ User is ADMIN?       │
                            └──────────────────────┘
                              ↓ YES        ↓ NO
                          [Allow]     [403 Forbidden]
```

---

## Demo Mode Use Cases

### 1. Live Product Demonstration

**Scenario:** Sales team demos app at conference

```bash
# Start app in demo mode
APP_DEMO_READONLY=true ./start.sh

# Attendees see live inventory data
# Click "Add Item" → 403 Forbidden
# Message: "This feature is disabled in Demo Mode"
```

**Benefits:**
- ✅ Show read-only data without risk
- ✅ No accidental modifications
- ✅ Emphasize full edit features in paid version

### 2. Trial/Evaluation Accounts

**Scenario:** Prospective customer evaluates app for 30 days

```yaml
# For trial tenant (multi-tenant setup)
tenants:
  trial-acme:
    demo-readonly: true    # Trial account
    expires: 2024-12-31
  
  licensed-acme:
    demo-readonly: false   # Paying customer
```

**Flow:**
1. Trial user logs in with SSO
2. Can read inventory, view analytics
3. Cannot create/modify data
4. After 30 days, either upgrade or access revoked

### 3. Public Showcase/Tutorial

**Scenario:** Public website with embedded read-only dashboard

```bash
# Publicly accessible instance
APP_DEMO_READONLY=true
SPRING_SECURITY_OAUTH2_LOGIN_CLIENT_ID=public-demo-client
```

**Use Case:**
- Public inventory viewer (like retail product catalog)
- No login required for GET requests
- Everyone sees same read-only data

### 4. Testing/QA Environment

**Scenario:** QA team testing without needing test data cleanup

```bash
# QA environment
APP_DEMO_READONLY=true SPRING_PROFILES_ACTIVE=qa

# QA can:
# - Run read tests against production-like data
# - Verify UI with real data
# - Ensure no test data pollutes production
```

---

## Error Messages in Demo Mode

### 403 Forbidden Response

**Request:**
```bash
POST /api/inventory \
  -H "Content-Type: application/json" \
  -d '{"itemName": "New Item", "quantity": 100}'
```

**Response (Demo Mode):**
```json
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "timestamp": "2024-01-15T10:30:00Z",
  "status": 403,
  "error": "Forbidden",
  "message": "This operation is disabled in Demo Mode. Read-only access only.",
  "path": "/api/inventory"
}
```

**Response (Normal Mode, User lacks ADMIN):**
```json
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "timestamp": "2024-01-15T10:30:00Z",
  "status": 403,
  "error": "Access Denied",
  "message": "Only ADMIN users can create inventory items.",
  "path": "/api/inventory"
}
```

### Distinguishing Error Causes

**UI Logic (Frontend):**
```typescript
// frontend/src/api.ts
async function makeRequest(method: string, url: string, data?: unknown) {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined
  });

  if (response.status === 403) {
    const error = await response.json();
    
    // Check if demo mode or insufficient permissions
    if (error.message.includes('Demo Mode')) {
      // Show "Demo Mode" notification
      showToast("Demo Mode: Read-only access", "info");
    } else if (error.message.includes('ADMIN')) {
      // Show "Permission denied" notification
      showToast("You need ADMIN role", "error");
    }
    throw new Error(error.message);
  }
  
  return response.json();
}
```

---

## Testing Demo Mode

### Unit Test Example

```java
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
class InventoryDemoModeTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    @TestPropertySource(properties = "app.demo-readonly=true")
    void testDemoModeBlocksCreate() {
        // Given: Demo mode enabled
        InventoryItemRequest request = new InventoryItemRequest();
        request.setItemName("Test Item");
        request.setQuantity(100);

        // When: Try to POST
        ResponseEntity<ErrorResponse> response = restTemplate.postForEntity(
            "/api/inventory",
            request,
            ErrorResponse.class
        );

        // Then: 403 Forbidden
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody().getMessage()).contains("Demo Mode");
    }

    @Test
    @TestPropertySource(properties = "app.demo-readonly=true")
    void testDemoModeAllowsRead() {
        // When: GET request
        ResponseEntity<List<InventoryItemDto>> response = restTemplate.getForEntity(
            "/api/inventory",
            new ParameterizedTypeReference<List<InventoryItemDto>>() {}
        );

        // Then: 200 OK
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotEmpty();
    }

    @Test
    @TestPropertySource(properties = "app.demo-readonly=false")
    void testNormalModeAllowsCreate() {
        // Given: Demo mode disabled
        String token = obtainAdminToken();
        
        InventoryItemRequest request = new InventoryItemRequest();
        request.setItemName("Test Item");
        request.setQuantity(100);

        // When: POST with admin token
        ResponseEntity<InventoryItemDto> response = restTemplate
            .withBasicAuth("admin", "password")
            .postForEntity("/api/inventory", request, InventoryItemDto.class);

        // Then: 201 Created
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }
}
```

### Integration Test Scenarios

```java
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
class DemoModeIntegrationTest {

    @Test
    void testFullDemoModeFlow() {
        // 1. GET inventory (allowed)
        List<InventoryItem> items = getInventory();
        assertThat(items).isNotEmpty();

        // 2. Try POST (blocked)
        InventoryItemRequest newItem = new InventoryItemRequest();
        ResponseEntity<ErrorResponse> postResponse = createInventory(newItem);
        assertThat(postResponse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        // 3. Try PUT (blocked)
        ResponseEntity<ErrorResponse> putResponse = updateInventory(items.get(0).getId(), newItem);
        assertThat(putResponse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        // 4. Try DELETE (blocked)
        ResponseEntity<ErrorResponse> deleteResponse = deleteInventory(items.get(0).getId());
        assertThat(deleteResponse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }
}
```

---

## Security Considerations for Demo Mode

### 1. Data Exposure

**Risk:** Demo mode shows all inventory data publicly

**Mitigation:**
```java
// Option A: Mask sensitive data
@GetMapping("/api/inventory")
public ResponseEntity<List<InventoryItemDto>> listInventory() {
    List<InventoryItem> items = inventoryService.getAll();
    return ResponseEntity.ok(
        items.stream()
            .map(item -> {
                InventoryItemDto dto = mapper.toDto(item);
                if (demoReadonly) {
                    dto.setCost(0);  // Hide cost in demo
                    dto.setSupplier(null);  // Hide supplier
                }
                return dto;
            })
            .collect(Collectors.toList())
    );
}

// Option B: Separate demo dataset
@GetMapping("/api/demo-inventory")
public ResponseEntity<List<InventoryItemDto>> listDemoInventory() {
    // Return only public demo items (pre-selected subset)
    return ResponseEntity.ok(demoInventoryService.getPublicItems());
}
```

### 2. Rate Limiting

**Risk:** Demo instance could be abused for traffic

**Mitigation:**
```yaml
# application.yml
spring:
  data:
    redis:
      timeout: 60000
server:
  servlet:
    session:
      timeout: 30m  # Shorter session in demo

# Rate limiting (custom)
app:
  rate-limit:
    enabled: true
    demo-only: true  # Rate limit only in demo mode
    requests-per-minute: 60
```

### 3. Resource Limits

**Risk:** Demo instance shared with public, high load possible

**Mitigation:**
```toml
# fly.toml
[vm]
  size = "shared-cpu-2x"  # More resources for public demo
  memory = 2048          # 2GB for demo instance

[[metrics]]
  port = 9090
  path = "/metrics"  # Monitor resource usage
```

### 4. Audit Logging

**Risk:** Cannot track modifications (because all writes blocked)

**Benefit:** Simplified logging
```yaml
# Audit logs still created for GET requests
logging:
  level:
    com.inventoryservice.security: DEBUG
```

**Log Entry (Demo Mode):**
```
2024-01-15T10:30:00.123 DEBUG - User: anonymous, IP: 192.168.1.5, Method: GET, Path: /api/inventory, DemoMode: true
2024-01-15T10:30:05.456 DEBUG - User: anonymous, IP: 192.168.1.5, Method: POST, Path: /api/inventory, Status: 403, Reason: Demo Mode
```

---

## Toggling Demo Mode in Production

### Safe Approach

```bash
# 1. Check current value
flyctl secrets get APP_DEMO_READONLY

# 2. Update (triggers rolling restart)
flyctl secrets set APP_DEMO_READONLY=false

# 3. Verify new instances started
flyctl status

# 4. Monitor health
flyctl logs
```

### Gradual Rollout

```bash
# 1. Start with small percentage in demo mode
# Use canary deployment or A/B testing

# 2. Monitor error rates and performance

# 3. If good, enable for all
flyctl secrets set APP_DEMO_READONLY=false
```

---

## Related Documentation

- **[Security Index](./index.html)** - Master security overview
- **[Authorization & RBAC](./authorization-rbac.html)** - Role-based access control
- **[Docker Security](./docker-security.html)** - Container hardening

---

[⬅️ Back to Security Index](./index.html)
