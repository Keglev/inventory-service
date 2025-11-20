[⬅️ Back to Validation Index](./index.html)

# Validation Patterns

## Overview

This document describes proven patterns and best practices for implementing multi-layer validation in Spring Boot applications. Smart Supply Pro demonstrates these patterns across all validation layers.

---

## Pattern 1: Layered Validation Architecture

### Pattern Structure

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Presentation (Controller)                      │
│ - @Validated annotation on controller class            │
│ - @Valid on request parameters                         │
│ - Responsibility: Catch format/type errors             │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 2: JSR-380 Declarative Validation (DTO)          │
│ - @NotNull, @NotBlank, @Email, @Pattern, etc.         │
│ - Validation groups (Create, Update)                   │
│ - Responsibility: Constraint-based field validation    │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 3: Custom Domain Validators (Service)            │
│ - Business rule enforcement (uniqueness, safety)       │
│ - Cross-field validation (name + price combination)    │
│ - Repository-dependent checks                          │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 4: Security Validation (Service)                 │
│ - Role-based field restrictions                        │
│ - Authorization checks before persistence              │
│ - Responsibility: Prevent unauthorized updates         │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 5: Exception Handling (GlobalExceptionHandler)   │
│ - HTTP status mapping                                  │
│ - Message sanitization (security)                      │
│ - Standardized error response format                   │
└─────────────────────────────────────────────────────────┘
```

### Benefits

| Benefit | Explanation |
|---------|-------------|
| **Separation of Concerns** | Each layer handles different validation aspects |
| **Reusability** | Validators can be called from multiple services |
| **Testability** | Each layer tested independently |
| **Maintainability** | Easy to add/modify validation rules |
| **Performance** | Early failure prevents unnecessary processing |

### Implementation Example

```java
// Step 1: Controller applies @Validated
@RestController
@RequestMapping("/api/inventory/items")
@Validated  // Enables JSR-380 validation on path/request params
public class InventoryItemController {

    @PostMapping
    public ResponseEntity<InventoryItemDTO> create(
        @Valid @RequestBody InventoryItemDTO dto  // Layer 2: JSR-380 validation triggered
    ) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<InventoryItemDTO> update(
        @PathVariable String id,
        @Valid @RequestBody InventoryItemDTO dto
    ) {
        return ResponseEntity.ok(service.update(id, dto));
    }
}

// Step 2: Service applies custom validators
@Service
public class InventoryItemService {

    public InventoryItemDTO create(InventoryItemDTO dto) {
        // Layer 1: Framework catches type/format errors before reaching here
        
        // Layer 3: Custom domain validators
        InventoryItemValidator.validateBase(dto);
        InventoryItemValidator.validateInventoryItemNotExists(
            dto.getName(), dto.getPrice(), repo);
        
        // Layer 4: Security validation
        InventoryItemSecurityValidator.validateUpdatePermissions(null, dto);
        
        // Persist and return
        InventoryItem item = mapper.toEntity(dto);
        item = repo.save(item);
        return mapper.toDto(item);
    }

    public InventoryItemDTO update(String id, InventoryItemDTO dto) {
        // Layer 3: Custom validators
        InventoryItem existing = InventoryItemValidator.validateExists(id, repo);
        InventoryItemValidator.validateBase(dto);
        InventoryItemValidator.validateInventoryItemNotExists(
            id, dto.getName(), dto.getPrice(), repo);
        
        // Layer 4: Security validation
        InventoryItemSecurityValidator.validateUpdatePermissions(existing, dto);
        
        // Update and persist
        existing.setName(dto.getName());
        existing.setQuantity(dto.getQuantity());
        existing.setPrice(dto.getPrice());
        existing = repo.save(existing);
        
        return mapper.toDto(existing);
    }
}

// Step 5: Exception handlers map to HTTP responses
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    // JSR-380 failures → 400
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(...) { }
    
    // Business rule violations → 409
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleDuplicate(...) { }
    
    // Security violations → 403
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAuthorization(...) { }
}
```

---

## Pattern 2: DTO with Validation Groups

### Problem
Different operations need different validation rules:
- **Create:** ID must be null, name/quantity/price required
- **Update:** ID must exist, optionally update any field

### Solution: Validation Groups

```java
// Define marker interfaces for validation groups
public interface CreateGroup { }
public interface UpdateGroup { }

// Apply constraints conditionally
@Data
@Builder
public class InventoryItemDTO {
    
