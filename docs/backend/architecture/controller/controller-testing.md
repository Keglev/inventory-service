[⬅️ Back to Controller Overview](./index.md)

# Controller Testing Strategy

## Overview

This document outlines testing patterns for REST controllers, including unit tests (`@WebMvcTest`) and integration tests (`@SpringBootTest`). Covers endpoint validation, authorization checks, and response shape verification.

**Test Location:** `src/test/java/.../controller/`  
**Frameworks:** JUnit 5, Mockito, Spring Test, RestAssured

---

## Testing Pyramid

```mermaid
graph TB
    A["Testing Pyramid"]
    
    A --> B["E2E Tests<br/>Full app + database"]
    B --> BX["10% of tests<br/>Slow, realistic"]
    
    A --> C["Integration Tests<br/>@SpringBootTest<br/>MockMvc + Real Spring Context"]
    C --> CX["20% of tests<br/>Medium speed"]
    
    A --> D["Unit Tests<br/>@WebMvcTest<br/>Mocked Services"]
    D --> DX["70% of tests<br/>Fast feedback"]
    
    style A fill:#fff9c4
    style B fill:#ffcdd2
    style C fill:#ffe0b2
    style D fill:#c8e6c9
```

---

## Unit Testing with @WebMvcTest

### Purpose

Test controller request/response mapping **without** service layer.

### Template

```java
@WebMvcTest(SupplierController.class)
class SupplierControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private SupplierService supplierService;
    
    @Test
    void testGetSupplier_Returns200WithData() throws Exception {
        // ARRANGE
        SupplierDTO mockSupplier = new SupplierDTO(
            "SUP-001", "ACME Corp", "acme@example.com", "active", null
        );
        when(supplierService.getSupplier("SUP-001"))
            .thenReturn(Optional.of(mockSupplier));
        
        // ACT & ASSERT
        mockMvc.perform(
            get("/api/suppliers/SUP-001")
                .contentType(MediaType.APPLICATION_JSON)
        )
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value("SUP-001"))
        .andExpect(jsonPath("$.name").value("ACME Corp"));
        
        // VERIFY
        verify(supplierService, times(1)).getSupplier("SUP-001");
    }
}
```

### Characteristics

| Aspect | Detail |
|--------|--------|
| **Speed** | Very fast (~50ms per test) |
| **Isolation** | Services mocked, pure MVC testing |
| **Scope** | Controller layer only (routing, binding, serialization) |
| **Deployment** | @WebMvcTest creates minimal Spring context |
| **Mocking** | @MockBean for services, repositories |

### Common Assertions

```java
// Status codes
.andExpect(status().isOk())
.andExpect(status().isCreated())
.andExpect(status().isBadRequest())
.andExpect(status().isUnauthorized())
.andExpect(status().isForbidden())
.andExpect(status().isNotFound())

// JSON path assertions
.andExpect(jsonPath("$.id").exists())
.andExpect(jsonPath("$.id").value("SUP-001"))
.andExpect(jsonPath("$.suppliers[0].name").value("ACME"))
.andExpect(jsonPath("$", hasSize(3)))

// Headers
.andExpect(header().exists("Location"))
.andExpect(header().string("Content-Type", containsString("application/json")))

// Content
.andExpect(content().json("{\"id\":\"SUP-001\"}"))
```

---

## Integration Testing with @SpringBootTest

### Purpose

Test controllers with **real services** and database operations.

### Template

```java
@SpringBootTest
@ActiveProfiles("test")  // Uses H2, application-test.yml
class SupplierControllerIntegrationTest {
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Autowired
    private SupplierRepository supplierRepository;
    
    @BeforeEach
    void setup() {
        supplierRepository.deleteAll();
        supplierRepository.save(new Supplier(
            "SUP-001", "ACME Corp", "acme@example.com", "active"
        ));
    }
    
    @Test
    void testGetSupplier_WithRealDatabase() {
        ResponseEntity<SupplierDTO> response = restTemplate.getForEntity(
            "/api/suppliers/SUP-001",
            SupplierDTO.class
        );
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getName()).isEqualTo("ACME Corp");
    }
}
```

### Characteristics

| Aspect | Detail |
|--------|--------|
| **Speed** | Slower (~500ms per test), but realistic |
| **Isolation** | Full Spring context, real services, H2 database |
| **Scope** | End-to-end from controller to database |
| **Deployment** | Full `@SpringBootTest` application context |
| **Database** | H2 in-memory (from `application-test.yml`) |

---

## Authorization Testing

### Testing @PreAuthorize Annotations

