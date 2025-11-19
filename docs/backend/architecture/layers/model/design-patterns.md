[⬅️ Back to Model Index](./index.md)

# Design Patterns

Design patterns in the domain model layer provide solutions to common persistence challenges.

## Audit Fields Pattern

**Problem:** Need to track who created/modified records and when for compliance.

**Solution:** Add immutable creation fields and updateable timestamp fields.

```java
@Column(name = "CREATED_BY", nullable = false, updatable = false)
private String createdBy;  // Set from SecurityContext, never changes

@CreationTimestamp
@Column(name = "CREATED_AT", updatable = false)
private LocalDateTime createdAt;  // Auto-set on INSERT, immutable

@UpdateTimestamp
@Column(name = "UPDATED_AT")
private LocalDateTime updatedAt;  // Auto-set on INSERT and UPDATE
```

**Benefits:**
- Complete audit trail of who did what and when
- Immutability prevents accidental or malicious changes
- Automatic timestamp management (no manual code)
- Compliance with data protection regulations

## Optimistic Locking Pattern

**Problem:** Multiple users editing the same record simultaneously can cause conflicts.

**Solution:** Use version field to detect concurrent modifications.

```java
@Version
@Column(name = "VERSION")
private Long version;  // Incremented on each update
```

**How It Works:**
```
User A reads Supplier (version = 3)
User B reads Supplier (version = 3)
User B updates Supplier → version = 4
User A tries to update → FAILS (version mismatch)
User A must refresh and retry
```

**Benefits:**
- No database locks needed (read/write efficiency)
- Detects concurrent modifications automatically
- Forces retry logic on conflicts
- Better performance than pessimistic locking

**Usage:**
```java
// Repository handles OptimisticLockException
try {
    supplierService.update(id, dto);
} catch (OptimisticLockException e) {
    // Retry or notify user to refresh and try again
}
```

## Soft Deletes Pattern

**Problem:** Need to delete records but maintain referential integrity and audit trails.

**Solution:** Mark records as deleted instead of removing them.

```java
@Column(name = "DELETED_AT")
private LocalDateTime deletedAt;  // NULL = active, not NULL = deleted

// Query for active records only
@Query("SELECT s FROM Supplier s WHERE s.deletedAt IS NULL")
List<Supplier> findActive();

// Include in where clauses
@Query("SELECT s FROM Supplier s WHERE s.deletedAt IS NULL AND s.name = :name")
Optional<Supplier> findActiveByName(@Param("name") String name);
```

**Benefits:**
- Preserves historical data and audit trails
- Prevents cascading constraint violations
- Can restore deleted records if needed
- Maintains referential integrity

**Trade-offs:**
- Every query must filter `deletedAt IS NULL`
- Database size grows larger
- Requires discipline in query writing

## Denormalization for Analytics Pattern

**Problem:** Analytics queries require expensive JOINs across multiple tables.

**Solution:** Duplicate frequently-needed fields in audit/history tables.

```java
// Instead of:
// SELECT sh.*, ii.name, s.name FROM stock_history sh
// JOIN inventory_item ii ON sh.item_id = ii.id
// JOIN supplier s ON ii.supplier_id = s.id

// Denormalize supplier into stock_history:
@Column(name = "SUPPLIER_ID")
private String supplierId;  // Redundant but avoids joins

// Now queries are simpler and faster:
// SELECT * FROM stock_history WHERE supplier_id = 'abc123'
```

**Benefits:**
- Significantly faster analytics queries
- Reduced database CPU usage
- Simpler query logic
- Better scalability for reporting

**Trade-offs:**
- Data redundancy (storage cost)
- Must keep denormalized fields in sync
- Adds complexity to write operations

**Synchronization Example:**
```java
// When creating stock history, also store supplier ID
StockHistory history = StockHistory.builder()
    .itemId(item.getId())
    .supplierId(item.getSupplierId())  // Denormalized
    .reason(StockChangeReason.SALE)
    .oldQuantity(previous)
    .newQuantity(current)
    .build();
```

---

[⬅️ Back to Model Index](./index.md)
