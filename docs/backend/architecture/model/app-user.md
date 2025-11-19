[⬅️ Back to Models Index](./index.html)

# AppUser Entity

## Entity Definition

```java
@Entity
@Table(name = "USERS_APP")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppUser {
    
    @Id
    private String id;
    
    @Column(name = "EMAIL", nullable = false, unique = true)
    private String email;
    
    @Column(name = "NAME")
    private String name;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "ROLE", nullable = false, length = 50)
    private Role role;
    
    @Column(name = "CREATED_AT", nullable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;
}
```

## Purpose

AppUser represents **OAuth2-authenticated users** in the system with:
- OAuth2 identity (email from Google/Azure/GitHub)
- Role-based access control (ADMIN or USER)
- Account creation timestamp
- No password management (delegated to OAuth provider)

**Domain Context:**
Users access the inventory system via OAuth2 authentication (no passwords stored). Each user has:
- Read-only access to inventory (default USER role)
- Optional admin capabilities (ADMIN role for configuration)
- Audit trail through CREATED_BY fields in other entities

---

## Database Schema

### Table: USERS_APP

```sql
CREATE TABLE USERS_APP (
    ID VARCHAR2(36) PRIMARY KEY,
    EMAIL VARCHAR2(255) NOT NULL UNIQUE,
    NAME VARCHAR2(255),
    ROLE VARCHAR2(50) NOT NULL,
    CREATED_AT TIMESTAMP NOT NULL
);

CREATE INDEX IX_USER_EMAIL ON USERS_APP(EMAIL);
```

### Field Reference

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| `id` | VARCHAR2(36) | PRIMARY KEY | UUID identifier |
| `email` | VARCHAR2(255) | NOT NULL, UNIQUE | OAuth2 email (login) |
| `name` | VARCHAR2(255) | NULL | Full name from OAuth |
| `role` | VARCHAR2(50) | NOT NULL | Role enum (ADMIN/USER) |
| `createdAt` | TIMESTAMP | NOT NULL | Registration timestamp |

---

## Field Details

### id
**Type:** String (UUID)

**Database:** Primary Key

**Characteristics:**
- Universally unique identifier
- 36 characters (UUID format)
- Generated at user creation

**Example:**
```
550e8400-e29b-41d4-a716-446655440000
```

**Auto-Generation:**
```java
@PrePersist
public void prePersist() {
    if (this.id == null) {
        this.id = UUID.randomUUID().toString();
    }
}
```

**Usage:**
```java
// Internal identifier (rarely used in APIs)
Optional<AppUser> user = userRepository.findById(userId);
```

---

### email
**Type:** String

**Database Constraints:**
- NOT NULL
- UNIQUE
- Max 255 characters

**Purpose:**
OAuth2 identity - the user's email from their OAuth provider (Google, Azure, GitHub, etc.)

**Examples:**
```
"john.doe@company.com"
"jane.smith@example.org"
"admin@myorg.io"
```

**Why Used as Identity:**
```
OAuth2 Flow:
  1. User clicks "Sign in with Google"
  2. Google returns: email, name, picture, profile_url
  3. System creates/updates user with email as unique key
  4. Email becomes login ID and internal reference
  
Benefits:
  - No password storage needed
  - Email is always unique (guaranteed by OAuth provider)
  - Email is user's known identifier
  - Can be used for notifications and communication
```

**Uniqueness Enforcement:**
```java
// Before allowing login, find existing user
@Transactional
public AppUser findOrCreateUser(String email, String name) {
    Optional<AppUser> existing = userRepository.findByEmail(email);
    
    if (existing.isPresent()) {
        // Update name if provided
        AppUser user = existing.get();
        if (name != null && !name.equals(user.getName())) {
            user.setName(name);
            userRepository.save(user);
        }
        return user;
    }
    
    // Create new user
    AppUser newUser = AppUser.builder()
        .id(UUID.randomUUID().toString())
        .email(email)
        .name(name)
        .role(Role.USER)  // Default role
        .createdAt(LocalDateTime.now())
        .build();
    
    return userRepository.save(newUser);
}
```

