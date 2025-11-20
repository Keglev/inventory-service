[⬅️ Back to Testing Index](./index.html)

# Unit Testing Patterns

## Overview

Unit tests verify individual components in **isolation** with **mocked dependencies**. They are the foundation of the testing pyramid, providing fast feedback for logic errors.

---

## Unit Testing Characteristics

| Aspect | Detail |
|--------|--------|
| **Scope** | Single class/method in isolation |
| **Dependencies** | All mocked (repositories, services, external APIs) |
| **Speed** | Milliseconds per test |
| **Framework** | JUnit 5 + Mockito, no Spring context |
| **Database** | None - all interactions mocked |
| **Failure Cause** | Clearly pinpoints logic error |

---

## JUnit 5 & Mockito Setup

### Annotations

```java
@ExtendWith(MockitoExtension.class)  // Enable Mockito for this test class
@MockitoSettings(strictness = Strictness.LENIENT)  // Optional: lenient stub checking
class MyServiceTest {
    
    @Mock           // Create mock dependency
    private UserRepository userRepository;
    
    @InjectMocks    // Inject mocks into service
    private UserService userService;
    
    @Test           // This is a test method
    void someTest() { }
    
    @BeforeEach     // Setup before each test
    void setup() { }
}
```

### Basic Assertions

```java
// Static imports
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

// Assertions
assertEquals(expected, actual);
assertNotNull(value);
assertThrows(Exception.class, () -> method());
assertTrue(condition);
assertFalse(condition);
```

---

## Validator Unit Tests

### Example: InventoryItemValidatorTest

```java
@ExtendWith(MockitoExtension.class)
class InventoryItemValidatorTest {
    
    @Mock
    private InventoryItemRepository repo;
    
    private InventoryItemDTO validDTO() {
        return InventoryItemDTO.builder()
            .name("Monitor")
            .quantity(10)
            .price(new BigDecimal("199.99"))
            .supplierId("supplier-1")
            .build();
    }
    
    // ========== validateBase() tests ==========
    
    @Test
    void validateBase_validInput_passes() {
        assertDoesNotThrow(() -> 
            InventoryItemValidator.validateBase(validDTO())
        );
    }
    
    @Test
    void validateBase_nullName_throwsException() {
        InventoryItemDTO dto = validDTO();
        dto.setName(null);
        
        Exception e = assertThrows(IllegalArgumentException.class, () ->
            InventoryItemValidator.validateBase(dto)
        );
        
        assertEquals("Product name cannot be null or empty", e.getMessage());
    }
    
    @Test
    void validateBase_negativeQuantity_throwsException() {
        InventoryItemDTO dto = validDTO();
        dto.setQuantity(-1);
        
        assertThrows(IllegalArgumentException.class, () ->
            InventoryItemValidator.validateBase(dto)
        );
    }
    
    @Test
    void validateBase_zeroPriceOrBelow_throwsException() {
        InventoryItemDTO dto = validDTO();
        dto.setPrice(BigDecimal.ZERO);
        
        assertThrows(IllegalArgumentException.class, () ->
            InventoryItemValidator.validateBase(dto)
        );
    }
    
    // ========== validateInventoryItemNotExists() tests ==========
    
    @Test
    void validateDuplicate_noExisting_passes() {
        when(repo.findByNameIgnoreCase("Monitor"))
            .thenReturn(List.of());
        
        assertDoesNotThrow(() -> 
            InventoryItemValidator.validateInventoryItemNotExists(
                "Monitor", new BigDecimal("199.99"), repo)
        );
    }
    
    @Test
    void validateDuplicate_existingWithSameName_Price_throwsConflict() {
        InventoryItem existing = InventoryItem.builder()
            .id("item-1")
            .name("Monitor")
            .price(new BigDecimal("199.99"))
            .build();
        
        when(repo.findByNameIgnoreCase("Monitor"))
            .thenReturn(List.of(existing));
        
        assertThrows(DuplicateResourceException.class, () ->
            InventoryItemValidator.validateInventoryItemNotExists(
                "Monitor", new BigDecimal("199.99"), repo)
        );
    }
    
    @Test
    void validateDuplicate_sameName_differentPrice_passes() {
        InventoryItem existing = InventoryItem.builder()
            .id("item-1")
            .name("Monitor")
            .price(new BigDecimal("199.99"))
            .build();
        
        when(repo.findByNameIgnoreCase("Monitor"))
            .thenReturn(List.of(existing));
        
        // Different price should NOT throw
        assertDoesNotThrow(() ->
            InventoryItemValidator.validateInventoryItemNotExists(
                "Monitor", new BigDecimal("249.99"), repo)  // ← Different price
        );
    }
    
    // ========== validateExists() tests ==========
    
    @Test
    void validateExists_itemExists_returnsItem() {
        InventoryItem item = InventoryItem.builder()
            .id("item-1")
            .name("Monitor")
            .build();
        
        when(repo.findById("item-1"))
            .thenReturn(Optional.of(item));
        
        InventoryItem result = InventoryItemValidator.validateExists("item-1", repo);
        
        assertEquals("item-1", result.getId());
    }
    
    @Test
    void validateExists_itemNotFound_throws404() {
        when(repo.findById("nonexistent"))
            .thenReturn(Optional.empty());
        
        assertThrows(ResponseStatusException.class, () ->
            InventoryItemValidator.validateExists("nonexistent", repo)
        );
    }
    
    // ========== assertFinalQuantityNonNegative() tests ==========
    
    @Test
    void assertFinalQuantity_zeroAllowed() {
        assertDoesNotThrow(() ->
            InventoryItemValidator.assertFinalQuantityNonNegative(0)
        );
    }
    
    @Test
    void assertFinalQuantity_positive_passes() {
        assertDoesNotThrow(() ->
            InventoryItemValidator.assertFinalQuantityNonNegative(100)
        );
    }
    
    @Test
    void assertFinalQuantity_negative_throws422() {
        ResponseStatusException e = assertThrows(ResponseStatusException.class, () ->
            InventoryItemValidator.assertFinalQuantityNonNegative(-50)
        );
        
        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, e.getStatusCode());
    }
}
```

