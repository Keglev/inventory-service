[⬅️ Back to Testing Index](./index.html)

# Integration Testing

## Overview

Integration tests verify **component interactions** with real infrastructure (databases, frameworks). They're slower than unit tests but provide higher confidence by testing realistic scenarios.

---

## Integration Testing Characteristics

| Aspect | Detail |
|--------|--------|
| **Scope** | Multiple components working together |
| **Dependencies** | Mix of real and mocked (DB real, external APIs mocked) |
| **Speed** | 100ms - 1s per test |
| **Framework** | @DataJpaTest, @WebMvcTest, @SpringBootTest |
| **Database** | H2 (fast) or TestContainers (realistic) |
| **Benefits** | Validates persistence, HTTP contracts, component wiring |

---

## @DataJpaTest - Repository Testing

### What It Does

- Loads only JPA/database components (no web, security, services)
- Provides `@Autowired` EntityManager and Repositories
- Auto-configures H2 in-memory database
- Rolls back transaction after each test

### Example: SupplierRepositoryTest

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@ActiveProfiles("test")
@Import(DatabaseDialectDetector.class)
class SupplierRepositoryTest {
    
    @Autowired
    private SupplierRepository supplierRepository;
    
    /**
     * Helper: Create and persist a supplier.
     */
    private Supplier save(String name) {
        Supplier s = Supplier.builder()
            .id("sup-" + UUID.randomUUID())
            .name(name)
            .contactName("John Doe")
            .email("contact@example.com")
            .phone("+49 123 456")
            .createdBy("admin")
            .build();
        return supplierRepository.save(s);
    }
    
    // ========== findByNameIgnoreCase() tests ==========
    
    @Test
    @DisplayName("findByNameIgnoreCase → exact match only (case-insensitive)")
    void findByNameIgnoreCase_exact_caseInsensitive() {
        save("Acme GmbH");
        
        // Should match various cases
        assertTrue(supplierRepository.findByNameIgnoreCase("Acme GmbH").isPresent());
        assertTrue(supplierRepository.findByNameIgnoreCase("acme gmbh").isPresent());
        assertTrue(supplierRepository.findByNameIgnoreCase("ACME GMBH").isPresent());
        
        // Should NOT match partials
        assertTrue(supplierRepository.findByNameIgnoreCase("Acme").isEmpty());
        assertTrue(supplierRepository.findByNameIgnoreCase("GmbH").isEmpty());
    }
    
    @Test
    @DisplayName("findByNameIgnoreCase → empty when not found")
    void findByNameIgnoreCase_notFound_returnsEmpty() {
        save("Acme GmbH");
        
        assertTrue(supplierRepository.findByNameIgnoreCase("Unknown Corp").isEmpty());
    }
    
    // ========== findByNameContainingIgnoreCase() tests ==========
    
    @Test
    @DisplayName("findByNameContainingIgnoreCase → substring search (case-insensitive)")
    void findByNameContaining_substringSearch() {
        save("Acme GmbH");
        save("Acme Trading");
        save("Beta Corp");
        
        List<Supplier> results = supplierRepository
            .findByNameContainingIgnoreCase("acme");
        
        assertEquals(2, results.size());
        assertTrue(results.stream().anyMatch(s -> s.getName().equals("Acme GmbH")));
        assertTrue(results.stream().anyMatch(s -> s.getName().equals("Acme Trading")));
    }
    
    // ========== existsByNameIgnoreCase() tests ==========
    
    @Test
    @DisplayName("existsByNameIgnoreCase → true when exists (case-insensitive)")
    void existsByNameIgnoreCase_found_returnsTrue() {
        save("Acme GmbH");
        
        assertTrue(supplierRepository.existsByNameIgnoreCase("acme gmbh"));
        assertTrue(supplierRepository.existsByNameIgnoreCase("ACME GMBH"));
    }
    