```java
@WebMvcTest(SupplierController.class)
class SupplierControllerSecurityTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private SupplierService supplierService;
    
    @Test
    @WithAnonymousUser  // No authentication
    void testCreateSupplier_WithAnonymous_Returns403() throws Exception {
        mockMvc.perform(
            post("/api/suppliers")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": \"New Corp\"}")
        )
        .andExpect(status().isForbidden());
    }
    
    @Test
    @WithMockUser(roles = "USER")  // USER role
    void testCreateSupplier_WithUserRole_Returns403() throws Exception {
        mockMvc.perform(
            post("/api/suppliers")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": \"New Corp\"}")
        )
        .andExpect(status().isForbidden());  // Only ADMIN allowed
    }
    
    @Test
    @WithMockUser(roles = "ADMIN")  // ADMIN role
    void testCreateSupplier_WithAdminRole_Returns201() throws Exception {
        SupplierDTO newSupplier = new SupplierDTO(
            "SUP-999", "New Corp", "new@example.com", "active", null
        );
        when(supplierService.createSupplier(any()))
            .thenReturn(newSupplier);
        
        mockMvc.perform(
            post("/api/suppliers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newSupplier))
        )
        .andExpect(status().isCreated());
    }
}
```

### Authorization Annotations

| Annotation | Use Case |
|-----------|----------|
| `@WithAnonymousUser` | Test public endpoints & 403 paths |
| `@WithMockUser` | Test authenticated USER behavior |
| `@WithMockUser(roles="ADMIN")` | Test ADMIN-only endpoints |
| `@WithSecurityContext` | Custom security context setup |

---

## Endpoint Testing by Controller

### Supplier Controller Tests

**Location:** `src/test/java/.../controller/supplier/`

```
SupplierControllerTest
├── testGetSuppliers_Returns200WithPagination
├── testGetSupplier_WithValidId_Returns200
├── testGetSupplier_WithInvalidId_Returns404
├── testCreateSupplier_WithAdminRole_Returns201
├── testCreateSupplier_WithUserRole_Returns403
├── testUpdateSupplier_WithValidData_Returns200
├── testDeleteSupplier_SoftDelete_Returns204
└── testSearchSupplier_ByName_ReturnsList

SupplierControllerSecurityTest
├── testCreateSupplier_WithAnonymousUser_Returns403
├── testUpdateSupplier_WithAnonymousUser_Returns403
└── testDeleteSupplier_WithAnonymousUser_Returns403
```

### Inventory Item Controller Tests

**Location:** `src/test/java/.../controller/inventoryitem/`

```
InventoryItemControllerTest
├── testGetItems_WithDefaultPagination_Returns20Items
├── testGetItems_WithSortByPrice_ReturnsSorted
├── testGetItem_WithValidId_Returns200
├── testCreateItem_WithValidData_Returns201
├── testUpdateItem_WithValidData_Returns200
├── testDeleteItem_SoftDelete_Returns204
├── testUpdateStock_IncreasesQuantity_UpdatesStockHistory
├── testUpdateStock_DecreasesQuantity_CreatesNegativeEntry
└── testSearchItem_ByName_ReturnsList

InventoryItemControllerSecurityTest
├── testUpdateStock_WithUserRole_Returns403
├── testCreateItem_WithDemoMode_Returns405
└── testDeleteItem_WithUserRole_Returns403
```

### Stock History Controller Tests

**Location:** `src/test/java/.../controller/stockhistory/`

```
StockHistoryControllerTest
├── testGetStockHistory_Paginated_Returns20Items
├── testGetStockHistoryById_WithValidId_Returns200
├── testGetHistoryByItem_Filtered_ReturnsList
├── testGetHistoryBySupplier_Filtered_ReturnsList
└── testGetHistoryWithDateRange_Filtered_ReturnsList

StockHistoryControllerSecurityTest
└── testGetStockHistory_PublicDemo_Returns200
```

### Auth Controller Tests

**Location:** `src/test/java/.../controller/auth/`

```
AuthControllerTest
├── testGetMe_WithAuthenticatedUser_Returns200WithProfile
├── testGetMe_WithAnonymousUser_RedirectsToLogin
└── testLogout_InvalidatesSession_Returns302Redirect

AuthControllerSecurityTest
├── testGetMe_CreatesSessionCookie_SameSiteNone
├── testLogout_ClearsSessionCookie
└── testOAuth2Login_AssignsUserRole_ByDefault
```

### Analytics Controller Tests

**Location:** `src/test/java/.../controller/analytics/`

```
AnalyticsControllerTest
├── testDashboardSummary_CalculatesKPIs_Returns200
├── testFinancialSummary_WithDateRange_Returns200
├── testStockValue_TimeSeries_ReturnsList
├── testStockPerSupplier_Distribution_ReturnsList
├── testPriceTrends_WithSupplierFilter_ReturnsList
└── testMonthlyMovement_AggregatesData_ReturnsList

AnalyticsControllerSecurityTest
└── testDashboardSummary_PublicDemo_Returns200
```