---

## Service Unit Tests

### Example: InventoryItemServiceImplSaveTest

```java
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class InventoryItemServiceImplSaveTest {
    
    @Mock private InventoryItemRepository repository;
    @Mock private SupplierRepository supplierRepository;
    @Mock private StockHistoryService stockHistoryService;
    @Mock private InventoryItemValidationHelper validationHelper;
    @Mock private InventoryItemAuditHelper auditHelper;
    
    @InjectMocks
    private InventoryItemServiceImpl service;
    
    private InventoryItemDTO baseDto;
    
    @BeforeEach
    void setup() {
        // Authenticate as OAuth2 user for service context
        InventoryItemServiceImplTestHelper.authenticateAsOAuth2("admin", "ADMIN");
        
        baseDto = new InventoryItemDTO();
        baseDto.setName("Widget");
        baseDto.setQuantity(100);
        baseDto.setPrice(new BigDecimal("10.00"));
        baseDto.setSupplierId("S1");
        baseDto.setCreatedBy("admin");
        
        // Lenient mocking - don't fail on unexpected calls
        lenient().when(supplierRepository.existsById(anyString()))
            .thenReturn(true);
        lenient().when(repository.existsByNameIgnoreCase(anyString()))
            .thenReturn(false);
    }
    
    @Test
    @DisplayName("save: returns saved item with generated ID and logs INITIAL_STOCK")
    void save_shouldReturnSavedItem() {
        // Map DTO to entity
        InventoryItem toPersist = InventoryItemMapper.toEntity(baseDto);
        
        // Create saved entity with generated ID
        InventoryItem saved = copyOf(toPersist);
        saved.setId("item-1");
        
        // Mock repository to return saved entity
        when(repository.save(any(InventoryItem.class)))
            .thenReturn(saved);
        
        // Execute
        InventoryItemDTO result = service.save(baseDto);
        
        // Verify returned item has ID
        assertEquals("item-1", result.getId());
        assertEquals(new BigDecimal("10.00"), result.getPrice());
        
        // Verify audit helper called (which logs INITIAL_STOCK)
        verify(auditHelper).logInitialStock(any(InventoryItem.class));
    }
    
    @Test
    @DisplayName("save: duplicate name throws 409 CONFLICT")
    void save_duplicateName_throwsConflict() {
        // Mock repository to find duplicate
        when(repository.existsByNameIgnoreCase(anyString()))
            .thenReturn(true);
        
        // Should throw before reaching repository.save()
        assertThrows(DuplicateResourceException.class, () ->
            service.save(baseDto)
        );
    }
    
    @Test
    @DisplayName("save: supplier not found throws 404 NOT_FOUND")
    void save_supplierNotFound_throws404() {
        // Mock supplier not existing
        when(supplierRepository.existsById("S1"))
            .thenReturn(false);
        
        assertThrows(ResponseStatusException.class, () ->
            service.save(baseDto)
        );
    }
    
    @Test
    @DisplayName("save: missing supplier ID throws 400 BAD_REQUEST")
    void save_missingSupplierId_throwsBadRequest() {
        baseDto.setSupplierId(null);
        
        assertThrows(InvalidRequestException.class, () ->
            service.save(baseDto)
        );
    }
}
```

