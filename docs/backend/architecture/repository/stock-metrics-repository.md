[⬅️ Back to Repository Index](./index.html)

# StockMetricsRepository

## Definition

```java
public interface StockMetricsRepository {

    @Query("""
        SELECT s.name, SUM(i.quantity) as total_stock
        FROM Supplier s
        LEFT JOIN s.inventoryItems i
        WHERE s.id = :supplierId
        GROUP BY s.id, s.name
    """)
    Object[] getTotalStockBySupplier(@Param("supplierId") String supplierId);

    @Query("""
        SELECT COUNT(sh)
        FROM StockHistory sh
        WHERE sh.itemId = :itemId
    """)
    int getUpdateCountByItem(@Param("itemId") String itemId);

    @Query("""
        SELECT i.name, i.quantity, i.minimumQuantity
        FROM InventoryItem i
        WHERE i.quantity < i.minimumQuantity
        ORDER BY i.quantity ASC
    """)
    List<Object[]> findItemsBelowMinimumStock();
}
```

## Purpose

Custom analytics repository providing **Key Performance Indicators (KPIs)** for:
- Supplier inventory metrics
- Item update frequency analysis
- Low-stock alerts and reporting
- Dashboard data aggregation

---

## Query Methods

### getTotalStockBySupplier(supplierId)

**Purpose:** Get total stock units from supplier

**Type:** Custom @Query (JPQL with GROUP BY)

**Returns:** Object[] with [supplier_name, total_stock]

**Usage:**
```java
// Get supplier stock summary
Object[] result = metricsRepository.getTotalStockBySupplier(supplierId);

String supplierName = (String) result[0];
Long totalStock = (Long) result[1];

System.out.printf(
    "Supplier: %s, Total Units: %d%n",
    supplierName,
    totalStock
);
```

**Left Join Rationale:**
- Returns supplier even if no items (0 stock)
- Prevents NULL supplier names
- Complete supplier coverage

**Use Cases:**
- Supplier dashboard
- Inventory allocation by supplier
- Supply chain analysis

---

### getUpdateCountByItem(itemId)

**Purpose:** Count how many times item stock has been updated

**Type:** Custom @Query (JPQL with COUNT)

**Returns:** int (count)

**Usage:**
```java
// Get update frequency for item
int updateCount = metricsRepository.getUpdateCountByItem(itemId);

System.out.println("Stock updates for item: " + updateCount);

if (updateCount > 100) {
    System.out.println("High-velocity item (>100 updates)");
}
```

**Use Cases:**
- Item volatility analysis
- Fast-moving SKU identification
- Supply chain velocity metrics
- Reorder frequency planning

---

### findItemsBelowMinimumStock()

**Purpose:** Get all items that need reordering

**Type:** Custom @Query (JPQL with WHERE condition)

**Returns:** List<Object[]> with [name, quantity, minimum_quantity]

**Usage:**
```java
// Get all low-stock items
List<Object[]> lowStockItems = metricsRepository
    .findItemsBelowMinimumStock();

System.out.println("Items needing reorder:");
for (Object[] item : lowStockItems) {
    String name = (String) item[0];
    int quantity = (int) item[1];
    int minimum = (int) item[2];
    
    System.out.printf(
        "  %s: %d/%d (shortage: %d)%n",
        name,
        quantity,
        minimum,
        minimum - quantity
    );
}
```

**Sorting:**
- Ordered by quantity ASC
- Critical items (near 0) appear first
- Aids prioritization for restocking

**Use Cases:**
- Reorder point dashboard
- Purchase requisition generation
- Low-stock alerts
- Inventory health reports

---

## Mixin Pattern Integration

StockMetricsRepository is implemented as a **mixin** by:
- `StockHistoryRepository` (main data source)

```java
public interface StockHistoryRepository extends JpaRepository<StockHistory, String>,
                                               StockMetricsRepository,    // ← Mixin
                                               StockTrendAnalyticsRepository,
                                               StockDetailQueryRepository {
    // Additional query methods...
}
```

