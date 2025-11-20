[⬅️ Back to Validation Index](./index.html)

# Custom Validators

## Overview

Custom validators enforce **domain-specific business rules** that JSR-380 constraints cannot express. Smart Supply Pro implements three custom validators for different entities:

- **InventoryItemValidator** - Uniqueness, quantity safety, existence checks
- **SupplierValidator** - Uniqueness, deletion safety
- **StockHistoryValidator** - Enum validation, business rules

---

## Validator Pattern

All custom validators follow a consistent pattern:

```java
public class DomainValidator {
    
    // Prevent instantiation (utility class)
    private DomainValidator() { }
    
    // Static validation methods
    public static void validateBase(DTO dto) {
        // Basic field validation
    }
    
    public static void assertBusinessRule(DTO dto, Repository repo) {
        // Complex business logic
    }
}
```

**Benefits:**
- ✅ No dependencies to manage
- ✅ Easy to test in isolation
- ✅ Reusable across service classes
- ✅ Clear separation from entity logic

---

## InventoryItemValidator

### Location
```
src/main/java/com/smartsupplypro/inventory/validation/InventoryItemValidator.java
```

### Capabilities

| Method | Purpose | Exception |
|--------|---------|-----------|
| `validateBase()` | Check name, quantity, price, supplier fields | IllegalArgumentException |
| `validateInventoryItemNotExists()` | Prevent name+price duplicates | DuplicateResourceException |
| `validateExists()` | Verify item exists before update/delete | ResponseStatusException (404) |
| `assertFinalQuantityNonNegative()` | Ensure quantity >= 0 after adjustment | ResponseStatusException (422) |
| `assertPriceValid()` | Ensure price > 0 for updates | ResponseStatusException (422) |

### Implementation

```java
public class InventoryItemValidator {
    
    private InventoryItemValidator() { }

    /**
     * Validates fundamental inventory item fields.
     * Called at service layer before persistence.
     */
    public static void validateBase(InventoryItemDTO dto) {
        if (dto.getName() == null || dto.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Product name cannot be null or empty");
        }
        if (dto.getQuantity() < 0) {
            throw new IllegalArgumentException("Quantity cannot be negative");
        }
        if (dto.getPrice() == null || dto.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Price must be positive or greater than zero");
        }
        if (dto.getSupplierId() == null || dto.getSupplierId().trim().isEmpty()) {
            throw new IllegalArgumentException("Supplier ID must be provided");
        }
    }

    /**
     * Enforces unique (name, price) combination for creation.
     */
    public static void validateInventoryItemNotExists(
            String id, String name, BigDecimal price, InventoryItemRepository inventoryRepo) {
        List<InventoryItem> existingItems = inventoryRepo.findByNameIgnoreCase(name);
        for (InventoryItem item : existingItems) {
            if (!item.getId().equals(id) && item.getPrice().compareTo(price) == 0) {
                throw new DuplicateResourceException(
                    "Another inventory item with this name and price already exists."
                );
            }
        }
    }

    /**
     * Enforces unique (name, price) combination for updates.
     */
    public static void validateInventoryItemNotExists(
            String name, BigDecimal price, InventoryItemRepository inventoryRepo) {
        List<InventoryItem> existingItems = inventoryRepo.findByNameIgnoreCase(name);
        for (InventoryItem item : existingItems) {
            if (item.getPrice().compareTo(price) == 0) {
                throw new DuplicateResourceException(
                    "An inventory item with this name and price already exists."
                );
            }
        }
    }

    /**
     * Validates inventory item exists before update/delete.
     */
    public static InventoryItem validateExists(String id, InventoryItemRepository inventoryRepo) {
        return inventoryRepo.findById(id).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found: " + id)
        );
    }

    /**
     * Ensures resulting quantity non-negative after adjustment.
     */
    public static void assertFinalQuantityNonNegative(int resultingQuantity) {
        if (resultingQuantity < 0) {
            throw new ResponseStatusException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "Resulting stock cannot be negative"
            );
        }
    }

    /**
     * Ensures price is strictly positive for updates.
     */
    public static void assertPriceValid(BigDecimal price) {
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "Price must be greater than zero"
            );
        }
    }
}
```

### Usage in Service Layer

