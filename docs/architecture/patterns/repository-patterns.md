# Repository Patterns

Placeholder for repository/data-access patterns: custom JPA implementations, query optimization, projection DTOs, and transaction boundaries.
# Repository Patterns

## Overview

This document describes custom repository patterns used in the Smart Supply Pro inventory service, focusing on **custom query methods**, **performance optimization**, and **Spring Data JPA best practices**.

---

## Pattern: Spring Data JPA Query Methods

### Method Name Conventions

**Spring Data automatically implements queries from method names:**
```java
public interface InventoryItemRepository extends JpaRepository<InventoryItem, String> {
    
    // Find by single field
    Optional<InventoryItem> findByName(String name);
    
    // Find by multiple fields (AND)
    List<InventoryItem> findByNameAndQuantityGreaterThan(String name, Integer quantity);
    
    // Find with ordering
    List<InventoryItem> findBySupplierIdOrderByCreatedAtDesc(String supplierId);
    
    // Count queries
    long countByQuantityLessThan(Integer threshold);
    
    // Exists queries
    boolean existsByName(String name);
    
    // Delete queries
    void deleteBySupplierIdAndQuantity(String supplierId, Integer quantity);
}
```

**Benefits:**
- ✅ **No implementation needed**: Spring generates query at runtime
- ✅ **Type-safe**: Compile-time checking of field names
- ✅ **Readable**: Method names clearly express intent
- ✅ **Maintainable**: Refactoring updates method signatures automatically

---

## Pattern: @Query with JPQL

### Named Parameters

**Explicit JPQL queries for complex logic:**
```java
public interface StockHistoryRepository extends JpaRepository<StockHistory, String> {
    
    /**
     * Finds stock changes by item and reason categories.
     * @param itemId inventory item ID
     * @param reasons list of change reasons
     * @return matching stock history records
     */
    @Query("""
        SELECT sh FROM StockHistory sh
        WHERE sh.itemId = :itemId
        AND sh.reason IN :reasons
        ORDER BY sh.createdAt DESC
        """)
    List<StockHistory> findByItemIdAndReasonIn(
        @Param("itemId") String itemId,
        @Param("reasons") List<StockChangeReason> reasons
    );
    
    /**
     * Calculates total quantity change for item within date range.
     * @param itemId inventory item ID
     * @param startDate range start (inclusive)
     * @param endDate range end (exclusive)
     * @return sum of quantity changes or null if no records
     */
    @Query("""
        SELECT SUM(sh.quantityChange)
        FROM StockHistory sh
        WHERE sh.itemId = :itemId
        AND sh.createdAt >= :startDate
        AND sh.createdAt < :endDate
        """)
    Integer sumQuantityChangesByDateRange(
        @Param("itemId") String itemId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
}
```

**Benefits:**
- ✅ **Flexibility**: Complex queries beyond method name limitations
- ✅ **Aggregations**: SUM, COUNT, AVG, MIN, MAX support
- ✅ **Readability**: Multi-line text blocks with proper formatting
- ✅ **Validation**: JPQL validated at startup (fail-fast)

### Positional Parameters (Alternative)

**Using ?1, ?2 instead of named parameters:**
```java
@Query("""
    SELECT sh FROM StockHistory sh
    WHERE sh.itemId = ?1
    AND sh.reason IN ?2
    """)
List<StockHistory> findByItemAndReasons(String itemId, List<StockChangeReason> reasons);
```

**Recommendation:** Use named parameters for better readability.

---

## Pattern: Native SQL Queries

### Database-Specific Optimizations

**When JPQL is insufficient:**
```java
public interface InventoryItemRepository extends JpaRepository<InventoryItem, String> {
    
    /**
     * Finds low-stock items using database-specific features.
     * Enterprise Comment: Performance Optimization
     * Uses native SQL for complex calculations or DB-specific functions
     * 
     * @param threshold minimum quantity threshold
     * @return low-stock items with calculated metrics
     */
    @Query(value = """
        SELECT 
            i.id,
            i.name,
            i.quantity,
            i.price,
            (SELECT COUNT(*) FROM stock_history sh 
             WHERE sh.item_id = i.id AND sh.reason = 'SALE') as total_sales,
            (SELECT AVG(sh.quantity_change) FROM stock_history sh
             WHERE sh.item_id = i.id AND sh.reason = 'SALE') as avg_sale_qty
        FROM inventory_items i
        WHERE i.quantity < :threshold
        ORDER BY i.quantity ASC, total_sales DESC
        """, nativeQuery = true)
    List<Object[]> findLowStockItemsWithMetrics(@Param("threshold") Integer threshold);
    
    /**
     * Bulk update with optimized SQL.
     * @param supplierId supplier ID
     * @param priceAdjustment percentage adjustment (e.g., 1.10 for 10% increase)
     * @return number of updated items
     */
    @Modifying
    @Query(value = """
        UPDATE inventory_items
        SET price = price * :adjustment,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = :username
        WHERE supplier_id = :supplierId
        """, nativeQuery = true)
    int bulkUpdatePricesBySupplier(
        @Param("supplierId") String supplierId,
        @Param("adjustment") BigDecimal adjustment,
        @Param("username") String username
    );
}
```