This allows StockHistoryRepository to expose metrics methods:
```java
// Can call metrics methods through StockHistoryRepository
Object[] metrics = stockHistoryRepository.getTotalStockBySupplier(supplierId);
int updateCount = stockHistoryRepository.getUpdateCountByItem(itemId);
List<Object[]> lowStock = stockHistoryRepository.findItemsBelowMinimumStock();
```

---

## Service Integration Pattern

```java
@Service
public class InventoryAnalyticsService {
    
    @Autowired
    private StockHistoryRepository stockHistoryRepository;
    
    /**
     * Get supplier inventory dashboard
     */
    @Transactional(readOnly = true)
    public SupplierInventoryDTO getSupplierInventory(String supplierId) {
        Object[] metrics = stockHistoryRepository
            .getTotalStockBySupplier(supplierId);
        
        String supplierName = (String) metrics[0];
        Long totalUnits = (Long) metrics[1];
        
        return SupplierInventoryDTO.builder()
            .supplierId(supplierId)
            .supplierName(supplierName)
            .totalUnits(totalUnits)
            .timestamp(LocalDateTime.now())
            .build();
    }
    
    /**
     * Get item update velocity for supply chain analysis
     */
    @Transactional(readOnly = true)
    public ItemVelocityDTO getItemVelocity(String itemId) {
        int updateCount = stockHistoryRepository
            .getUpdateCountByItem(itemId);
        
        String velocity;
        if (updateCount > 100) {
            velocity = "HIGH";
        } else if (updateCount > 20) {
            velocity = "MEDIUM";
        } else {
            velocity = "LOW";
        }
        
        return ItemVelocityDTO.builder()
            .itemId(itemId)
            .updateCount(updateCount)
            .velocity(velocity)
            .build();
    }
    
    /**
     * Get KPI dashboard data
     */
    @Transactional(readOnly = true)
    public InventoryKpiDTO getKpiDashboard() {
        // Get all low-stock items
        List<Object[]> lowStockItems = stockHistoryRepository
            .findItemsBelowMinimumStock();
        
        int criticalCount = (int) lowStockItems.stream()
            .filter(item -> {
                int qty = (int) item[1];
                int minimum = (int) item[2];
                return qty < (minimum * 0.25); // Less than 25% of minimum
            })
            .count();
        
        return InventoryKpiDTO.builder()
            .totalLowStockItems(lowStockItems.size())
            .criticalItemsCount(criticalCount)
            .restockingRequired(lowStockItems.size() > 0)
            .timestamp(LocalDateTime.now())
            .build();
    }
    
    /**
     * Generate reorder report
     */
    @Transactional(readOnly = true)
    public List<ReorderLineItemDTO> generateReorderReport() {
        List<Object[]> lowStockItems = stockHistoryRepository
            .findItemsBelowMinimumStock();
        
        return lowStockItems.stream()
            .map(item -> ReorderLineItemDTO.builder()
                .itemName((String) item[0])
                .currentQuantity((int) item[1])
                .minimumQuantity((int) item[2])
                .orderQuantity((int) item[2] * 2) // Suggest 2x minimum
                .priority(calculatePriority(
                    (int) item[1],
                    (int) item[2]
                ))
                .build())
            .collect(Collectors.toList());
    }
    
    private String calculatePriority(int quantity, int minimum) {
        if (quantity == 0) return "CRITICAL";
        if (quantity < minimum * 0.25) return "HIGH";
        if (quantity < minimum * 0.5) return "MEDIUM";
        return "LOW";
    }
}
```

---

## Testing