```java
@Service
public class InventoryItemService {
    
    @Autowired
    private InventoryItemRepository repo;

    public InventoryItemDTO create(InventoryItemDTO dto) {
        // 1. JSR-380 constraints checked by controller
        
        // 2. Custom validator checks business rules
        InventoryItemValidator.validateBase(dto);
        InventoryItemValidator.validateInventoryItemNotExists(
            dto.getName(), dto.getPrice(), repo);
        
        // 3. Create entity and persist
        InventoryItem item = mapper.toEntity(dto);
        item = repo.save(item);
        
        return mapper.toDto(item);
    }

    public InventoryItemDTO update(String id, InventoryItemDTO dto) {
        // 1. JSR-380 constraints checked by controller
        
        // 2. Custom validators
        InventoryItem existing = InventoryItemValidator.validateExists(id, repo);
        InventoryItemValidator.validateBase(dto);
        InventoryItemValidator.validateInventoryItemNotExists(
            dto.getName(), dto.getPrice(), repo);  // Uniqueness, excluding current item
        
        // 3. Security validator (field-level authorization)
        InventoryItemSecurityValidator.validateUpdatePermissions(existing, dto);
        
        // 4. Update and persist
        existing.setName(dto.getName());
        existing.setQuantity(dto.getQuantity());
        existing.setPrice(dto.getPrice());
        existing = repo.save(existing);
        
        return mapper.toDto(existing);
    }

    public void adjustQuantity(String id, int delta) {
        InventoryItem item = InventoryItemValidator.validateExists(id, repo);
        
        int newQuantity = item.getQuantity() + delta;
        InventoryItemValidator.assertFinalQuantityNonNegative(newQuantity);
        
        item.setQuantity(newQuantity);
        repo.save(item);
    }
}
```

---

## SupplierValidator

### Location
```
src/main/java/com/smartsupplypro/inventory/validation/SupplierValidator.java
```

### Capabilities

| Method | Purpose | Exception |
|--------|---------|-----------|
| `validateBase()` | Check required fields (name) | InvalidRequestException |
| `assertUniqueName()` | Enforce case-insensitive name uniqueness | DuplicateResourceException |
| `assertDeletable()` | Prevent deletion with linked items | InvalidRequestException / IllegalStateException |

### Implementation

```java
public final class SupplierValidator {

    private SupplierValidator() { }

    /**
     * Validates required supplier fields.
     */
    public static void validateBase(SupplierDTO dto) {
        if (dto == null) {
            throw new InvalidRequestException("Supplier payload must not be null");
        }
        if (isBlank(dto.getName())) {
            throw new InvalidRequestException("Supplier name must not be blank");
        }
    }

    /**
     * Enforces unique supplier name (case-insensitive).
     * For creation: excludeId = null
     * For update: excludeId = current supplier ID
     */
    public static void assertUniqueName(SupplierRepository repo, String name, String excludeId) {
        if (isBlank(name)) return;  // validateBase already handles blank
        
        String trimmed = name.trim();
        var existing = repo.findByNameIgnoreCase(trimmed).orElse(null);
        
        if (existing != null) {
            String existingId = invokeGetId(existing);
            if (!Objects.equals(existingId, excludeId)) {
                throw new DuplicateResourceException("Supplier already exists");
            }
        }
    }

    /**
     * Prevents supplier deletion when linked inventory items exist.
     * Uses supplier-agnostic boolean check (caller provides link detection).
     */
    public static void assertDeletable(String supplierId, BooleanSupplier hasAnyLinks) {
        if (isBlank(supplierId)) {
            throw new InvalidRequestException("Supplier id must be provided for deletion");
        }
        if (hasAnyLinks != null && hasAnyLinks.getAsBoolean()) {
            throw new IllegalStateException("Cannot delete supplier with linked items");
        }
    }

    // Helper methods
    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private static String invokeGetId(Object entity) {
        try {
            var m = entity.getClass().getMethod("getId");
            Object v = m.invoke(entity);
            return v != null ? v.toString() : null;
        } catch (Exception e) {
            return null;
        }
    }
}
```

### Usage in Service Layer

```java
@Service
public class SupplierService {
    
    @Autowired
    private SupplierRepository repo;
    
    @Autowired
    private InventoryItemRepository itemRepo;

    public SupplierDTO create(SupplierDTO dto) {
        // 1. Validate base fields
        SupplierValidator.validateBase(dto);
        
        // 2. Check uniqueness
        SupplierValidator.assertUniqueName(repo, dto.getName(), null);
        
        // 3. Create and persist
        Supplier supplier = mapper.toEntity(dto);
        supplier = repo.save(supplier);
        
        return mapper.toDto(supplier);
    }

    public SupplierDTO update(String id, SupplierDTO dto) {
        // 1. Validate base fields
        SupplierValidator.validateBase(dto);
        
        // 2. Check uniqueness, excluding current supplier
        SupplierValidator.assertUniqueName(repo, dto.getName(), id);
        
        // 3. Update and persist
        Supplier supplier = repo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        supplier.setName(dto.getName());
        supplier = repo.save(supplier);
        
        return mapper.toDto(supplier);
    }

    public void delete(String id) {
        // 1. Check if supplier has linked items
        SupplierValidator.assertDeletable(id, 
            () -> itemRepo.existsBySupplierId(id)
        );
        
        // 2. Delete
        repo.deleteById(id);
    }
}
```

