# Inventory Item Service Architecture

## Overview

The **InventoryItemServiceImpl** is the core service for inventory lifecycle management, providing comprehensive CRUD operations with integrated audit trails, security validation, and business rule enforcement. It coordinates inventory item operations while maintaining strict data integrity and complete audit history through the stock history subsystem.

## Core Responsibilities

### 1. CRUD Operations
- **Create**: New inventory items with validation and initial stock logging
- **Read**: Single items, paginated lists, and search operations
- **Update**: Item modifications with conditional audit trail
- **Delete**: Hard deletion with complete audit trail preservation

### 2. Stock Management
- **Quantity Adjustments**: Positive/negative stock changes with reason tracking
- **Price Updates**: Separate price changes without stock movement
- **Non-Negative Enforcement**: Business rule preventing negative inventory

### 3. Audit Trail Integration
- **Complete History**: Every stock movement recorded with user context
- **Stock History Service**: Tight integration for compliance and analytics
- **User Tracking**: Authenticated user context for all changes

### 4. Validation & Security
- **Business Rule Validation**: Price positivity, uniqueness, supplier existence
- **Security Validation**: User permissions and role-based access
- **Data Integrity**: Foreign key validation and constraint enforcement

## Architecture Patterns

### Service Layer Design
```java
@Service
public class InventoryItemServiceImpl implements InventoryItemService {
    private final InventoryItemRepository repository;
    private final StockHistoryService stockHistoryService;
    private final SupplierRepository supplierRepository;
    
    // Transactional CRUD operations
    // Integrated audit trail logging
    // Layered validation strategy
}
```

**Key Characteristics**:
- **Dependency Injection**: Constructor-based for immutability
- **Transactional Boundaries**: Proper transaction management for data consistency
- **Audit Integration**: Every mutation logged to stock history
- **Security Context**: User tracking for compliance

### Validation Strategy (Layered Approach)
```java
// Business validation layer
InventoryItemValidator.validateBase(dto);
InventoryItemValidator.validateExists(id, repository);
InventoryItemValidator.validateInventoryItemNotExists(name, price, repository);

// Security validation layer
InventoryItemSecurityValidator.validateUpdatePermissions(existing, dto);
```

**Validation Layers**:
1. **Business Rules**: DTO validation, constraints, uniqueness
2. **Security Rules**: User permissions, role-based access
3. **Data Integrity**: Foreign key existence, database constraints

**Benefits**:
- **Separation of Concerns**: Business vs security validation
- **Reusability**: Validation logic shared across methods
- **Testability**: Each layer testable in isolation
- **Maintainability**: Centralized validation rules

## Key Methods Deep Dive

### 1. save() - Create New Item
**Purpose**: Create new inventory item with comprehensive validation and audit trail.

**Operation Flow**:
```java
@Transactional
public InventoryItemDTO save(InventoryItemDTO dto) {
    // 1. Populate createdBy from authenticated user
    if (dto.getCreatedBy() == null || dto.getCreatedBy().trim().isEmpty()) {
        dto.setCreatedBy(currentUsername());
    }
    
    // 2. Validate DTO fields
    InventoryItemValidator.validateBase(dto);
    
    // 3. Check uniqueness (name + price)
    InventoryItemValidator.validateInventoryItemNotExists(dto.getName(), dto.getPrice(), repository);
    
    // 4. Validate supplier exists
    validateSupplierExists(dto.getSupplierId());
    
    // 5. Convert DTO to entity and generate server fields
    InventoryItem entity = InventoryItemMapper.toEntity(dto);
    entity.setId(UUID.randomUUID().toString());
    entity.setCreatedBy(currentUsername());
    entity.setCreatedAt(LocalDateTime.now());
    
    // 6. Apply business rules
    if (entity.getMinimumQuantity() <= 0) {
        entity.setMinimumQuantity(10);  // Default minimum
    }
    
    // 7. Persist entity
    InventoryItem saved = repository.save(entity);
    
    // 8. Log INITIAL_STOCK history entry
    stockHistoryService.logStockChange(
        saved.getId(),
        saved.getQuantity(),              // Initial quantity
        StockChangeReason.INITIAL_STOCK,  // Special reason
        currentUsername(),                // Who created
        saved.getPrice()                  // Price snapshot
    );
    
    return InventoryItemMapper.toDTO(saved);
}
```

