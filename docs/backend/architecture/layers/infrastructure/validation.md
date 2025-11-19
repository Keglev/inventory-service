[⬅️ Back to Infrastructure Index](./index.md)

# Validation Layer

The **Validation Layer** enforces business rules and data constraints. Validation occurs at multiple levels: DTO fields, service business rules, and database constraints.

## Custom Validators

Domain-specific validation logic:

```java
@Component
public class SupplierValidator {
    
    private final SupplierRepository repository;
    
    public void validateUniquenessOnCreate(String name) {
        if (repository.existsByNameIgnoreCase(name)) {
            throw new IllegalStateException(
                "Supplier with name '" + name + "' already exists"
            );
        }
    }
    
    public void validateRequiredFields(CreateSupplierDTO dto) {
        if (dto.getName() == null || dto.getName().isBlank()) {
            throw new IllegalArgumentException("Supplier name is required");
        }
        if (dto.getContactName() == null || dto.getContactName().isBlank()) {
            throw new IllegalArgumentException("Contact name is required");
        }
    }
}
```

```java
@Component
public class InventoryItemValidator {
    
    private final InventoryItemRepository itemRepository;
    private final SupplierRepository supplierRepository;
    
    public void validateBeforeCreate(CreateInventoryItemDTO dto) {
        if (!supplierRepository.existsById(dto.getSupplierId())) {
            throw new IllegalArgumentException(
                "Supplier with ID '" + dto.getSupplierId() + "' not found"
            );
        }
        
        if (itemRepository.existsByNameIgnoreCase(dto.getName())) {
            throw new IllegalStateException(
                "Item with name '" + dto.getName() + "' already exists"
            );
        }
        
        if (dto.getInitialQuantity() < 0) {
            throw new IllegalArgumentException(
                "Initial quantity cannot be negative"
            );
        }
    }
}
```

## Validation Flow

```
HTTP Request
    ↓
Controller with @Valid
    ↓
DTO Field Validation (@NotNull, @NotBlank, etc.)
    ↓ Valid?
    ├─ No → Validation Error Response (400)
    └─ Yes → Service Layer
        ↓
    Custom Validator Checks
        ↓ Business Rules Met?
        ├─ No → Exception → Error Response
        └─ Yes → Execute Operation
            ↓
        Database Constraints
            ↓ Valid?
            ├─ No → Constraint Violation
            └─ Yes → Success
```

---

[⬅️ Back to Infrastructure Index](./index.md)
