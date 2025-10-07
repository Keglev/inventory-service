# Validation Patterns

## Overview

This document describes validation patterns used across the Smart Supply Pro inventory service, focusing on **delegated validation** vs **inline validation**, and when to use each approach.

---

## Pattern: Delegated Validation

### Description

Validation logic delegated to specialized service layers, keeping controllers and repositories focused on their primary responsibilities.

### Implementation

**Service Layer:**
```java
@Service
public class SupplierServiceImpl {
    
    /**
     * Creates supplier with external system validation.
     * @param dto supplier data
     * @return created supplier
     * @throws DuplicateResourceException if external ID already exists
     */
    public SupplierDTO create(SupplierDTO dto) {
        // Enterprise Comment: External System Validation
        // Validates with third-party ERP before database insert
        if (externalApiService.existsSupplier(dto.getExternalSupplierCode())) {
            throw new DuplicateResourceException(
                "Supplier already exists: " + dto.getExternalSupplierCode()
            );
        }
        
        // Proceed with creation
        Supplier entity = SupplierMapper.toEntity(dto, currentUsername());
        return SupplierMapper.toDTO(supplierRepository.save(entity));
    }
}
```

### Benefits

- ✅ **Single Responsibility**: Controllers handle HTTP, services handle business logic
- ✅ **Reusability**: Validation logic reused across multiple entry points
- ✅ **Testability**: Easy to unit test validation separately
- ✅ **Consistency**: Same validation applied regardless of caller

### Use Cases

- External system integration validation
- Complex business rules requiring multiple data sources
- Cross-entity validation (e.g., supplier exists before creating purchase order)
- Validation requiring transactional context

---

## Pattern: Inline Validation

### Description

Simple validation performed directly where needed, typically for parameter checks or basic business rules.

### Implementation

**Method Parameter Validation:**
```java
/**
 * Retrieves inventory item by ID.
 * @param id item ID
 * @return item DTO
 * @throws IllegalArgumentException if ID is null/empty
 * @throws ResourceNotFoundException if item not found
 */
public InventoryItemDTO getById(String id) {
    // Inline validation for quick parameter check
    if (id == null || id.trim().isEmpty()) {
        throw new IllegalArgumentException("Item ID cannot be null or empty");
    }
    
    return inventoryItemRepository.findById(id)
        .map(InventoryItemMapper::toDTO)
        .orElseThrow(() -> new ResourceNotFoundException("Item not found: " + id));
}
```

### Benefits

- ✅ **Performance**: No additional method calls
- ✅ **Locality**: Validation logic close to usage point
- ✅ **Simplicity**: No need for separate validator classes
- ✅ **Fail-Fast**: Immediate validation before expensive operations

### Use Cases

- Null/empty parameter checks
- Simple range validations
- Format validations (e.g., email, phone)
- Pre-condition checks

---

## Bean Validation (JSR-380)

### Description

Declarative validation using annotations on DTOs, validated automatically by Spring.

### Implementation

**DTO with Validation Annotations:**
```java
public class InventoryItemDTO {
    
    @NotBlank(message = "Item name is required")
    @Size(min = 3, max = 100, message = "Name must be between 3 and 100 characters")
    private String name;
    
    @NotNull(message = "Quantity is required")
    @Min(value = 0, message = "Quantity cannot be negative")
    private Integer quantity;
    
    @DecimalMin(value = "0.01", message = "Price must be positive")
    @Digits(integer = 10, fraction = 2, message = "Invalid price format")
    private BigDecimal price;
    
    @NotBlank(message = "Supplier ID is required")
    private String supplierId;
    
    @Pattern(regexp = "^[A-Z]{2,3}-\\d{4,6}$", 
             message = "SKU must match format: XX-1234 or XXX-123456")
    private String sku;
}
```

**Controller with Automatic Validation:**
```java
@RestController
@RequestMapping("/api/inventory")
public class InventoryItemController {
    
    /**
     * Creates new inventory item with automatic validation.
     * @param dto validated item data
     * @return created item
     */
    @PostMapping
    public ResponseEntity<InventoryItemDTO> create(@Valid @RequestBody InventoryItemDTO dto) {
        // Spring automatically validates dto before method execution
        // Returns 400 Bad Request with validation errors if invalid
        InventoryItemDTO created = inventoryItemService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
```

### Benefits

- ✅ **Declarative**: Validation rules visible on DTO fields
- ✅ **Automatic**: No manual validation code needed
- ✅ **Consistent**: Same validation rules across all endpoints
- ✅ **Standard**: JSR-380 standard with Spring Boot integration
- ✅ **Error Handling**: Automatic HTTP 400 responses with validation details

### Custom Validation Annotations

**Complex Business Rules:**
```java
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = StockUpdateValidator.class)
public @interface ValidStockUpdate {
    String message() default "Invalid stock update";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

@ValidStockUpdate
public class StockUpdateDTO {
    private String itemId;
    private Integer quantityChange;
    private StockChangeReason reason;
}
```

**Validator Implementation:**
```java
public class StockUpdateValidator implements ConstraintValidator<ValidStockUpdate, StockUpdateDTO> {
    
    @Override
    public boolean isValid(StockUpdateDTO dto, ConstraintValidatorContext context) {
        // Enterprise Comment: Business Rule Validation
        // Negative quantity changes require SALE, DAMAGE, or RETURN reason
        if (dto.getQuantityChange() < 0) {
            return dto.getReason() == StockChangeReason.SALE ||
                   dto.getReason() == StockChangeReason.DAMAGE ||
                   dto.getReason() == StockChangeReason.RETURN;
        }
        return true;
    }
}
```