    @Null(groups = CreateGroup.class, message = "ID must be null for creation")
    @NotNull(groups = UpdateGroup.class, message = "ID required for update")
    private String id;
    
    @NotBlank(groups = {CreateGroup.class, UpdateGroup.class})
    private String name;
    
    @NotNull(groups = {CreateGroup.class, UpdateGroup.class})
    @PositiveOrZero(groups = {CreateGroup.class, UpdateGroup.class})
    private Integer quantity;
    
    @NotNull(groups = {CreateGroup.class, UpdateGroup.class})
    @Positive(groups = {CreateGroup.class, UpdateGroup.class})
    private BigDecimal price;
    
    @NotBlank(groups = {CreateGroup.class, UpdateGroup.class})
    private String supplierId;
}
```

### Controller Usage

```java
@RestController
@RequestMapping("/api/inventory/items")
public class InventoryItemController {

    @PostMapping
    public ResponseEntity<InventoryItemDTO> create(
        @Validated(CreateGroup.class)  // Validates with CreateGroup rules
        @RequestBody InventoryItemDTO dto
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(service.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<InventoryItemDTO> update(
        @PathVariable String id,
        @Validated(UpdateGroup.class)  // Validates with UpdateGroup rules
        @RequestBody InventoryItemDTO dto
    ) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<InventoryItemDTO> partialUpdate(
        @PathVariable String id,
        @RequestBody InventoryItemDTO dto
    ) {
        // No validation group = apply all constraints
        return ResponseEntity.ok(service.update(id, dto));
    }
}
```

---

## Pattern 3: Cross-Field Validation

### Problem
Single-field constraints cannot express relationships between fields:
- Inventory item: (name, price) combination must be unique
- Stock history: Zero quantity change only allowed for PRICE_CHANGE reason

### Solution: Custom Validator Methods

```java
public class InventoryItemValidator {
    
    /**
     * Enforces unique (name, price) combination.
     * Cannot be expressed with single-field constraints.
     */
    public static void validateInventoryItemNotExists(
            String name, BigDecimal price, InventoryItemRepository repo) {
        
        List<InventoryItem> duplicates = repo.findByNameIgnoreCase(name);
        
        for (InventoryItem item : duplicates) {
            if (item.getPrice().compareTo(price) == 0) {
                throw new DuplicateResourceException(
                    "Item with this name and price already exists"
                );
            }
        }
    }
}

public class StockHistoryValidator {
    
    /**
     * Enforces business rule: Zero quantity change only for PRICE_CHANGE.
     * Cannot be expressed with single-field constraints.
     */
    public static void validate(StockHistoryDTO dto) {
        StockChangeReason reason = StockChangeReason.valueOf(dto.getReason());
        
        if (dto.getChange() == 0 && reason != StockChangeReason.PRICE_CHANGE) {
            throw new InvalidRequestException(
                "Zero quantity change is only allowed for PRICE_CHANGE"
            );
        }
    }
}
```

### Usage in Service Layer

```java
@Service
public class InventoryItemService {
    
    public InventoryItemDTO create(InventoryItemDTO dto) {
        // Single-field validation happens in Layer 2 (JSR-380)
        // Cross-field validation happens here in Layer 3
        
        InventoryItemValidator.validateInventoryItemNotExists(
            dto.getName(), dto.getPrice(), repo
        );
        
        InventoryItem item = mapper.toEntity(dto);
        return mapper.toDto(repo.save(item));
    }
}
```

---

## Pattern 4: Repository-Agnostic Validators

### Problem
Validators often need repository access, creating tight coupling:

```java
// ❌ Tight coupling: Validator depends on specific repository
public static void assertUniqueName(String name, SupplierRepository repo) {
    var existing = repo.findByNameIgnoreCase(name).orElse(null);
    if (existing != null) {
        throw new DuplicateResourceException("Supplier already exists");
    }
}
```

### Solution: Use BooleanSupplier for Decoupling

```java
// ✅ Loosely coupled: Caller provides the check logic
public static void assertUniqueName(String name, BooleanSupplier hasDuplicate) {
    if (hasDuplicate != null && hasDuplicate.getAsBoolean()) {
        throw new DuplicateResourceException("Supplier already exists");
    }
}

// Usage in service: Caller provides repository logic
@Service
public class SupplierService {
    
    public void create(SupplierDTO dto) {
        // Validator doesn't know about repository
        SupplierValidator.assertUniqueName(dto.getName(),
            () -> repo.findByNameIgnoreCase(dto.getName()).isPresent()
        );
        
        Supplier supplier = mapper.toEntity(dto);
        repo.save(supplier);
    }
}
```

**Benefits:**
- Validators don't depend on framework classes
- Easier to test (mock BooleanSupplier)
- Reusable across different repositories
- Follows Single Responsibility Principle

---

## Pattern 5: Early Validation Failure

### Principle
Fail as early as possible to prevent unnecessary processing.

```java
@Service
public class InventoryItemService {
    
    public InventoryItemDTO update(String id, InventoryItemDTO dto) {
        // Step 1: Basic field validation (Layer 3 - quick)
        InventoryItemValidator.validateBase(dto);
        
        // Step 2: Check if item exists before expensive operations (Layer 3)
        InventoryItem existing = InventoryItemValidator.validateExists(id, repo);
        
        // Step 3: Uniqueness check with repository (Layer 3)
        InventoryItemValidator.validateInventoryItemNotExists(
            id, dto.getName(), dto.getPrice(), repo);
        
        // Step 4: Security check (Layer 4) - only after basic validation
        InventoryItemSecurityValidator.validateUpdatePermissions(existing, dto);
        
        // Step 5: Only now perform the expensive update
        existing.setName(dto.getName());
        existing.setQuantity(dto.getQuantity());
        existing.setPrice(dto.getPrice());
        existing = repo.save(existing);
        
        return mapper.toDto(existing);
    }
}
```

**Order Matters:**
1. ✅ Fast checks first (format, required fields)
2. ✅ Repository checks second (uniqueness, existence)
3. ✅ Security checks third (authorization)
4. ✅ Expensive operations last (persistence)

---

## Pattern 6: Validation Testing Strategy

### Unit Testing Validators

```java
@ExtendWith(MockitoExtension.class)
class InventoryItemValidatorTest {

    @Mock
    private InventoryItemRepository repo;

    @Test
    void validateBase_AllFieldsValid_NoException() {
        InventoryItemDTO dto = InventoryItemDTO.builder()
            .name("Widget")
            .quantity(100)
            .price(BigDecimal.TEN)
            .supplierId("SUPP-001")
            .build();

        // Should not throw
        assertDoesNotThrow(() -> InventoryItemValidator.validateBase(dto));
    }

    @Test
    void validateBase_NameBlank_ThrowsException() {
        InventoryItemDTO dto = InventoryItemDTO.builder()
            .name("")  // Invalid
            .quantity(100)
            .price(BigDecimal.TEN)
            .supplierId("SUPP-001")
            .build();

        assertThrows(IllegalArgumentException.class,
            () -> InventoryItemValidator.validateBase(dto));
    }

    @Test
    void validateExists_ItemNotFound_Throws404() {
        when(repo.findById("nonexistent")).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class,
            () -> InventoryItemValidator.validateExists("nonexistent", repo));
    }

    @Test
    void validateDuplicate_NameAndPriceExist_ThrowsConflict() {
        InventoryItem existing = InventoryItem.builder()
            .id("ITEM-001")
            .name("Widget")
            .price(new BigDecimal("25.50"))
            .build();

        when(repo.findByNameIgnoreCase("Widget"))
            .thenReturn(List.of(existing));

        assertThrows(DuplicateResourceException.class,
            () -> InventoryItemValidator.validateInventoryItemNotExists(
                "Widget", new BigDecimal("25.50"), repo));
    }

    @Test
    void assertFinalQuantityNonNegative_NegativeQuantity_Throws422() {
        assertThrows(ResponseStatusException.class,
            () -> InventoryItemValidator.assertFinalQuantityNonNegative(-50));
    }
}
```

### Integration Testing Validation Layers

```java
@SpringBootTest
class InventoryItemValidationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private InventoryItemRepository repo;

