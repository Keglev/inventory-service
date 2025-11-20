[⬅️ Back to Security Index](./index.html)

# Authorization & RBAC

## Overview

Smart Supply Pro implements **Role-Based Access Control (RBAC)** with two roles: ADMIN and USER. Authorization is enforced at multiple levels:

1. **HTTP request matching** - URL patterns and HTTP methods
2. **Method-level security** - `@PreAuthorize` annotations
3. **Database constraints** - Audit fields for user tracking

---

## Role Definitions

### ADMIN Role

**Capabilities:**
- Full CRUD operations on suppliers and inventory
- Access to analytics dashboards
- User management (future)
- Admin console access

**API Permissions:**
```
GET    /api/**          → ALLOWED
POST   /api/**          → ALLOWED
PUT    /api/**          → ALLOWED
PATCH  /api/**          → ALLOWED
DELETE /api/**          → ALLOWED
```

### USER Role

**Capabilities:**
- Read all inventory and supplier data
- Limited write operations (depends on endpoint)
- View analytics (read-only)

**API Permissions:**
```
GET    /api/inventory/**  → ALLOWED
GET    /api/suppliers/**  → ALLOWED
GET    /api/analytics/**  → ALLOWED
POST   /api/**            → DENIED (403 Forbidden)
PUT    /api/**            → DENIED (403 Forbidden)
DELETE /api/**            → DENIED (403 Forbidden)
```

---

## Role Assignment

### During OAuth2 Login

```java
// CustomOAuth2UserService.loadUser()
String email = oAuthUser.getAttribute("email");
Set<String> adminEmails = readAdminAllowlist();  // from APP_ADMIN_EMAILS

boolean isAdmin = adminEmails.contains(email.toLowerCase());
Role role = isAdmin ? Role.ADMIN : Role.USER;

AppUser user = new AppUser();
user.setRole(role);
userRepository.save(user);
```

### Configuration via Environment

**APP_ADMIN_EMAILS** - Comma-separated list of admin email addresses

```bash
export APP_ADMIN_EMAILS="alice@company.com, bob@company.com, charlie@company.de"
```

**Case-Insensitive Matching:**
```java
adminEmails.contains(email.toLowerCase())  // "Alice@Company.com" matches "alice@company.com"
```

### Role Healing on Each Login

On every login, the system dynamically updates user role if the allow-list changed:

```java
// CustomOAuth2UserService.loadUser()
AppUser existingUser = userRepository.findByEmail(email).get();
Role desired = isAdmin ? Role.ADMIN : Role.USER;

if (existingUser.getRole() != desired) {
    existingUser.setRole(desired);      // Update if changed
    userRepository.save(existingUser);
}
```

**Benefits:**
- ✅ Removing email from allow-list immediately revokes ADMIN on next login
- ✅ Adding email to allow-list immediately grants ADMIN on next login
- ✅ No manual user management needed

---

## Authorization Rules

### HTTP Request Authorization

**SecurityAuthorizationHelper configures authorization:**

```java
public void configureAuthorization(AuthorizeHttpRequestsConfigurer auth, boolean demoReadonly) {
    
    // 1. Public endpoints (no authentication required)
    auth.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll();
    auth.requestMatchers("/logout", "/error", "/login/**").permitAll();
    auth.requestMatchers("/actuator/**", "/health/**").permitAll();
    
    // 2. Demo mode: allow read-only without login
    if (demoReadonly) {
        auth.requestMatchers(HttpMethod.GET, "/api/inventory/**").permitAll();
        auth.requestMatchers(HttpMethod.GET, "/api/suppliers/**").permitAll();
        auth.requestMatchers(HttpMethod.GET, "/api/analytics/**").permitAll();
    }
    
    // 3. Authenticated users may READ
    auth.requestMatchers(HttpMethod.GET, "/api/inventory/**").authenticated();
    auth.requestMatchers(HttpMethod.GET, "/api/suppliers/**").authenticated();
    auth.requestMatchers(HttpMethod.GET, "/api/analytics/**").authenticated();
    
    // 4. Admin-only: WRITE operations
    auth.requestMatchers(HttpMethod.POST, "/api/inventory/**").hasRole("ADMIN");
    auth.requestMatchers(HttpMethod.PUT, "/api/inventory/**").hasRole("ADMIN");
    auth.requestMatchers(HttpMethod.PATCH, "/api/inventory/**").hasRole("ADMIN");
    auth.requestMatchers(HttpMethod.DELETE, "/api/inventory/**").hasRole("ADMIN");
    
    auth.requestMatchers(HttpMethod.POST, "/api/suppliers/**").hasRole("ADMIN");
    auth.requestMatchers(HttpMethod.PUT, "/api/suppliers/**").hasRole("ADMIN");
    auth.requestMatchers(HttpMethod.PATCH, "/api/suppliers/**").hasRole("ADMIN");
    auth.requestMatchers(HttpMethod.DELETE, "/api/suppliers/**").hasRole("ADMIN");
    
    // 5. Admin console
    auth.requestMatchers("/api/admin/**").hasRole("ADMIN");
    
    // 6. Everything else requires authentication
    auth.anyRequest().authenticated();
}
```

### Method-Level Security

**Spring Security @PreAuthorize annotations:**

```java
@RestController
@RequestMapping("/api/suppliers")
public class SupplierController {
    
    // Public read in demo mode, authenticated read otherwise
    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public List<SupplierDTO> getAllSuppliers() { ... }
    
    // Admin-only write
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public SupplierDTO createSupplier(@RequestBody CreateSupplierDTO dto) { ... }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public SupplierDTO updateSupplier(@PathVariable String id,
                                       @RequestBody UpdateSupplierDTO dto) { ... }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteSupplier(@PathVariable String id) { ... }
}
```