---

## Parameterized Tests

### Testing Multiple Scenarios

```java
@ParameterizedTest
@ValueSource(strings = { "", " ", "  " })
@DisplayName("validateBase: blank names rejected")
void validateBase_blankNames_throw(String blankName) {
    InventoryItemDTO dto = validDTO();
    dto.setName(blankName);
    
    assertThrows(IllegalArgumentException.class, () ->
        InventoryItemValidator.validateBase(dto)
    );
}

@ParameterizedTest
@ValueSource(ints = { -1, -100, Integer.MIN_VALUE })
@DisplayName("validateBase: negative quantities rejected")
void validateBase_negativeQuantities_throw(int qty) {
    InventoryItemDTO dto = validDTO();
    dto.setQuantity(qty);
    
    assertThrows(IllegalArgumentException.class, () ->
        InventoryItemValidator.validateBase(dto)
    );
}

@ParameterizedTest
@CsvSource({
    "0.00, true",          // Zero - should throw
    "-1.50, true",         // Negative - should throw
    "0.01, false",         // Positive - should pass
    "999.99, false"        // Positive - should pass
})
@DisplayName("validateBase: price validation")
void validateBase_priceValidation(String priceStr, boolean shouldThrow) {
    InventoryItemDTO dto = validDTO();
    dto.setPrice(new BigDecimal(priceStr));
    
    if (shouldThrow) {
        assertThrows(IllegalArgumentException.class, () ->
            InventoryItemValidator.validateBase(dto)
        );
    } else {
        assertDoesNotThrow(() ->
            InventoryItemValidator.validateBase(dto)
        );
    }
}
```

---

## Mocking Best Practices

### When to Use Mocks vs Real Objects

```java
// ✅ GOOD: Mock external dependencies
@Mock private InventoryItemRepository repo;  // External DB
@Mock private StockHistoryService service;   // External service
@Mock private HttpClient httpClient;         // External API

// ❌ AVOID: Mock the object being tested
@Mock private InventoryItemValidator validator;  // ← Don't do this

// ✅ GOOD: Use real objects for value types
private BigDecimal price = new BigDecimal("25.99");
private InventoryItemDTO dto = InventoryItemDTO.builder()...build();
```

### Stubbing vs Verification

```java
// STUBBING - Tell mock what to return
when(repo.findById("item-1"))
    .thenReturn(Optional.of(item));

// VERIFICATION - Verify mock was called correctly
verify(repo).save(any(InventoryItem.class));
verify(repo, times(2)).findById(anyString());
verify(repo, never()).delete(any());

// LENIENT - Don't fail on unexpected calls
lenient().when(repo.existsById(anyString()))
    .thenReturn(true);
```