---

## Decision Matrix

| Validation Type | Pattern | Example |
|----------------|---------|---------|
| **Null/Empty Checks** | Bean Validation | `@NotBlank`, `@NotNull` |
| **Format Validation** | Bean Validation | `@Pattern`, `@Email` |
| **Range Validation** | Bean Validation | `@Min`, `@Max`, `@Size` |
| **Complex Business Rules** | Delegated Service | External system checks |
| **Cross-Entity Validation** | Delegated Service | FK existence checks |
| **Quick Fail-Fast Checks** | Inline | Parameter null checks |
| **Multi-Field Rules** | Custom Validator | `@ValidStockUpdate` |

---

## Best Practices

### 1. Layered Validation

**Controller Layer:**
- Bean validation on DTOs (`@Valid`)
- Basic format and null checks

**Service Layer:**
- Business rule validation
- Cross-entity validation
- External system checks
- Transactional validation

**Repository Layer:**
- Database constraint validation (implicit)
- Unique constraint violations

### 2. Fail-Fast Principle

```java
public void processOrder(OrderDTO order) {
    // Validate parameters first (fail-fast)
    if (order == null || order.getItems().isEmpty()) {
        throw new IllegalArgumentException("Order cannot be empty");
    }
    
    // Then perform expensive operations
    List<InventoryItem> items = fetchInventoryItems(order.getItems());
    calculateTotal(items);
    processPayment(order);
}
```

### 3. Meaningful Error Messages

**Good:**
```java
throw new IllegalArgumentException(
    "Quantity cannot be negative. Received: " + quantity
);
```

**Bad:**
```java
throw new IllegalArgumentException("Invalid input");
```

### 4. Validation Reusability

**Extract Common Validations:**
```java
public class ValidationUtils {
    
    public static void requireNonEmpty(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(fieldName + " cannot be null or empty");
        }
    }
    
    public static void requirePositive(Integer value, String fieldName) {
        if (value == null || value <= 0) {
            throw new IllegalArgumentException(fieldName + " must be positive");
        }
    }
}

// Usage
ValidationUtils.requireNonEmpty(dto.getName(), "Item name");
ValidationUtils.requirePositive(dto.getQuantity(), "Quantity");
```

---

## Testing Strategies

### Unit Testing Validation

**Service Layer Validation:**
```java
@Test
void create_shouldThrowException_whenExternalIdDuplicate() {
    // Given
    SupplierDTO dto = createTestSupplier();
    when(externalApiService.existsSupplier(dto.getExternalSupplierCode()))
        .thenReturn(true);
    
    // When/Then
    assertThrows(DuplicateResourceException.class, 
                () -> supplierService.create(dto));
}
```

**Bean Validation Testing:**
```java
@Test
void create_shouldReject_whenNameTooShort() {
    // Given
    InventoryItemDTO dto = new InventoryItemDTO();
    dto.setName("AB"); // Too short (min = 3)
    
    // When
    Set<ConstraintViolation<InventoryItemDTO>> violations = 
        validator.validate(dto);
    
    // Then
    assertFalse(violations.isEmpty());
    assertTrue(violations.stream()
        .anyMatch(v -> v.getMessage().contains("between 3 and 100")));
}
```

### Integration Testing Validation

**Controller Validation:**
```java
@Test
void createInventoryItem_shouldReturn400_whenInvalidData() throws Exception {
    // Given
    String invalidJson = "{\"name\": \"AB\", \"quantity\": -5}";
    
    // When/Then
    mockMvc.perform(post("/api/inventory")
            .contentType(MediaType.APPLICATION_JSON)
            .content(invalidJson))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors").isArray())
        .andExpect(jsonPath("$.errors[*].field").value(hasItems("name", "quantity")));
}
```

---

## Common Pitfalls

### ❌ Validation in Wrong Layer

**Bad: Business validation in controller**
```java
@PostMapping
public ResponseEntity<?> create(@RequestBody SupplierDTO dto) {
    // DON'T: Business logic in controller
    if (externalApiService.existsSupplier(dto.getExternalSupplierCode())) {
        return ResponseEntity.badRequest().body("Duplicate supplier");
    }
    return ResponseEntity.ok(supplierService.create(dto));
}
```

**Good: Business validation in service**
```java
@PostMapping
public ResponseEntity<SupplierDTO> create(@Valid @RequestBody SupplierDTO dto) {
    // Controller only handles HTTP concerns
    SupplierDTO created = supplierService.create(dto);
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
}
```

### ❌ Ignoring Null Checks

**Bad: Assuming non-null**
```java
public void process(String input) {
    String upper = input.toUpperCase(); // NPE if input is null
}
```

**Good: Validate parameters**
```java
public void process(String input) {
    if (input == null) {
        throw new IllegalArgumentException("Input cannot be null");
    }
    String upper = input.toUpperCase();
}
```

### ❌ Duplicate Validation Logic

**Bad: Copy-paste validation**
```java
// In multiple methods...
if (id == null || id.isEmpty()) {
    throw new IllegalArgumentException("ID cannot be empty");
}
```

**Good: Reusable validation**
```java
private void validateId(String id) {
    ValidationUtils.requireNonEmpty(id, "ID");
}
```

---

## References

- **Bean Validation (JSR-380)**: https://beanvalidation.org/
- **Spring Validation**: https://docs.spring.io/spring-framework/reference/core/validation/beanvalidation.html
- **Related Patterns**: `mapper-patterns.md`, `security-context.md`

---

*Document Version: 1.0*  
*Last Updated: 2025*  
*Project: Smart Supply Pro Inventory Service*