**Tradeoffs:**
- ✅ **Performance**: Direct SQL execution, optimal for bulk operations
- ✅ **Features**: Access to database-specific functions (PostgreSQL, MySQL, etc.)
- ❌ **Portability**: Tied to specific database dialect
- ❌ **Type Safety**: Returns Object[] requiring manual mapping
- ❌ **Maintenance**: Column names as strings (not refactor-safe)

### Mapping Native Query Results

**Using DTOs with @SqlResultSetMapping:**
```java
@SqlResultSetMapping(
    name = "LowStockItemMetricsMapping",
    classes = @ConstructorResult(
        targetClass = LowStockItemMetrics.class,
        columns = {
            @ColumnResult(name = "id", type = String.class),
            @ColumnResult(name = "name", type = String.class),
            @ColumnResult(name = "quantity", type = Integer.class),
            @ColumnResult(name = "price", type = BigDecimal.class),
            @ColumnResult(name = "total_sales", type = Long.class),
            @ColumnResult(name = "avg_sale_qty", type = Double.class)
        }
    )
)
@Query(value = "...", nativeQuery = true, resultSetMapping = "LowStockItemMetricsMapping")
List<LowStockItemMetrics> findLowStockItemsWithMetrics(@Param("threshold") Integer threshold);
```

---

## Pattern: Custom Repository Implementation

### Extending Repository Interface

**For complex logic not expressible in queries:**
```java
// 1. Define custom interface
public interface InventoryItemRepositoryCustom {
    List<InventoryItem> findWithComplexCriteria(InventorySearchCriteria criteria);
}

// 2. Implement custom interface
@Component
public class InventoryItemRepositoryCustomImpl implements InventoryItemRepositoryCustom {
    
    @PersistenceContext
    private EntityManager entityManager;
    
    @Override
    public List<InventoryItem> findWithComplexCriteria(InventorySearchCriteria criteria) {
        // Enterprise Comment: Dynamic Query Building
        // Criteria API allows programmatic query construction
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<InventoryItem> query = cb.createQuery(InventoryItem.class);
        Root<InventoryItem> root = query.from(InventoryItem.class);
        
        List<Predicate> predicates = new ArrayList<>();
        
        if (criteria.getName() != null) {
            predicates.add(cb.like(root.get("name"), "%" + criteria.getName() + "%"));
        }
        
        if (criteria.getMinQuantity() != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("quantity"), criteria.getMinQuantity()));
        }
        
        if (criteria.getSupplierIds() != null && !criteria.getSupplierIds().isEmpty()) {
            predicates.add(root.get("supplierId").in(criteria.getSupplierIds()));
        }
        
        query.where(predicates.toArray(new Predicate[0]));
        query.orderBy(cb.desc(root.get("createdAt")));
        
        return entityManager.createQuery(query).getResultList();
    }
}

// 3. Extend in main repository
public interface InventoryItemRepository extends 
        JpaRepository<InventoryItem, String>, 
        InventoryItemRepositoryCustom {
    // Standard Spring Data methods + custom methods available
}
```

**Benefits:**
- ✅ **Dynamic queries**: Build queries programmatically based on criteria
- ✅ **Type safety**: Criteria API uses entity metamodel
- ✅ **Reusability**: Custom methods available through main repository
- ✅ **Testability**: Can inject and test custom implementations

---

## Performance Optimization Patterns

### Pattern: Pagination & Sorting

