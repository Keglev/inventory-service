# Audit Trail Patterns

## Overview

This document describes the audit trail implementation patterns used throughout the Smart Supply Pro inventory service, with emphasis on the **stock history integration** that provides immutable event logging for all inventory changes.

---

## Core Audit Fields

### Entity-Level Auditing

**Base audit fields in all entities:**
```java
@MappedSuperclass
public abstract class AuditableEntity {
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @Column(name = "created_by", nullable = false, updatable = false, length = 50)
    private String createdBy;
    
    @Column(name = "updated_by", nullable = false, length = 50)
    private String updatedBy;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

**Example entity:**
```java
@Entity
@Table(name = "inventory_items")
public class InventoryItem extends AuditableEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    private String name;
    private String description;
    private Integer quantity;
    private BigDecimal price;
    private String supplierId;
    
    // Inherited audit fields:
    // - createdAt, updatedAt, createdBy, updatedBy
}
```

**Benefits:**
- ✅ **Who**: Track which user created/updated records
- ✅ **When**: Automatic timestamp management
- ✅ **Immutability**: `createdAt` and `createdBy` never change
- ✅ **Consistency**: Same pattern across all entities

---

## Stock History Event Logging

### Architecture Overview

**Stock history serves as immutable event log:**
```
InventoryItem Entity (Mutable State)
         ↓
Stock History Events (Immutable Log)
         ↓
Analytics Service (Aggregations)
```

### Integration Pattern

**InventoryItemServiceImpl.java:**
```java
@Service
public class InventoryItemServiceImpl extends BaseService {
    
    private final StockHistoryService stockHistoryService;
    
    /**
     * Creates inventory item with audit trail logging.
     * @param dto item data
     * @return created item
     */
    @Transactional
    public InventoryItemDTO create(InventoryItemDTO dto) {
        // 1. Create inventory item
        InventoryItem entity = InventoryItemMapper.toEntity(dto, currentUsername());
        InventoryItem saved = inventoryItemRepository.save(entity);
        
        // 2. Log stock history event (AFTER successful save)
        // Enterprise Comment: Event Sourcing Integration
        // Stock history logged after item save to ensure consistency
        // @Transactional ensures rollback of both if history log fails
        stockHistoryService.logStockChange(
            saved.getId(),                      // Item ID
            dto.getQuantity(),                  // Quantity change
            StockChangeReason.INITIAL_STOCK,    // Business reason
            currentUsername(),                  // Authenticated user
            saved.getPrice()                    // Price at transaction time
        );
        
        return InventoryItemMapper.toDTO(saved);
    }
    
    /**
     * Updates inventory item with audit trail logging.
     * @param id item ID
     * @param dto updated data
     * @return updated item
     */
    @Transactional
    public InventoryItemDTO update(String id, InventoryItemDTO dto) {
        InventoryItem existing = inventoryItemRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Item not found: " + id));
        
        // Calculate quantity delta for history
        int oldQuantity = existing.getQuantity();
        int newQuantity = dto.getQuantity();
        int quantityChange = newQuantity - oldQuantity;
        
        // Update entity
        InventoryItemMapper.updateEntity(existing, dto, currentUsername());
        InventoryItem saved = inventoryItemRepository.save(existing);
        
        // Log stock change if quantity changed
        if (quantityChange != 0) {
            // Enterprise Comment: Delta Tracking
            // Only log history when quantity changes to avoid noise
            StockChangeReason reason = quantityChange > 0 ? 
                StockChangeReason.RESTOCK : 
                StockChangeReason.ADJUSTMENT;
            
            stockHistoryService.logStockChange(
                saved.getId(), 
                quantityChange,  // Delta, not absolute quantity
                reason, 
                currentUsername(), 
                saved.getPrice()
            );
        }
        
        return InventoryItemMapper.toDTO(saved);
    }
}
```

### Stock Change Reasons

**Business categorization of inventory changes:**
```java
public enum StockChangeReason {
    INITIAL_STOCK,   // First-time inventory entry
    RESTOCK,         // Purchase order received
    SALE,            // Customer purchase
    RETURN,          // Customer return
    DAMAGE,          // Damaged/spoiled goods
    ADJUSTMENT,      // Manual correction
    TRANSFER_IN,     // Warehouse transfer (incoming)
    TRANSFER_OUT,    // Warehouse transfer (outgoing)
    INVENTORY_COUNT  // Physical count reconciliation
}
```

**Usage patterns:**
- **Positive changes**: `INITIAL_STOCK`, `RESTOCK`, `RETURN`, `TRANSFER_IN`, `INVENTORY_COUNT`
- **Negative changes**: `SALE`, `DAMAGE`, `TRANSFER_OUT`, `INVENTORY_COUNT`
- **Either direction**: `ADJUSTMENT` (manual corrections)

---

## Transactional Consistency

### Pattern: Atomic Audit Logging

**@Transactional ensures all-or-nothing:**
```java
@Transactional
public InventoryItemDTO create(InventoryItemDTO dto) {
    // Step 1: Save inventory item
    InventoryItem saved = inventoryItemRepository.save(entity);
    
    // Step 2: Log stock history
    stockHistoryService.logStockChange(...);
    
    // If Step 2 fails → Step 1 automatically rolled back
    // If Step 1 fails → Step 2 never executes
    
    return InventoryItemMapper.toDTO(saved);
}
```

**Benefits:**
- ✅ **Consistency**: Item and history always in sync
- ✅ **Reliability**: No orphaned records or missing events
- ✅ **Integrity**: Database constraints enforced across both operations

### Pattern: Post-Save Event Logging

**Why log AFTER save, not before:**
```java
// CORRECT: Log after save
InventoryItem saved = repository.save(entity);  // Get generated ID
stockHistoryService.logStockChange(saved.getId(), ...);  // Use real ID