**Demo Mode with SpEL:**

```java
@GetMapping
@PreAuthorize("@appProperties.demoReadonly or hasRole('ADMIN')")
public List<InventoryItemDTO> getAllItems() { ... }
```

This allows read access if either:
- Demo mode enabled (`@appProperties.demoReadonly == true`)
- User has ADMIN role

---

## Enforcement Mechanisms

### 1. Filter-Based Authorization

`SecurityFilterChain` checks all requests:

```
Request → API Detection Filter → Authorization Check → Handler
                                  ↓
                         Check HTTP method + role
                                  ↓
                    ALLOW / 403 Forbidden / 401 Unauthorized
```

### 2. Method-Level Security

`@PreAuthorize` interceptor checks before method execution:

```java
@Service
public class SupplierService {
    
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteSupplier(String id) {
        // Throws AccessDeniedException if role check fails
        supplier = repository.findById(id).orElseThrow();
        repository.delete(supplier);
    }
}
```

### 3. Exception Handling

**ExceptionHandler for AccessDeniedException:**

```java
@ExceptionHandler(AccessDeniedException.class)
public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException e) {
    return ResponseEntity
        .status(HttpStatus.FORBIDDEN)
        .body(new ErrorResponse("Access denied", "You lack permissions for this operation"));
}
```

---

## Example Authorization Flows

### Admin Creates New Supplier

```
1. User: alice@company.com (in APP_ADMIN_EMAILS)
2. LOGIN: OAuth2 → Role = ADMIN
3. REQUEST: POST /api/suppliers with admin token
4. AUTHORIZATION CHECK:
   - Path matches: /api/suppliers/**
   - Method is POST: requires hasRole('ADMIN')
   - User role: ADMIN ✅
5. EXECUTE: SupplierService.createSupplier()
```

### Regular User Tries to Delete Item

```
1. User: john@company.com (NOT in APP_ADMIN_EMAILS)
2. LOGIN: OAuth2 → Role = USER
3. REQUEST: DELETE /api/inventory/items/123
4. AUTHORIZATION CHECK:
   - Path matches: /api/inventory/**
   - Method is DELETE: requires hasRole('ADMIN')
   - User role: USER ❌
5. RESPONSE: 403 Forbidden
   {
     "error": "Access Denied",
     "message": "You lack permissions to delete inventory items"
   }
```

### User Reads Data in Demo Mode

```
1. User: anonymous (no login)
2. REQUEST: GET /api/suppliers (no token)
3. AUTHORIZATION CHECK:
   - APP_DEMO_READONLY = true
   - Method is GET
   - Demo allows GET without authentication ✅
4. EXECUTE: SupplierService.getAllSuppliers()
5. RESPONSE: [List of suppliers]
```

---

## Audit Trail

All write operations capture user identity:

```java
@Entity
public class InventoryItem {
    // ... other fields ...
    
    @Column(name = "created_by", nullable = false)
    private String createdBy;  // User email from SecurityContext
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @Column(name = "updated_by")
    private String updatedBy;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
```

**Capturing User in Service:**

```java
@Service
public class SupplierService {
    
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public SupplierDTO createSupplier(CreateSupplierDTO dto) {
        String currentUser = SecurityContextHolder
            .getContext()
            .getAuthentication()
            .getName();  // Returns email
        
        Supplier supplier = new Supplier();
        supplier.setName(dto.getName());
        supplier.setCreatedBy(currentUser);
        supplier.setCreatedAt(LocalDateTime.now());
        
        return repository.save(supplier);
    }
}
```

---

## Error Responses

### 401 Unauthorized (Not Authenticated)

**Cause:** User not logged in

**API Response (JSON):**
```json
{
  "message": "Unauthorized"
}
```

**Browser Response:** Redirect to `/login`

### 403 Forbidden (Authenticated but Denied)

**Cause:** User logged in but lacks required role

**Response:**
```json
{
  "error": "Access Denied",
  "message": "You lack the required role: ADMIN"
}
```

### 400 Bad Request

**Cause:** Invalid request syntax or missing parameters

**Response:**
```json
{
  "error": "Bad Request",
  "message": "Missing required parameter: supplierId"
}
```

---

## Entry Point Handling

Different responses for API vs browser clients:

### API Requests (Accept: application/json)

```
Request: GET /api/suppliers
Headers: Accept: application/json

Unauthorized Response:
  Status: 401
  Content-Type: application/json
  Body: {"message": "Unauthorized"}
```

### Browser Requests

```
Request: GET /api/suppliers
Accept: text/html

Unauthorized Response:
  Status: 302 Redirect
  Location: https://inventory.example.com/login
```

---

## Best Practices

| Practice | Implementation | Benefit |
|----------|---|---|
| **Default Deny** | All endpoints require authentication | Secure by default |
| **Specific Roles** | Separate ADMIN/USER for granularity | Principle of least privilege |
| **Role Healing** | Dynamic role update on login | Changes take effect immediately |
| **Audit Trail** | createdBy/updatedBy fields | Full accountability |
| **Entry Points** | Different responses (API vs browser) | Better UX for all clients |
| **Method-Level** | @PreAuthorize on service methods | Fail-safe at service layer |

---

## Related Documentation

- **[Security Index](./index.html)** - Master security overview
- **[OAuth2 Authentication](./oauth2-authentication.html)** - Authentication flows
- **[Demo Mode](./demo-mode.html)** - Public access configuration

---

[⬅️ Back to Security Index](./index.html)