**Avoid loading large result sets:**
```java
public interface InventoryItemRepository extends JpaRepository<InventoryItem, String> {
    
    /**
     * Finds all items with pagination and sorting.
     * @param pageable pagination parameters
     * @return page of inventory items
     */
    Page<InventoryItem> findAll(Pageable pageable);
    
    /**
     * Finds items by supplier with pagination.
     * @param supplierId supplier ID
     * @param pageable pagination parameters
     * @return page of items
     */
    Page<InventoryItem> findBySupplierId(String supplierId, Pageable pageable);
}

// Usage in service
public Page<InventoryItemDTO> getAll(int page, int size, String sortBy) {
    // Enterprise Comment: Pagination Pattern
    // Loads only requested page, not entire result set
    PageRequest pageRequest = PageRequest.of(page, size, Sort.by(sortBy).descending());
    
    return inventoryItemRepository.findAll(pageRequest)
        .map(InventoryItemMapper::toDTO);
}
```

**Benefits:**
- ✅ **Memory efficiency**: Load only needed records
- ✅ **Performance**: Reduces database query time
- ✅ **User experience**: Faster response times
- ✅ **Scalability**: Handles large datasets gracefully

### Pattern: Projection Interfaces

**Load only required fields:**
```java
// Projection interface
public interface InventoryItemSummary {
    String getId();
    String getName();
    Integer getQuantity();
    
    // Derived property
    @Value("#{target.quantity * target.price}")
    BigDecimal getTotalValue();
}

// Repository method
public interface InventoryItemRepository extends JpaRepository<InventoryItem, String> {
    
    /**
     * Finds item summaries for efficient list views.
     * Enterprise Comment: Performance Optimization
     * Loads only ID, name, quantity (no description, timestamps, etc.)
     * 
     * @return lightweight item summaries
     */
    List<InventoryItemSummary> findAllProjectedBy();
    
    /**
     * Finds summaries by supplier.
     * @param supplierId supplier ID
     * @return item summaries
     */
    List<InventoryItemSummary> findBySupplierIdProjectedBy(String supplierId);
}
```

**Benefits:**
- ✅ **Reduced data transfer**: Only selected columns fetched
- ✅ **Faster queries**: Less data to read from disk
- ✅ **Derived properties**: Calculated fields via SpEL
- ✅ **Type safety**: Compile-time interface checking

### Pattern: @EntityGraph for Fetch Optimization

**Solve N+1 query problem:**
```java
@Entity
public class InventoryItem {
    @Id
    private String id;
    
    private String name;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;  // Lazy by default
}

public interface InventoryItemRepository extends JpaRepository<InventoryItem, String> {
    
    /**
     * Finds items with supplier eagerly fetched.
     * Enterprise Comment: N+1 Prevention
     * Single query with JOIN instead of N+1 queries
     * 
     * @return items with suppliers loaded
     */
    @EntityGraph(attributePaths = {"supplier"})
    List<InventoryItem> findAllWithSupplier();
    
    /**
     * Finds item by ID with supplier eagerly fetched.
     * @param id item ID
     * @return item with supplier
     */
    @EntityGraph(attributePaths = {"supplier"})
    Optional<InventoryItem> findWithSupplierById(String id);
}
```

**Without @EntityGraph:**
```sql
-- Initial query
SELECT * FROM inventory_items;  -- Returns 100 items

-- N+1 queries (lazy loading)
SELECT * FROM suppliers WHERE id = ?;  -- Repeated 100 times
```

**With @EntityGraph:**
```sql
-- Single query with JOIN
SELECT i.*, s.*
FROM inventory_items i
LEFT JOIN suppliers s ON i.supplier_id = s.id;
```

---

## Pattern: Batch Operations

### Bulk Insert

**Efficient batch processing:**
```java
@Service
public class InventoryItemServiceImpl {
    
    private final InventoryItemRepository repository;
    
    /**
     * Creates multiple items in batch.
     * @param dtos items to create
     * @return created items
     */
    @Transactional
    public List<InventoryItemDTO> createBatch(List<InventoryItemDTO> dtos) {
        // Enterprise Comment: Batch Insert Optimization
        // saveAll() uses JDBC batch insert (configured in application.yml)
        // spring.jpa.properties.hibernate.jdbc.batch_size=50
        
        List<InventoryItem> entities = dtos.stream()
            .map(dto -> InventoryItemMapper.toEntity(dto, currentUsername()))
            .collect(Collectors.toList());
        
        List<InventoryItem> saved = repository.saveAll(entities);
        
        return saved.stream()
            .map(InventoryItemMapper::toDTO)
            .collect(Collectors.toList());
    }
}
```

