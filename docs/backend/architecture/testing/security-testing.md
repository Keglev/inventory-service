[⬅️ Back to Testing Index](./index.html)

# Security Testing

## Overview

Security tests verify **authentication, authorization, and API access control**. They ensure OAuth2 flows work correctly and role-based access control (RBAC) properly restricts operations.

---

## Security Testing Characteristics

| Aspect | Detail |
|--------|--------|
| **Scope** | Authentication flows, authorization rules, API access |
| **Framework** | @WebMvcTest with SecurityConfig, spring-security-test |
| **Dependencies** | Mock OAuth2 config, test security filters |
| **Key Classes** | @WithMockUser, TestSecurityConfig, SecurityMockMvcRequestPostProcessors |
| **Focus** | Role validation, endpoint protection, CORS, CSRF |

---

## Spring Security Test Annotations

### @WithMockUser

```java
@Test
@WithMockUser(username = "john", roles = "USER")
void userCanAccessUserEndpoint() {
    // Test runs with mocked OAuth2 user "john" with role "USER"
}

@Test
@WithMockUser(username = "admin", roles = "ADMIN")
void adminCanAccessAdminEndpoint() {
    // Test runs with mocked OAuth2 user "admin" with role "ADMIN"
}

@Test
@WithMockUser(roles = {"USER", "MODERATOR"})
void multipleRolesSupported() {
    // User has both USER and MODERATOR roles
}
```

### Request Mutators

```java
// Add CSRF token (required for POST/PUT/DELETE)
mockMvc.perform(post("/api/suppliers")
    .with(csrf()))

// Add user with role
mockMvc.perform(get("/api/admin")
    .with(user("admin").roles("ADMIN")))

// OAuth2 token (for resource server testing)
mockMvc.perform(get("/api/secure")
    .with(oauth2Login().attributes(attrs)))
```

---

## Authentication Testing

### Example: OAuth2 Authentication Flow

```java
@WebMvcTest(controllers = AdminStubController.class)
@Import({ SecurityConfig.class, TestSecurityConfig.class })
class OAuth2AuthenticationTest {
    
    @Autowired MockMvc mvc;
    @Autowired OAuth2LoginSuccessHandler successHandler;
    @Autowired ClientRegistrationRepository clientRegistrationRepository;
    
    @Test
    @DisplayName("OAuth2 client registration configured for Google")
    void googleClientConfigured() {
        ClientRegistration google = 
            clientRegistrationRepository.findByRegistrationId("google");
        
        assertNotNull(google);
        assertEquals("google", google.getRegistrationId());
        assertEquals("https://accounts.google.com/o/oauth2/v2/auth", 
            google.getProviderDetails().getAuthorizationUri());
    }
    
    @Test
    @DisplayName("OAuth2 authorization endpoint redirects to Google")
    void oauth2AuthorizationRedirectsToGoogle() throws Exception {
        mvc.perform(get("/oauth2/authorization/google"))
            .andExpect(status().is3xxRedirection())
            .andExpect(header().string("Location", 
                containsString("accounts.google.com")));
    }
    
    @Test
    @DisplayName("Login success handler exists and is configured")
    void loginSuccessHandlerWired() {
        assertNotNull(successHandler);
    }
}
```

### Custom OAuth2UserService Testing

```java
@WebMvcTest
@Import(TestSecurityConfig.class)
class OAuth2UserServiceTest {
    
    @Autowired MockMvc mvc;
    @MockitoBean CustomOAuth2UserService customUserService;
    @MockitoBean AppUserRepository appUserRepository;
    
    @Test
    @DisplayName("OAuth2 login creates AppUser if not exists")
    void oauth2Login_newUser_createsAppUser() {
        // Setup: Mock OAuth2 user from Google
        OAuth2User oAuth2User = mock(OAuth2User.class);
        when(oAuth2User.getAttribute("email"))
            .thenReturn("john@example.com");
        when(oAuth2User.getAttribute("name"))
            .thenReturn("John Doe");
        
        // Setup: Service creates AppUser
        AppUser appUser = AppUser.builder()
            .email("john@example.com")
            .username("john@example.com")
            .role(Role.USER)
            .build();
        when(customUserService.loadUser(any(OAuth2UserRequest.class)))
            .thenReturn(new DefaultOAuth2User(
                AuthorityUtils.createAuthorityList("ROLE_USER"),
                Map.of("email", "john@example.com", "name", "John Doe"),
                "email"
            ));
        
        // OAuth2 login should complete successfully
        // (verified via actual OAuth2 callback flow)
    }
}
```

