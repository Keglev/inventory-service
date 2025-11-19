[⬅️ Back to Layers Overview](./index.md)

# Derived Query Methods

## Pattern Overview

Spring Data JPA generates queries automatically from method names. No manual SQL or JPQL needed for standard queries.

## Query Syntax

Spring Data interprets method names using keywords:

| Keyword | Meaning | Example |
|---------|---------|---------|
| `findBy` | SELECT WHERE | `findByName(String name)` |
| `Containing` | LIKE search | `findByNameContaining(String text)` |
| `IgnoreCase` | LOWER() | `findByNameIgnoreCase(String name)` |
| `OrderBy` | ORDER BY | `OrderByNameAsc()` |
| `Asc` | Ascending sort | `findByNameOrderByNameAsc()` |
| `Desc` | Descending sort | `findByCreatedAtDesc()` |
| `existsBy` | EXISTS check | `existsByNameIgnoreCase(String name)` |
| `And` | AND condition | `findByNameAndSupplier(String name, String supplier)` |

## Examples

### Simple Exact Match
```java
// SELECT * FROM SUPPLIER WHERE NAME = ?
Optional<Supplier> findByNameIgnoreCase(String name);

// SELECT * FROM APP_USER WHERE EMAIL = ?
Optional<AppUser> findByEmail(String email);
```

### Partial Text Match
```java
// SELECT * FROM SUPPLIER WHERE NAME LIKE ? (case-insensitive)
List<Supplier> findByNameContainingIgnoreCase(String name);

// SELECT * FROM INVENTORY_ITEM WHERE NAME LIKE ?
List<InventoryItem> findByNameContainingIgnoreCase(String name, Pageable pageable);
```

### Boolean Checks
```java
// SELECT COUNT(*) FROM SUPPLIER WHERE NAME = ?
boolean existsByNameIgnoreCase(String name);

// SELECT COUNT(*) FROM INVENTORY_ITEM WHERE NAME = ?
boolean existsByNameIgnoreCase(String name);
```

### Filtering with Sorting
```java
// SELECT * FROM INVENTORY_ITEM 
// WHERE SUPPLIER_ID = ? 
// ORDER BY NAME ASC
List<InventoryItem> findBySupplierIdOrderByNameAsc(String supplierId, Pageable pageable);

// SELECT * FROM STOCK_HISTORY 
// WHERE REASON = ? 
// ORDER BY CREATED_AT DESC
List<StockHistory> findByReasonOrderByCreatedAtDesc(StockChangeReason reason);
```

### Multiple Conditions
```java
// SELECT * FROM INVENTORY_ITEM 
// WHERE NAME LIKE ? AND SUPPLIER_ID = ?
List<InventoryItem> findByNameContainingIgnoreCaseAndSupplierId(
    String name, 
    String supplierId);

// SELECT * FROM INVENTORY_ITEM 
// WHERE SUPPLIER_ID = ? AND QUANTITY < ?
List<InventoryItem> findBySupplierIdAndQuantityLessThan(
    String supplierId, 
    int threshold);
```

## Complete Repository Example

```java
@Repository
public interface SupplierRepository extends JpaRepository<Supplier, String> {
    
    // Find one
    Optional<Supplier> findByNameIgnoreCase(String name);
    
    // Search multiple
    List<Supplier> findByNameContainingIgnoreCase(String name);
    
    // Check existence
    boolean existsByNameIgnoreCase(String name);
    
    // Count
    long countByCreatedBy(String createdBy);
    
    // With pagination
    Page<Supplier> findByNameContainingIgnoreCaseOrderByNameAsc(
        String name, 
        Pageable pageable);
}
```

## Advantages

✅ **Clear Intent** - Method name describes the query  
✅ **Type-Safe** - Compile-time checking  
✅ **No SQL** - Database-agnostic  
✅ **Automatic** - Spring generates implementation  
✅ **Refactoring Safe** - IDE can rename methods easily  

---

[⬅️ Back to Layers Overview](./index.md)