    @Test
    @DisplayName("existsByNameIgnoreCase → false when not exists")
    void existsByNameIgnoreCase_notFound_returnsFalse() {
        save("Acme GmbH");
        
        assertFalse(supplierRepository.existsByNameIgnoreCase("Unknown Corp"));
    }
}
```

---

## @WebMvcTest - Controller Testing

### What It Does

- Loads only web layer (controllers, security, MockMvc)
- Mocks services via `@MockitoBean`
- No database or full context initialization
- Provides `MockMvc` for HTTP testing

### Example: SupplierControllerTest

```java
@WebMvcTest(SupplierController.class)
@Import({ TestSecurityConfig.class, GlobalExceptionHandler.class })
@ActiveProfiles("test")
class SupplierControllerTest {
    
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    
    @MockitoBean SupplierService supplierService;  // Mocked
    
    SupplierDTO dto;
    
    @BeforeEach
    void setUp() {
        dto = SupplierDTO.builder()
            .id("sup-1")
            .name("Acme GmbH")
            .contactName("Alice")
            .email("alice@acme.test")
            .createdBy("admin")
            .build();
    }
    
    // ========== GET /api/suppliers/{id} ==========
    
    @Test
    @DisplayName("GET /api/suppliers/{id}: with ADMIN role returns 200")
    @WithMockUser(roles = "ADMIN")
    void getById_adminRole_returns200() throws Exception {
        when(supplierService.findById("sup-1"))
            .thenReturn(dto);
        
        mockMvc.perform(get("/api/suppliers/sup-1")
            .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value("sup-1"))
            .andExpect(jsonPath("$.name").value("Acme GmbH"));
    }
    
    @Test
    @DisplayName("GET /api/suppliers/{id}: without auth returns 401")
    void getById_noAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/suppliers/sup-1"))
            .andExpect(status().isUnauthorized());
    }
    
    @Test
    @DisplayName("GET /api/suppliers/{id}: not found returns 404")
    @WithMockUser(roles = "USER")
    void getById_notFound_returns404() throws Exception {
        when(supplierService.findById("nonexistent"))
            .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND));
        
        mockMvc.perform(get("/api/suppliers/nonexistent"))
            .andExpect(status().isNotFound());
    }
    
    // ========== POST /api/suppliers ==========
    
    @Test
    @DisplayName("POST /api/suppliers: with valid data returns 201 CREATED")
    @WithMockUser(roles = "ADMIN")
    void create_validData_returns201() throws Exception {
        SupplierDTO saved = SupplierDTO.builder()
            .id("sup-new-1")
            .name("Acme GmbH")
            .contactName("Alice")
            .email("alice@acme.test")
            .createdBy("admin")
            .build();
        
        when(supplierService.create(any(SupplierDTO.class)))
            .thenReturn(saved);
        
        mockMvc.perform(post("/api/suppliers")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto))
            .with(csrf()))
            .andExpect(status().isCreated())
            .andExpect(header().exists("Location"))
            .andExpect(jsonPath("$.id").value("sup-new-1"));
    }
    
    @Test
    @DisplayName("POST /api/suppliers: duplicate name returns 409 CONFLICT")
    @WithMockUser(roles = "ADMIN")
    void create_duplicateName_returns409() throws Exception {
        when(supplierService.create(any(SupplierDTO.class)))
            .thenThrow(new DuplicateResourceException("Already exists"));
        
        mockMvc.perform(post("/api/suppliers")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto))
            .with(csrf()))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").exists());
    }
    
    @Test
    @DisplayName("POST /api/suppliers: USER role returns 403 FORBIDDEN")
    @WithMockUser(roles = "USER")
    void create_userRole_returns403() throws Exception {
        mockMvc.perform(post("/api/suppliers")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto))
            .with(csrf()))
            .andExpect(status().isForbidden());
    }
    
    @Test
    @DisplayName("POST /api/suppliers: blank name returns 400 BAD_REQUEST")
    @WithMockUser(roles = "ADMIN")
    void create_blankName_returns400() throws Exception {
        SupplierDTO invalid = SupplierDTO.builder()
            .name("")  // blank
            .contactName("Alice")
            .email("alice@acme.test")
            .createdBy("admin")
            .build();
        
        mockMvc.perform(post("/api/suppliers")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(invalid))
            .with(csrf()))
            .andExpect(status().isBadRequest());
    }
    
    // ========== PUT /api/suppliers/{id} ==========
    
    @Test
    @DisplayName("PUT /api/suppliers/{id}: with valid data returns 200 OK")
    @WithMockUser(roles = "ADMIN")
    void update_validData_returns200() throws Exception {
        SupplierDTO updated = SupplierDTO.builder()
            .id("sup-1")
            .name("Acme GmbH Updated")
            .contactName("Bob")
            .email("bob@acme.test")
            .createdBy("admin")
            .build();
        
        when(supplierService.update("sup-1", dto))
            .thenReturn(updated);
        
        mockMvc.perform(put("/api/suppliers/sup-1")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto))
            .with(csrf()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Acme GmbH Updated"));
    }
    
    // ========== DELETE /api/suppliers/{id} ==========
    
    @Test
    @DisplayName("DELETE /api/suppliers/{id}: success returns 204 NO_CONTENT")
    @WithMockUser(roles = "ADMIN")
    void delete_success_returns204() throws Exception {
        mockMvc.perform(delete("/api/suppliers/sup-1").with(csrf()))
            .andExpect(status().isNoContent());
        
        verify(supplierService).delete("sup-1");
    }
    
    @Test
    @DisplayName("DELETE /api/suppliers/{id}: with linked items returns 409 CONFLICT")
    @WithMockUser(roles = "ADMIN")
    void delete_linkedItems_returns409() throws Exception {
        doThrow(new IllegalStateException("Cannot delete supplier with linked items"))
            .when(supplierService).delete("sup-1");
        
        mockMvc.perform(delete("/api/suppliers/sup-1").with(csrf()))
            .andExpect(status().isConflict());
    }
}
```

---

## MockMvc Testing Patterns

### HTTP Request Building

```java
// GET request
mockMvc.perform(get("/api/suppliers/123")
    .header("Accept", "application/json"))