// WRONG: Log before save
stockHistoryService.logStockChange(entity.getId(), ...);  // ID is null!
InventoryItem saved = repository.save(entity);
```

**Reason:** Entity ID generated by database on persist, needed for history FK.

---

## Analytics Integration

### Denormalized Data Pattern

**Stock history stores snapshot data:**
```java
@Entity
@Table(name = "stock_history")
public class StockHistory extends AuditableEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(name = "item_id", nullable = false)
    private String itemId;
    
    @Column(name = "quantity_change", nullable = false)
    private Integer quantityChange;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "reason", nullable = false)
    private StockChangeReason reason;
    
    @Column(name = "performed_by", nullable = false)
    private String performedBy;
    
    // Enterprise Comment: Denormalized Snapshot
    // Price copied from inventory item at transaction time
    // Enables historical WAC calculations without joins
    @Column(name = "price_at_change", precision = 10, scale = 2)
    private BigDecimal priceAtChange;
    
    @Column(name = "notes", length = 500)
    private String notes;
}
```

**Why denormalize price?**
- ✅ **Historical accuracy**: Captures price at exact moment of change
- ✅ **Performance**: Analytics queries don't need joins to inventory table
- ✅ **WAC calculations**: Enables weighted average cost without current item data
- ✅ **Audit completeness**: Full context of transaction preserved

### Analytics Service Integration

**WAC calculation using stock history:**
```java
@Service
public class AnalyticsServiceImpl extends BaseService {
    
    /**
     * Calculates weighted average cost from stock history.
     * @param itemId inventory item ID
     * @return WAC or null if no purchase history
     * @see docs/architecture/services/analytics-service.md#wac-calculation
     */
    public BigDecimal calculateWeightedAverageCost(String itemId) {
        // Enterprise Comment: WAC Formula
        // WAC = Σ(quantity × price) / Σ(quantity)
        // Only considers RESTOCK and INITIAL_STOCK events
        List<StockHistory> purchases = stockHistoryRepository.findByItemIdAndReasonIn(
            itemId, 
            List.of(StockChangeReason.INITIAL_STOCK, StockChangeReason.RESTOCK)
        );
        
        if (purchases.isEmpty()) {
            return null;
        }
        
        BigDecimal totalCost = BigDecimal.ZERO;
        int totalQuantity = 0;
        
        for (StockHistory history : purchases) {
            // Uses priceAtChange (denormalized) for accuracy
            BigDecimal cost = history.getPriceAtChange()
                .multiply(BigDecimal.valueOf(history.getQuantityChange()));
            totalCost = totalCost.add(cost);
            totalQuantity += history.getQuantityChange();
        }
        
        return totalCost.divide(
            BigDecimal.valueOf(totalQuantity), 
            2, 
            RoundingMode.HALF_UP
        );
    }
}
```

---

## Query Patterns

### Time-Range Queries

**Find changes within date range:**
```java
@Query("""
    SELECT sh FROM StockHistory sh
    WHERE sh.itemId = :itemId
    AND sh.createdAt BETWEEN :startDate AND :endDate
    ORDER BY sh.createdAt DESC
    """)
List<StockHistory> findByItemAndDateRange(
    @Param("itemId") String itemId,
    @Param("startDate") LocalDateTime startDate,
    @Param("endDate") LocalDateTime endDate
);
```

### User Activity Audit

**Track all actions by specific user:**
```java
@Query("""
    SELECT sh FROM StockHistory sh
    WHERE sh.performedBy = :username
    ORDER BY sh.createdAt DESC
    """)
List<StockHistory> findByUser(@Param("username") String username);
```

### Reason-Based Filtering

**Find specific types of changes:**
```java
@Query("""
    SELECT sh FROM StockHistory sh
    WHERE sh.reason IN :reasons
    AND sh.createdAt >= :since
    ORDER BY sh.createdAt DESC
    """)
List<StockHistory> findByReasonsAndDate(
    @Param("reasons") List<StockChangeReason> reasons,
    @Param("since") LocalDateTime since
);

