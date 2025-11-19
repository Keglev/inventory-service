[⬅️ Back to Layers Overview](./index.md)

# Transaction Management

## Pattern Overview

Repositories operate within service layer transactions. The `@Transactional` annotation creates transaction boundaries that ensure data consistency.

## Basic Transaction Pattern

```java
@Service
@RequiredArgsConstructor
public class InventoryItemServiceImpl implements InventoryItemService {
    
    private final InventoryItemRepository itemRepository;
    private final StockHistoryRepository historyRepository;
    
    @Transactional  // Single transaction for entire method
    public InventoryItemDTO create(CreateInventoryItemDTO dto) {
        // 1. Create item
        InventoryItem item = new InventoryItem();
        item.setName(dto.getName());
        item.setSupplierId(dto.getSupplierId());
        InventoryItem savedItem = itemRepository.save(item);
        
        // 2. Create initial stock audit entry
        StockHistory history = new StockHistory();
        history.setItemId(savedItem.getId());
        history.setOldQuantity(0);
        history.setNewQuantity(dto.getInitialQuantity());
        history.setReason(StockChangeReason.INITIAL);
        historyRepository.save(history);
        
        // Both saves in same transaction
        // Either both succeed or both rollback
        
        return mapper.toDTO(savedItem);
    }
}
```

## Transactional Boundaries

All writes must be within @Transactional:

```java
@Service
@RequiredArgsConstructor
public class SupplierServiceImpl implements SupplierService {
    
    private final SupplierRepository repository;
    
    // ✅ Good - Transactional write
    @Transactional
    public SupplierDTO create(CreateSupplierDTO dto) {
        Supplier supplier = mapper.toEntity(dto);
        supplier.setCreatedBy(getCurrentUser());
        supplier.setCreatedAt(LocalDateTime.now());
        
        return mapper.toDTO(repository.save(supplier));
    }
    
    // ✅ Good - Transactional update
    @Transactional
    public SupplierDTO update(String id, UpdateSupplierDTO dto) {
        Supplier supplier = repository.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Not found"));
        
        supplier.setName(dto.getName());
        supplier.setContactName(dto.getContactName());
        // Auto-persisted by transaction
        
        return mapper.toDTO(supplier);
    }
    
    // ✅ Good - Transactional delete
    @Transactional
    public void delete(String id) {
        repository.deleteById(id);
    }
    
    // ✅ Good - Read-only optimization
    @Transactional(readOnly = true)
    public SupplierDTO findById(String id) {
        return repository.findById(id)
            .map(mapper::toDTO)
            .orElseThrow(() -> new NoSuchElementException("Not found"));
    }
}
```

## Nested Transactions

Services may call other services within same transaction:

```java
@Service
@RequiredArgsConstructor
public class InventoryItemServiceImpl {
    
    private final InventoryItemRepository itemRepository;
    private final StockHistoryService stockHistoryService;
    
    @Transactional
    public InventoryItemDTO create(CreateInventoryItemDTO dto) {
        // Create item
        InventoryItem saved = itemRepository.save(mapper.toEntity(dto));
        
        // Call another service - joins same transaction
        stockHistoryService.logInitialStock(saved);
        
        return mapper.toDTO(saved);
    }
}

@Service
@RequiredArgsConstructor
public class StockHistoryServiceImpl {
    
    private final StockHistoryRepository repository;
    
    @Transactional
    public void logInitialStock(InventoryItem item) {
        StockHistory history = new StockHistory();
        history.setItem(item);
        history.setReason(StockChangeReason.INITIAL);
        repository.save(history);
        // Joins transaction from calling service
    }
}
```

## Rollback Behavior

By default, unchecked exceptions trigger rollback:

```java
@Service
@Transactional
public class SupplierServiceImpl {
    
    public SupplierDTO create(CreateSupplierDTO dto) {
        // If validation fails, exception triggers rollback
        if (repository.existsByNameIgnoreCase(dto.getName())) {
            throw new IllegalStateException("Duplicate supplier");
        }
        
        // If database error occurs, exception triggers rollback
        return mapper.toDTO(repository.save(mapper.toEntity(dto)));
    }
}
```

Checked exceptions do NOT trigger rollback by default:

```java
@Service
@Transactional(rollbackFor = Exception.class)  // Force rollback
public class SupplierServiceImpl {
    
    public void riskyOperation() throws Exception {
        // Now checked exceptions also trigger rollback
        repository.save(mapper.toEntity(dto));
    }
}
```

## Transaction Isolation

Control how concurrent transactions interact:

```java
@Service
@Transactional(isolation = Isolation.READ_COMMITTED)
public class InventoryItemServiceImpl {
    
    public InventoryItemDTO create(CreateInventoryItemDTO dto) {
        // Default: READ_COMMITTED
        // Prevents dirty reads but allows non-repeatable reads
        return mapper.toDTO(repository.save(mapper.toEntity(dto)));
    }
}
```

## Propagation Control

Control how nested transactions behave:

```java
@Service
@Transactional(propagation = Propagation.REQUIRED)  // Default
public class InventoryItemServiceImpl {
    
    public void outerTransaction() {
        // Inner transaction joins outer transaction
        innerTransaction();
    }
    
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void innerTransaction() {
        // Creates NEW transaction, separate from outer
        // Commits independently
    }
}
```

## Multiple Repository Operations

Ensure all persist/delete operations in single transaction:

```java
@Service
@RequiredArgsConstructor
@Transactional
public class InventoryItemServiceImpl {
    
    private final InventoryItemRepository itemRepository;
    private final StockHistoryRepository historyRepository;
    private final SupplierRepository supplierRepository;
    
    public InventoryItemDTO updateStock(String itemId, int newQuantity) {
        // All three operations in same transaction
        InventoryItem item = itemRepository.findById(itemId)
            .orElseThrow(() -> new NoSuchElementException("Item not found"));
        
        Supplier supplier = supplierRepository.findById(item.getSupplierId())
            .orElseThrow(() -> new NoSuchElementException("Supplier not found"));
        
        // Record history
        StockHistory history = new StockHistory();
        history.setItemId(item.getId());
        history.setOldQuantity(item.getQuantity());
        history.setNewQuantity(newQuantity);
        history.setReason(StockChangeReason.ADJUSTMENT);
        historyRepository.save(history);
        
        // Update item
        item.setQuantity(newQuantity);
        InventoryItem updated = itemRepository.save(item);
        
        // All persist at transaction end
        return mapper.toDTO(updated);
    }
}
```

---

[⬅️ Back to Layers Overview](./index.md)