```java
@DataJpaTest
class StockMetricsRepositoryTest {
    
    @Autowired
    private StockHistoryRepository repository;
    
    @Autowired
    private SupplierRepository supplierRepository;
    
    @Autowired
    private InventoryItemRepository itemRepository;
    
    @Test
    void testGetTotalStockBySupplier() {
        // Setup
        Supplier supplier = supplierRepository.save(
            Supplier.builder()
                .id("SUP-001")
                .name("Widget Corp")
                .build()
        );
        
        itemRepository.save(createItem("ITEM-001", 100, supplier.getId()));
        itemRepository.save(createItem("ITEM-002", 50, supplier.getId()));
        
        // Test
        Object[] result = repository.getTotalStockBySupplier(supplier.getId());
        
        assertEquals("Widget Corp", result[0]);
        assertEquals(150L, result[1]);
    }
    
    @Test
    void testGetUpdateCountByItem() {
        String itemId = "ITEM-001";
        
        // Record multiple updates
        repository.save(createEvent(itemId, 0, 100, "INITIAL"));
        repository.save(createEvent(itemId, 100, 80, "SALE"));
        repository.save(createEvent(itemId, 80, 120, "RESTOCK"));
        
        // Test
        int count = repository.getUpdateCountByItem(itemId);
        
        assertEquals(3, count);
    }
    
    @Test
    void testFindItemsBelowMinimumStock() {
        // Below minimum
        itemRepository.save(createItemWithMinimum(
            "ITEM-001", 5, 10  // Below minimum
        ));
        itemRepository.save(createItemWithMinimum(
            "ITEM-002", 3, 10  // Below minimum
        ));
        
        // Above minimum
        itemRepository.save(createItemWithMinimum(
            "ITEM-003", 20, 10  // Above minimum
        ));
        
        // Test
        List<Object[]> results = repository.findItemsBelowMinimumStock();
        
        assertEquals(2, results.size());
        // Verify sorted by quantity ASC
        assertEquals(3, results.get(0)[1]); // Item-002
        assertEquals(5, results.get(1)[1]); // Item-001
    }
    
    private InventoryItem createItem(String id, int quantity, String supplierId) {
        return InventoryItem.builder()
            .id(id)
            .name("Item " + id)
            .quantity(quantity)
            .price(new BigDecimal("10.00"))
            .supplierId(supplierId)
            .minimumQuantity(10)
            .createdBy("test")
            .createdAt(LocalDateTime.now())
            .build();
    }
    
    private InventoryItem createItemWithMinimum(String id, int quantity, int minimum) {
        return InventoryItem.builder()
            .id(id)
            .name("Item " + id)
            .quantity(quantity)
            .price(new BigDecimal("10.00"))
            .supplierId("SUP-001")
            .minimumQuantity(minimum)
            .createdBy("test")
            .createdAt(LocalDateTime.now())
            .build();
    }
    
    private StockHistory createEvent(
        String itemId,
        int before,
        int after,
        String reason
    ) {
        return StockHistory.builder()
            .id(UUID.randomUUID().toString())
            .itemId(itemId)
            .quantityBefore(before)
            .quantityAfter(after)
            .reason(reason)
            .createdBy("test")
            .createdAt(LocalDateTime.now())
            .build();
    }
}
```

---

## Dashboard Integration

Typical usage in analytics dashboard service:

```java
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    
    @Autowired
    private InventoryAnalyticsService analyticsService;
    
    @GetMapping("/kpi")
    public ResponseEntity<InventoryKpiDTO> getKpis() {
        InventoryKpiDTO kpi = analyticsService.getKpiDashboard();
        return ResponseEntity.ok(kpi);
    }
    
    @GetMapping("/supplier/{id}/inventory")
    public ResponseEntity<SupplierInventoryDTO> getSupplierInventory(
        @PathVariable String id
    ) {
        SupplierInventoryDTO inventory = analyticsService
            .getSupplierInventory(id);
        return ResponseEntity.ok(inventory);
    }
    
    @GetMapping("/reorder-report")
    public ResponseEntity<List<ReorderLineItemDTO>> getReorderReport() {
        List<ReorderLineItemDTO> report = analyticsService
            .generateReorderReport();
        return ResponseEntity.ok(report);
    }
}
```

---

## Performance Notes

- **GROUP BY Aggregation:** Efficient supplier-level aggregation
- **COUNT Query:** Fast count without fetching full entities
- **No Joins in Small Queries:** COUNT and findItemsBelowMinimumStock are simple
- **Supplier JOIN:** Left join ensures complete supplier coverage
- **Dashboard Optimization:** Pre-computed metrics reduce query complexity

---

## Related Documentation

- [Stock History Repository](./stock-history-repository.html) (implements mixin)
- [Stock Trend Analytics Repository](./stock-trend-analytics-repository.html)
- [Stock Detail Query Repository](./stock-detail-query-repository.html)
- [Repository Layer Index](./index.html)

---

[⬅️ Back to Repository Index](./index.html)