**Query by Email:**
```java
// Find user by email (fastest)
AppUser user = userRepository.findByEmail("john@company.com");

// Check if email exists
boolean exists = userRepository.existsByEmail("john@company.com");

// Find all admin emails (for permission checks)
List<AppUser> admins = userRepository.findByRole(Role.ADMIN);
```

---

### name
**Type:** String

**Database Constraints:**
- NULL allowed
- Max 255 characters

**Purpose:**
User's full name from OAuth2 provider

**Examples:**
```
"John Doe"
"Jane Smith"
"Admin User"
```

**Source:**
Comes from OAuth2 provider (Google, Azure, GitHub):

```java
// When creating user from OAuth2 response
GoogleAuthProvider oauth = new GoogleAuthProvider(request.getIdToken());

AppUser user = AppUser.builder()
    .email(oauth.getEmail())      // user@company.com
    .name(oauth.getName())        // "John Doe" (from Google profile)
    .role(Role.USER)
    .createdAt(LocalDateTime.now())
    .build();
```

**Update from OAuth:**
```java
// Update name if OAuth provider has newer info
@Transactional
public void updateFromOAuth(String email, String newName) {
    AppUser user = userRepository.findByEmail(email);
    if (user != null && !newName.equals(user.getName())) {
        user.setName(newName);
        userRepository.save(user);
    }
}
```

**Display Usage:**
```java
// Show user's name in UI
String greeting = "Welcome, " + user.getName() + "!";

// Audit trail display
System.out.println("Created by: " + user.getName() + 
                   " (" + user.getEmail() + ")");
```

**NULL Handling:**
Some OAuth providers may not return full name:

```java
String displayName = user.getName() != null 
    ? user.getName() 
    : user.getEmail().split("@")[0];  // Fallback to email prefix
```

---

### role
**Type:** Enum (Role)

**Database Constraints:**
- NOT NULL
- VARCHAR2(50)
- Stored as enum name

**Purpose:**
Role-based access control (RBAC)

**Enum Values:**
```java
public enum Role {
    ADMIN,  // Full access to all operations
    USER    // Read access to inventory (default)
}
```

**Database Storage:**
```
Role Value   → Database String
ADMIN        → "ADMIN"
USER         → "USER"
```

**JPA Mapping:**
```java
@Enumerated(EnumType.STRING)  // Store enum name
@Column(name = "ROLE", nullable = false, length = 50)
private Role role;
```

**Default Assignment:**
```java
// New users default to USER role
AppUser newUser = AppUser.builder()
    .email(email)
    .name(name)
    .role(Role.USER)  // ← Always default to USER
    .createdAt(LocalDateTime.now())
    .build();
```

**Admin Assignment:**
```java
// Only admins can be assigned via configuration
private static final Set<String> ADMIN_EMAILS = Set.of(
    "admin@company.com",
    "owner@company.com"
);

@Transactional
public AppUser findOrCreateUser(String email, String name) {
    AppUser user = userRepository.findByEmail(email)
        .orElse(createNewUser(email, name));
    
    // Check if should be admin
    if (ADMIN_EMAILS.contains(email) && !user.getRole().equals(Role.ADMIN)) {
        user.setRole(Role.ADMIN);
        userRepository.save(user);
    }
    
    return user;
}
```

**Permission Checks:**
```java
// Protect admin operations
@PreAuthorize("hasRole('ADMIN')")
@PostMapping("/system/reset")
public ResponseEntity<?> resetSystem() {
    // Only accessible to ADMIN users
    systemService.reset();
    return ResponseEntity.ok().build();
}

// Check role in service
if (currentUser.getRole() != Role.ADMIN) {
    throw new UnauthorizedException("Admin privileges required");
}

// Conditional logic based on role
if (user.getRole() == Role.ADMIN) {
    // Show admin options
}
```

