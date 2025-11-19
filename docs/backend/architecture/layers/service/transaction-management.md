[⬅️ Back to Layers Overview](./index.md)

# Transaction Management

## Pattern Overview

Transaction management ensures data consistency across database operations. The `@Transactional` annotation marks method boundaries as atomic units of work.

## Core Principle: One Transaction Per Operation

Services group all related operations into a single transaction to ensure atomicity:

```java
@Service
@RequiredArgsConstructor
public class InventoryItemServiceImpl implements InventoryItemService {
    
    private final InventoryItemRepository itemRepository;
    private final StockHistoryService stockHistoryService;
    
    @Transactional  // Single transaction wraps entire operation
    public InventoryItemDTO create(CreateInventoryItemDTO dto) {
        // Step 1: Create and save item
        InventoryItem item = mapper.toEntity(dto);
        InventoryItem saved = itemRepository.save(item);
        
        // Step 2: Create audit entry in SAME transaction
        stockHistoryService.logInitialStock(saved);
        
        // Step 3: All changes committed atomically
        return mapper.toDTO(saved);
    }
}
```

## Why @Transactional?

1. **Atomicity** - Either all steps succeed or all rollback
2. **Consistency** - Database state remains valid
3. **Isolation** - Concurrent modifications don't interfere
4. **Durability** - Committed changes persist

## Transactional Write Operations

All write operations must be marked with `@Transactional`:

```java
@Service
@RequiredArgsConstructor
public class SupplierServiceImpl implements SupplierService {
    
    private final SupplierRepository repository;
    
    @Transactional
    public SupplierDTO create(CreateSupplierDTO dto) {
        Supplier supplier = mapper.toEntity(dto);
        return mapper.toDTO(repository.save(supplier));
    }
    
    @Transactional
    public SupplierDTO update(String id, UpdateSupplierDTO dto) {
        Supplier supplier = repository.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Not found"));
        
        supplier.setName(dto.getName());
        supplier.setContactName(dto.getContactName());
        // Save happens implicitly at transaction end
        
        return mapper.toDTO(supplier);
    }
    
    @Transactional
    public void delete(String id) {
        repository.deleteById(id);
    }
}
```

## Transactional Read Operations (Read-Only)

Read-only queries improve performance by preventing write analysis:

```java
@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl implements AnalyticsService {
    
    private final AnalyticsRepository repository;
    
    @Transactional(readOnly = true)  // Hint to database
    public DashboardSummaryDTO getDashboardSummary() {
        long itemCount = repository.countItems();
        long supplierCount = repository.countSuppliers();
        BigDecimal inventoryValue = repository.calculateTotalValue();
        
        return DashboardSummaryDTO.builder()
            .itemCount(itemCount)
            .supplierCount(supplierCount)
            .inventoryValue(inventoryValue)
            .build();
    }
}
```

## Nested Transactions with Propagation

Default propagation (REQUIRED) - join existing transaction:

```java
@Service
@RequiredArgsConstructor
public class InventoryItemServiceImpl implements InventoryItemService {
    
    private final InventoryItemRepository itemRepository;
    private final StockHistoryService stockHistoryService;
    
    @Transactional
    public InventoryItemDTO create(CreateInventoryItemDTO dto) {
        InventoryItem saved = itemRepository.save(mapper.toEntity(dto));
        
        // Joins current transaction (doesn't create new one)
        stockHistoryService.logInitialStock(saved);
        
        return mapper.toDTO(saved);
    }
}

@Service
@RequiredArgsConstructor
public class StockHistoryServiceImpl implements StockHistoryService {
    
    private final StockHistoryRepository repository;
    
    @Transactional  // PROPAGATION.REQUIRED (default)
    public void logInitialStock(InventoryItem item) {
        StockHistory history = new StockHistory();
        history.setItem(item);
        history.setReason(StockChangeReason.ADJUSTMENT);
        repository.save(history);
        // Commit handled by outer transaction
    }
}
```

## Rollback Behavior

By default, unchecked exceptions trigger rollback:

```java
@Transactional
public SupplierDTO create(CreateSupplierDTO dto) {
    // If this throws, entire transaction rolls back
    validator.validateUniquenessOnCreate(dto.getName());
    
    Supplier supplier = mapper.toEntity(dto);
    return mapper.toDTO(repository.save(supplier));
}
```

Checked exceptions do NOT rollback by default (can be configured):

```java
@Transactional(rollbackFor = Exception.class)  // Rollback on any exception
public void riskyOperation() throws Exception {
    // Now checked exceptions also trigger rollback
}
```

---

[⬅️ Back to Layers Overview](./index.md)
