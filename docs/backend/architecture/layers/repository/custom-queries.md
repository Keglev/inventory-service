[⬅️ Back to Layers Overview](./index.md)

# Custom Queries with @Query

## Pattern Overview

For complex queries beyond derived query capabilities, use `@Query` annotation with JPQL or native SQL.

## JPQL Queries

JPQL (Java Persistence Query Language) is database-agnostic and works with object models:

```java
@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, String> {
    
    // Find items below stock threshold
    @Query("SELECT i FROM InventoryItem i WHERE i.quantity < :threshold")
    List<InventoryItem> findLowStockItems(@Param("threshold") int threshold);
    
    // Find items with specific reason in history
    @Query("SELECT i FROM InventoryItem i " +
           "WHERE EXISTS (SELECT 1 FROM StockHistory sh " +
           "WHERE sh.itemId = i.id AND sh.reason = :reason)")
    List<InventoryItem> findItemsWithReason(@Param("reason") StockChangeReason reason);
    
    // Join with supplier
    @Query("SELECT i FROM InventoryItem i " +
           "WHERE i.supplier.name = :supplierName " +
           "ORDER BY i.name ASC")
    List<InventoryItem> findBySupplierName(@Param("supplierName") String supplierName);
}
```

## Native SQL Queries

For database-specific optimizations, use native SQL with `nativeQuery = true`:

```java
@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, String> {
    
    // Find high-value items
    @Query(value = "SELECT i.* FROM INVENTORY_ITEM i " +
           "WHERE i.UNIT_PRICE * i.QUANTITY > :minValue " +
           "ORDER BY i.UNIT_PRICE * i.QUANTITY DESC", 
           nativeQuery = true)
    List<InventoryItem> findHighValueItems(@Param("minValue") BigDecimal minValue);
    
    // Complex analytics query
    @Query(value = "SELECT i.ID, i.NAME, SUM(sh.NEW_QUANTITY - sh.OLD_QUANTITY) as TOTAL_CHANGE " +
           "FROM INVENTORY_ITEM i " +
           "LEFT JOIN STOCK_HISTORY sh ON i.ID = sh.ITEM_ID " +
           "WHERE sh.CREATED_AT >= :startDate " +
           "GROUP BY i.ID, i.NAME " +
           "HAVING SUM(sh.NEW_QUANTITY - sh.OLD_QUANTITY) > 0 " +
           "ORDER BY TOTAL_CHANGE DESC",
           nativeQuery = true)
    List<Object[]> findTopMovingItems(
        @Param("startDate") LocalDateTime startDate);
}
```

## Queries with Pagination

Custom queries work with Spring's `Pageable` interface:

```java
@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, String> {
    
    // JPQL with pagination
    @Query("SELECT i FROM InventoryItem i WHERE i.supplierId = :supplierId")
    Page<InventoryItem> findBySupplier(
        @Param("supplierId") String supplierId, 
        Pageable pageable);
    
    // Native SQL with pagination
    @Query(value = "SELECT i.* FROM INVENTORY_ITEM i WHERE i.SUPPLIER_ID = :supplierId",
           countQuery = "SELECT COUNT(*) FROM INVENTORY_ITEM i WHERE i.SUPPLIER_ID = :supplierId",
           nativeQuery = true)
    Page<InventoryItem> findBySupplierNative(
        @Param("supplierId") String supplierId, 
        Pageable pageable);
}
```

**Note:** For native queries with pagination, provide `countQuery` for accurate total count.

## Query with Named Parameters

Always use named parameters for readability and safety:

```java
// ✅ Good - Named parameters
@Query("SELECT i FROM InventoryItem i WHERE i.quantity < :threshold AND i.supplierId = :supplier")
List<InventoryItem> findLowStockBySupplier(
    @Param("threshold") int threshold,
    @Param("supplier") String supplierId);

// ❌ Bad - Positional parameters
@Query("SELECT i FROM InventoryItem i WHERE i.quantity < ?1 AND i.supplierId = ?2")
List<InventoryItem> findLowStockBySupplier(int threshold, String supplierId);
```

## When to Use @Query

✅ **Use @Query when:**
- Derived query name becomes too complex
- Complex multi-table joins needed
- Aggregations (SUM, COUNT, GROUP BY)
- Window functions required
- Database-specific optimizations needed

❌ **Don't use @Query when:**
- Simple filtering works (use derived query)
- Just filtering and sorting (use derived query)
- Only minor complexity added

## Common @Query Patterns

### Counting with Condition
```java
@Query("SELECT COUNT(i) FROM InventoryItem i WHERE i.supplierId = :supplierId")
long countBySupplier(@Param("supplierId") String supplierId);
```

### Checking Existence
```java
@Query("SELECT CASE WHEN COUNT(i) > 0 THEN true ELSE false END " +
       "FROM InventoryItem i WHERE i.supplierId = :supplierId")
boolean supplierHasItems(@Param("supplierId") String supplierId);
```

### Aggregation
```java
@Query("SELECT SUM(i.quantity * i.unitPrice) FROM InventoryItem i WHERE i.supplierId = :supplierId")
BigDecimal getTotalValueBySupplier(@Param("supplierId") String supplierId);
```

### JOIN FETCH (Fix N+1)
```java
@Query("SELECT DISTINCT i FROM InventoryItem i " +
       "JOIN FETCH i.supplier WHERE i.supplierId = :supplierId")
List<InventoryItem> findBySupplierWithEagerFetch(@Param("supplierId") String supplierId);
```

---

[⬅️ Back to Layers Overview](./index.md)
