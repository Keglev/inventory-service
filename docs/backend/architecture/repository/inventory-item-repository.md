[⬅️ Back to Repository Index](./index.html)

# InventoryItemRepository

## Definition

```java
public interface InventoryItemRepository extends JpaRepository<InventoryItem, String> {

    @Query("""
        select (count(i) > 0)
        from InventoryItem i
        left join i.supplier s
        where (s.id = :supplierId or i.supplierId = :supplierId)
            and i.quantity > :minQty
    """)
    boolean existsActiveStockForSupplier(@Param("supplierId") String supplierId,
                                         @Param("minQty") int minQty);

    List<InventoryItem> findByNameContainingIgnoreCase(String name);

    boolean existsBySupplier_Id(String supplierId);

    boolean existsByNameAndPrice(String name, BigDecimal price);

    @Query(value = """
        SELECT name, quantity, minimum_quantity
        FROM inventory_item
        WHERE quantity < minimum_quantity
          AND (:supplierId IS NULL OR supplier_id = :supplierId)
        ORDER BY quantity ASC
        """, nativeQuery = true)
    List<Object[]> findItemsBelowMinimumStockFiltered(@Param("supplierId") String supplierId);

    @Query(value = """
        SELECT COUNT(*)
        FROM inventory_item
        WHERE quantity < minimum_quantity
            AND (:supplierId IS NULL OR supplier_id = :supplierId)
        """, nativeQuery = true)
    long countItemsBelowMinimumStockFiltered(@Param("supplierId") String supplierId);

    @Query("""
        SELECT COUNT(i)
        FROM InventoryItem i
        WHERE COALESCE(i.quantity, 0) < :threshold
        """)
    long countWithQuantityBelow(@Param("threshold") int threshold);

    List<InventoryItem> findByNameIgnoreCase(String name);

    @Query("""
        SELECT i FROM InventoryItem i
        WHERE LOWER(i.name) LIKE LOWER(CONCAT('%', :name, '%'))
        ORDER BY i.price ASC
    """)
    Page<InventoryItem> findByNameSortedByPrice(@Param("name") String name, Pageable pageable);

    Page<InventoryItem> findByNameContainingIgnoreCase(String name, Pageable pageable);

    boolean existsByNameIgnoreCase(String name);

    boolean existsBySupplier_IdAndQuantityGreaterThan(String supplierId, int quantity);
}
```

## Purpose

Provides data access for **InventoryItem** entities with capabilities for:
- CRUD operations via JpaRepository
- Stock analysis and reorder queries
- Supplier-based filtering
- Duplicate detection
- Performance-optimized native SQL queries for analytics

---

## Custom Query Methods

### existsActiveStockForSupplier(supplierId, minQty)

**Purpose:** Check if supplier has items in stock before deletion

**Type:** Custom @Query (JPQL)

**Usage:**
```java
// Before deleting supplier, check if any items have stock
if (inventoryRepository.existsActiveStockForSupplier(
    supplierId, 
    0  // Check for any positive quantity
)) {
    throw new SupplierHasStockException(
        "Cannot delete supplier with active inventory"
    );
}
```

**Use Cases:**
- Supplier deletion validation
- Inventory safety checks
- Business rule enforcement

---

### findByNameContainingIgnoreCase(String name)

**Purpose:** Search items by name substring (case-insensitive)

**Type:** Method-derived JPQL

**Usage:**
```java
List<InventoryItem> results = inventoryRepository
    .findByNameContainingIgnoreCase("widget");

// Returns: "Widget A", "Widget B", "WideScreen Widget", etc.
```

**With Pagination:**
```java
Page<InventoryItem> results = inventoryRepository
    .findByNameContainingIgnoreCase("widget", PageRequest.of(0, 20));
```

---

### existsBySupplier_Id(supplierId)

**Purpose:** Check if supplier has any items

**Type:** Method-derived JPQL

**Usage:**
```java
if (inventoryRepository.existsBySupplier_Id(supplierId)) {
    System.out.println("Supplier has items in inventory");
} else {
    System.out.println("No items from this supplier");
}
```