**Configuration (application.yml):**
```yaml
spring:
  jpa:
    properties:
      hibernate:
        jdbc:
          batch_size: 50  # Batch 50 inserts into single statement
        order_inserts: true  # Group inserts by entity type
        order_updates: true  # Group updates by entity type
```

### Bulk Update

**Efficient mass updates:**
```java
public interface InventoryItemRepository extends JpaRepository<InventoryItem, String> {
    
    /**
     * Bulk updates supplier for multiple items.
     * @param oldSupplierId current supplier ID
     * @param newSupplierId new supplier ID
     * @param username user performing update
     * @return number of updated items
     */
    @Modifying
    @Transactional
    @Query("""
        UPDATE InventoryItem i
        SET i.supplierId = :newSupplierId,
            i.updatedAt = CURRENT_TIMESTAMP,
            i.updatedBy = :username
        WHERE i.supplierId = :oldSupplierId
        """)
    int bulkUpdateSupplier(
        @Param("oldSupplierId") String oldSupplierId,
        @Param("newSupplierId") String newSupplierId,
        @Param("username") String username
    );
}
```

**Note:** Bulk updates bypass JPA entity lifecycle (no `@PreUpdate` callbacks).

---

## Testing Strategies

### Unit Testing Repositories

**Use @DataJpaTest for repository layer:**
```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class InventoryItemRepositoryTest {
    
    @Autowired
    private InventoryItemRepository repository;
    
    @Test
    void findByName_shouldReturnItem_whenExists() {
        // Given
        InventoryItem item = createTestItem();
        item.setName("Test Item");
        repository.save(item);
        
        // When
        Optional<InventoryItem> found = repository.findByName("Test Item");
        
        // Then
        assertTrue(found.isPresent());
        assertEquals("Test Item", found.get().getName());
    }
    
    @Test
    void findByNameAndQuantityGreaterThan_shouldFilterCorrectly() {
        // Given
        InventoryItem item1 = createTestItem();
        item1.setName("Item A");
        item1.setQuantity(50);
        
        InventoryItem item2 = createTestItem();
        item2.setName("Item A");
        item2.setQuantity(150);
        
        repository.saveAll(List.of(item1, item2));
        
        // When
        List<InventoryItem> results = repository.findByNameAndQuantityGreaterThan("Item A", 100);
        
        // Then
        assertEquals(1, results.size());
        assertEquals(150, results.get(0).getQuantity());
    }
}
```

### Testing Custom Queries

**Validate JPQL logic:**
```java
@Test
void sumQuantityChangesByDateRange_shouldCalculateCorrectly() {
    // Given
    String itemId = "item123";
    LocalDateTime start = LocalDateTime.of(2025, 1, 1, 0, 0);
    LocalDateTime end = LocalDateTime.of(2025, 2, 1, 0, 0);
    
    StockHistory change1 = createHistory(itemId, 100, start.plusDays(5));
    StockHistory change2 = createHistory(itemId, -20, start.plusDays(10));
    StockHistory change3 = createHistory(itemId, 50, start.plusDays(15));
    
    stockHistoryRepository.saveAll(List.of(change1, change2, change3));
    
    // When
    Integer total = stockHistoryRepository.sumQuantityChangesByDateRange(itemId, start, end);
    
    // Then
    assertEquals(130, total);  // 100 - 20 + 50
}
```

---

## Advanced Patterns

### Pattern: Multi-Database Dialect Support

