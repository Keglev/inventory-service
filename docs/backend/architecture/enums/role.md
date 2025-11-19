[⬅️ Back to Enums Hub](./index.html)

# Role Enum

## Overview

The `Role` enum defines user authorization roles for access control throughout the application. It works in conjunction with Spring Security's `@PreAuthorize` annotation to enforce role-based access control (RBAC) at the method level.

**Location:** `src/main/java/com/smartsupplypro/inventory/model/Role.java`

**Package:** `com.smartsupplypro.inventory.model`

**Purpose:** Type-safe user role classification for authorization decisions

---

## Enum Definition

```java
public enum Role {
    ADMIN,
    USER;

    public static Role fromString(String value) {
        return Role.valueOf(value.trim().replace(",", ""));
    }
}
```

---

## Role Values

### ADMIN

**Description:** Full system access with administrative privileges

**Capabilities:**
- Create, read, update, delete suppliers
- Create, read, update, delete inventory items
- Manage stock adjustments
- View analytics and reports
- Access configuration settings
- Create and manage other users

**Controllers Using ADMIN:**
```java
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<SupplierDTO> createSupplier(@Valid @RequestBody CreateSupplierDTO dto) {
    return ResponseEntity.status(HttpStatus.CREATED).body(supplierService.create(dto));
}

@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<?> deleteSupplier(@PathVariable String id) {
    supplierService.delete(id);
    return ResponseEntity.noContent().build();
}

@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<InventoryItemDTO> createInventoryItem(@Valid @RequestBody CreateInventoryItemDTO dto) {
    return ResponseEntity.status(HttpStatus.CREATED).body(inventoryService.create(dto));
}
```

**Typical User:** System administrators, inventory managers

---

### USER

**Description:** Limited access, typically for regular users

**Capabilities (Default):**
- Read suppliers, inventory items, stock history
- View analytics (in some systems)
- Cannot create or modify data (in demo mode)
- Cannot delete data
- Cannot access administration features

**Capabilities (Full Access):**
- Create, read, update inventory items
- Create, read stock movements
- View stock history
- View analytics

**Controllers Using USER:**
```java
@PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
public ResponseEntity<Page<SupplierDTO>> searchSuppliers(
    @RequestParam(required = false) String name,
    Pageable pageable) {
    return ResponseEntity.ok(supplierService.search(name, pageable));
}

@PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
public ResponseEntity<StockHistoryDTO> getStockHistory(@PathVariable String itemId) {
    return ResponseEntity.ok(stockHistoryService.getHistory(itemId));
}
```

**Typical User:** Regular employees, warehouse staff, sales team

---

## Database Schema

### Storage

The `Role` enum is persisted as a STRING in the `app_user` table:

```sql
ALTER TABLE app_user ADD COLUMN role VARCHAR(10);
-- Values: 'ADMIN', 'USER'

-- Recommended index for query performance
CREATE INDEX idx_app_user_role ON app_user(role);
```

### Sample Data

```sql
-- Admin user
INSERT INTO app_user (id, email, role, full_name)
VALUES ('1', 'admin@company.com', 'ADMIN', 'System Admin');

-- Regular user
INSERT INTO app_user (id, email, role, full_name)
VALUES ('2', 'user@company.com', 'USER', 'Warehouse Staff');
```

---

## Entity Usage

### AppUser Model

```java
@Entity
@Table(name = "app_user")
public class AppUser {
    
    @Id
    private String id;
    
    @Email
    private String email;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;
    
    private String fullName;
    
    @Temporal(TemporalType.TIMESTAMP)
    private LocalDateTime createdAt;
    
    /**
     * Returns user's role enum.
     */
    public Role getRoleEnum() {
        return role;
    }
    
    /**
     * Returns true if user is administrator.
     */
    public boolean isAdmin() {
        return role == Role.ADMIN;
    }
}
```

---

## Spring Security Integration

### Authorization Annotations

#### @PreAuthorize with Role Check

```java
// Admin only
@PreAuthorize("hasRole('ADMIN')")
public void deleteItem(String id) { ... }

// Admin or User
@PreAuthorize("hasRole('ADMIN') or hasRole('USER')")
public List<ItemDTO> listItems() { ... }

// Authenticated (any role)
@PreAuthorize("isAuthenticated()")
public ItemDTO getItem(String id) { ... }
```

#### Role Hierarchy

Spring Security doesn't have explicit role hierarchy in this application, but conceptually:

```
ADMIN > USER
```

ADMIN users have all capabilities of USER users plus additional privileges.

### SecurityContext Integration

```java
@Service
public class InventoryItemService {
    
    public InventoryItemDTO create(CreateInventoryItemDTO dto) {
        // Get current user's role from SecurityContext
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserDetails userDetails = (UserDetails) auth.getPrincipal();
        
        // Can also get from OAuth2User for OAuth2 authentication
        // Role would be derived from email checking against ADMIN_EMAILS
        
        // Business logic...
        return itemRepository.save(entity);
    }
}
```

---

## DTO Serialization

### Role in AppUserProfileDTO

```java
public record AppUserProfileDTO(
    String email,
    String fullName,
    String role,              // Serialized as string
    String pictureUrl
) {}
```

### API Response Example

**Request:**
```http
GET /api/me
Authorization: Bearer <token>
```

**Response (ADMIN):**
```json
{
  "email": "admin@company.com",
  "fullName": "System Admin",
  "role": "ADMIN",
  "pictureUrl": "https://example.com/admin.jpg"
}
```

**Response (USER):**
```json
{
  "email": "user@company.com",
  "fullName": "Warehouse Staff",
  "role": "USER",
  "pictureUrl": "https://example.com/user.jpg"
}
```

---

## Role Assignment Logic

### OAuth2 Configuration