**Critical Business Rules**:
- **Uniqueness**: No duplicate (name, price) combinations
- **Price Validation**: Must be positive (price > 0)
- **Supplier Validation**: Referenced supplier must exist
- **Minimum Quantity Default**: 10 if not provided or ≤ 0
- **Authoritative createdBy**: Always from SecurityContext (ignores client value)

**Audit Trail Behavior**:
- **INITIAL_STOCK Entry**: Establishes baseline for future calculations
- **Baseline for WAC**: First entry used in Weighted Average Cost calculations
- **Compliance Record**: Creates audit trail from item inception

### 2. update() - Modify Existing Item
**Purpose**: Update existing item with validation, security checks, and conditional audit trail.

**Operation Flow**:
```java
@Transactional
public Optional<InventoryItemDTO> update(String id, InventoryItemDTO dto) {
    // 1. Validate DTO and supplier
    InventoryItemValidator.validateBase(dto);
    validateSupplierExists(dto.getSupplierId());
    
    // 2. Verify item exists and get current state
    InventoryItem existing = InventoryItemValidator.validateExists(id, repository);
    
    // 3. Security validation
    InventoryItemSecurityValidator.validateUpdatePermissions(existing, dto);
    
    // 4. Detect changes for uniqueness check
    boolean nameChanged = !existing.getName().equalsIgnoreCase(dto.getName());
    boolean priceChanged = !existing.getPrice().equals(dto.getPrice());
    if (nameChanged || priceChanged) {
        InventoryItemValidator.validateInventoryItemNotExists(id, dto.getName(), dto.getPrice(), repository);
    }
    
    // 5. Calculate quantity delta for audit
    int quantityDiff = dto.getQuantity() - existing.getQuantity();
    
    // 6. Update entity fields
    existing.setName(dto.getName());
    existing.setQuantity(dto.getQuantity());
    existing.setSupplierId(dto.getSupplierId());
    if (dto.getMinimumQuantity() > 0) {
        existing.setMinimumQuantity(dto.getMinimumQuantity());
    }
    if (priceChanged) {
        assertPriceValid(dto.getPrice());
        existing.setPrice(dto.getPrice());
    }
    // CRITICAL: DO NOT overwrite createdBy (audit compliance)
    
    // 7. Persist changes
    InventoryItem updated = repository.save(existing);
    
    // 8. Conditional audit trail logging
    if (quantityDiff != 0) {
        stockHistoryService.logStockChange(
            updated.getId(),
            quantityDiff,                     // Delta (+ or -)
            StockChangeReason.MANUAL_UPDATE,  // Generic reason
            currentUsername(),                // Who changed
            updated.getPrice()                // Price snapshot
        );
    }
    
    return Optional.of(InventoryItemMapper.toDTO(updated));
}
```

**Key Rules**:
- **Security First**: User permissions checked before any changes
- **Conditional Audit**: Stock history only if quantity changed (delta ≠ 0)
- **Immutable Creator**: createdBy field never overwritten
- **Uniqueness Protection**: New (name, price) combination validated
- **Price Validation**: If price changed, must be positive

**Audit Trail Logic**:
- **Quantity Changed**: Logs MANUAL_UPDATE with delta and price snapshot
- **Quantity Unchanged**: No stock history entry (no movement to audit)
- **Price-Only Updates**: Use updatePrice() method for dedicated price change logging

### 3. delete() - Remove Item with Audit
**Purpose**: Delete inventory item after logging complete stock removal.

**Operation Flow**:
```java
@Transactional
public void delete(String id, StockChangeReason reason) {
    // 1. Validate deletion reason
    if (!isValidDeletionReason(reason)) {
        throw new IllegalArgumentException("Invalid reason for deletion");
    }
    
    // 2. Verify item exists
    InventoryItem item = repository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Item not found"));
    
    // 3. Log complete stock removal
    stockHistoryService.logStockChange(
        item.getId(),
        -item.getQuantity(),              // Full removal (negative)
        reason,                           // Specific deletion reason
        currentUsername(),                // Who deleted
        item.getPrice()                   // Final price snapshot
    );
    
    // 4. Hard delete from database
    repository.deleteById(id);
}
```