---

## Authorization (RBAC) Testing

### Example: Role-Based Access Control

```java
@WebMvcTest(SupplierController.class)
@Import({ TestSecurityConfig.class, GlobalExceptionHandler.class })
class RBACTest {
    
    @Autowired MockMvc mvc;
    @MockitoBean SupplierService supplierService;
    
    SupplierDTO dto = SupplierDTO.builder()
        .name("Acme").contactName("Alice").email("alice@acme.com")
        .build();
    
    // ========== READ operations: USER + ADMIN can access ==========
    
    @Test
    @DisplayName("USER role can GET suppliers")
    @WithMockUser(roles = "USER")
    void userCanGetSupplier() throws Exception {
        when(supplierService.findById("sup-1"))
            .thenReturn(dto);
        
        mvc.perform(get("/api/suppliers/sup-1"))
            .andExpect(status().isOk());
    }
    
    @Test
    @DisplayName("ADMIN role can GET suppliers")
    @WithMockUser(roles = "ADMIN")
    void adminCanGetSupplier() throws Exception {
        when(supplierService.findById("sup-1"))
            .thenReturn(dto);
        
        mvc.perform(get("/api/suppliers/sup-1"))
            .andExpect(status().isOk());
    }
    
    // ========== WRITE operations: ADMIN only ==========
    
    @Test
    @DisplayName("ADMIN role can POST suppliers")
    @WithMockUser(roles = "ADMIN")
    void adminCanCreateSupplier() throws Exception {
        when(supplierService.create(any()))
            .thenReturn(SupplierDTO.builder().id("new-id").name("Acme").build());
        
        mvc.perform(post("/api/suppliers")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto))
            .with(csrf()))
            .andExpect(status().isCreated());
    }
    
    @Test
    @DisplayName("USER role CANNOT POST suppliers (403 FORBIDDEN)")
    @WithMockUser(roles = "USER")
    void userCannotCreateSupplier() throws Exception {
        mvc.perform(post("/api/suppliers")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto))
            .with(csrf()))
            .andExpect(status().isForbidden());
    }
    
    @Test
    @DisplayName("ADMIN role can PUT suppliers")
    @WithMockUser(roles = "ADMIN")
    void adminCanUpdateSupplier() throws Exception {
        when(supplierService.update("sup-1", dto))
            .thenReturn(dto);
        
        mvc.perform(put("/api/suppliers/sup-1")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto))
            .with(csrf()))
            .andExpect(status().isOk());
    }
    
    @Test
    @DisplayName("USER role CANNOT PUT suppliers (403 FORBIDDEN)")
    @WithMockUser(roles = "USER")
    void userCannotUpdateSupplier() throws Exception {
        mvc.perform(put("/api/suppliers/sup-1")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto))
            .with(csrf()))
            .andExpect(status().isForbidden());
    }
    
    @Test
    @DisplayName("ADMIN role can DELETE suppliers")
    @WithMockUser(roles = "ADMIN")
    void adminCanDeleteSupplier() throws Exception {
        mvc.perform(delete("/api/suppliers/sup-1")
            .with(csrf()))
            .andExpect(status().isNoContent());
    }
    
    @Test
    @DisplayName("USER role CANNOT DELETE suppliers (403 FORBIDDEN)")
    @WithMockUser(roles = "USER")
    void userCannotDeleteSupplier() throws Exception {
        mvc.perform(delete("/api/suppliers/sup-1")
            .with(csrf()))
            .andExpect(status().isForbidden());
    }
    
    // ========== Unauthenticated access: 401 ==========
    
    @Test
    @DisplayName("Unauthenticated GET returns 401 UNAUTHORIZED")
    void unauthenticatedCannotGet() throws Exception {
        mvc.perform(get("/api/suppliers/sup-1"))
            .andExpect(status().isUnauthorized());
    }
    
    @Test
    @DisplayName("Unauthenticated POST returns 401 UNAUTHORIZED")
    void unauthenticatedCannotCreate() throws Exception {
        mvc.perform(post("/api/suppliers")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto))
            .with(csrf()))
            .andExpect(status().isUnauthorized());
    }
}
```