---

## Response Shape Validation

### Verify Paginated Responses

```java
@Test
void testGetSuppliers_WithPagination_ReturnsPageStructure() throws Exception {
    mockMvc.perform(
        get("/api/suppliers?page=0&size=20")
            .contentType(MediaType.APPLICATION_JSON)
    )
    .andExpect(status().isOk())
    .andExpect(jsonPath("$.content").isArray())
    .andExpect(jsonPath("$.content[0].id").exists())
    .andExpect(jsonPath("$.pageable.pageNumber").value(0))
    .andExpect(jsonPath("$.pageable.pageSize").value(20))
    .andExpect(jsonPath("$.totalElements").isNumber());
}
```

### Verify Single Resource Response

```java
@Test
void testGetSupplier_ReturnsDTOStructure() throws Exception {
    mockMvc.perform(get("/api/suppliers/SUP-001"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value("SUP-001"))
        .andExpect(jsonPath("$.name").value("ACME Corp"))
        .andExpect(jsonPath("$.email").value("acme@example.com"))
        .andExpect(jsonPath("$.status").value("active"));
}
```

### Verify Error Response

```java
@Test
void testGetSupplier_WithInvalidId_Returns404WithErrorMessage() throws Exception {
    mockMvc.perform(get("/api/suppliers/INVALID"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.error").value("SUPPLIER_NOT_FOUND"))
        .andExpect(jsonPath("$.message").exists())
        .andExpect(jsonPath("$.timestamp").exists());
}
```

---

## Mocking Services

### Mock Service Dependencies

```java
@WebMvcTest(SupplierController.class)
class SupplierControllerTest {
    
    @MockBean
    private SupplierService supplierService;
    
    // Mock responses for service calls
    @Test
    void testGetSupplier_DelegatestoService() throws Exception {
        SupplierDTO mock = new SupplierDTO("SUP-001", "ACME", ...);
        when(supplierService.getSupplier("SUP-001"))
            .thenReturn(Optional.of(mock));
        
        mockMvc.perform(get("/api/suppliers/SUP-001"))
            .andExpect(status().isOk());
        
        verify(supplierService).getSupplier("SUP-001");
    }
}
```

### Mock Exception Throwing

```java
@Test
void testGetSupplier_WithServiceException_Returns500() throws Exception {
    when(supplierService.getSupplier(any()))
        .thenThrow(new DatabaseException("Connection timeout"));
    
    mockMvc.perform(get("/api/suppliers/INVALID"))
        .andExpect(status().isInternalServerError());
}
```

---

## Running Tests

### Run All Tests

```bash
# Maven
mvn clean test

# Gradle
gradle clean test
```

### Run Specific Test Class

```bash
mvn test -Dtest=SupplierControllerTest
```

### Run Specific Test Method

```bash
mvn test -Dtest=SupplierControllerTest#testGetSupplier_Returns200WithData
```

### Run with Coverage

```bash
mvn clean test jacoco:report
# Report: target/site/jacoco/index.html
```

---

## Test Coverage Goals

| Layer | Target | Rationale |
|-------|--------|-----------|
| **Controller** | >80% | Business logic verified |
| **Service** | >85% | Critical business rules |
| **Repository** | >70% | Query logic tested |
| **Overall** | >75% | Adequate safety net |

---

## Best Practices

```
✅ DO:
  • One test per scenario (single assertion focus)
  • Use @BeforeEach for common setup
  • Name tests clearly: testMethod_Condition_Expected
  • Mock external dependencies (@MockBean)
  • Test authorization separately from business logic
  • Use @ActiveProfiles("test") for H2 database
  • Verify method calls with verify()

❌ DON'T:
  • Test framework code (Spring handles it)
  • Create tight coupling between tests
  • Use Thread.sleep() (use testcontainers instead)
  • Skip authorization tests
  • Mix @WebMvcTest with real database
  • Test multiple scenarios in one test
```

---

## Summary

| Test Type | Use Case | Speed | Isolation | Coverage |
|-----------|----------|-------|-----------|----------|
| **Unit (@WebMvcTest)** | Controller logic, routing | Fast | High | Shallow (controller only) |
| **Integration (@SpringBootTest)** | End-to-end flows | Slow | Low | Deep (full stack) |
| **Authorization** | Role checks, @PreAuthorize | Medium | Medium | Security coverage |

**Recommended Ratio:** 70% unit + 20% integration + 10% E2E tests.

---

[⬅️ Back to Controller Overview](./index.md)