**Allowed Deletion Reasons**:
- **SCRAPPED**: Disposed as scrap material
- **DESTROYED**: Intentionally destroyed (recalls, etc.)
- **DAMAGED**: Damaged beyond repair
- **EXPIRED**: Past expiration date
- **LOST**: Theft, misplacement, shrinkage
- **RETURNED_TO_SUPPLIER**: Full stock returned

**Why Specific Reasons Required**:
- **Compliance**: Regulatory requirements for inventory write-offs
- **Financial Accuracy**: Different reasons have different accounting treatments
- **Analytics**: Understand patterns in inventory losses
- **Audit Trail**: Complete reasoning for deletion decisions

**Hard Delete Rationale**:
- **Clean Database**: No zombie records or complex deleted flags
- **Simpler Queries**: No need to filter out deleted items
- **Audit Preservation**: Stock history preserves essential audit data
- **Performance**: Smaller active dataset for better query performance

### 4. adjustQuantity() - Stock Movement
**Purpose**: Adjust inventory quantity with business reason tracking.

**Operation Flow**:
```java
@Transactional
public InventoryItemDTO adjustQuantity(String id, int delta, StockChangeReason reason) {
    // 1. Verify item exists
    InventoryItem item = repository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Item not found"));
    
    // 2. Calculate new quantity
    int newQty = item.getQuantity() + delta;
    
    // 3. Business rule: prevent negative stock
    InventoryItemValidator.assertFinalQuantityNonNegative(newQty);
    
    // 4. Update quantity
    item.setQuantity(newQty);
    InventoryItem saved = repository.save(item);
    
    // 5. Log stock movement
    stockHistoryService.logStockChange(
        saved.getId(),
        delta,                     // Exact delta (+ or -)
        reason,                    // Business reason
        currentUsername(),         // Who adjusted
        saved.getPrice()           // Price snapshot
    );
    
    return InventoryItemMapper.toDTO(saved);
}
```

**Delta Semantics**:
- **Positive Delta**: Stock increase (purchases, returns from customers)
- **Negative Delta**: Stock decrease (sales, damages, losses)
- **Zero Delta**: Allowed but creates no-op history entry

**Business Rule Enforcement**:
- **Non-Negative Final Quantity**: Prevents overselling
- **Reason Required**: Every movement must have business justification
- **User Tracking**: Who made the adjustment for accountability

**Common Usage Patterns**:
```java
// Receive shipment
adjustQuantity("item-123", +100, StockChangeReason.PURCHASE);

// Customer sale
adjustQuantity("item-123", -5, StockChangeReason.SALE);

// Damage write-off
adjustQuantity("item-123", -3, StockChangeReason.DAMAGED);
```

### 5. updatePrice() - Price Change Only
**Purpose**: Update item price without stock movement.

**Operation Flow**:
```java
@Transactional
public InventoryItemDTO updatePrice(String id, BigDecimal newPrice) {
    // 1. Validate price
    assertPriceValid(newPrice);
    
    // 2. Get item
    InventoryItem item = repository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Item not found"));
    
    // 3. Update price
    item.setPrice(newPrice);
    InventoryItem saved = repository.save(item);
    
    // 4. Log price change (delta = 0)
    stockHistoryService.logStockChange(
        saved.getId(),
        0,                           // No quantity change
        StockChangeReason.PRICE_CHANGE, // Special reason
        currentUsername(),           // Who changed price
        saved.getPrice()             // New price
    );
    
    return InventoryItemMapper.toDTO(saved);
}
```

**Price Change vs Quantity Change**:
- **updatePrice()**: Delta=0, reason=PRICE_CHANGE, NO WAC impact
- **adjustQuantity()**: Actual delta, business reason, triggers WAC recalculation

**Financial Implications**:
- **Existing Inventory**: NOT revalued (keeps old cost basis)
- **Future Purchases**: New price applies to subsequent acquisitions
- **WAC Calculation**: Price change alone doesn't affect Weighted Average Cost

## Security Integration Patterns