---

## CSRF Protection Testing

### CSRF Token Handling

```java
@Test
@DisplayName("POST without CSRF token returns 403 FORBIDDEN")
@WithMockUser(roles = "ADMIN")
void postWithoutCsrf_returns403() throws Exception {
    // Intentionally omit .with(csrf())
    mvc.perform(post("/api/suppliers")
        .contentType(MediaType.APPLICATION_JSON)
        .content(json))
        // ← Missing .with(csrf())
        .andExpect(status().isForbidden());
}

@Test
@DisplayName("POST with CSRF token succeeds")
@WithMockUser(roles = "ADMIN")
void postWithCsrf_succeeds() throws Exception {
    when(supplierService.create(any())).thenReturn(dto);
    
    mvc.perform(post("/api/suppliers")
        .contentType(MediaType.APPLICATION_JSON)
        .content(json)
        .with(csrf()))  // ← Include CSRF token
        .andExpect(status().isCreated());
}

@Test
@DisplayName("GET does not require CSRF token")
@WithMockUser(roles = "USER")
void getDoesNotRequireCsrf() throws Exception {
    mvc.perform(get("/api/suppliers/sup-1"))
        // No .with(csrf()) needed for safe methods
        .andExpect(status().isOk());
}
```

---

## CORS Testing

### Cross-Origin Request Testing

```java
@Test
@DisplayName("CORS preflight request returns allowed headers")
void corsPreflight_returnsAllowedHeaders() throws Exception {
    mvc.perform(options("/api/suppliers")
        .header("Origin", "http://localhost:3000")
        .header("Access-Control-Request-Method", "POST"))
        .andExpect(status().isOk())
        .andExpect(header().exists("Access-Control-Allow-Origin"))
        .andExpect(header().string("Access-Control-Allow-Methods", 
            containsString("POST")));
}

@Test
@DisplayName("CORS allows credentials for development origin")
void corsAllowsCredentials_devOrigin() throws Exception {
    mvc.perform(get("/api/suppliers")
        .header("Origin", "http://localhost:3000"))
        .andExpect(status().isOk())
        .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
}
```

---

## Demo Mode Security Testing

### Read-Only Security in Demo

```java
@SpringBootTest(properties = "app.demo.enabled=true")
@AutoConfigureMockMvc
class DemoReadonlySecurityTest {
    
    @Autowired MockMvc mvc;
    
    @Test
    @DisplayName("Demo mode allows GET operations")
    @WithMockUser(roles = "USER")
    void demo_getSucceeds() throws Exception {
        mvc.perform(get("/api/suppliers"))
            .andExpect(status().isOk());
    }
    
    @Test
    @DisplayName("Demo mode blocks POST operations (read-only)")
    @WithMockUser(roles = "ADMIN")
    void demo_postBlocked() throws Exception {
        mvc.perform(post("/api/suppliers")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{}")
            .with(csrf()))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message")
                .value(containsString("demo mode")));
    }
    
    @Test
    @DisplayName("Demo mode blocks PUT operations (read-only)")
    @WithMockUser(roles = "ADMIN")
    void demo_putBlocked() throws Exception {
        mvc.perform(put("/api/suppliers/sup-1")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{}")
            .with(csrf()))
            .andExpect(status().isForbidden());
    }
    
    @Test
    @DisplayName("Demo mode blocks DELETE operations (read-only)")
    @WithMockUser(roles = "ADMIN")
    void demo_deleteBlocked() throws Exception {
        mvc.perform(delete("/api/suppliers/sup-1")
            .with(csrf()))
            .andExpect(status().isForbidden());
    }
}
```

---

## Field-Level Authorization Testing

### Role-Based Field Updates

