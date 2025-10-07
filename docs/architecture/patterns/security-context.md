# Security Context Patterns

## Overview

This document describes security patterns used in the Smart Supply Pro inventory service, focusing on the `currentUsername()` pattern for extracting authentication information and OAuth 2.0/JWT integration.

---

## Pattern: Current Username Extraction

### Description

Centralized method to extract the authenticated user's username from Spring Security context, used consistently across all service methods for audit trail tracking.

### Core Implementation

**BaseService.java (Abstract):**
```java
public abstract class BaseService {
    
    /**
     * Extracts current username from security context.
     * @return authenticated username or "system" if anonymous
     */
    protected String currentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        // Enterprise Comment: Anonymous Request Handling
        // Returns "system" for scheduled jobs or internal processes
        if (authentication == null || !authentication.isAuthenticated()) {
            return "system";
        }
        
        // Enterprise Comment: JWT Principal Extraction
        // OAuth2Authentication provides user details from JWT token
        Object principal = authentication.getPrincipal();
        
        if (principal instanceof UserDetails) {
            return ((UserDetails) principal).getUsername();
        }
        
        if (principal instanceof String) {
            return (String) principal;
        }
        
        return "system";
    }
}
```

### Usage Across Services

**InventoryItemServiceImpl.java:**
```java
@Service
public class InventoryItemServiceImpl extends BaseService {
    
    public InventoryItemDTO create(InventoryItemDTO dto) {
        // Enterprise Comment: Audit Trail Integration
        // currentUsername() captures authenticated user for audit logging
        InventoryItem entity = InventoryItemMapper.toEntity(dto, currentUsername());
        InventoryItem saved = inventoryItemRepository.save(entity);
        
        // Enterprise Comment: Stock History Event Logging
        // Same username propagated to related event for consistency
        stockHistoryService.logStockChange(
            saved.getId(), 
            dto.getQuantity(), 
            StockChangeReason.INITIAL_STOCK, 
            currentUsername(),  // <-- Consistent audit tracking
            saved.getPrice()
        );
        
        return InventoryItemMapper.toDTO(saved);
    }
}
```

**SupplierServiceImpl.java:**
```java
@Service
public class SupplierServiceImpl extends BaseService {
    
    public SupplierDTO update(String id, SupplierDTO dto) {
        Supplier existing = supplierRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Supplier not found: " + id));
        
        // Enterprise Comment: Update Audit Trail
        // updatedBy field captures current user via currentUsername()
        SupplierMapper.updateEntity(existing, dto, currentUsername());
        
        return SupplierMapper.toDTO(supplierRepository.save(existing));
    }
}
```

---

## Benefits

### 1. Consistency

**Single source of truth for user extraction:**
```java
// All services use same method
String user1 = currentUsername(); // InventoryItemService
String user2 = currentUsername(); // SupplierService
String user3 = currentUsername(); // AnalyticsService
```

**Result:** Uniform audit trail across all entities.

### 2. Centralized Logic

**One place to handle edge cases:**
```java
protected String currentUsername() {
    // Handles:
    // - Null authentication
    // - Anonymous users
    // - Different principal types (UserDetails, String, OAuth2User)
    // - Default fallback to "system"
}
```

**Benefit:** Changes propagate automatically to all services.

### 3. Testability

**Easy to override in tests:**
```java
@TestConfiguration
static class TestSecurityConfig {
    
    @Bean
    @Primary
    public BaseService testBaseService() {
        return new BaseService() {
            @Override
            protected String currentUsername() {
                return "testUser"; // Override for tests
            }
        };
    }
}
```

### 4. Clean Service Layer

**No repeated SecurityContext boilerplate:**
```java
// Without pattern (repeated everywhere)
Authentication auth = SecurityContextHolder.getContext().getAuthentication();
String username = auth != null ? auth.getName() : "system";

// With pattern (one method call)
String username = currentUsername();
```

---

## OAuth 2.0 Integration

### JWT Token Structure

**Access Token Claims:**
```json
{
  "sub": "user123",
  "username": "john.doe",
  "email": "john.doe@example.com",
  "roles": ["ROLE_USER", "ROLE_ADMIN"],
  "iat": 1609459200,
  "exp": 1609545600
}
```

### Spring Security Configuration

**SecurityConfig.java:**
```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/api/auth/**", "/api/health/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            );
        
        return http.build();
    }
    
    /**
     * Converts JWT claims to Spring Security authorities.
     */
    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter = 
            new JwtGrantedAuthoritiesConverter();
        grantedAuthoritiesConverter.setAuthoritiesClaimName("roles");
        grantedAuthoritiesConverter.setAuthorityPrefix("ROLE_");
        
        JwtAuthenticationConverter jwtAuthenticationConverter = 
            new JwtAuthenticationConverter();
        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(
            grantedAuthoritiesConverter
        );
        
        return jwtAuthenticationConverter;
    }
}
```