// POST with request body
mockMvc.perform(post("/api/suppliers")
    .contentType(MediaType.APPLICATION_JSON)
    .content(objectMapper.writeValueAsString(dto))
    .with(csrf()))  // ← Required for POST/PUT/DELETE

// PUT with path parameter
mockMvc.perform(put("/api/suppliers/{id}", "sup-1")
    .contentType(MediaType.APPLICATION_JSON)
    .content(json)
    .with(csrf()))

// DELETE with role
mockMvc.perform(delete("/api/suppliers/sup-1")
    .with(user("admin").roles("ADMIN"))
    .with(csrf()))
```

### Response Assertions

```java
// Status codes
.andExpect(status().isOk())                    // 200
.andExpect(status().isCreated())               // 201
.andExpect(status().isNoContent())             // 204
.andExpect(status().isBadRequest())            // 400
.andExpect(status().isUnauthorized())          // 401
.andExpect(status().isForbidden())             // 403
.andExpect(status().isNotFound())              // 404
.andExpect(status().isConflict())              // 409

// JSON path assertions
.andExpect(jsonPath("$.id").value("sup-1"))
.andExpect(jsonPath("$.name").value("Acme"))
.andExpect(jsonPath("$.items[0].name").exists())
.andExpect(jsonPath("$.items.length()").value(2))

// Header assertions
.andExpect(header().exists("Location"))
.andExpect(header().string("Content-Type", "application/json"))

// Content assertions
.andExpect(content().contentType(MediaType.APPLICATION_JSON))
.andExpect(content().string(containsString("Acme")))
```

---

## @SpringBootTest - Full Integration Tests

### What It Does

- Loads entire application context (all beans, profiles)
- Provides real database (TestContainers or H2)
- Allows testing end-to-end workflows
- Slower but highest confidence

### Example: Security Smoke Test

```java
@SpringBootTest
@AutoConfigureMockMvc
class SecuritySmokeTest {
    