### User Context Extraction
```java
private String currentUsername() {
    Authentication a = SecurityContextHolder.getContext() != null
            ? SecurityContextHolder.getContext().getAuthentication() : null;
    return a != null ? a.getName() : "system";
}
```

**Security Context Usage**:
- **Audit Trail**: User recorded in every stock history entry
- **Created By**: Authoritative source for item creator
- **Compliance**: Who-did-what tracking for regulatory requirements
- **Default Fallback**: "system" for background processes

### Permission Validation
```java
// Example security check
InventoryItemSecurityValidator.validateUpdatePermissions(existing, dto);
```

**Security Validation Patterns**:
- **Role-Based Access**: Admin, manager, user permission levels
- **Ownership Checks**: Users can only modify their own items (if applicable)
- **Operation-Specific**: Different permissions for create vs update vs delete
- **Early Validation**: Security checked before any business logic

## Data Flow Architecture

### Transactional Boundaries
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Controllers   │───▶│ InventoryService │───▶│   Repositories  │
│                 │    │                  │    │                 │
│ • REST endpoints│    │ • Business logic │    │ • Entity CRUD   │
│ • DTO validation│    │ • Transactions   │    │ • Constraints   │
│ • Error handling│    │ • Audit logging  │    │ • Query methods │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                    ┌──────────────────────┐
                    │  StockHistoryService │
                    │                      │
                    │ • Audit trail       │
                    │ • User tracking     │
                    │ • Reason logging    │
                    └──────────────────────┘
```

### Transaction Management
```java
@Transactional  // Write operations
public InventoryItemDTO save(InventoryItemDTO dto) {
    // Entity save + stock history logging in single transaction
}

@Transactional(readOnly = true)  // Read operations
public List<InventoryItemDTO> getAll() {
    // Optimized for read-only access
}
```

**Transaction Benefits**:
- **Atomicity**: Entity change + audit log succeed or fail together
- **Consistency**: No orphaned records or incomplete audit trails
- **Isolation**: Concurrent access properly handled
- **Durability**: Changes committed together to database

## Audit Trail Integration

### Stock History Logging Pattern
Every mutation operation follows this pattern:
```java
// 1. Perform business operation
InventoryItem saved = repository.save(entity);

// 2. Log to audit trail
stockHistoryService.logStockChange(
    saved.getId(),        // What item
    quantityDelta,        // How much changed
    businessReason,       // Why it changed
    currentUsername(),    // Who changed it
    saved.getPrice()      // Price at time of change
);
```

**Audit Trail Characteristics**:
- **Complete Coverage**: Every stock movement logged
- **User Attribution**: Who made each change
- **Business Context**: Why the change was made
- **Price Snapshots**: Historical pricing for WAC calculations
- **Compliance Ready**: Regulatory audit trail requirements

### Audit Trail Scenarios
```java
// Creation: INITIAL_STOCK
logStockChange(id, initialQuantity, INITIAL_STOCK, user, price);

// Purchase: PURCHASE
logStockChange(id, +100, PURCHASE, user, price);

// Sale: SALE  
logStockChange(id, -10, SALE, user, price);

// Price change: PRICE_CHANGE (delta = 0)
logStockChange(id, 0, PRICE_CHANGE, user, newPrice);

// Deletion: Specific reason with full removal
logStockChange(id, -currentQuantity, DAMAGED, user, price);
```

## Error Handling & Validation

### Business Rule Validation
```java
// Price validation
public static void assertPriceValid(BigDecimal price) {
    if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
        throw new IllegalArgumentException("Price must be positive");
    }
}

// Quantity validation
public static void assertFinalQuantityNonNegative(int finalQuantity) {
    if (finalQuantity < 0) {
        throw new IllegalArgumentException("Final quantity cannot be negative");
    }
}
```

### Exception Handling Strategy
```java
// Not found scenarios
repository.findById(id)
    .orElseThrow(() -> new IllegalArgumentException("Item not found"));