### Authentication Flow

**1. Login (OAuth2AuthenticationService):**
```java
public AuthResponse login(String username, String password) {
    // Authenticate with Spring Security
    Authentication authentication = authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(username, password)
    );
    
    // Set security context
    SecurityContextHolder.getContext().setAuthentication(authentication);
    
    // Generate JWT tokens
    String accessToken = jwtUtil.generateAccessToken(authentication);
    String refreshToken = jwtUtil.generateRefreshToken(authentication);
    
    return new AuthResponse(accessToken, refreshToken, username, roles);
}
```

**2. Request with JWT (Filter Chain):**
```
Client Request → JWT Filter → Token Validation → Set SecurityContext
                                                           ↓
                                                    Controller Method
                                                           ↓
                                                    Service: currentUsername()
                                                           ↓
                                                    SecurityContextHolder.getContext()
```

**3. Username Extraction:**
```java
protected String currentUsername() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    // auth.getPrincipal() contains JWT claims
    // Extract "username" claim or "sub" claim
    return extractUsernameFromJWT(auth);
}
```

---

## Role-Based Access Control (RBAC)

### Method-Level Security

**@PreAuthorize Annotations:**
```java
@Service
public class SupplierServiceImpl extends BaseService {
    
    /**
     * Deletes supplier (admin-only operation).
     * @param id supplier ID
     */
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(String id) {
        supplierRepository.deleteById(id);
        // currentUsername() used for audit log
        auditService.log("Supplier deleted", id, currentUsername());
    }
    
    /**
     * Gets supplier (any authenticated user).
     * @param id supplier ID
     * @return supplier DTO
     */
    @PreAuthorize("isAuthenticated()")
    public SupplierDTO getById(String id) {
        return supplierRepository.findById(id)
            .map(SupplierMapper::toDTO)
            .orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));
    }
}
```

### Hierarchical Roles

**Role Hierarchy:**
```
ROLE_ADMIN → ROLE_MANAGER → ROLE_USER
```

**Configuration:**
```java
@Bean
public RoleHierarchy roleHierarchy() {
    RoleHierarchyImpl hierarchy = new RoleHierarchyImpl();
    hierarchy.setHierarchy("ROLE_ADMIN > ROLE_MANAGER > ROLE_USER");
    return hierarchy;
}
```

**Effect:** Users with `ROLE_ADMIN` automatically have `ROLE_MANAGER` and `ROLE_USER` permissions.

---

## Advanced Patterns

### Pattern: Tenant Isolation (Multi-Tenancy)

**Extended currentUsername() for tenant context:**
```java
protected String currentTenantId() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    
    if (authentication != null && authentication.getPrincipal() instanceof JwtPrincipal) {
        JwtPrincipal principal = (JwtPrincipal) authentication.getPrincipal();
        return principal.getClaim("tenantId");
    }
    
    return "default";
}
```

**Usage with tenant filtering:**
```java
public List<InventoryItemDTO> getAll() {
    String tenantId = currentTenantId();
    
    // Enterprise Comment: Multi-Tenant Data Isolation
    // Query filtered by tenant ID to prevent cross-tenant data leaks
    return inventoryItemRepository.findByTenantId(tenantId)
        .stream()
        .map(InventoryItemMapper::toDTO)
        .collect(Collectors.toList());
}
```

### Pattern: Impersonation Support

**Admin impersonating another user:**
```java
protected String currentUsername() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    
    // Check for impersonation context
    if (authentication instanceof ImpersonatedAuthentication) {
        ImpersonatedAuthentication impAuth = (ImpersonatedAuthentication) authentication;
        // Log impersonation for audit
        auditService.logImpersonation(
            impAuth.getActualUser(), 
            impAuth.getImpersonatedUser()
        );
        return impAuth.getImpersonatedUser();
    }
    
    return extractUsername(authentication);
}
```

### Pattern: Service Account Detection

**Differentiate human users from service accounts:**
```java
protected boolean isServiceAccount() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    
    if (authentication != null && authentication.getPrincipal() instanceof JwtPrincipal) {
        JwtPrincipal principal = (JwtPrincipal) authentication.getPrincipal();
        return "service".equals(principal.getClaim("userType"));
    }
    
    return false;
}

// Usage
public void performSensitiveOperation() {
    if (isServiceAccount()) {
        throw new AccessDeniedException("Service accounts cannot perform this operation");
    }
    
    String username = currentUsername();
    // ... proceed with operation
}
```

---

## Testing Strategies

### Unit Testing with Mock Security Context