---

## StockHistoryValidator

### Location
```
src/main/java/com/smartsupplypro/inventory/validation/StockHistoryValidator.java
```

### Capabilities

| Method | Purpose | Exception |
|--------|---------|-----------|
| `validate()` | Complete DTO validation (fields, enums, business rules) | InvalidRequestException |
| `validateEnum()` | Ensure reason is allowed enum value | IllegalArgumentException |

### Implementation

```java
public class StockHistoryValidator {

    private StockHistoryValidator() { }

    /**
     * Complete stock history validation before persistence.
     * Checks:
     * - Item ID provided
     * - Change value appropriate for reason
     * - Reason is valid enum
     * - CreatedBy audit field provided
     */
    public static void validate(StockHistoryDTO dto) {
        // Item ID required
        if (dto.getItemId() == null || dto.getItemId().isBlank()) {
            throw new InvalidRequestException("Item ID cannot be null or empty");
        }

        // Reason must be valid enum
        final StockChangeReason reason;
        try {
            reason = dto.getReason() == null ? null : 
                     StockChangeReason.valueOf(dto.getReason());
        } catch (IllegalArgumentException ex) {
            throw new InvalidRequestException("Invalid stock change reason: " + dto.getReason());
        }
        if (reason == null) {
            throw new InvalidRequestException("Stock change reason is required");
        }

        // Zero delta only allowed for PRICE_CHANGE
        if (dto.getChange() == 0 && reason != StockChangeReason.PRICE_CHANGE) {
            throw new InvalidRequestException(
                "Zero quantity change is only allowed for PRICE_CHANGE"
            );
        }

        // CreatedBy audit field required
        if (dto.getCreatedBy() == null || dto.getCreatedBy().isBlank()) {
            throw new InvalidRequestException("CreatedBy must be provided");
        }

        // Price must be non-negative for PRICE_CHANGE
        if (reason == StockChangeReason.PRICE_CHANGE &&
            dto.getPriceAtChange() != null &&
            dto.getPriceAtChange().signum() < 0) {
            throw new InvalidRequestException("priceAtChange must be >= 0 for PRICE_CHANGE");
        }
    }

    /**
     * Validates reason is in allowed enum set.
     */
    public static void validateEnum(StockChangeReason reason) {
        if (reason == null || !EnumSet.of(
                StockChangeReason.SOLD,
                StockChangeReason.SCRAPPED,
                StockChangeReason.RETURNED_TO_SUPPLIER,
                StockChangeReason.RETURNED_BY_CUSTOMER,
                StockChangeReason.INITIAL_STOCK,
                StockChangeReason.MANUAL_UPDATE,
                StockChangeReason.PRICE_CHANGE
        ).contains(reason)) {
            throw new IllegalArgumentException("Invalid stock change reason: " + reason);
        }
    }
}
```

### Usage in Service Layer

```java
@Service
public class StockHistoryService {
    
    @Autowired
    private StockHistoryRepository repo;
    
    @Autowired
    private InventoryItemRepository itemRepo;

    public StockHistoryDTO recordChange(StockHistoryDTO dto) {
        // 1. Complete validation
        StockHistoryValidator.validate(dto);
        
        // 2. Verify item exists
        InventoryItem item = itemRepo.findById(dto.getItemId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        
        // 3. Apply quantity adjustment if not PRICE_CHANGE
        StockChangeReason reason = StockChangeReason.valueOf(dto.getReason());
        if (reason != StockChangeReason.PRICE_CHANGE) {
            int newQuantity = item.getQuantity() + dto.getChange();
            InventoryItemValidator.assertFinalQuantityNonNegative(newQuantity);
            item.setQuantity(newQuantity);
            itemRepo.save(item);
        }
        
        // 4. Persist stock history record
        StockHistory history = mapper.toEntity(dto);
        history = repo.save(history);
        
        return mapper.toDto(history);
    }
}
```

---

## Exception Mapping

### InventoryItemValidator Exceptions