---

### createdAt
**Type:** LocalDateTime

**Database Constraints:**
- NOT NULL
- Set automatically

**Purpose:**
Records when user registered/first logged in

**Auto-Population:**
```java
@CreationTimestamp
private LocalDateTime createdAt;  // Hibernate sets automatically
```

**Example:**
```
2024-01-15 14:30:45.123456
```

**Usage:**
```java
// User registration date
System.out.println("Registered: " + user.getCreatedAt());

// Find recently joined users
LocalDateTime weekAgo = LocalDateTime.now().minusWeeks(1);
List<AppUser> newUsers = userRepository.findByCreatedAtAfter(weekAgo);

// Determine user tenure
Duration tenure = Duration.between(user.getCreatedAt(), LocalDateTime.now());
long daysAsMember = tenure.toDays();
```

**Immutability:**
```java
// Cannot modify registration date (set once at creation)
user.setCreatedAt(LocalDateTime.now().minusDays(365));  // Ignored
userRepository.save(user);
```

---

## Relationships

### Implicit: AppUser ← Other Entities

**Type:** One-to-Many (implied, not database-enforced)

**References:**
Every entity has audit fields referencing AppUser:

```java
// In Supplier
@Column(name = "CREATED_BY", nullable = false)
private String createdBy;  // References AppUser.email

// In InventoryItem
@Column(name = "CREATED_BY", nullable = false)
private String createdBy;  // References AppUser.email

// In StockHistory
@Column(name = "CREATED_BY", nullable = false)
private String createdBy;  // References AppUser.email
```

**Why Not Foreign Keys:**
- Allow system-generated records (createdBy = "system")
- Flexible for service accounts and batch processes
- User deletion doesn't cascade to delete their records
- Preserves audit trail even if user is removed

**Semantic Relationship:**
```
AppUser
  │
  ├─ (implicitly creates) → Supplier (via CREATED_BY)
  ├─ (implicitly creates) → InventoryItem (via CREATED_BY)
  └─ (implicitly creates) → StockHistory (via CREATED_BY)
```

**Query via Audit Trail:**
```java
// Find all items created by a user
List<InventoryItem> userItems = 
    itemRepository.findByCreatedByOrderByCreatedAtDesc("john@company.com");

// Find all changes by a user
List<StockHistory> userChanges = 
    historyRepository.findByCreatedByOrderByTimestampDesc("john@company.com");

// Attribution
String creator = item.getCreatedBy();  // Returns email
AppUser user = userRepository.findByEmail(creator);
System.out.println("Created by: " + user.getName());
```

---

## Lifecycle

### OAuth2 Login Flow

```
1. User accesses application
   → Not authenticated yet
   
2. User clicks "Sign in with Google/Azure/GitHub"
   → Redirected to OAuth provider
   
3. User authenticates with provider
   → Provider returns ID token with email, name, profile
   
4. Application receives OAuth response
   → Extracts email from ID token
   
5. System calls findOrCreateUser(email, name)
   → If user exists: update and return
   → If new: create with default USER role
   
6. Create Spring Security session
   → User is now authenticated
   
7. User can access application
```

### Example: OAuth2 Login Handler

```java
@Service
public class OAuth2UserService {
    
    @Autowired
    private AppUserRepository userRepository;
    
    @Autowired
    private RoleConfigService roleConfig;
    
    @Transactional
    public AppUser findOrCreateUser(OAuth2User oAuth2User) {
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        
        // Find existing user
        Optional<AppUser> existing = userRepository.findByEmail(email);
        
        if (existing.isPresent()) {
            // Update name if changed
            AppUser user = existing.get();
            if (name != null && !name.equals(user.getName())) {
                user.setName(name);
                userRepository.save(user);
            }
            return user;
        }
        
        // Create new user
        AppUser newUser = AppUser.builder()
            .id(UUID.randomUUID().toString())
            .email(email)
            .name(name)
            .role(determineRole(email))  // Check if admin
            .createdAt(LocalDateTime.now())
            .build();
        
        return userRepository.save(newUser);
    }
    
    private Role determineRole(String email) {
        if (roleConfig.isAdminEmail(email)) {
            return Role.ADMIN;
        }
        return Role.USER;
    }
}
```

