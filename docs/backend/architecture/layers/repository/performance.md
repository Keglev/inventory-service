[⬅️ Back to Layers Overview](./index.md)

# Performance Considerations

## N+1 Query Problem

### The Problem

Loading 100 items individually results in 101 total queries (1 main + 100 for relationships):

```java
// ❌ Bad - Results in N+1 queries
List<InventoryItem> items = repository.findAll();

for (InventoryItem item : items) {
    // Each access to supplier triggers new query!
    System.out.println(item.getSupplier().getName());
}

// Execution:
// Query 1: SELECT * FROM INVENTORY_ITEM (100 items)
// Query 2-101: SELECT * FROM SUPPLIER WHERE ID = ? (for each item)
// Total: 101 queries!
```

### Solution 1: Eager Fetch in Entity

```java
@Entity
public class InventoryItem {
    
    @ManyToOne(fetch = FetchType.EAGER)  // Always load supplier
    @JoinColumn(name = "SUPPLIER_ID")
    private Supplier supplier;
}

// Usage - Single query with join
List<InventoryItem> items = repository.findAll();
for (InventoryItem item : items) {
    System.out.println(item.getSupplier().getName());  // No additional queries
}
```

### Solution 2: JOIN FETCH Query

```java
@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, String> {
    
    @Query("SELECT DISTINCT i FROM InventoryItem i JOIN FETCH i.supplier")
    List<InventoryItem> findAllWithSupplier();
}

// Usage
List<InventoryItem> items = repository.findAllWithSupplier();
for (InventoryItem item : items) {
    System.out.println(item.getSupplier().getName());  // Loaded
}
```

### Solution 3: Batch Fetching

```java
@Entity
@BatchSize(size = 10)  // Load 10 related entities at once
public class InventoryItem {
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SUPPLIER_ID")
    private Supplier supplier;
}

// Usage - Reduces N+1 to N/batch_size + 1 queries
List<InventoryItem> items = repository.findAll();
for (InventoryItem item : items) {
    System.out.println(item.getSupplier().getName());
    // With batch size 10: 1 main + 10 batch queries (not 101)
}
```

## Pagination

### Problem: Loading All Records

```java
// ❌ Bad - Loads ALL records into memory
List<InventoryItem> items = repository.findAll();
// With 1 million items, memory exhaustion likely
```

### Solution: Use Pageable

```java
// ✅ Good - Only loads one page
Pageable pageable = PageRequest.of(0, 20);
Page<InventoryItem> page = repository.findAll(pageable);

// Only 20 records loaded, database handles LIMIT/OFFSET
List<InventoryItem> items = page.getContent();
```

### Benefits of Pagination

| Aspect | Without Pagination | With Pagination |
|--------|-------------------|-----------------|
| Memory | Loads all records | Loads one page |
| Response Time | Slow (process millions) | Fast (20-50 records) |
| Network | Large payload | Small payload |
| Database | Full table scan | LIMIT/OFFSET efficient |
| Scalability | Fails at scale | Scales to any size |

## Index Strategy

### Indexes on Frequently Queried Columns

```java
@Entity
@Table(name = "SUPPLIER",
    indexes = {
        @Index(name = "idx_supplier_name", columnList = "NAME"),
        @Index(name = "idx_supplier_created", columnList = "CREATED_BY")
    })
public class Supplier {
    private String id;
    private String name;
    private String createdBy;
}
```

**Impact:**
```
Query: SELECT * FROM SUPPLIER WHERE NAME = 'ACME'
Without index: Full table scan (slow for large tables)
With index: Index lookup (milliseconds)
```

### Indexes on Foreign Keys

```java
@Entity
@Table(name = "INVENTORY_ITEM",
    indexes = {
        @Index(name = "idx_item_supplier", columnList = "SUPPLIER_ID"),
        @Index(name = "idx_item_name", columnList = "NAME")
    })
public class InventoryItem {
    
    @ManyToOne
    @JoinColumn(name = "SUPPLIER_ID")
    private Supplier supplier;
    
    private String name;
}
```

**Impact:**
```
Query: SELECT * FROM INVENTORY_ITEM WHERE SUPPLIER_ID = ?
Without index: Full table scan
With index: Efficient lookup + JOIN
```

### Composite Indexes

For queries filtering on multiple columns:

```sql
-- Single query filters on supplier AND quantity
SELECT * FROM INVENTORY_ITEM 
WHERE SUPPLIER_ID = 'supplier-1' AND QUANTITY < 10

-- Create composite index
CREATE INDEX idx_item_supplier_quantity ON INVENTORY_ITEM(SUPPLIER_ID, QUANTITY)
```

### Index Cardinality

Choose columns with high cardinality (many unique values):

```
Good index candidates:
- NAME (high cardinality)
- EMAIL (high cardinality)
- SUPPLIER_ID (medium cardinality)

Poor index candidates:
- ROLE (low cardinality - only ADMIN, USER)
- STATUS (low cardinality - only active/inactive)
```

## Query Optimization Checklist

| Optimization | Impact | Effort |
|---|---|---|
| Add indexes on WHERE columns | High | Low |
| Use pagination | High | Low |
| Use JOIN FETCH instead of lazy | High | Medium |
| Add composite indexes | Medium | Medium |
| Use database-specific features | Medium | High |
| Denormalize frequently aggregated columns | Medium | High |

---

[⬅️ Back to Layers Overview](./index.md)