// Usage: Find all damages and losses in last 30 days
List<StockHistory> losses = repository.findByReasonsAndDate(
    List.of(StockChangeReason.DAMAGE, StockChangeReason.ADJUSTMENT),
    LocalDateTime.now().minusDays(30)
);
```

---

## Compliance & Reporting

### Regulatory Requirements

**Immutable audit trail for compliance:**
- **Sarbanes-Oxley (SOX)**: Financial record integrity
- **FDA 21 CFR Part 11**: Electronic record requirements (pharmaceutical)
- **GDPR Article 30**: Record of processing activities

**Stock history meets requirements:**
- ✅ **Immutability**: No updates/deletes allowed
- ✅ **Completeness**: Every change logged with context
- ✅ **Traceability**: User, timestamp, reason captured
- ✅ **Retention**: Historical data preserved indefinitely

### Audit Reports

**Monthly inventory change report:**
```java
public MonthlyAuditReport generateMonthlyReport(int year, int month) {
    LocalDateTime start = LocalDateTime.of(year, month, 1, 0, 0);
    LocalDateTime end = start.plusMonths(1);
    
    List<StockHistory> changes = stockHistoryRepository.findByDateRange(start, end);
    
    Map<StockChangeReason, Integer> changesByReason = changes.stream()
        .collect(Collectors.groupingBy(
            StockHistory::getReason,
            Collectors.summingInt(StockHistory::getQuantityChange)
        ));
    
    Map<String, Integer> changesByUser = changes.stream()
        .collect(Collectors.groupingBy(
            StockHistory::getPerformedBy,
            Collectors.summingInt(sh -> 1)  // Count of changes
        ));
    
    return new MonthlyAuditReport(year, month, changesByReason, changesByUser);
}
```

---

## Best Practices

### 1. Always Log After Success

```java
@Transactional
public void performInventoryAction() {
    // 1. Execute business logic
    InventoryItem saved = repository.save(entity);
    
    // 2. Log audit event AFTER success
    auditService.log(saved.getId(), ...);
    
    // If audit logging fails, transaction rolls back entire operation
}
```

### 2. Use Business-Meaningful Reasons

```java
// GOOD: Clear business reason
stockHistoryService.logStockChange(
    itemId, 
    -50, 
    StockChangeReason.SALE,  // <-- Explicit business context
    currentUsername(), 
    price
);

// BAD: Generic or unclear reason
stockHistoryService.logStockChange(
    itemId, 
    -50, 
    StockChangeReason.ADJUSTMENT,  // Ambiguous
    currentUsername(), 
    price
);
```

### 3. Denormalize Critical Context

```java
@Entity
public class StockHistory {
    // Denormalize data needed for analytics
    private BigDecimal priceAtChange;  // Not FK to current price
    
    // Optional: Denormalize item name for reporting
    private String itemNameSnapshot;
    
    // Optional: Denormalize supplier for supply chain analytics
    private String supplierIdSnapshot;
}
```

### 4. Prevent Audit Log Manipulation

**Repository-level protection:**
```java
public interface StockHistoryRepository extends JpaRepository<StockHistory, String> {
    
    // Only allow inserts (via save with null ID)
    // NO custom update or delete methods exposed
    
    // Queries only
    List<StockHistory> findByItemId(String itemId);
    List<StockHistory> findByPerformedBy(String username);
}
```

**Database-level protection:**
```sql
-- Trigger to prevent updates
CREATE TRIGGER prevent_stock_history_updates
BEFORE UPDATE ON stock_history
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Stock history records are immutable';
END;

-- Trigger to prevent deletes
CREATE TRIGGER prevent_stock_history_deletes
BEFORE DELETE ON stock_history
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Stock history records cannot be deleted';
END;
```

---

## Testing Strategies

### Unit Testing Audit Trail

```java
@Test
@Transactional
void create_shouldLogStockHistory() {
    // Given
    InventoryItemDTO dto = createTestDTO();
    dto.setQuantity(100);
    
    // When
    InventoryItemDTO created = inventoryItemService.create(dto);
    
    // Then
    List<StockHistory> history = stockHistoryRepository.findByItemId(created.getId());
    assertFalse(history.isEmpty());
    
    StockHistory event = history.get(0);
    assertEquals(100, event.getQuantityChange());
    assertEquals(StockChangeReason.INITIAL_STOCK, event.getReason());
    assertEquals("testUser", event.getPerformedBy());
}
```

### Integration Testing Transactional Rollback

```java
@Test
void create_shouldRollbackBoth_whenHistoryFails() {
    // Given
    InventoryItemDTO dto = createTestDTO();
    
    // Mock stock history service to throw exception
    doThrow(new RuntimeException("History logging failed"))
        .when(stockHistoryService).logStockChange(any(), anyInt(), any(), any(), any());
    
    // When/Then
    assertThrows(RuntimeException.class, () -> inventoryItemService.create(dto));
    
    // Verify inventory item was also rolled back
    assertEquals(0, inventoryItemRepository.count());
    assertEquals(0, stockHistoryRepository.count());
}
```

---

## References

- **Event Sourcing**: https://martinfowler.com/eaaDev/EventSourcing.html
- **Audit Logging Best Practices**: OWASP Logging Cheat Sheet
- **Related Documentation**: 
  - `stock-history-service.md` - Complete stock history architecture
  - `security-context.md` - User tracking patterns
  - `analytics-service.md` - WAC calculation details

---

*Document Version: 1.0*  
*Last Updated: 2025*  
*Project: Smart Supply Pro Inventory Service*