### OAuth2 Configuration (Spring Security)

```java
@Configuration
@EnableWebSecurity
public class OAuth2SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .oauth2Login()
                .userInfoEndpoint()
                    .userService(oauth2UserService())
                .and()
                .defaultSuccessUrl("/dashboard")
            .and()
            .authorizeRequests()
                .antMatchers("/admin/**").hasRole("ADMIN")
                .antMatchers("/api/**").hasAnyRole("ADMIN", "USER")
                .anyRequest().authenticated();
        
        return http.build();
    }
    
    @Bean
    public OAuth2UserService<OAuthUserRequest, OAuth2User> oauth2UserService() {
        // Custom service that calls findOrCreateUser
        return request -> {
            OAuth2User oAuth2User = defaultUserService.loadUser(request);
            return userService.findOrCreateUser(oAuth2User);
        };
    }
}
```

---

## Usage Examples

### 1. Get Current User

```java
// In controller
@GetMapping("/me")
public ResponseEntity<AppUserResponse> getCurrentUser(@AuthenticationPrincipal OAuth2User principal) {
    String email = principal.getAttribute("email");
    AppUser user = userRepository.findByEmail(email).get();
    return ResponseEntity.ok(mapToResponse(user));
}

// In service (get from Spring Security)
@Autowired
private SecurityContextHolder securityContext;

public String getCurrentUserEmail() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    return auth.getName();  // Returns email
}
```

### 2. Check User Permissions

```java
// Using @PreAuthorize in controller
@PreAuthorize("hasRole('ADMIN')")
@PostMapping("/system/settings")
public ResponseEntity<?> updateSystemSettings(@RequestBody SystemSettings settings) {
    settingsService.update(settings);
    return ResponseEntity.ok().build();
}

// In service layer
public void deleteSupplier(String supplierId, AppUser currentUser) {
    if (currentUser.getRole() != Role.ADMIN) {
        throw new UnauthorizedException("Only admins can delete suppliers");
    }
    supplierRepository.deleteById(supplierId);
}

// Query check
AppUser user = userRepository.findByEmail(email);
if (user.getRole() == Role.ADMIN) {
    // Grant admin features
}
```

### 3. Find Users by Role

```java
// Find all admins
List<AppUser> admins = userRepository.findByRole(Role.ADMIN);

// Find all regular users
List<AppUser> regularUsers = userRepository.findByRole(Role.USER);

// Count users
long totalUsers = userRepository.count();
long adminCount = userRepository.countByRole(Role.ADMIN);
```

### 4. Audit Trail with User Info

```java
@Transactional(readOnly = true)
public AuditLog getAuditTrail(String itemId) {
    InventoryItem item = itemRepository.findById(itemId).get();
    
    String creator = item.getCreatedBy();
    AppUser creatingUser = userRepository.findByEmail(creator);
    
    List<StockHistory> history = historyRepository
        .findByItemIdOrderByTimestampDesc(itemId);
    
    return AuditLog.builder()
        .itemName(item.getName())
        .createdBy(creatingUser != null ? creatingUser.getName() : creator)
        .createdAt(item.getCreatedAt())
        .recentChanges(history.stream()
            .map(sh -> {
                AppUser changer = userRepository.findByEmail(sh.getCreatedBy());
                return ChangeRecord.builder()
                    .reason(sh.getReason())
                    .quantityChange(sh.getChange())
                    .timestamp(sh.getTimestamp())
                    .changedBy(changer != null ? changer.getName() : sh.getCreatedBy())
                    .build();
            })
            .collect(toList()))
        .build();
}
```

