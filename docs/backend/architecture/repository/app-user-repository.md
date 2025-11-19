[⬅️ Back to Repository Index](./index.html)

# AppUserRepository

## Definition

```java
public interface AppUserRepository extends JpaRepository<AppUser, String> {

    Optional<AppUser> findByEmail(String email);

    @Override
    long count();
}
```

## Purpose

Provides data access for **AppUser** entities with capabilities for:
- CRUD operations via JpaRepository
- User lookup by email (OAuth2 authentication)
- User count retrieval
- Simple account management

---

## Minimal Design Rationale

AppUserRepository is intentionally minimal because:

1. **OAuth2 Integration:** User identity managed by external OAuth2 provider (Google, GitHub, etc.)
2. **Stateless Authentication:** Each request provides JWT token containing user info
3. **Minimal Database State:** Only stores user email and audit fields
4. **No Password Management:** Authentication handled by OAuth2 provider
5. **No Role Management:** Roles derived from identity provider claims

---

## Custom Query Methods

### findByEmail(String email)

**Purpose:** Look up user by email address (OAuth2 user identification)

**Type:** Method-derived JPQL

**Returns:** `Optional<AppUser>`

**Usage:**
```java
Optional<AppUser> user = appUserRepository.findByEmail("alice@example.com");

if (user.isPresent()) {
    System.out.println("User found: " + user.get().getId());
} else {
    System.out.println("User not found");
}
```

**OAuth2 Integration Pattern:**
```java
@Service
public class OAuth2UserService {
    
    @Autowired
    private AppUserRepository appUserRepository;
    
    public AppUser getOrCreateUser(OAuth2User oauth2User) {
        String email = oauth2User.getAttribute("email");
        String googleId = oauth2User.getAttribute("sub");
        
        // Check if user exists
        Optional<AppUser> existing = appUserRepository.findByEmail(email);
        
        if (existing.isPresent()) {
            return existing.get();
        }
        
        // Create new user from OAuth2 claims
        AppUser newUser = AppUser.builder()
            .id(UUID.randomUUID().toString())
            .email(email)
            .externalId(googleId)  // Store OAuth2 provider ID
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
        
        return appUserRepository.save(newUser);
    }
}
```

---

### count()

**Purpose:** Get total user count (analytics)

**Type:** Inherited from JpaRepository (override annotation for visibility)

**Usage:**
```java
long totalUsers = appUserRepository.count();

System.out.println("Total registered users: " + totalUsers);
```

**Use Cases:**
- User statistics dashboard
- License seat counting
- Analytics reporting

---

## Inherited JpaRepository Methods

### Standard CRUD Operations

```java
// Create
AppUser newUser = AppUser.builder()
    .email("bob@example.com")
    .build();
AppUser saved = appUserRepository.save(newUser);

// Read by ID
Optional<AppUser> user = appUserRepository.findById(userId);

// Read all
List<AppUser> allUsers = appUserRepository.findAll();

// Update
AppUser user = appUserRepository.findById(userId).orElseThrow();
user.setUpdatedAt(LocalDateTime.now());
appUserRepository.save(user);

// Delete
appUserRepository.deleteById(userId);

// Exists
boolean exists = appUserRepository.existsById(userId);
```

---

## OAuth2 Authentication Flow

### Step 1: OAuth2 Login Request
User clicks "Login with Google/GitHub"

### Step 2: OAuth2 Authorization
External provider returns `OAuth2User` with claims:
- `sub` (subject ID)
- `email`
- `name`
- `picture` (optional)

### Step 3: User Lookup
```java
Optional<AppUser> appUser = appUserRepository.findByEmail(
    oAuth2User.getAttribute("email")
);
```

### Step 4: Create or Update
If user not found, create new AppUser record:
```java
AppUser user = appUserRepository.save(
    new AppUser(oAuth2User.getAttribute("email"))
);
```

### Step 5: Issue JWT Token
Backend issues JWT containing:
- `userId` (from AppUser.id)
- `email` (from AppUser.email)
- `roles` (derived from identity provider)

---

## Service Integration Pattern