---

## Test Organization Patterns

### 1. Given-When-Then (GWT) Pattern

```java
@Test
@DisplayName("create: valid data creates item and returns 201")
void create_validData_returns201() {
    // GIVEN - Setup initial state
    InventoryItemDTO dto = validDTO();
    InventoryItem savedItem = InventoryItemMapper.toEntity(dto);
    savedItem.setId("item-123");
    when(repository.save(any())).thenReturn(savedItem);
    
    // WHEN - Execute the action
    InventoryItemDTO result = service.create(dto);
    
    // THEN - Verify the result
    assertNotNull(result.getId());
    assertEquals("item-123", result.getId());
    verify(repository).save(any());
}
```

### 2. Arrange-Act-Assert (AAA) Pattern

```java
@Test
void validateExists_itemNotFound_throws404() {
    // ARRANGE - Setup dependencies
    when(repo.findById("nonexistent"))
        .thenReturn(Optional.empty());
    
    // ACT - Execute the method
    ResponseStatusException exception = assertThrows(
        ResponseStatusException.class, () ->
        InventoryItemValidator.validateExists("nonexistent", repo)
    );
    
    // ASSERT - Verify outcomes
    assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
}
```

### 3. Test Method Naming

```java
// Pattern: [methodName]_[scenario]_[expectedResult]
void validateBase_nullName_throwsException()
void validateBase_validInput_passes()
void validateDuplicate_sameNameAndPrice_throwsConflict()
void validateDuplicate_sameName_differentPrice_passes()
void assertFinalQuantity_negative_throws422()
```

---

## Common Pitfalls

### ❌ Overly Complex Mocking

```java
// Bad: Complex setup obscures test purpose
when(repository.save(argThat(item -> 
    item.getName() != null && 
    item.getPrice().compareTo(BigDecimal.ZERO) > 0 &&
    item.getQuantity() >= 0
))).thenReturn(...);

// Good: Simple, clear setup
when(repository.save(any(InventoryItem.class)))
    .thenReturn(savedItem);
```

### ❌ Testing Implementation Details

```java
// Bad: Overly specific verification
verify(repository, times(1)).findById(eq("item-1"));
verify(mapper, times(1)).toDTO(any());

// Good: Verify behavior, not implementation
verify(repository).save(any(InventoryItem.class));
assertEquals(expected, result);
```

### ❌ Test Interdependencies

```java
// Bad: Tests depend on each other
@Test void test1() { repo.save(item); }
@Test void test2() { assertEquals(1, repo.count()); }  // Depends on test1!

// Good: Each test is independent
@BeforeEach void setup() { /* Reset state */ }
@Test void test1() { /* Complete setup */ }
@Test void test2() { /* Independent setup */ }
```

---

## Best Practices Checklist

### ✅ DO

- [ ] Test one thing per test method
- [ ] Use descriptive test names
- [ ] Mock external dependencies only
- [ ] Use `@BeforeEach` for common setup
- [ ] Use parameterized tests for multiple scenarios
- [ ] Use `@DisplayName` for human-readable names
- [ ] Verify behavior, not implementation
- [ ] Keep tests simple and readable
- [ ] Test both success and failure paths

### ❌ DON'T

- [ ] Test the testing framework (JUnit/Mockito)
- [ ] Make tests interdependent
- [ ] Use sleep/wait in tests
- [ ] Leave test data inconsistent
- [ ] Mock the object being tested
- [ ] Write tests for trivial code (getters/setters)
- [ ] Suppress test warnings without reason
- [ ] Use magic numbers or strings
- [ ] Skip negative test cases

---

## Related Documentation

- **[Testing Index](./index.html)** - Complete testing strategy overview
- **[Integration Testing](./integration-testing.html)** - Repository and database testing
- **[Security Testing](./security-testing.html)** - Authentication and authorization tests
- **[Validation Framework](../validation/index.html)** - Validator examples and patterns

---

[⬅️ Back to Testing Index](./index.html)