---

### existsByNameAndPrice(name, price)

**Purpose:** Detect duplicate items (same name and price)

**Type:** Method-derived JPQL

**Usage:**
```java
if (inventoryRepository.existsByNameAndPrice("Widget A", new BigDecimal("49.99"))) {
    throw new DuplicateItemException("Item already exists with this price");
}
```

---

### findItemsBelowMinimumStockFiltered(supplierId)

**Purpose:** Get low-stock items with optional supplier filter

**Type:** Native SQL (performance optimized)

**Returns:** Object[] with [name, quantity, minimum_quantity]

**Usage:**
```java
// All low-stock items
List<Object[]> allLowStock = inventoryRepository
    .findItemsBelowMinimumStockFiltered(null);

// Low-stock items from specific supplier
List<Object[]> supplierLowStock = inventoryRepository
    .findItemsBelowMinimumStockFiltered(supplierId);

// Process results
for (Object[] row : supplierLowStock) {
    String name = (String) row[0];
    int quantity = (int) row[1];
    int minimum = (int) row[2];
    
    System.out.printf("%s: %d/%d units%n", name, quantity, minimum);
}
```

**Use Cases:**
- Low-stock alerts
- Reorder point dashboards
- Inventory management reports

---

### countItemsBelowMinimumStockFiltered(supplierId)

**Purpose:** Count items below minimum threshold

**Type:** Native SQL

**Usage:**
```java
// Count all low-stock items
long totalLowStock = inventoryRepository
    .countItemsBelowMinimumStockFiltered(null);

System.out.println("Items needing reorder: " + totalLowStock);

// Count for specific supplier
long supplierLowStock = inventoryRepository
    .countItemsBelowMinimumStockFiltered(supplierId);
```

---

### countWithQuantityBelow(threshold)

**Purpose:** Count items with quantity below fixed threshold

**Type:** Custom @Query (JPQL)

**Usage:**
```java
// KPI: items with less than 10 units
long critical = inventoryRepository.countWithQuantityBelow(10);

System.out.println("Critical stock items: " + critical);
```

---

### findByNameIgnoreCase(String name)

**Purpose:** Find items by exact name (case-insensitive)

**Type:** Method-derived JPQL

**Usage:**
```java
List<InventoryItem> items = inventoryRepository
    .findByNameIgnoreCase("Widget A");

// Returns: Items with exact name "Widget A" (any casing)
```

---

### findByNameSortedByPrice(name, pageable)

**Purpose:** Search items by name, deterministically sorted by price

**Type:** Custom @Query (JPQL)

**Usage:**
```java
// Search and sort by price ascending
Page<InventoryItem> results = inventoryRepository.findByNameSortedByPrice(
    "widget",
    PageRequest.of(0, 20)
);

// Guaranteed consistent ordering
for (InventoryItem item : results.getContent()) {
    System.out.printf("%s: $%.2f%n", 
        item.getName(), 
        item.getPrice()
    );
}
```

**Why custom sort?**
- Deterministic pagination (price is secondary sort key)
- Prevents inconsistent ordering between pages
- Improves UX for sorted lists

---

### countByNameContainingIgnoreCase(String name, Pageable pageable)

**Purpose:** Paginated search with consistent ordering

**Type:** Method-derived JPQL

**Usage:**
```java
Page<InventoryItem> page1 = inventoryRepository
    .findByNameContainingIgnoreCase("widget", PageRequest.of(0, 20));

Page<InventoryItem> page2 = inventoryRepository
    .findByNameContainingIgnoreCase("widget", PageRequest.of(1, 20));

// Consistent results across pages
long totalResults = page1.getTotalElements();
System.out.println("Total items: " + totalResults);
```

---

### existsByNameIgnoreCase(String name)

**Purpose:** Check if item exists by name (validate uniqueness)

**Type:** Method-derived JPQL

**Usage:**
```java
if (inventoryRepository.existsByNameIgnoreCase("Widget A")) {
    throw new DuplicateItemException("Item name already exists");
}
```

---

### existsBySupplier_IdAndQuantityGreaterThan(supplierId, quantity)