```java
try {
    InventoryItemValidator.validateBase(dto);
} catch (IllegalArgumentException e) {
    // Maps to: 400 Bad Request
    // Caught by GlobalExceptionHandler.handleGenericException()
}

try {
    InventoryItemValidator.validateInventoryItemNotExists(...);
} catch (DuplicateResourceException e) {
    // Maps to: 409 Conflict
    // Caught by BusinessExceptionHandler.handleDuplicate()
}

try {
    InventoryItemValidator.validateExists(...);
} catch (ResponseStatusException e) {
    // Maps to: 404 Not Found
    // Caught by Spring's default handler
}
```

---

## Testing Custom Validators

### Unit Test Example

```java
@ExtendWith(MockitoExtension.class)
class InventoryItemValidatorTest {

    @Mock
    private InventoryItemRepository repo;

    @Test
    void testValidateBase_NameBlank_ThrowsException() {
        InventoryItemDTO dto = InventoryItemDTO.builder()
            .name("")  // Invalid: blank
            .quantity(100)
            .price(BigDecimal.TEN)
            .supplierId("SUPP-001")
            .build();

        assertThrows(IllegalArgumentException.class, 
            () -> InventoryItemValidator.validateBase(dto));
    }

    @Test
    void testValidateBase_PriceZero_ThrowsException() {
        InventoryItemDTO dto = InventoryItemDTO.builder()
            .name("Widget")
            .quantity(100)
            .price(BigDecimal.ZERO)  // Invalid: must be positive
            .supplierId("SUPP-001")
            .build();

        assertThrows(IllegalArgumentException.class, 
            () -> InventoryItemValidator.validateBase(dto));
    }

    @Test
    void testValidateExists_ItemNotFound_Throws404() {
        String itemId = "nonexistent";
        when(repo.findById(itemId)).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, 
            () -> InventoryItemValidator.validateExists(itemId, repo));
    }

    @Test
    void testValidateDuplicate_SameName_Price_ThrowsException() {
        String name = "Widget A";
        BigDecimal price = new BigDecimal("25.50");

        InventoryItem existing = new InventoryItem();
        existing.setId("item-123");
        existing.setName(name);
        existing.setPrice(price);

        when(repo.findByNameIgnoreCase(name)).thenReturn(List.of(existing));

        assertThrows(DuplicateResourceException.class, 
            () -> InventoryItemValidator.validateInventoryItemNotExists(name, price, repo));
    }
}
```

---

## Best Practices

### 1. Clear Validation Method Names
```java
// ✅ Good: Action-oriented names
public static void validateBase(DTO dto) { }
public static void assertUniqueName(...) { }
public static void assertFinalQuantityNonNegative(int quantity) { }

// ❌ Avoid: Generic names
public static void validate(DTO dto) { }
public static void check() { }
```

### 2. Fail Early, Throw Specific Exceptions
```java
// ✅ Good: Specific exceptions for specific cases
throw new DuplicateResourceException("Already exists");
throw new InvalidRequestException("Field required");
throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found");

// ❌ Avoid: Generic exception for all cases
throw new RuntimeException("Error");
```

### 3. Validator as Utility Class
```java
// ✅ Good: Static methods, private constructor
public final class SupplierValidator {
    private SupplierValidator() { }
    
    public static void validateBase(DTO dto) { }
}

// ❌ Avoid: Instance methods, unnecessary state
public class SupplierValidator {
    private DTO currentDto;  // Unnecessary state
    
    public void validate() { }
}
```

### 4. Repository-Agnostic Design (When Possible)
```java
// ✅ Good: Caller provides check, validator is generic
public static void assertDeletable(String id, BooleanSupplier hasLinks) {
    if (hasLinks != null && hasLinks.getAsBoolean()) {
        throw new IllegalStateException("Cannot delete");
    }
}

// Usage:
SupplierValidator.assertDeletable(id, 
    () -> itemRepo.existsBySupplierId(id)
);

// ❌ Avoid: Validator tightly coupled to specific repository
public static void assertDeletable(String id, InventoryItemRepository repo) {
    if (repo.existsBySupplierId(id)) {
        throw new IllegalStateException("Cannot delete");
    }
}
```

---

## Related Documentation

- **[Validation Index](./index.html)** - Multi-layer validation framework overview
- **[JSR-380 Constraints](./jsr-380-constraints.html)** - Declarative field validation
- **[Exception Handling](./exception-handling.html)** - Error response mapping
- **[Validation Patterns](./patterns.html)** - Best practices
- **[Security Validation](../security/field-level-validation.html)** - Field-level authorization

---

[⬅️ Back to Validation Index](./index.html)