### 5. User Activity Report

```java
@Transactional(readOnly = true)
public UserActivityReport getUserActivity(String email, LocalDateTime since) {
    AppUser user = userRepository.findByEmail(email).get();
    
    List<InventoryItem> createdItems = itemRepository
        .findByCreatedByAndCreatedAtAfter(email, since);
    
    List<StockHistory> changes = historyRepository
        .findByCreatedByAndTimestampAfter(email, since);
    
    BigDecimal totalValueChanged = changes.stream()
        .filter(sh -> sh.getPriceAtChange() != null)
        .map(sh -> sh.getPriceAtChange()
            .multiply(new BigDecimal(sh.getChange())))
        .reduce(BigDecimal.ZERO, BigDecimal::add);
    
    return UserActivityReport.builder()
        .userName(user.getName())
        .userEmail(user.getEmail())
        .userRole(user.getRole())
        .itemsCreated(createdItems.size())
        .stockChanges(changes.size())
        .totalValueAffected(totalValueChanged)
        .period(since)
        .build();
}
```

---

## Testing

### Unit Test: Creation

```java
@DataJpaTest
class AppUserRepositoryTest {
    
    @Autowired
    private AppUserRepository repository;
    
    @Test
    void testUserCreation() {
        AppUser user = AppUser.builder()
            .email("test@company.com")
            .name("Test User")
            .role(Role.USER)
            .createdAt(LocalDateTime.now())
            .build();
        
        AppUser saved = repository.save(user);
        
        assertNotNull(saved.getId());
        assertEquals("test@company.com", saved.getEmail());
        assertEquals(Role.USER, saved.getRole());
    }
    
    @Test
    void testEmailUniqueness() {
        AppUser user1 = AppUser.builder()
            .email("duplicate@test.com")
            .role(Role.USER)
            .createdAt(LocalDateTime.now())
            .build();
        
        repository.save(user1);
        
        AppUser user2 = AppUser.builder()
            .email("duplicate@test.com")  // Duplicate
            .role(Role.USER)
            .createdAt(LocalDateTime.now())
            .build();
        
        assertThrows(DataIntegrityViolationException.class,
            () -> repository.save(user2));
    }
    
    @Test
    void testFindByEmail() {
        AppUser user = AppUser.builder()
            .email("findme@test.com")
            .name("Find Me")
            .role(Role.USER)
            .createdAt(LocalDateTime.now())
            .build();
        
        repository.save(user);
        
        Optional<AppUser> found = repository.findByEmail("findme@test.com");
        
        assertTrue(found.isPresent());
        assertEquals("Find Me", found.get().getName());
    }
}
```

### Integration Test: OAuth2 Flow

```java
@SpringBootTest
@Transactional
class OAuth2UserServiceIT {
    
    @Autowired
    private OAuth2UserService oAuth2Service;
    
    @Autowired
    private AppUserRepository userRepository;
    
    @Test
    void testCreateNewUserFromOAuth() {
        OAuth2User oAuth2User = mock(OAuth2User.class);
        when(oAuth2User.getAttribute("email")).thenReturn("new@company.com");
        when(oAuth2User.getAttribute("name")).thenReturn("New User");
        
        AppUser created = oAuth2Service.findOrCreateUser(oAuth2User);
        
        assertNotNull(created.getId());
        assertEquals("new@company.com", created.getEmail());
        assertEquals(Role.USER, created.getRole());
        
        // Verify persisted
        AppUser persisted = userRepository.findByEmail("new@company.com").get();
        assertEquals("New User", persisted.getName());
    }
    
    @Test
    void testFindExistingUser() {
        // Setup existing user
        AppUser existing = AppUser.builder()
            .email("existing@company.com")
            .name("Existing User")
            .role(Role.USER)
            .createdAt(LocalDateTime.now())
            .build();
        userRepository.save(existing);
        
        // OAuth2 login with same email
        OAuth2User oAuth2User = mock(OAuth2User.class);
        when(oAuth2User.getAttribute("email")).thenReturn("existing@company.com");
        when(oAuth2User.getAttribute("name")).thenReturn("Updated Name");
        
        AppUser found = oAuth2Service.findOrCreateUser(oAuth2User);
        
        // Should find existing and optionally update
        assertEquals("existing@company.com", found.getEmail());
        // Name updated if provided
        assertEquals("Updated Name", found.getName());
    }
}
```