**Purpose:** Check if supplier has items above quantity threshold

**Type:** Method-derived JPQL

**Usage:**
```java
// Check if supplier has items in stock
if (inventoryRepository.existsBySupplier_IdAndQuantityGreaterThan(
    supplierId, 
    0
)) {
    System.out.println("Supplier has stock");
}

// Check if supplier has items above minimum threshold
if (inventoryRepository.existsBySupplier_IdAndQuantityGreaterThan(
    supplierId, 
    minimumQuantity
)) {
    System.out.println("Supplier has items above minimum");
}
```

---

## Service Integration Pattern

```java
@Service
public class InventoryItemService {
    
    @Autowired
    private InventoryItemRepository repository;
    
    @Transactional
    public InventoryItemDTO createItem(CreateItemRequest request, String userId) {
        // Validate name uniqueness
        if (repository.existsByNameIgnoreCase(request.getName())) {
            throw new DuplicateItemException(
                "Item name already exists: " + request.getName()
            );
        }
        
        // Create and save
        InventoryItem item = InventoryItem.builder()
            .id(UUID.randomUUID().toString())
            .name(request.getName())
            .quantity(request.getQuantity())
            .price(request.getPrice())
            .supplierId(request.getSupplierId())
            .minimumQuantity(request.getMinimumQuantity())
            .createdBy(userId)
            .createdAt(LocalDateTime.now())
            .build();
        
        item = repository.save(item);
        return mapToDTO(item);
    }
    
    @Transactional(readOnly = true)
    public List<Object[]> getLowStockItems(String supplierId) {
        return repository.findItemsBelowMinimumStockFiltered(supplierId);
    }
    
    @Transactional(readOnly = true)
    public Page<InventoryItemDTO> searchItems(String query, int page) {
        Page<InventoryItem> results = repository
            .findByNameSortedByPrice(query, PageRequest.of(page, 20));
        
        return results.map(this::mapToDTO);
    }
}
```

---

## Testing

```java
@DataJpaTest
class InventoryItemRepositoryTest {
    
    @Autowired
    private InventoryItemRepository repository;
    
    @Test
    void testFindBelowMinimumStock() {
        // Setup
        repository.save(createItem("Widget A", 5, 10));  // Below minimum
        repository.save(createItem("Widget B", 20, 10)); // Above minimum
        
        // Test
        List<Object[]> results = repository
            .findItemsBelowMinimumStockFiltered(null);
        
        assertEquals(1, results.size());
        assertEquals("Widget A", results.get(0)[0]);
    }
    
    @Test
    void testCountBelowMinimum() {
        repository.save(createItem("Widget A", 5, 10));
        repository.save(createItem("Widget B", 15, 10));
        repository.save(createItem("Widget C", 8, 10));
        
        long count = repository.countItemsBelowMinimumStockFiltered(null);
        
        assertEquals(2, count);
    }
    
    @Test
    void testDuplicateDetection() {
        repository.save(createItem("Widget", 10, 100));
        
        boolean exists = repository.existsByNameAndPrice(
            "Widget",
            new BigDecimal("100")
        );
        
        assertTrue(exists);
    }
    
    private InventoryItem createItem(String name, int qty, BigDecimal price) {
        return InventoryItem.builder()
            .name(name)
            .quantity(qty)
            .price(price)
            .supplierId("SUP-001")
            .minimumQuantity(10)
            .createdBy("test")
            .createdAt(LocalDateTime.now())
            .build();
    }
}
```

---

## Performance Notes

- **findByNameSortedByPrice:** Uses custom JPQL for deterministic ordering
- **findItemsBelowMinimumStockFiltered:** Native SQL for analytics performance
- **countWithQuantityBelow:** Handles NULL quantities with COALESCE
- All search methods support pagination to prevent memory overload

---

## Related Documentation

- [Data Models - InventoryItem Entity](../model/inventory-item.html)
- [Repository Layer Index](./index.html)
- [Service Layer](../layers/service-layer.html)

---

[⬅️ Back to Repository Index](./index.html)