**Runtime database detection for H2 (test) vs Oracle (prod):**
```java
@Component
public class StockHistoryCustomRepositoryImpl implements StockHistoryCustomRepository {
    
    @PersistenceContext
    private EntityManager em;
    
    @Autowired
    private Environment environment;
    
    /**
     * Detects active database profile.
     * Enterprise Comment: Database Dialect Detection
     * Enables writing portable queries that adapt to test/prod environments
     * without requiring separate implementations.
     * 
     * @return true if H2 (test), false if Oracle (prod)
     */
    private boolean isH2() {
        return Arrays.stream(environment.getActiveProfiles())
            .anyMatch(p -> p.equalsIgnoreCase("test") || p.equalsIgnoreCase("h2"));
    }
    
    /**
     * Monthly stock aggregations with database-specific SQL.
     */
    @Override
    public List<Object[]> getMonthlyStockMovement(LocalDateTime start, LocalDateTime end) {
        final String sql;
        if (isH2()) {
            // H2: Use CONCAT, YEAR/MONTH/DAY functions
            sql = """
                SELECT CONCAT(CAST(YEAR(sh.created_at) AS VARCHAR), '-',
                              LPAD(CAST(MONTH(sh.created_at) AS VARCHAR), 2, '0')) AS month_str,
                       SUM(CASE WHEN sh.quantity_change > 0 THEN sh.quantity_change ELSE 0 END) AS stock_in,
                       SUM(CASE WHEN sh.quantity_change < 0 THEN ABS(sh.quantity_change) ELSE 0 END) AS stock_out
                FROM stock_history sh
                WHERE sh.created_at BETWEEN :start AND :end
                GROUP BY CONCAT(CAST(YEAR(sh.created_at) AS VARCHAR), '-',
                                LPAD(CAST(MONTH(sh.created_at) AS VARCHAR), 2, '0'))
                ORDER BY 1
            """;
        } else {
            // Oracle: Use TO_CHAR for formatting
            sql = """
                SELECT TO_CHAR(sh.created_at, 'YYYY-MM') AS month_str,
                       SUM(CASE WHEN sh.quantity_change > 0 THEN sh.quantity_change ELSE 0 END) AS stock_in,
                       SUM(CASE WHEN sh.quantity_change < 0 THEN ABS(sh.quantity_change) ELSE 0 END) AS stock_out
                FROM stock_history sh
                WHERE sh.created_at BETWEEN :start AND :end
                GROUP BY TO_CHAR(sh.created_at, 'YYYY-MM')
                ORDER BY 1
            """;
        }
        
        Query query = em.createNativeQuery(sql);
        query.setParameter("start", start);
        query.setParameter("end", end);
        return query.getResultList();
    }
}
```

**Key Differences Between Dialects:**

| Feature | H2 (Test) | Oracle (Production) |
|---------|-----------|---------------------|
| **Identifiers** | Quoted uppercase: `"CREATED_AT"` | Unquoted lowercase: `created_at` |
| **Date Formatting** | `YEAR()`, `MONTH()`, `DAY()`, `CONCAT()` | `TO_CHAR(date, 'YYYY-MM-DD')` |
| **String Functions** | `LPAD()`, `CONCAT()` | `TO_CHAR()`, `||` operator |
| **Day Truncation** | `TRUNC(date)` | `TRUNC(date)` (same) |

**Benefits:**
- ✅ **Test Portability**: Use in-memory H2 for fast unit tests
- ✅ **Production Performance**: Optimize for Oracle in production
- ✅ **Single Codebase**: No separate test/prod implementations
- ✅ **Profile-Based**: Automatically switches via Spring profiles

---

### Pattern: Window Functions & Analytics

**Using SQL window functions for complex analytics:**
```java
/**
 * Daily stock valuation using window functions.
 * Enterprise Comment: Window Function Pattern
 * Uses ROW_NUMBER() to identify last event per item per day,
 * then calculates running balance and multiplies by price.
 * This avoids full inventory reconstruction for each day.
 */
@Override
public List<Object[]> getStockValueGroupedByDateFiltered(
    LocalDateTime dateFrom, 
    LocalDateTime dateTo, 
    String supplierId
) {
    final String sql = isH2() ? """
        WITH daily_events AS (
            SELECT 
                i.id AS item_id,
                TRUNC(sh.created_at) AS event_date,
                sh.quantity_change,
                sh.price_at_change,
                ROW_NUMBER() OVER (
                    PARTITION BY i.id, TRUNC(sh.created_at)
                    ORDER BY sh.created_at DESC
                ) AS rn
            FROM stock_history sh
            JOIN inventory_item i ON sh.item_id = i.id
            WHERE (:dateFrom IS NULL OR sh.created_at >= :dateFrom)
              AND (:dateTo IS NULL OR sh.created_at <= :dateTo)
              AND (:supplierId IS NULL OR UPPER(i.supplier_id) = UPPER(:supplierId))
        ),
        running_balance AS (
            SELECT 
                event_date,
                SUM(quantity_change) OVER (
                    PARTITION BY item_id 
                    ORDER BY event_date
                ) AS daily_quantity,
                price_at_change
            FROM daily_events
            WHERE rn = 1
        )
        SELECT 
            event_date,
            SUM(daily_quantity * price_at_change) AS total_value
        FROM running_balance
        GROUP BY event_date
        ORDER BY event_date
        """ : "..."; // Oracle variant
    
    Query query = em.createNativeQuery(sql);
    query.setParameter("dateFrom", dateFrom);
    query.setParameter("dateTo", dateTo);
    query.setParameter("supplierId", (supplierId == null || supplierId.isBlank()) ? null : supplierId);
    
    return query.getResultList();
}
```