**Setup security context in tests:**
```java
@BeforeEach
void setupSecurityContext() {
    UserDetails userDetails = User.builder()
        .username("testUser")
        .password("password")
        .roles("USER")
        .build();
    
    Authentication authentication = new UsernamePasswordAuthenticationToken(
        userDetails, null, userDetails.getAuthorities()
    );
    
    SecurityContextHolder.getContext().setAuthentication(authentication);
}

@Test
void create_shouldUseCurrentUsername() {
    // Given
    InventoryItemDTO dto = createTestDTO();
    
    // When
    InventoryItemDTO created = inventoryItemService.create(dto);
    
    // Then
    verify(inventoryItemRepository).save(argThat(entity -> 
        "testUser".equals(entity.getCreatedBy())
    ));
}

@AfterEach
void clearSecurityContext() {
    SecurityContextHolder.clearContext();
}
```

### Integration Testing with @WithMockUser

**Spring Security Test Support:**
```java
@SpringBootTest
@AutoConfigureMockMvc
class InventoryItemControllerIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    @WithMockUser(username = "testUser", roles = {"USER"})
    void createInventoryItem_shouldUseAuthenticatedUser() throws Exception {
        String requestBody = """
            {
                "name": "Test Item",
                "quantity": 100,
                "price": 19.99,
                "supplierId": "supplier123"
            }
            """;
        
        mockMvc.perform(post("/api/inventory")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.createdBy").value("testUser"));
    }
    
    @Test
    @WithMockUser(username = "adminUser", roles = {"ADMIN"})
    void deleteSupplier_shouldSucceed_whenUserIsAdmin() throws Exception {
        mockMvc.perform(delete("/api/suppliers/123"))
            .andExpect(status().isNoContent());
    }
    
    @Test
    @WithMockUser(username = "regularUser", roles = {"USER"})
    void deleteSupplier_shouldFail_whenUserNotAdmin() throws Exception {
        mockMvc.perform(delete("/api/suppliers/123"))
            .andExpect(status().isForbidden());
    }
}
```

### Testing Anonymous Access

**Verify default username for non-authenticated requests:**
```java
@Test
void currentUsername_shouldReturnSystem_whenNoAuthentication() {
    // Given
    SecurityContextHolder.clearContext();
    
    // When
    String username = baseService.currentUsername();
    
    // Then
    assertEquals("system", username);
}
```

---

## Common Pitfalls

### ❌ Thread Context Leaks

**Problem: SecurityContext not cleared after async operations**
```java
// BAD: Context not propagated to async thread
@Async
public CompletableFuture<String> asyncOperation() {
    // currentUsername() returns "system" or null
    return CompletableFuture.completedFuture(currentUsername());
}
```

**Solution: Configure SecurityContext propagation**
```java
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {
    
    @Override
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(10);
        
        // Propagate security context to async threads
        executor.setTaskDecorator(new SecurityContextPropagatingTaskDecorator());
        
        executor.initialize();
        return executor;
    }
}

class SecurityContextPropagatingTaskDecorator implements TaskDecorator {
    @Override
    public Runnable decorate(Runnable runnable) {
        SecurityContext context = SecurityContextHolder.getContext();
        return () -> {
            try {
                SecurityContextHolder.setContext(context);
                runnable.run();
            } finally {
                SecurityContextHolder.clearContext();
            }
        };
    }
}
```

### ❌ Hardcoded Usernames

**Problem: Bypassing authentication**
```java
// BAD: Hardcoded username ignores actual authentication
public void create(InventoryItemDTO dto) {
    InventoryItem entity = InventoryItemMapper.toEntity(dto, "admin");
}
```

**Solution: Always use currentUsername()**
```java
// GOOD: Respects authenticated user
public void create(InventoryItemDTO dto) {
    InventoryItem entity = InventoryItemMapper.toEntity(dto, currentUsername());
}
```

### ❌ Missing RBAC Annotations

**Problem: No access control enforcement**
```java
// BAD: No authorization check
public void delete(String id) {
    supplierRepository.deleteById(id);
}
```

**Solution: Add @PreAuthorize**
```java
// GOOD: Enforces admin-only access
@PreAuthorize("hasRole('ADMIN')")
public void delete(String id) {
    supplierRepository.deleteById(id);
}
```

---

## References

- **Spring Security Documentation**: https://docs.spring.io/spring-security/reference/
- **OAuth 2.0 Specification**: https://oauth.net/2/
- **JWT Introduction**: https://jwt.io/introduction
- **Related Documentation**: `oauth2-services.md`, `audit-trail.md`

---

*Document Version: 1.0*  
*Last Updated: 2025*  
*Project: Smart Supply Pro Inventory Service*