---

## Security Considerations

### 1. OAuth2 Token Verification

Never trust email without OAuth2 verification:

```java
// ❌ DON'T: Trust user input
public AppUser getUser(String email) {
    return userRepository.findByEmail(email).get();  // Unsafe
}

// ✅ DO: Get email from verified OAuth2 token
@GetMapping("/me")
public AppUserResponse getCurrentUser(@AuthenticationPrincipal OAuth2User principal) {
    String email = principal.getAttribute("email");  // From verified token
    AppUser user = userRepository.findByEmail(email).get();
    return mapToResponse(user);
}
```

### 2. Admin Role Assignment

Strictly control admin role assignment:

```java
// In configuration
private static final Set<String> ADMIN_EMAILS = Set.of(
    "admin@company.com",
    "owner@company.com"
    // Hard-coded list of trusted admins
);

// ❌ DON'T: Allow role parameter from request
@PostMapping("/users")
public ResponseEntity<?> createUser(@RequestBody UserRequest request) {
    AppUser user = AppUser.builder()
        .email(request.getEmail())
        .role(request.getRole())  // ❌ User can set their own role!
        .build();
}

// ✅ DO: Determine role server-side
@PostMapping("/users")
public ResponseEntity<?> createUser(@RequestBody UserRequest request) {
    Role role = ADMIN_EMAILS.contains(request.getEmail()) 
        ? Role.ADMIN 
        : Role.USER;
    
    AppUser user = AppUser.builder()
        .email(request.getEmail())
        .role(role)  // ✅ Controlled server-side
        .build();
}
```

### 3. Authorization Checks

Always verify permissions before sensitive operations:

```java
// ❌ DON'T: Skip checks
@DeleteMapping("/suppliers/{id}")
public ResponseEntity<?> deleteSupplier(@PathVariable String id) {
    supplierRepository.deleteById(id);  // No permission check!
    return ResponseEntity.ok().build();
}

// ✅ DO: Check authorization
@DeleteMapping("/suppliers/{id}")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<?> deleteSupplier(@PathVariable String id) {
    supplierRepository.deleteById(id);
    return ResponseEntity.ok().build();
}

// ✅ DO: Runtime checks in service
if (currentUser.getRole() != Role.ADMIN) {
    throw new UnauthorizedException("Admin privileges required");
}
```

---

## API Contract

### DTO: AppUserResponse

```java
public class AppUserResponse {
    private String id;
    private String email;
    private String name;
    private Role role;
    private LocalDateTime createdAt;
}
```

### Never Expose:
- Internal user IDs (use email as identifier)
- Role in list endpoints (for privacy)
- Creation timestamp (unless needed)

---

## Related Documentation

**Other Entities:**
- [Supplier Entity](./supplier.html) - createdBy audit trail
- [InventoryItem Entity](./inventory-item.html) - createdBy audit trail
- [StockHistory Entity](./stock-history.html) - createdBy audit trail

**Code References:**
- [AppUser.java](../../../src/main/java/com/example/model/AppUser.java)
- [AppUserRepository.java](../../../src/main/java/com/example/repository/AppUserRepository.java)
- [OAuth2UserService.java](../../../src/main/java/com/example/security/OAuth2UserService.java)

**Architecture:**
- [Models Index](./index.html) - Overview of all entities
- [Enums Reference](../enums/index.html) - Role enum
- [Security Architecture](../security/overview.html) - OAuth2 & RBAC

---

[⬅️ Back to Models Index](./index.html)
