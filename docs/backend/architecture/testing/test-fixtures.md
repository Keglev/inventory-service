# Test Fixtures & Data Builders

**Overview:** This document explains test helper patterns, data builders, and fixture management used throughout the inventory service test suite.

---

## Table of Contents

1. [Test Helper Pattern](#test-helper-pattern)
2. [InventoryItemServiceImplTestHelper](#inventoryitemserviceimpltesthelper)
3. [OAuth2 Authentication Setup](#oauth2-authentication-setup)
4. [Test Data Builders](#test-data-builders)
5. [Test Isolation & Cleanup](#test-isolation--cleanup)
6. [Best Practices](#best-practices)

---

## Test Helper Pattern

**Definition:** A test helper is a utility class that provides shared test setup logic across multiple test classes.

**Purpose:**
- Reduce code duplication in test setup
- Provide consistent test authentication/authorization
- Encapsulate complex initialization logic
- Make test classes more readable

**Design Principles:**
- Keep helpers **stateless** (no instance variables)
- Use `final class` with private constructor to prevent instantiation
- Mark methods as `static` for direct access without object creation
- Add comprehensive JavaDoc explaining **why** the helper exists and **what** it does

**Example Structure:**

```java
/**
 * Shared helper methods for InventoryItemServiceImpl test classes.
 * 
 * <p><strong>Purpose</strong></p>
 * <ul>
 *   <li>Provides OAuth2 authentication setup for test security context.</li>
 *   <li>Simplifies mocking of authenticated user scenarios.</li>
 * </ul>
 */
final class InventoryItemServiceImplTestHelper {
    private InventoryItemServiceImplTestHelper() {
        // Utility class - no instances
    }
    
    static void authenticateAsOAuth2(String username, String... roles) {
        // Authentication setup logic
    }
}
```

---

## InventoryItemServiceImplTestHelper

**Location:** `src/test/java/com/smartsupplypro/inventory/service/impl/InventoryItemServiceImplTestHelper.java`

**Purpose:** Centralizes OAuth2 authentication setup for `InventoryItemServiceImpl` test classes, eliminating duplication across multiple test files.

**Why It Exists:**
- `InventoryItemServiceImpl` requires authenticated users (OAuth2) for most operations
- Multiple test classes (`SaveTest`, `UpdateDeleteTest`, `SearchTest`) need the same authentication setup
- Without this helper, each test class would duplicate authentication code
- Provides a single point of change if authentication patterns need updates

### Method 1: `authenticateAsOAuth2(username, roles...)`

**Recommended approach.** Mimics actual Spring OAuth2 authentication flow.

```java
static void authenticateAsOAuth2(String username, String... roles) {
    // Create role authorities with ROLE_ prefix (e.g., "ADMIN" -> "ROLE_ADMIN")
    List<SimpleGrantedAuthority> roleAuthorities =
            Arrays.stream(roles)
                    .map(r -> new SimpleGrantedAuthority("ROLE_" + r))
                    .toList();
    
    // Create bare authorities without prefix (some code paths check both forms)
    List<SimpleGrantedAuthority> bareAuthorities =
            Arrays.stream(roles)
                    .map(SimpleGrantedAuthority::new)
                    .toList();

    // Combine both authority lists to cover all code paths
    List<GrantedAuthority> authorities = new java.util.ArrayList<>(roleAuthorities.size() + bareAuthorities.size());
    authorities.addAll(roleAuthorities);
    authorities.addAll(bareAuthorities);

    // Create OAuth2 attributes matching Google OAuth2 structure
    Map<String, Object> attrs = Map.of(
            "sub", username,                     // Subject: user ID
            "email", username + "@example.com", // Email attribute
            "name", username                    // User name
    );
    
    // Create OAuth2User principal with attributes and authorities
    OAuth2User principal = new DefaultOAuth2User(authorities, attrs, "sub");

    // Create OAuth2AuthenticationToken (mimics Spring OAuth2 authentication flow)
    OAuth2AuthenticationToken oauth2 =
            new OAuth2AuthenticationToken(principal, authorities, "test");

    // Set in security context so @PreAuthorize and hasRole() checks will see it
    SecurityContextHolder.getContext().setAuthentication(oauth2);
}
```

**Parameters:**
- `username` - Username/email for the authenticated user
- `roles` - Variable number of role names (e.g., "ADMIN", "USER")

**How It Works:**
1. Converts role names to `ROLE_` prefixed authorities (Spring Security convention)
2. Also creates bare authorities without prefix (covers both code paths)
3. Creates OAuth2 attributes matching Google OAuth2 structure (sub, email, name)
4. Creates `OAuth2AuthenticationToken` (mimics real Google login)
5. Sets token in `SecurityContextHolder` so security checks see the authenticated user

**Usage Example:**

```java
@Test
@DisplayName("Admin should be able to save inventory items")
void testSaveAsAdmin() {
    // Authenticate as admin user
    InventoryItemServiceImplTestHelper.authenticateAsOAuth2("admin@example.com", "ADMIN");
    
    // Now the service sees this user as authenticated with ADMIN role
    InventoryItem item = InventoryItem.builder()
            .id("item-1")
            .name("Widget")
            .build();
    
    InventoryItem saved = inventoryItemService.save(item);
    assertNotNull(saved.getId());
}

@Test
@DisplayName("Regular user should not be able to delete items")
void testDeleteAsUser() {
    // Authenticate as regular user
    InventoryItemServiceImplTestHelper.authenticateAsOAuth2("user@example.com", "USER");
    
    // This should throw AccessDeniedException because USER role lacks DELETE permission
    assertThrows(AccessDeniedException.class, () -> {
        inventoryItemService.delete("item-1");
    });
}
```

### Method 2: `mockOAuth2Authentication(email, roles...)`

**Legacy approach.** Simpler but less realistic.

```java
static void mockOAuth2Authentication(String email, String... roles) {
    // Create minimal OAuth2 attributes (email only)
    Map<String, Object> attributes = Map.of("email", email);

    // Create GrantedAuthority collection from role strings
    Collection<GrantedAuthority> authorities = Arrays.stream(roles)
            .map(SimpleGrantedAuthority::new)
            .collect(Collectors.toList());

    // Create OAuth2User with email attribute as principal name attribute
    OAuth2User oauth2User = new DefaultOAuth2User(authorities, attributes, "email");

    // Create TestingAuthenticationToken (simpler but less realistic)
    Authentication auth = new TestingAuthenticationToken(oauth2User, null, authorities);
    
    // Create empty context and set authentication
    SecurityContext context = SecurityContextHolder.createEmptyContext();
    context.setAuthentication(auth);
    SecurityContextHolder.setContext(context);
}
```

**When to Use:**
- Basic tests that only care about role presence/absence
- Don't need realistic OAuth2 attributes
- Prefer simpler setup over authenticity

**Prefer `authenticateAsOAuth2()` instead** for most cases.

---

## OAuth2 Authentication Setup

### How `authenticateAsOAuth2()` Maps to Real Authentication

**Real Google OAuth2 Flow:**
```
User clicks "Login with Google"
    ↓
Google returns OAuth2 token with attributes (sub, email, name)
    ↓
Spring creates OAuth2User with these attributes
    ↓
Spring wraps OAuth2User in OAuth2AuthenticationToken
    ↓
Token stored in SecurityContextHolder
    ↓
@PreAuthorize checks see authenticated user with roles
```

**Test Helper Flow:**
```
Call: authenticateAsOAuth2("admin@example.com", "ADMIN")
    ↓
Helper manually creates OAuth2User with test attributes
    ↓
Helper manually creates OAuth2AuthenticationToken
    ↓
Helper stores token in SecurityContextHolder
    ↓
@PreAuthorize checks see authenticated user (test mimics real flow)
```

**Key Difference:** Real flow uses actual Google API; test flow simulates it. Result is identical from the application's perspective.

### Why Both Role Formats?

```java
// ROLE_ prefixed (Spring Security standard)
authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));

// Bare (some custom code paths check this way)
authorities.add(new SimpleGrantedAuthority("ADMIN"));
```

**Example:**
```java
// @PreAuthorize and hasRole() look for ROLE_ prefix
@PreAuthorize("hasRole('ADMIN')")  // Checks for ROLE_ADMIN

// Some custom code checks bare role name
if (authorities.stream().anyMatch(a -> a.getAuthority().equals("ADMIN"))) {
    // Custom logic
}
```

**Solution:** Helper includes both, so all code paths see the role.

---

## Test Data Builders

### Pattern: Object Builders for Test Data

**Why:** Test classes often need to create complex domain objects. Builders make this clear and maintainable.

**Example - InventoryItem Builder:**

```java
@Test
void testSaveWithCompleteData() {
    InventoryItem item = InventoryItem.builder()
            .id("item-123")
            .name("Industrial Widget")
            .description("A quality widget for industrial use")
            .price(BigDecimal.valueOf(99.99))
            .quantity(500)
            .minimumQuantity(50)
            .supplier(supplierA)
            .createdBy("admin@example.com")
            .createdAt(now)
            .build();
    
    InventoryItem saved = repository.save(item);
    assertEquals("item-123", saved.getId());
}
```

**Benefits:**
- **Readable:** Clear which fields are being set
- **Flexible:** Easy to create variations (minimal vs. complete objects)
- **Maintainable:** If entity structure changes, one place to update

### Creating Test-Specific Builders

**Option 1: Use Domain Entity Builder (if available)**

If your domain model has a builder (Lombok `@Builder`), use it directly:

```java
// InventoryItem has @Builder from Lombok
InventoryItem testItem = InventoryItem.builder()
        .id("test-id")
        .name("Test Item")
        .build();
```

**Option 2: Create Test Data Factory**

For complex initialization logic, create a test helper:

```java
final class InventoryItemTestFactory {
    static InventoryItem createMinimalItem() {
        return InventoryItem.builder()
                .id("item-" + UUID.randomUUID())
                .name("Test Item")
                .price(BigDecimal.TEN)
                .quantity(10)
                .minimumQuantity(1)
                .build();
    }
    
    static InventoryItem createCompleteItem(String id, String name, BigDecimal price) {
        return InventoryItem.builder()
                .id(id)
                .name(name)
                .price(price)
                .quantity(100)
                .minimumQuantity(10)
                .supplier(createTestSupplier())
                .createdBy("test-user")
                .createdAt(Instant.now())
                .build();
    }
}
```

---

## Test Isolation & Cleanup

### Automatic Cleanup with @DataJpaTest

```java
@DataJpaTest  // Spring automatically handles cleanup
class AppUserRepositoryTest {
    @Autowired
    private AppUserRepository repository;
    
    @Test
    void testSaveAndFind() {
        AppUser user = new AppUser("test@example.com", "Test User");
        repository.save(user);
        
        Optional<AppUser> found = repository.findByEmail("test@example.com");
        assertTrue(found.isPresent());
    }
    
    // After this test, Spring automatically:
    // 1. Rolls back the transaction
    // 2. Clears the H2 database
    // Result: Next test starts with clean database
}
```

**How It Works:**
- `@DataJpaTest` wraps each test in a transaction
- After test completes, transaction is rolled back
- H2 database returns to state before test
- No data leaks between tests

### Manual Cleanup with @BeforeEach

```java
@SpringBootTest
@ActiveProfiles("test")
class InventoryItemServiceTest {
    @Autowired
    private InventoryItemRepository repository;
    
    @BeforeEach
    void setup() {
        // Clear database before each test
        repository.deleteAll();
    }
    
    @Test
    void testOperation1() {
        // Database is clean
    }
    
    @Test
    void testOperation2() {
        // Database is clean
    }
}
```

### Test Order Independence

**Rule:** Each test must be runnable in any order without depending on other tests.

**Bad (dependent on test order):**
```java
@Test
void testCreateUser() {
    userService.create("user1");  // Assume this runs first
}

@Test
void testFindUser() {
    Optional<User> user = userService.findById("user1");  // Depends on testCreateUser running first!
    assertTrue(user.isPresent());
}
```

**Good (independent):**
```java
@Test
void testCreateAndFindUser() {
    userService.create("user1");
    Optional<User> user = userService.findById("user1");
    assertTrue(user.isPresent());
}
```

### SecurityContextHolder Cleanup

When testing security, manually clean up `SecurityContextHolder`:

```java
@Test
void testAdminOperation() {
    InventoryItemServiceImplTestHelper.authenticateAsOAuth2("admin", "ADMIN");
    // ... test admin-only operation
}

@AfterEach
void tearDown() {
    SecurityContextHolder.clearContext();  // Clear for next test
}
```

---

## Best Practices

### 1. Use Helpers for Repetitive Setup

**Before (duplicated in every test class):**
```java
class SaveTest {
    @Test
    void test1() {
        List<GrantedAuthority> auth = List.of(new SimpleGrantedAuthority("ROLE_ADMIN"));
        OAuth2User principal = new DefaultOAuth2User(auth, 
                Map.of("sub", "admin", "email", "admin@example.com"), "sub");
        OAuth2AuthenticationToken token = new OAuth2AuthenticationToken(principal, auth, "test");
        SecurityContextHolder.getContext().setAuthentication(token);
        // ... test logic
    }
}
```

**After (using helper):**
```java
class SaveTest {
    @Test
    void test1() {
        InventoryItemServiceImplTestHelper.authenticateAsOAuth2("admin", "ADMIN");
        // ... test logic
    }
}
```

### 2. Name Test Helpers Descriptively

**Convention:** `{TestClass}TestHelper` or `{Domain}TestFactory`

```java
// Good
InventoryItemServiceImplTestHelper          // Service test helper
InventoryItemRepositoryTestFactory          // Repository test factory
AuthenticationTestHelper                    // Authentication helper

// Avoid
Helper
TestUtil
Util
```

### 3. Make Helpers Stateless

**Bad:**
```java
class TestHelper {
    private String currentUser;  // State!
    
    void setUser(String user) {
        this.currentUser = user;  // Side effect
    }
}
```

**Good:**
```java
class TestHelper {
    static void authenticateAsUser(String user) {
        // No state, just does setup
    }
}
```

### 4. Document Why Helpers Exist

```java
/**
 * Shared helper methods for InventoryItemServiceImpl test classes.
 * 
 * <p><strong>Purpose</strong></p>
 * <ul>
 *   <li>Provides OAuth2 authentication setup for test security context.</li>
 *   <li>Simplifies mocking of authenticated user scenarios across multiple test classes.</li>
 * </ul>
 * 
 * <p><strong>Key Methods</strong></p>
 * ...
 */
```

### 5. Keep Builders Simple

**Too complex:**
```java
// Trying to handle every possible combination
InventoryItem item = InventoryItemTestFactory.create()
        .withId("id-1")
        .withName("Name")
        .withPrice(100)
        .withQuantity(10)
        // ... 20 more options
        .build();
```

**Better (multiple simple methods):**
```java
// Minimal item
InventoryItem item = InventoryItemTestFactory.createMinimal();

// Complete item with specific values
InventoryItem item = InventoryItemTestFactory.createComplete("id-1", "Name", 100);

// In test, modify as needed
item.setQuantity(50);
```

---

## Summary

| Pattern | Use Case | Example |
|---------|----------|---------|
| **Test Helper** | Repetitive setup logic (auth, mocking) | `InventoryItemServiceImplTestHelper` |
| **Test Factory** | Creating complex test data | `InventoryItemTestFactory.createComplete()` |
| **Builder Pattern** | Clear, flexible object construction | `InventoryItem.builder()...build()` |
| **@BeforeEach** | Manual cleanup, per-test setup | `repository.deleteAll()` |
| **@DataJpaTest** | Automatic transaction rollback | Test isolation without manual cleanup |
| **SecurityContextHolder.clearContext()** | Security test cleanup | After each security-related test |

---

## See Also

- [Testing Index](./index.md) - Master testing documentation
- [Unit Testing](./unit-testing.md) - JUnit 5 and Mockito patterns
- [Integration Testing](./integration-testing.md) - @DataJpaTest and @WebMvcTest
- [Security Testing](./security-testing.md) - OAuth2 and RBAC testing