    @Test
    @Transactional
    void create_ValidRequest_Returns201Created() throws Exception {
        String requestBody = """
            {
                "name": "New Widget",
                "quantity": 100,
                "price": 25.50,
                "supplierId": "SUPP-001"
            }
            """;

        mockMvc.perform(post("/api/inventory/items")
            .contentType(MediaType.APPLICATION_JSON)
            .content(requestBody))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").exists())
            .andExpect(jsonPath("$.name").value("New Widget"));
    }

    @Test
    void create_BlankName_Returns400BadRequest() throws Exception {
        String requestBody = """
            {
                "name": "",
                "quantity": 100,
                "price": 25.50,
                "supplierId": "SUPP-001"
            }
            """;

        mockMvc.perform(post("/api/inventory/items")
            .contentType(MediaType.APPLICATION_JSON)
            .content(requestBody))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void create_DuplicateNameAndPrice_Returns409Conflict() throws Exception {
        // Pre-create item
        InventoryItem existing = InventoryItem.builder()
            .name("Widget")
            .price(new BigDecimal("25.50"))
            .quantity(100)
            .supplierId("SUPP-001")
            .build();
        repo.save(existing);

        String requestBody = """
            {
                "name": "Widget",
                "quantity": 50,
                "price": 25.50,
                "supplierId": "SUPP-002"
            }
            """;

        mockMvc.perform(post("/api/inventory/items")
            .contentType(MediaType.APPLICATION_JSON)
            .content(requestBody))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message")
                .value(containsString("already exists")));
    }

