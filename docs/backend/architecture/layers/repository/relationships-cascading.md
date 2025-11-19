[⬅️ Back to Layers Overview](./index.md)

# Relationships and Cascading

## Pattern Overview

Repositories manage entity relationships through foreign keys and JPA annotations. Cascading controls how operations propagate to related entities.

## Many-to-One Relationships

InventoryItem references Supplier via foreign key:

```java
@Entity
@Table(name = "INVENTORY_ITEM")
public class InventoryItem {
    
    @Id
    private String id;
    
    private String name;
    
    // Many items reference one supplier
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "SUPPLIER_ID", nullable = false)
    private Supplier supplier;
}
```

**Repository Methods:**
```java
// Find items from specific supplier
List<InventoryItem> findBySupplierId(String supplierId);

// Find with supplier joined (avoid N+1)
@Query("SELECT i FROM InventoryItem i JOIN FETCH i.supplier WHERE i.id = :id")
Optional<InventoryItem> findByIdWithSupplier(@Param("id") String id);
```

## One-to-Many Relationships

Supplier has many InventoryItems:

```java
@Entity
@Table(name = "SUPPLIER")
public class Supplier {
    
    @Id
    private String id;
    
    private String name;
    
    // One supplier has many items
    @OneToMany(mappedBy = "supplier", cascade = CascadeType.ALL)
    private List<InventoryItem> items = new ArrayList<>();
}
```

## Fetch Strategies

Control when related entities are loaded:

### Eager Fetch (FetchType.EAGER)
```java
@ManyToOne(fetch = FetchType.EAGER)
@JoinColumn(name = "SUPPLIER_ID")
private Supplier supplier;

// Loading item automatically loads supplier
InventoryItem item = repository.findById(id).get();
System.out.println(item.getSupplier().getName());  // Loaded
```

**Use When:** Supplier needed in every operation

### Lazy Fetch (FetchType.LAZY)
```java
@OneToMany(mappedBy = "supplier", fetch = FetchType.LAZY)
private List<InventoryItem> items;

// Loading supplier doesn't load items
Supplier supplier = repository.findById(id).get();
supplier.getItems().size();  // ERROR: Collection not loaded
```

**Use When:** Items rarely needed, saves load time

## Avoiding N+1 Query Problem

**Problem:** Loading 100 items individually loads 1 main query + 100 supplier queries = 101 total queries

```java
// ❌ Bad - Results in N+1 queries
List<InventoryItem> items = repository.findAll();
for (InventoryItem item : items) {
    System.out.println(item.getSupplier().getName());  // N additional queries!
}
```

**Solution 1: Eager Fetch in Entity**
```java
@ManyToOne(fetch = FetchType.EAGER)  // Always load supplier
@JoinColumn(name = "SUPPLIER_ID")
private Supplier supplier;

// Now single query loads all items with suppliers
List<InventoryItem> items = repository.findAll();
```

**Solution 2: JOIN FETCH in Query**
```java
@Query("SELECT DISTINCT i FROM InventoryItem i JOIN FETCH i.supplier")
List<InventoryItem> findAllWithSupplier();

// Now single query loads all items with suppliers
List<InventoryItem> items = repository.findAllWithSupplier();
```

**Solution 3: Explicit Fetch in Service**
```java
@Transactional(readOnly = true)
public List<InventoryItemDTO> getAllWithSuppliers() {
    // Loads items and triggers lazy supplier loading within transaction
    return repository.findAll()
        .stream()
        .peek(item -> item.getSupplier().getId())  // Trigger load
        .map(mapper::toDTO)
        .collect(toList());
}
```

## Cascade Operations

Control whether operations on parent cascade to children:

```java
@Entity
public class Supplier {
    
    @OneToMany(mappedBy = "supplier", cascade = CascadeType.ALL)
    private List<InventoryItem> items;
}
```

**Cascade Types:**

| Type | Behavior |
|------|----------|
| `PERSIST` | Save parent → saves children |
| `REMOVE` | Delete parent → deletes children |
| `REFRESH` | Refresh parent → refreshes children |
| `MERGE` | Merge parent → merges children |
| `ALL` | All of the above |

## Example: Filtering by Relationship

```java
@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, String> {
    
    // Find items from specific supplier
    List<InventoryItem> findBySupplierId(String supplierId);
    
    // Find items from suppliers in specific region
    @Query("SELECT i FROM InventoryItem i " +
           "WHERE i.supplier.region = :region")
    List<InventoryItem> findBySupplierRegion(@Param("region") String region);
    
    // Find high-value items with eager supplier loading
    @Query("SELECT DISTINCT i FROM InventoryItem i " +
           "JOIN FETCH i.supplier " +
           "WHERE i.quantity * i.unitPrice > :value")
    List<InventoryItem> findHighValueItemsWithSupplier(
        @Param("value") BigDecimal value);
}
```

---

[⬅️ Back to Layers Overview](./index.md)
