[⬅️ Back to Layers Overview](./index.md)

# Audit Logging

## Pattern Overview

Changes are tracked through `createdBy`, `createdAt`, `updatedBy`, and `updatedAt` fields set via Spring Security context.

## Core Implementation

Audit fields are immutable fields populated from Spring Security:

```java
@Entity
@Table(name = "SUPPLIER")
@Data
@NoArgsConstructor
public class Supplier {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(name = "NAME", nullable = false, unique = true)
    private String name;
    
    // Audit fields
    @Column(name = "CREATED_BY", nullable = false, updatable = false)
    private String createdBy;
    
    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @Column(name = "UPDATED_BY")
    private String updatedBy;
    
    @Column(name = "UPDATED_AT")
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
```

## Setting Audit Fields in Service

Services set audit fields from the current authenticated user:

```java
@Service
@RequiredArgsConstructor
public class SupplierServiceImpl implements SupplierService {
    
    private final SupplierRepository repository;
    private final SupplierMapper mapper;
    
    @Transactional
    public SupplierDTO create(CreateSupplierDTO dto) {
        Supplier supplier = mapper.toEntity(dto);
        
        // Get current user from SecurityContext
        String currentUser = getCurrentUsername();
        
        // Set audit fields
        supplier.setCreatedBy(currentUser);
        supplier.setCreatedAt(LocalDateTime.now());
        
        return mapper.toDTO(repository.save(supplier));
    }
    
    @Transactional
    public SupplierDTO update(String id, UpdateSupplierDTO dto) {
        Supplier supplier = repository.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Not found"));
        
        // Update business fields
        supplier.setName(dto.getName());
        supplier.setContactName(dto.getContactName());
        
        // Update audit fields
        supplier.setUpdatedBy(getCurrentUsername());
        supplier.setUpdatedAt(LocalDateTime.now());
        
        return mapper.toDTO(repository.save(supplier));
    }
    
    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext()
            .getAuthentication();
        return auth != null ? auth.getName() : "SYSTEM";
    }
}
```

## Automatic Timestamp Management

Using Spring's `@CreationTimestamp` and `@UpdateTimestamp` (Hibernate):

```java
@Entity
@Table(name = "INVENTORY_ITEM")
@Data
public class InventoryItem {
    
    @Id
    private String id;
    
    private String name;
    
    // Automatically set on creation
    @Column(updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    // Automatically updated on modification
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
```

**Note:** Timestamps are automatic, but user tracking (`createdBy`, `updatedBy`) must be set manually in service.

## Query Example: Filter by User

Find all items created by a specific user:

```java
@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, String> {
    
    List<InventoryItem> findByCreatedBy(String username);
    
    List<InventoryItem> findByCreatedByAndCreatedAtAfter(
        String username, 
        LocalDateTime date);
}

@Service
@RequiredArgsConstructor
public class InventoryItemServiceImpl implements InventoryItemService {
    
    private final InventoryItemRepository repository;
    
    public List<InventoryItemDTO> findByCurrentUser() {
        String currentUser = getCurrentUsername();
        return repository.findByCreatedBy(currentUser)
            .stream()
            .map(mapper::toDTO)
            .collect(toList());
    }
}
```

## Audit Trail Example

View complete audit trail for an item:

```java
// Entity with audit fields
InventoryItem item = repository.findById(itemId).get();

// Access complete audit information
System.out.println("Created by: " + item.getCreatedBy());
System.out.println("Created at: " + item.getCreatedAt());
System.out.println("Updated by: " + item.getUpdatedBy());
System.out.println("Updated at: " + item.getUpdatedAt());

// Output example:
// Created by: john.doe
// Created at: 2025-01-15 10:30:00
// Updated by: jane.smith
// Updated at: 2025-01-16 14:22:15
```

## StockHistory: Immutable Audit Trail

For truly immutable audit trails, use create-only entities:

```java
@Entity
@Table(name = "STOCK_HISTORY")
@Data
@NoArgsConstructor
public class StockHistory {
    
    @Id
    private String id;
    
    @ManyToOne
    @JoinColumn(name = "ITEM_ID", nullable = false)
    private InventoryItem item;
    
    @Column(name = "OLD_QUANTITY")
    private Integer oldQuantity;
    
    @Column(name = "NEW_QUANTITY")
    private Integer newQuantity;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "REASON")
    private StockChangeReason reason;
    
    // Audit fields (immutable)
    @Column(name = "CREATED_BY", nullable = false, updatable = false)
    private String createdBy;
    
    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;
}

// Service creates entries, never updates
@Service
@RequiredArgsConstructor
public class StockHistoryServiceImpl implements StockHistoryService {
    
    private final StockHistoryRepository repository;
    
    @Transactional
    public StockHistoryDTO create(StockHistoryCreateDTO dto) {
        StockHistory history = new StockHistory();
        history.setItem(dto.getItem());
        history.setOldQuantity(dto.getOldQuantity());
        history.setNewQuantity(dto.getNewQuantity());
        history.setReason(dto.getReason());
        history.setCreatedBy(getCurrentUsername());
        
        return mapper.toDTO(repository.save(history));
    }
    
    // No update method - entries are immutable
    
    private String getCurrentUsername() {
        return SecurityContextHolder.getContext()
            .getAuthentication()
            .getName();
    }
}
```

## Anti-Pattern: Missing Audit Fields

```java
// ❌ Bad - No audit trail
@Entity
public class Supplier {
    private String id;
    private String name;
    // No createdBy, createdAt, updatedBy, updatedAt
}

@Service
public class SupplierServiceImpl {
    public SupplierDTO create(CreateSupplierDTO dto) {
        return mapper.toDTO(repository.save(mapper.toEntity(dto)));
    }
}
```

## Best Practice: Complete Audit Trail

```java
// ✅ Good - Complete audit trail
@Entity
public class Supplier {
    private String id;
    private String name;
    
    @Column(updatable = false)
    private String createdBy;
    
    @Column(updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    private String updatedBy;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}

@Service
@RequiredArgsConstructor
public class SupplierServiceImpl {
    
    @Transactional
    public SupplierDTO create(CreateSupplierDTO dto) {
        Supplier supplier = mapper.toEntity(dto);
        supplier.setCreatedBy(getCurrentUsername());
        supplier.setCreatedAt(LocalDateTime.now());
        
        return mapper.toDTO(repository.save(supplier));
    }
    
    private String getCurrentUsername() {
        return SecurityContextHolder.getContext()
            .getAuthentication()
            .getName();
    }
}
```

---

[⬅️ Back to Layers Overview](./index.md)