    @Test
    void update_UnauthorizedFieldAccess_Returns403Forbidden() throws Exception {
        // As USER role, attempt to update price
        InventoryItem item = InventoryItem.builder()
            .name("Widget")
            .price(new BigDecimal("25.50"))
            .quantity(100)
            .supplierId("SUPP-001")
            .build();
        item = repo.save(item);

        String requestBody = """
            {
                "name": "Widget Updated",
                "quantity": 150,
                "price": 99.99,
                "supplierId": "SUPP-001"
            }
            """;

        mockMvc.perform(put("/api/inventory/items/" + item.getId())
            .with(user("john").password("pass").roles("USER"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(requestBody))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message").value("Access denied"));
    }
}
```

---

## Pattern 7: Error Scenario Documentation

### Document Common Error Cases

```markdown
## Common Validation Failures

### Case 1: Missing Required Field (400 Bad Request)

**Cause:** @NotBlank validation fails on name field

**Request:**
POST /api/inventory/items
{
    "quantity": 100,
    "price": 25.50,
    "supplierId": "SUPP-001"
    // Missing: "name"
}

**Response:**
HTTP/1.1 400 Bad Request
{
    "message": "name must not be blank",
    "status": "BAD_REQUEST"
}

**Fix:** Add "name" field with non-empty value

---

### Case 2: Duplicate Entry (409 Conflict)

**Cause:** Uniqueness constraint violation (name + price)

**Request:**
POST /api/inventory/items
{
    "name": "Existing Widget",
    "quantity": 100,
    "price": 25.50,  // ← Same name+price already exists
    "supplierId": "SUPP-001"
}

**Response:**
HTTP/1.1 409 Conflict
{
    "message": "Another inventory item with this name and price already exists",
    "status": "CONFLICT"
}

**Fix:** Use different name or price combination

---

### Case 3: Negative Quantity After Adjustment (422 Unprocessable Entity)

**Cause:** Quantity would become negative

**Request:**
POST /api/inventory/items/ITEM-123/adjust
{
    "delta": -150  // Current: 100, would result in -50
}

**Response:**
HTTP/1.1 422 Unprocessable Entity
{
    "message": "Resulting stock cannot be negative",
    "status": "UNPROCESSABLE_ENTITY"
}

**Fix:** Use smaller delta value or check current quantity first
```

---

## Best Practices Checklist

### ✅ DO

- [ ] Use JSR-380 for simple field constraints
- [ ] Create utility validators for complex business rules
- [ ] Fail early with specific exceptions
- [ ] Sanitize error messages in exception handlers
- [ ] Test each validation layer independently
- [ ] Use validation groups for different operations (Create/Update)
- [ ] Document validation requirements in API documentation
- [ ] Use consistent exception types across validators

### ❌ DON'T

- [ ] Perform validation in entity classes
- [ ] Mix validation logic across multiple classes
- [ ] Throw generic RuntimeException for validation
- [ ] Expose internal class names or SQL in error messages
- [ ] Validate in both controller and service (duplication)
- [ ] Create custom JSR-380 annotations unless truly reusable
- [ ] Perform expensive operations before validation
- [ ] Ignore validation failures in service layer

---

## Related Documentation

- **[Validation Index](./index.html)** - Multi-layer validation framework overview
- **[JSR-380 Constraints](./jsr-380-constraints.html)** - Declarative field validation
- **[Custom Validators](./custom-validators.html)** - Domain-specific validation
- **[Exception Handling](./exception-handling.html)** - Error response mapping

---

[⬅️ Back to Validation Index](./index.html)
