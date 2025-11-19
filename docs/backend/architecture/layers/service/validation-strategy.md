[⬅️ Back to Layers Overview](./index.md)

# Validation Strategy

## Pattern Overview

Complex validation is delegated to specialized validator classes rather than cluttering service methods with validation logic.

## Validator Delegation

Services call dedicated validators to enforce business rules:

```java
@Service
@RequiredArgsConstructor
public class SupplierServiceImpl implements SupplierService {
    
    private final SupplierRepository repository;
    private final SupplierValidator validator;
    private final SupplierMapper mapper;
    
    @Transactional
    public SupplierDTO create(CreateSupplierDTO dto) {
        // Delegate validation to specialized class
        validator.validateUniquenessOnCreate(dto.getName());
        validator.validateRequiredFields(dto);
        
        // Proceed only if validation passes
        return mapper.toDTO(repository.save(mapper.toEntity(dto)));
    }
}
```

## Validator Implementation

Validators encapsulate business rule logic:

```java
@Component
@RequiredArgsConstructor
public class SupplierValidator {
    
    private final SupplierRepository repository;
    
    public void validateUniquenessOnCreate(String name) {
        if (repository.existsByNameIgnoreCase(name)) {
            throw new IllegalStateException(
                "Supplier with name '" + name + "' already exists");
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
    
    public void validateDeletionAllowed(String id) {
        long itemCount = itemRepository.countBySupplier(id);
        if (itemCount > 0) {
            throw new IllegalStateException(
                "Cannot delete supplier: " + itemCount + " items exist");
        }
    }
}
```

## Validation Order: Fail Early

Validations performed before any persistence operations:

```java
@Service
@RequiredArgsConstructor
@Transactional
public class InventoryItemServiceImpl implements InventoryItemService {
    
    private final InventoryItemValidator validator;
    private final InventoryItemRepository itemRepository;
    private final SupplierRepository supplierRepository;
    
    public InventoryItemDTO create(CreateInventoryItemDTO dto) {
        // 1. Validate input format FIRST
        validator.validateRequiredFields(dto);
        validator.validateQuantity(dto.getQuantity());
        validator.validatePrice(dto.getUnitPrice());
        
        // 2. Validate business rules (requires DB lookup)
        validator.validateSupplierExists(dto.getSupplierId());
        validator.validateNameUniqueness(dto.getName());
        
        // 3. Only THEN proceed to persistence
        InventoryItem item = mapper.toEntity(dto);
        item.setSupplier(supplierRepository.findById(dto.getSupplierId()).get());
        
        return mapper.toDTO(itemRepository.save(item));
    }
}
```

## Validation Exception Handling

Validators throw specific exceptions for clear error communication:

```java
@Component
@RequiredArgsConstructor
public class InventoryItemValidator {
    
    private final InventoryItemRepository repository;
    private final SupplierRepository supplierRepository;
    
    // Input validation → 400 Bad Request
    public void validateQuantity(Integer quantity) {
        if (quantity == null || quantity < 0) {
            throw new IllegalArgumentException("Quantity must be non-negative");
        }
    }
    
    // Business rule violation → 409 Conflict
    public void validateNameUniqueness(String name) {
        if (repository.existsByNameIgnoreCase(name)) {
            throw new IllegalStateException("Item name already exists");
        }
    }
    
    // Data not found → 404 Not Found
    public void validateSupplierExists(String supplierId) {
        if (!supplierRepository.existsById(supplierId)) {
            throw new NoSuchElementException("Supplier not found");
        }
    }
}
```

## Composite Validators for Complex Rules

```java
@Component
@RequiredArgsConstructor
public class InventoryItemUpdateValidator {
    
    private final InventoryItemValidator itemValidator;
    private final SupplierRepository supplierRepository;
    
    public void validateUpdate(String itemId, UpdateInventoryItemDTO dto) {
        // Basic field validation
        itemValidator.validateQuantity(dto.getQuantity());
        itemValidator.validatePrice(dto.getUnitPrice());
        
        // Complex rule: if supplier changed, validate new supplier
        if (dto.getSupplierId() != null) {
            itemValidator.validateSupplierExists(dto.getSupplierId());
        }
        
        // Complex rule: cannot change supplier if stock movements exist
        if (dto.getSupplierId() != null && stockMovementsExist(itemId)) {
            throw new IllegalStateException(
                "Cannot change supplier: stock movements exist");
        }
    }
    
    private boolean stockMovementsExist(String itemId) {
        return stockHistoryRepository.countByItemId(itemId) > 0;
    }
}
```

## Anti-Pattern: Validation in Service

```java
// ❌ Bad - Validation logic mixed with business logic
@Service
public class SupplierServiceImpl implements SupplierService {
    
    public SupplierDTO create(CreateSupplierDTO dto) {
        // Validation clutters service method
        if (dto.getName() == null || dto.getName().isBlank()) {
            throw new IllegalArgumentException("Name required");
        }
        if (repository.existsByNameIgnoreCase(dto.getName())) {
            throw new IllegalStateException("Duplicate");
        }
        if (dto.getContactName() == null || dto.getContactName().isBlank()) {
            throw new IllegalArgumentException("Contact required");
        }
        
        // Actual business logic buried here
        return mapper.toDTO(repository.save(mapper.toEntity(dto)));
    }
}
```

## Best Practice: Separated Concerns

```java
// ✅ Good - Clear separation of validation and business logic
@Service
@RequiredArgsConstructor
public class SupplierServiceImpl implements SupplierService {
    
    private final SupplierRepository repository;
    private final SupplierValidator validator;
    private final SupplierMapper mapper;
    
    @Transactional
    public SupplierDTO create(CreateSupplierDTO dto) {
        // Validation delegated
        validator.validateRequiredFields(dto);
        validator.validateUniquenessOnCreate(dto.getName());
        
        // Business logic clean and focused
        Supplier supplier = mapper.toEntity(dto);
        return mapper.toDTO(repository.save(supplier));
    }
}
```

---

[⬅️ Back to Layers Overview](./index.md)