```java
@WebMvcTest(InventoryItemController.class)
@Import({ TestSecurityConfig.class, GlobalExceptionHandler.class })
class FieldAuthorizationTest {
    
    @Autowired MockMvc mvc;
    @MockitoBean InventoryItemService service;
    
    @Test
    @DisplayName("USER role can update quantity")
    @WithMockUser(roles = "USER")
    void userCanUpdateQuantity() throws Exception {
        InventoryItemDTO dto = InventoryItemDTO.builder()
            .id("item-1")
            .name("Widget")
            .quantity(150)  // ← Updating quantity is allowed for USER
            .price(new BigDecimal("25.00"))
            .supplierId("supp-1")
            .build();
        
        when(service.update("item-1", dto)).thenReturn(dto);
        
        mvc.perform(put("/api/inventory/items/item-1")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto))
            .with(csrf()))
            .andExpect(status().isOk());
    }
    
    @Test
    @DisplayName("USER role CANNOT update price (403 FORBIDDEN)")
    @WithMockUser(roles = "USER")
    void userCannotUpdatePrice() throws Exception {
        InventoryItemDTO dto = InventoryItemDTO.builder()
            .id("item-1")
            .name("Widget")
            .quantity(100)
            .price(new BigDecimal("99.99"))  // ← Price update blocked for USER
            .supplierId("supp-1")
            .build();
        
        // Service enforces field-level authorization
        when(service.update("item-1", dto))
            .thenThrow(new AccessDeniedException("Price field restricted"));
        
        mvc.perform(put("/api/inventory/items/item-1")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto))
            .with(csrf()))
            .andExpect(status().isForbidden());
    }
    
    @Test
    @DisplayName("ADMIN role can update all fields including price")
    @WithMockUser(roles = "ADMIN")
    void adminCanUpdateAllFields() throws Exception {
        InventoryItemDTO dto = InventoryItemDTO.builder()
            .id("item-1")
            .name("Widget Updated")
            .quantity(200)
            .price(new BigDecimal("99.99"))  // ← Price update allowed for ADMIN
            .supplierId("supp-1")
            .build();
        
        when(service.update("item-1", dto)).thenReturn(dto);
        
        mvc.perform(put("/api/inventory/items/item-1")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto))
            .with(csrf()))
            .andExpect(status().isOk());
    }
}
```

---

## Best Practices for Security Testing

### ✅ DO

- [ ] Test both happy path and denial paths
- [ ] Verify all role combinations for protected endpoints
- [ ] Include CSRF tokens in mutation tests (POST/PUT/DELETE)
- [ ] Test unauthenticated access (should be 401)
- [ ] Test insufficient role access (should be 403)
- [ ] Verify CORS headers in cross-origin scenarios
- [ ] Test demo mode restrictions separately
- [ ] Verify field-level authorization for sensitive fields
- [ ] Document role requirements in test names

### ❌ DON'T

- [ ] Hardcode user credentials in tests
- [ ] Skip CSRF testing for mutations
- [ ] Assume all endpoints need same authorization
- [ ] Mock SecurityContext directly (use @WithMockUser)
- [ ] Test Spring Security itself (trust the framework)
- [ ] Leave OAuth2 config undocumented
- [ ] Ignore CORS requirements
- [ ] Test with real production OAuth2 credentials

---

## Test Security Configuration

### TestSecurityConfig

```java
@TestConfiguration
public class TestSecurityConfig {
    
    @Bean
    public ClientRegistrationRepository clientRegistrationRepository() {
        ClientRegistration google = ClientRegistration.withRegistrationId("google")
            .clientId("test-client-id")
            .clientSecret("test-client-secret")
            .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
            .redirectUri("http://localhost:8080/login/oauth2/code/google")
            .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
            .tokenUri("https://oauth2.googleapis.com/token")
            .userInfoUri("https://www.googleapis.com/oauth2/v2/userinfo")
            .userNameAttributeName("email")
            .build();
        
        return new InMemoryClientRegistrationRepository(google);
    }
}
```

---

## Related Documentation

- **[Testing Index](./index.html)** - Complete testing strategy
- **[Integration Testing](./integration-testing.html)** - Controller and repository testing
- **[Unit Testing](./unit-testing.html)** - Component isolation
- **[Test Fixtures & Data Builders](./test-fixtures.html)** - Helper patterns and OAuth2 authentication setup
- **[Security Architecture](../security/index.html)** - OAuth2 and RBAC design

---

[⬅️ Back to Testing Index](./index.html)