Roles are assigned based on email during OAuth2 authentication:

```java
@Configuration
@EnableOAuth2Client
public class SecurityConfig {
    
    @Bean
    public UserDetailsService userDetailsService(AppProperties props) {
        return email -> {
            // Check if email is in admin list
            boolean isAdmin = props.getAdminEmails().contains(email);
            
            return new org.springframework.security.core.userdetails.User(
                email,
                "",  // No password for OAuth2
                List.of(new SimpleGrantedAuthority(
                    isAdmin ? "ROLE_ADMIN" : "ROLE_USER"
                ))
            );
        };
    }
}
```

### Environment-Based Assignment

```yaml
# application.yml
app:
  admin-emails:
    - admin@company.com
    - manager@company.com
```

---

## Parsing & Conversion

### fromString() Method

Safely converts a string to Role enum:

```java
public static Role fromString(String value) {
    return Role.valueOf(value.trim().replace(",", ""));
}
```

**Features:**
- Trims whitespace
- Removes commas (handles legacy data)
- Throws `IllegalArgumentException` if invalid

**Usage:**
```java
Role role = Role.fromString("ADMIN");        // ✅ Works
Role role = Role.fromString(" USER ");       // ✅ Works (trimmed)
Role role = Role.fromString("ADMIN,");       // ✅ Works (comma removed)
Role role = Role.fromString("INVALID");      // ❌ Throws exception
```

---

## Testing

### Unit Tests

```java
@Test
void testRoleFromString() {
    // Valid conversions
    assertEquals(Role.ADMIN, Role.fromString("ADMIN"));
    assertEquals(Role.USER, Role.fromString("USER"));
    
    // With whitespace
    assertEquals(Role.ADMIN, Role.fromString("  ADMIN  "));
    
    // With comma
    assertEquals(Role.ADMIN, Role.fromString("ADMIN,"));
    
    // Invalid
    assertThrows(IllegalArgumentException.class,
        () -> Role.fromString("INVALID"));
}

@Test
void testRoleValues() {
    // Verify all role values exist
    Role[] roles = Role.values();
    assertEquals(2, roles.length);
    assertTrue(Arrays.asList(roles).contains(Role.ADMIN));
    assertTrue(Arrays.asList(roles).contains(Role.USER));
}
```

### Integration Tests with Security

```java
@SpringBootTest
class RoleAuthorizationIT {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    @WithMockUser(roles = "ADMIN")
    void testAdminCanDelete() throws Exception {
        mockMvc.perform(delete("/api/suppliers/SUP-001"))
            .andExpect(status().isNoContent());
    }
    
    @Test
    @WithMockUser(roles = "USER")
    void testUserCannotDelete() throws Exception {
        mockMvc.perform(delete("/api/suppliers/SUP-001"))
            .andExpect(status().isForbidden());
    }
    
    @Test
    void testUnauthenticatedCannotAccess() throws Exception {
        mockMvc.perform(get("/api/suppliers"))
            .andExpect(status().isUnauthorized());
    }
}
```

---

## Authorization Matrix

### Endpoint Access by Role

| Endpoint | ADMIN | USER | Authenticated | Notes |
|----------|-------|------|---|-------|
| GET /api/suppliers | ✅ | ✅ | ✅ | Public in demo mode |
| POST /api/suppliers | ✅ | ❌ | - | ADMIN only |
| PUT /api/suppliers/{id} | ✅ | ❌ | - | ADMIN only |
| DELETE /api/suppliers/{id} | ✅ | ❌ | - | ADMIN only |
| GET /api/inventory/items | ✅ | ✅ | ✅ | Public in demo mode |
| POST /api/inventory/items | ✅ | ✅ | - | Authenticated users |
| DELETE /api/inventory/items/{id} | ✅ | ❌ | - | ADMIN only |
| GET /api/stock-history | ✅ | ✅ | ✅ | Audit trail read-only |
| POST /api/analytics | ✅ | ✅ | - | Authenticated users |
| GET /api/me | ✅ | ✅ | - | Current user profile |

---

## Migration Path

### Adding a New Role

To add a new role (e.g., `MANAGER`):

**Step 1: Update Enum**
```java
public enum Role {
    ADMIN,
    USER,
    MANAGER;  // New role
}
```

**Step 2: Update Database Migration**
```sql
-- No schema changes needed (VARCHAR accommodates new value)
-- Existing values remain unchanged
```

**Step 3: Update Authorization Rules**
```java
@PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
public ResponseEntity<AnalyticsDTO> getAnalytics() { ... }
```

**Step 4: Update Role Assignment Logic**
```yaml
app:
  admin-emails:
    - admin@company.com
  manager-emails:  # New configuration
    - manager@company.com
```

---

## Best Practices

✅ **DO:**
- Use enum values in `@PreAuthorize` annotations
- Check roles in service layer for business logic
- Store roles as STRING in database for clarity
- Document which roles can access each endpoint
- Use meaningful role names (ADMIN, MANAGER, USER)
- Implement role assignment logic in one place

❌ **DON'T:**
- Use string literals instead of enum values
- Check roles multiple times in same method
- Store roles as integers (ordinals)
- Mix role logic across multiple services
- Forget to secure sensitive endpoints
- Use too many granular roles (RBAC vs ABAC tradeoff)

---

## Related Documentation

**Architecture:**
- [Enums Hub](./index.html) - Overview of all enums
- [Security Architecture](../security.html) - Authentication and authorization details
- [Data Models & Entities](../model.html) - Entity definitions

**Code Examples:**
- [AppUser Entity](../../model/AppUser.java)
- [AuthController](../../controller/AuthController.java)
- [SecurityConfig](../../config/SecurityConfig.java)

---

[⬅️ Back to Enums Hub](./index.html)