```java
@Service
public class UserManagementService {
    
    @Autowired
    private AppUserRepository appUserRepository;
    
    @Autowired
    private JwtProvider jwtProvider;
    
    /**
     * Handle OAuth2 user login
     */
    @Transactional
    public LoginResponse loginOAuth2User(OAuth2User oauth2User) {
        String email = oauth2User.getAttribute("email");
        
        AppUser appUser = appUserRepository.findByEmail(email)
            .orElseGet(() -> {
                // Create new user from OAuth2 claims
                AppUser newUser = AppUser.builder()
                    .id(UUID.randomUUID().toString())
                    .email(email)
                    .name(oauth2User.getAttribute("name"))
                    .externalId(oauth2User.getAttribute("sub"))
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
                
                return appUserRepository.save(newUser);
            });
        
        // Issue JWT token
        String token = jwtProvider.generateToken(appUser);
        
        return LoginResponse.builder()
            .userId(appUser.getId())
            .email(appUser.getEmail())
            .token(token)
            .build();
    }
    
    /**
     * Get user profile by ID
     */
    @Transactional(readOnly = true)
    public UserProfileDTO getUserProfile(String userId) {
        AppUser user = appUserRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException(userId));
        
        return UserProfileDTO.builder()
            .id(user.getId())
            .email(user.getEmail())
            .name(user.getName())
            .createdAt(user.getCreatedAt())
            .build();
    }
    
    /**
     * Check if user exists
     */
    @Transactional(readOnly = true)
    public boolean userExists(String email) {
        return appUserRepository.findByEmail(email).isPresent();
    }
    
    /**
     * Get user statistics
     */
    @Transactional(readOnly = true)
    public UserStatsDTO getUserStats() {
        return UserStatsDTO.builder()
            .totalUsers(appUserRepository.count())
            .lastUpdated(LocalDateTime.now())
            .build();
    }
}
```

---

## Entity Definition

```java
@Entity
@Table(name = "app_user")
@Getter
@Setter
@NoArgsConstructor
@Builder
@AllArgsConstructor
public class AppUser {
    
    @Id
    private String id;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    @Column(name = "external_id")
    private String externalId;  // OAuth2 provider ID (Google, GitHub, etc.)
    
    private String name;
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    // Note: NO password field (OAuth2 handles authentication)
    // Note: NO roles field (roles derived from identity provider claims)
}
```

---

## Testing

```java
@DataJpaTest
class AppUserRepositoryTest {
    
    @Autowired
    private AppUserRepository repository;
    
    @Test
    void testFindByEmail() {
        // Create user
        AppUser user = AppUser.builder()
            .id("user-001")
            .email("alice@example.com")
            .name("Alice")
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
        
        repository.save(user);
        
        // Find by email
        Optional<AppUser> found = repository.findByEmail("alice@example.com");
        
        assertTrue(found.isPresent());
        assertEquals("Alice", found.get().getName());
    }
    
    @Test
    void testFindByEmailNotFound() {
        Optional<AppUser> found = repository.findByEmail("notfound@example.com");
        
        assertFalse(found.isPresent());
    }
    
    @Test
    void testCountUsers() {
        repository.save(createUser("alice@example.com", "Alice"));
        repository.save(createUser("bob@example.com", "Bob"));
        repository.save(createUser("charlie@example.com", "Charlie"));
        
        long count = repository.count();
        
        assertEquals(3, count);
    }
    
    @Test
    void testEmailUniqueness() {
        AppUser user1 = createUser("alice@example.com", "Alice");
        repository.save(user1);
        
        AppUser user2 = createUser("alice@example.com", "Alice2");
        
        assertThrows(DataIntegrityViolationException.class, () -> {
            repository.save(user2);
            repository.flush();
        });
    }
    
    private AppUser createUser(String email, String name) {
        return AppUser.builder()
            .id(UUID.randomUUID().toString())
            .email(email)
            .name(name)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
    }
}
```

---

## Security Considerations

### Authentication Flow (OAuth2)
1. User clicks "Login with Provider"
2. Redirected to provider authorization endpoint
3. After user approves, provider redirects back with code
4. Backend exchanges code for `OAuth2User` token
5. `findByEmail()` looks up or creates AppUser
6. JWT token issued for subsequent API calls

### Authorization
- Users can only access their own data (user audit fields)
- Admin users (defined by provider claims) can access all data
- Role-based access control derived from identity provider

### No Password Storage
- **Advantage:** No password hashing/salt complexity
- **Advantage:** No password breach risk
- **Advantage:** Provider handles MFA
- **Disadvantage:** Depends on external provider availability

---

## Performance Notes

- **Email Index:** Database has UNIQUE INDEX on email column
- **Lookup Performance:** O(1) by email due to unique index
- **No Full Table Scans:** Email lookup uses index
- **Count Performance:** Efficient aggregate query

---

## Related Documentation

- [Data Models - AppUser Entity](../model/app-user.html)
- [OAuth2 Security Setup](../security/oauth2-authentication.html)
- [JWT Token Provider](../services/jwt-provider.html)
- [Repository Layer Index](./index.html)

---

[⬅️ Back to Repository Index](./index.html)