    @Autowired MockMvc mvc;
    @Autowired AppProperties appProperties;
    
    @Test
    @DisplayName("Security context loads successfully")
    void contextLoads() {
        assertThat(appProperties).isNotNull();
    }
    
    @Test
    @DisplayName("ADMIN role can access admin endpoints")
    @WithMockUser(roles = "ADMIN")
    void adminCanAccessAdmin() throws Exception {
        mvc.perform(get("/api/admin/ping"))
            .andExpect(status().isOk())
            .andExpect(content().string("admin ok"));
    }
    
    @Test
    @DisplayName("OAuth2 endpoints are configured")
    void oauth2EndpointsReachable() throws Exception {
        mvc.perform(get("/oauth2/authorization/google"))
            .andExpect(status().is3xxRedirection());
    }
}
```

---

## Test Database Configuration

### H2 Configuration (application-test.properties)

```properties
# Use H2 in Oracle compatibility mode for fast tests
spring.datasource.url=jdbc:h2:mem:testdb;MODE=Oracle
spring.datasource.driverClassName=org.h2.Driver
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect

# Disable H2 console
spring.h2.console.enabled=false

# Show SQL for debugging (optional)
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false
```

### TestContainers Configuration (Optional)

```java
@SpringBootTest
@Testcontainers  // Enable TestContainers
class IntegrationTestWithOracleTest {
    
    @Container
    static OracleContainer oracle = new OracleContainer(
        "gvenzl/oracle-free:latest"
    );
    
    static {
        Testcontainers.exposeHostPorts(1521);
    }
}
```

---

## Testing Transactional Behavior

### @Transactional in Tests

```java
@DataJpaTest
class RepositoryTransactionTest {
    
    @Autowired private SupplierRepository repo;
    
    @Test
    @Transactional  // This test runs in a transaction
    void createAndQuery_inTransaction() {
        Supplier s = Supplier.builder().name("Acme").build();
        s = repo.save(s);
        
        // Can query immediately within transaction
        assertTrue(repo.findByNameIgnoreCase("Acme").isPresent());
    }
    
    @Test
    // No @Transactional = test runs without transaction
    // Each test auto-rolls back after completion
    void createAndVerifyRollback() {
        // Default behavior: test changes are rolled back
    }
}
```

---

## Best Practices for Integration Tests

### ✅ DO

- [ ] Test realistic component interactions
- [ ] Use `@DataJpaTest` for repository tests (fast slice)
- [ ] Use `@WebMvcTest` for controller tests (isolated)
- [ ] Use `@SpringBootTest` for end-to-end workflows
- [ ] Mock services not needed for the test
- [ ] Use `@MockitoBean` for selective mocking
- [ ] Test happy path and error scenarios
- [ ] Verify persistence side effects
- [ ] Check HTTP status codes and response format

### ❌ DON'T

- [ ] Start with `@SpringBootTest` (slow down test suite)
- [ ] Test framework features (JPA, Spring, etc.)
- [ ] Load unnecessary beans/profiles
- [ ] Mock everything (defeats purpose of integration tests)
- [ ] Leave database data between tests
- [ ] Ignore HTTP status codes and headers
- [ ] Assume JSON structure without assertions
- [ ] Make tests depend on external services

---

## Related Documentation

- **[Testing Index](./index.html)** - Complete testing strategy
- **[Unit Testing](./unit-testing.html)** - Component isolation patterns
- **[Test Fixtures & Data Builders](./test-fixtures.html)** - Helper patterns and test data creation
- **[Security Testing](./security-testing.html)** - Authentication and RBAC tests
- **[Controller Documentation](../controller/index.html)** - Endpoint contracts

---

[⬅️ Back to Testing Index](./index.html)