// Business rule violations
if (!isValidBusinessRule(data)) {
    throw new IllegalArgumentException("Business rule violation: " + details);
}
```

**Error Response Patterns**:
- **IllegalArgumentException**: Business rule violations, not found errors
- **Specific Messages**: Clear indication of what went wrong
- **Early Validation**: Fail fast before any data changes
- **Consistent Handling**: Same error types for similar scenarios

## Performance Considerations

### Repository Optimization
```java
// Efficient queries with specific fields
@Query("SELECT i FROM InventoryItem i WHERE i.quantity <= i.minimumQuantity")
List<InventoryItem> findLowStockItems();

// Existence checks without full entity loading
@Query("SELECT COUNT(i) > 0 FROM InventoryItem i WHERE i.name = ?1 AND i.price = ?2")
boolean existsByNameAndPrice(String name, BigDecimal price);
```

### Pagination Support
```java
public Page<InventoryItemDTO> findByNameSortedByPrice(String name, Pageable pageable) {
    Page<InventoryItem> page = repository.findByNameSortedByPrice(name, pageable);
    return page.map(InventoryItemMapper::toDTO);
}
```

### Memory Management
- **DTO Conversion**: Convert to DTOs early to release entity references
- **Stream Processing**: Use streams for collection transformations
- **Pagination**: Large datasets returned with pagination
- **Lazy Loading**: Avoid unnecessary eager fetching

## Testing Strategy

### Unit Testing Approach
```java
@Test
public void testSaveItemWithAuditTrail() {
    // Given
    InventoryItemDTO dto = createValidDTO();
    when(repository.save(any())).thenReturn(savedEntity);
    
    // When
    InventoryItemDTO result = service.save(dto);
    
    // Then
    verify(stockHistoryService).logStockChange(
        eq(savedEntity.getId()),
        eq(dto.getQuantity()),
        eq(StockChangeReason.INITIAL_STOCK),
        anyString(),
        eq(dto.getPrice())
    );
    assertNotNull(result);
}
```

### Integration Testing
```java
@Test
@Transactional
public void testUpdateWithQuantityChangeCreatesAuditTrail() {
    // Given: Item in database
    InventoryItem existing = createAndSaveItem();
    InventoryItemDTO updateDto = createUpdateWithQuantityChange();
    
    // When: Update item
    service.update(existing.getId(), updateDto);
    
    // Then: Verify audit trail
    List<StockHistory> history = stockHistoryRepository.findByInventoryItemId(existing.getId());
    assertEquals(2, history.size()); // INITIAL_STOCK + MANUAL_UPDATE
}
```

## Integration Points

### Stock History Service
**Critical Dependency**: Every mutation operation requires stock history logging.
```java
// Service dependency
private final StockHistoryService stockHistoryService;

// Usage pattern
stockHistoryService.logStockChange(id, delta, reason, user, price);
```

### Validation Services
**Business Rule Enforcement**: Delegated validation for separation of concerns.
```java
// Static validation utilities
InventoryItemValidator.validateBase(dto);
InventoryItemValidator.validateExists(id, repository);
InventoryItemSecurityValidator.validateUpdatePermissions(existing, dto);
```

### Security Integration
**User Context**: Spring Security integration for audit trail.
```java
// Security context extraction
private String currentUsername() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    return auth != null ? auth.getName() : "system";
}
```

## Future Enhancements

### Service Decomposition
1. **Validation Coordinator**: Extract validation logic to reusable service
2. **Audit Trail Service**: Generalized audit logging for other entities
3. **Security Context Service**: Reusable user context extraction
4. **Business Rules Engine**: Configurable rule validation

### Performance Optimization
1. **Caching Layer**: Cache frequently accessed items
2. **Batch Operations**: Bulk create/update capabilities
3. **Async Audit Logging**: Background audit trail processing
4. **Database Optimization**: Advanced indexing and query optimization

### Advanced Features
1. **Soft Delete Option**: Configurable soft vs hard delete
2. **Approval Workflows**: Multi-step approval for sensitive operations
3. **Batch Import**: Excel/CSV import capabilities
4. **Version History**: Full item change history beyond stock movements

## Related Documentation

- [Service Layer Overview](../services/README.md)
- [Analytics Service](analytics-service.md)
- [Stock History Service](stock-history-service.md)
- [Validation Patterns](../patterns/validation-patterns.md)
- [Security Patterns](../patterns/security-patterns.md)
- [Audit Trail Patterns](../patterns/audit-trail.md)