**Window Function Benefits:**
- ✅ **Performance**: Avoids correlated subqueries
- ✅ **Readability**: Clear analytical intent
- ✅ **Accuracy**: Precise per-partition calculations
- ✅ **Flexibility**: PARTITION BY, ORDER BY, window frames

**Common Window Functions:**
- `ROW_NUMBER()`: Sequential numbering within partition
- `RANK()`: Ranking with gaps for ties
- `SUM() OVER()`: Running totals
- `AVG() OVER()`: Moving averages
- `LAG()/LEAD()`: Access previous/next row values

---

### Pattern: Multi-Criteria Filtering with NULL-Safe Queries

**Flexible filtering without dynamic SQL:**
```java
/**
 * Searches stock updates with optional multi-criteria filters.
 * Enterprise Comment: Multi-Criteria Filtering Pattern
 * Uses NULL-safe WHERE clauses (:param IS NULL OR condition).
 * Each parameter is normalized (null/blank checks) and converted
 * to search patterns (e.g., LIKE %term%). This enables flexible
 * queries without building dynamic SQL strings (SQL injection safe).
 */
@Override
public List<Object[]> findFilteredStockUpdates(
    LocalDateTime startDate,
    LocalDateTime endDate,
    String itemName,
    String supplierId,
    String createdBy,
    Integer minChange,
    Integer maxChange
) {
    final String sql = """
        SELECT i.name, s.name, sh.quantity_change, sh.reason, sh.created_by, sh.created_at
        FROM stock_history sh
        JOIN inventory_item i ON sh.item_id = i.id
        JOIN supplier s ON i.supplier_id = s.id
        WHERE (:startDate     IS NULL OR sh.created_at >= :startDate)
          AND (:endDate       IS NULL OR sh.created_at <= :endDate)
          AND (:itemPattern   IS NULL OR LOWER(i.name) LIKE :itemPattern)
          AND (:supplierId    IS NULL OR i.supplier_id = :supplierId)
          AND (:createdByNorm IS NULL OR LOWER(sh.created_by) = :createdByNorm)
          AND (:minChange     IS NULL OR sh.quantity_change >= :minChange)
          AND (:maxChange     IS NULL OR sh.quantity_change <= :maxChange)
        ORDER BY sh.created_at DESC
        """;
    
    // Parameter normalization
    final String itemPattern = (itemName == null || itemName.isBlank()) 
        ? null : "%" + itemName.toLowerCase() + "%";
    final String normalizedSupp = (supplierId == null || supplierId.isBlank()) 
        ? null : supplierId;
    final String createdByNorm = (createdBy == null || createdBy.isBlank()) 
        ? null : createdBy.toLowerCase();
    
    Query q = em.createNativeQuery(sql);
    q.setParameter("startDate", startDate);
    q.setParameter("endDate", endDate);
    q.setParameter("itemPattern", itemPattern);
    q.setParameter("supplierId", normalizedSupp);
    q.setParameter("createdByNorm", createdByNorm);
    q.setParameter("minChange", minChange);
    q.setParameter("maxChange", maxChange);
    
    return q.getResultList();
}
```

**Pattern Benefits:**
- ✅ **SQL Injection Safe**: All parameters bound, no string concatenation
- ✅ **Flexible**: Any combination of filters works
- ✅ **Maintainable**: Single query handles all cases
- ✅ **Performance**: Database can optimize with NULL checks
- ✅ **Normalized**: Consistent case handling (LOWER/UPPER)

**Normalization Techniques:**
- `null` or blank → `null` (skip filter)
- Partial match → `LIKE %term%`
- Exact match → `LOWER(field) = LOWER(param)`
- Case-insensitive → `UPPER()` or `LOWER()` functions

---

### Pattern: DTO Projection in JPQL

**Type-safe result mapping without boilerplate:**
```java
/**
 * Streams stock events for WAC (Weighted Average Cost) calculations.
 * Enterprise Comment: WAC Event Streaming
 * Provides time-ordered event stream for cost-flow calculations.
 * Events sorted by item and timestamp enable sequential replay for
 * opening inventory reconstruction and period-specific aggregations.
 */
@Override
public List<StockEventRowDTO> findEventsUpTo(LocalDateTime end, String supplierId) {
    final String jpql = """
        select new com.smartsupplypro.inventory.dto.StockEventRowDTO(
            sh.itemId, 
            coalesce(sh.supplierId, i.supplierId), 
            sh.timestamp, 
            sh.change,
            sh.priceAtChange,
            sh.reason
        )
        from StockHistory sh, InventoryItem i
        where i.id = sh.itemId 
            and sh.timestamp <= :end
            and (
                :supplierIdNorm is null 
                or lower(sh.supplierId) = :supplierIdNorm
            )
        order by sh.itemId asc, sh.timestamp asc
    """;

    final String supplierIdNorm = (supplierId == null || supplierId.isBlank()) 
        ? null : supplierId.trim().toLowerCase();

    return em.createQuery(jpql, StockEventRowDTO.class)
            .setParameter("end", end)
            .setParameter("supplierIdNorm", supplierIdNorm)
            .getResultList();
}
```

**DTO Constructor Requirements:**
```java
public class StockEventRowDTO {
    private final String itemId;
    private final String supplierId;
    private final LocalDateTime timestamp;
    private final Integer change;
    private final BigDecimal priceAtChange;
    private final StockChangeReason reason;
    
    // Constructor MUST match JPQL "new" clause signature
    public StockEventRowDTO(
        String itemId,
        String supplierId,
        LocalDateTime timestamp,
        Integer change,
        BigDecimal priceAtChange,
        StockChangeReason reason
    ) {
        this.itemId = itemId;
        this.supplierId = supplierId;
        this.timestamp = timestamp;
        this.change = change;
        this.priceAtChange = priceAtChange;
        this.reason = reason;
    }
    
    // Getters...
}
```

**Benefits:**
- ✅ **Type Safety**: Compile-time DTO constructor validation
- ✅ **No Manual Mapping**: JPQL handles Object[] → DTO conversion
- ✅ **Readable**: Clear field mapping in query
- ✅ **Maintainable**: Refactoring updates query automatically
- ✅ **Performance**: Direct field selection, no full entity loading

---

## Best Practices

### 1. Use Specific Return Types

```java
// GOOD: Optional for single result
Optional<InventoryItem> findByName(String name);

// GOOD: List for multiple results
List<InventoryItem> findBySupplier(String supplierId);

// BAD: Stream (requires explicit close)
Stream<InventoryItem> findAll();  // Must call .close()!
```

### 2. Avoid Cartesian Products

```java
// BAD: Multiple @EntityGraph attributes causing cartesian product
@EntityGraph(attributePaths = {"supplier", "stockHistory"})
List<InventoryItem> findAll();  // If item has 5 history records → 5 rows per item

// GOOD: Separate queries or use DTOs
List<InventoryItem> findAll();
List<StockHistory> findByItemIdIn(List<String> itemIds);
```

### 3. Index Database Columns

**For frequently queried fields:**
```java
@Entity
@Table(
    name = "inventory_items",
    indexes = {
        @Index(name = "idx_supplier_id", columnList = "supplier_id"),
        @Index(name = "idx_name", columnList = "name"),
        @Index(name = "idx_quantity", columnList = "quantity"),
        @Index(name = "idx_created_at", columnList = "created_at")
    }
)
public class InventoryItem {
    // ...
}
```

### 4. Use @Transactional Appropriately

```java
// Read-only optimization
@Transactional(readOnly = true)
public List<InventoryItemDTO> getAll() {
    return repository.findAll().stream()
        .map(InventoryItemMapper::toDTO)
        .collect(Collectors.toList());
}

// Write operations
@Transactional
public InventoryItemDTO create(InventoryItemDTO dto) {
    // ...
}
```

---

## References

- **Spring Data JPA Documentation**: https://docs.spring.io/spring-data/jpa/reference/
- **Hibernate Performance Tuning**: https://docs.jboss.org/hibernate/orm/current/userguide/html_single/Hibernate_User_Guide.html#performance
- **Related Patterns**: `validation-patterns.md`, `mapper-patterns.md`

---

*Document Version: 1.0*  
*Last Updated: 2025*  
*Project: Smart Supply Pro Inventory Service*