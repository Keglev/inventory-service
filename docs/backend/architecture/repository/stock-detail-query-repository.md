[⬅️ Back to Repository Index](./index.html)

# StockDetailQueryRepository

## Definition

```java
public interface StockDetailQueryRepository {

    @Query(value = """
        SELECT 
            sh.id,
            sh.item_id,
            i.name,
            sh.quantity_before,
            sh.quantity_after,
            sh.reason,
            sh.event_date,
            i.price,
            s.name as supplier_name
        FROM stock_history sh
        JOIN inventory_item i ON sh.item_id = i.id
        LEFT JOIN supplier s ON i.supplier_id = s.id
        WHERE (:itemId IS NULL OR sh.item_id = :itemId)
            AND (:supplier IS NULL OR s.id = :supplier)
            AND (:reason IS NULL OR sh.reason = :reason)
            AND sh.event_date BETWEEN :startDate AND :endDate
        ORDER BY sh.event_date DESC
        """, nativeQuery = true)
    List<Object[]> searchStockUpdates(
        @Param("itemId") String itemId,
        @Param("supplier") String supplier,
        @Param("reason") String reason,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate);

    @Query(value = """
        SELECT 
            sh.id,
            sh.item_id,
            i.name,
            sh.quantity_after,
            i.price,
            (sh.quantity_after * i.price) as total_value,
            sh.event_date
        FROM stock_history sh
        JOIN inventory_item i ON sh.item_id = i.id
        JOIN supplier s ON i.supplier_id = s.id
        WHERE sh.event_date >= :date
            AND s.id = :supplierId
            AND sh.quantity_after > 0
        ORDER BY sh.event_date DESC
        """, nativeQuery = true)
    Stream<Object[]> streamEventsForWAC(
        @Param("date") LocalDateTime date,
        @Param("supplierId") String supplierId);
}
```

## Purpose

Custom query repository providing **advanced search and analytics** for:
- Multi-criteria stock history searches
- Complex filtering across multiple entities
- Weighted Average Cost (WAC) calculations
- Detailed audit trail retrieval
- Supply chain traceability

---

## Query Methods

### searchStockUpdates(itemId, supplier, reason, startDate, endDate)

**Purpose:** Advanced search across stock history with optional filtering

**Type:** Native SQL with multi-table JOIN and optional filtering

**Returns:** List<Object[]> with [id, item_id, name, quantity_before, quantity_after, reason, event_date, price, supplier_name]

**Usage:**
```java
// Search all restock events from January
List<Object[]> restockEvents = repository.searchStockUpdates(
    null,                          // Any item
    null,                          // Any supplier
    "RESTOCK",                     // Only restocking
    LocalDateTime.of(2024, 1, 1, 0, 0),
    LocalDateTime.of(2024, 1, 31, 23, 59)
);

for (Object[] event : restockEvents) {
    String id = (String) event[0];
    String itemId = (String) event[1];
    String itemName = (String) event[2];
    int qtyBefore = (int) event[3];
    int qtyAfter = (int) event[4];
    String reason = (String) event[5];
    LocalDateTime eventDate = (LocalDateTime) event[6];
    BigDecimal price = (BigDecimal) event[7];
    String supplier = (String) event[8];
    
    System.out.printf(
        "%s: %s from %s (%d->%d units) at $%.2f%n",
        eventDate,
        itemName,
        supplier,
        qtyBefore,
        qtyAfter,
        price
    );
}
```

**Advanced Filtering Examples:**

```java
// Find all updates for specific item from specific supplier
List<Object[]> itemHistory = repository.searchStockUpdates(
    "ITEM-001",                    // Specific item
    "SUP-005",                     // Specific supplier
    null,                          // Any reason
    LocalDateTime.of(2024, 1, 1, 0, 0),
    LocalDateTime.now()
);

// Find all sales (quantity decreased) in date range
List<Object[]> sales = repository.searchStockUpdates(
    null,
    null,
    "SALE",
    LocalDateTime.of(2024, 12, 1, 0, 0),
    LocalDateTime.of(2024, 12, 31, 23, 59)
);

// Find all adjustments from any supplier
List<Object[]> adjustments = repository.searchStockUpdates(
    null,
    "SUP-999",                     // Specific supplier
    "ADJUSTMENT",
    LocalDateTime.now().minusMonths(3),
    LocalDateTime.now()
);
```

**Use Cases:**
- Audit trail retrieval
- Compliance reporting
- Investigation of discrepancies
- Supplier performance analysis
- Inventory reconciliation

---

### streamEventsForWAC(date, supplierId)

**Purpose:** Stream supplier events for Weighted Average Cost calculation

**Type:** Native SQL returning Stream (memory efficient)

**Returns:** Stream<Object[]> with [id, item_id, name, quantity_after, price, total_value, event_date]

**WAC Calculation Pattern:**

Weighted Average Cost is calculated as:
```
WAC = Total Inventory Value / Total Units
```

**Usage:**
```java
// Calculate WAC for supplier items since date
LocalDateTime cutoffDate = LocalDateTime.of(2024, 1, 1, 0, 0);
String supplierId = "SUP-001";

BigDecimal totalValue = BigDecimal.ZERO;
int totalUnits = 0;

try (Stream<Object[]> events = repository.streamEventsForWAC(
    cutoffDate,
    supplierId
)) {
    for (Object[] event : (Iterable<Object[]>) events::iterator) {
        String itemId = (String) event[1];
        Integer quantity = (Integer) event[3];
        BigDecimal value = (BigDecimal) event[5];
        
        totalValue = totalValue.add(value);
        totalUnits += quantity;
    }
}

// Calculate WAC
BigDecimal wac = totalUnits > 0 ?
    totalValue.divide(
        BigDecimal.valueOf(totalUnits),
        2,
        RoundingMode.HALF_UP
    ) :
    BigDecimal.ZERO;

System.out.printf(
    "Supplier %s WAC: $%.2f (Total: $%.2f, Units: %d)%n",
    supplierId,
    wac,
    totalValue,
    totalUnits
);
```

**Per-Item WAC Calculation:**

```java
// Calculate WAC per item from supplier
Map<String, BigDecimal> itemWacs = new HashMap<>();
Map<String, Integer> itemUnits = new HashMap<>();
Map<String, BigDecimal> itemValues = new HashMap<>();

try (Stream<Object[]> events = repository.streamEventsForWAC(
    LocalDateTime.of(2024, 1, 1, 0, 0),
    "SUP-001"
)) {
    events.forEach(event -> {
        String itemId = (String) event[1];
        String itemName = (String) event[2];
        Integer quantity = (Integer) event[3];
        BigDecimal price = (BigDecimal) event[4];
        BigDecimal value = (BigDecimal) event[5];
        
        // Accumulate by item
        itemUnits.put(itemId, itemUnits.getOrDefault(itemId, 0) + quantity);
        itemValues.put(
            itemId,
            itemValues.getOrDefault(itemId, BigDecimal.ZERO).add(value)
        );
    });
}

// Calculate per-item WAC
for (String itemId : itemUnits.keySet()) {
    int units = itemUnits.get(itemId);
    BigDecimal value = itemValues.get(itemId);
    BigDecimal itemWac = value.divide(
        BigDecimal.valueOf(units),
        2,
        RoundingMode.HALF_UP
    );
    itemWacs.put(itemId, itemWac);
}

itemWacs.forEach((itemId, wac) ->
    System.out.printf("Item %s WAC: $%.2f%n", itemId, wac)
);
```

**Use Cases:**
- Cost of goods accounting
- Financial reporting (GAAP compliance)
- Inventory valuation for balance sheet
- Margin analysis
- Supplier cost analysis

---

## Mixin Pattern Integration

StockDetailQueryRepository is implemented as a **mixin** by:
- `StockHistoryRepository` (main data source)

```java
public interface StockHistoryRepository extends JpaRepository<StockHistory, String>,
                                               StockMetricsRepository,
                                               StockTrendAnalyticsRepository,
                                               StockDetailQueryRepository  // ← Mixin
{
    // Additional query methods...
}
```

This allows StockHistoryRepository to expose detail query methods:
```java
// Can call detail query methods through StockHistoryRepository
List<Object[]> results = stockHistoryRepository.searchStockUpdates(
    itemId,
    supplierId,
    reason,
    startDate,
    endDate
);

Stream<Object[]> events = stockHistoryRepository.streamEventsForWAC(
    date,
    supplierId
);
```

---

## Service Integration Pattern

```java
@Service
public class InventorySearchAndWACService {
    
    @Autowired
    private StockHistoryRepository stockHistoryRepository;
    
    /**
     * Search stock history with advanced filtering
     */
    @Transactional(readOnly = true)
    public List<StockEventDTO> searchStockEvents(
        StockEventSearchCriteria criteria
    ) {
        List<Object[]> results = stockHistoryRepository.searchStockUpdates(
            criteria.getItemId(),
            criteria.getSupplierId(),
            criteria.getReason(),
            criteria.getStartDate(),
            criteria.getEndDate()
        );
        
        return results.stream()
            .map(row -> StockEventDTO.builder()
                .id((String) row[0])
                .itemId((String) row[1])
                .itemName((String) row[2])
                .quantityBefore((int) row[3])
                .quantityAfter((int) row[4])
                .reason((String) row[5])
                .eventDate((LocalDateTime) row[6])
                .price((BigDecimal) row[7])
                .supplierName((String) row[8])
                .quantityChange((int) row[4] - (int) row[3])
                .valueChange(
                    ((BigDecimal) row[7]).multiply(
                        BigDecimal.valueOf((int) row[4] - (int) row[3])
                    )
                )
                .build())
            .collect(Collectors.toList());
    }
    
    /**
     * Generate audit report for compliance
     */
    @Transactional(readOnly = true)
    public AuditReportDTO generateAuditReport(
        String itemId,
        LocalDate startDate,
        LocalDate endDate
    ) {
        List<Object[]> events = stockHistoryRepository.searchStockUpdates(
            itemId,
            null,
            null,
            startDate.atStartOfDay(),
            endDate.atTime(23, 59, 59)
        );
        
        int totalMovements = events.size();
        int restockCount = (int) events.stream()
            .filter(row -> "RESTOCK".equals(row[5]))
            .count();
        int saleCount = (int) events.stream()
            .filter(row -> "SALE".equals(row[5]))
            .count();
        
        return AuditReportDTO.builder()
            .itemId(itemId)
            .reportPeriod(startDate + " to " + endDate)
            .totalMovements(totalMovements)
            .restockCount(restockCount)
            .saleCount(saleCount)
            .build();
    }
    
    /**
     * Calculate Weighted Average Cost (WAC) for supplier
     */
    @Transactional(readOnly = true)
    public SupplierWACReportDTO calculateSupplierWAC(
        String supplierId,
        LocalDate fromDate
    ) {
        BigDecimal totalValue = BigDecimal.ZERO;
        int totalUnits = 0;
        int eventCount = 0;
        
        try (Stream<Object[]> events = stockHistoryRepository
            .streamEventsForWAC(
                fromDate.atStartOfDay(),
                supplierId
            )) {
            
            List<Object[]> eventList = events.collect(Collectors.toList());
            
            for (Object[] event : eventList) {
                Integer quantity = (Integer) event[3];
                BigDecimal value = (BigDecimal) event[5];
                
                totalValue = totalValue.add(value);
                totalUnits += quantity;
                eventCount++;
            }
        }
        
        BigDecimal wac = totalUnits > 0 ?
            totalValue.divide(
                BigDecimal.valueOf(totalUnits),
                2,
                RoundingMode.HALF_UP
            ) :
            BigDecimal.ZERO;
        
        return SupplierWACReportDTO.builder()
            .supplierId(supplierId)
            .reportDate(LocalDate.now())
            .fromDate(fromDate)
            .totalValue(totalValue)
            .totalUnits(totalUnits)
            .weightedAverageCost(wac)
            .eventCount(eventCount)
            .build();
    }
    
    /**
     * Generate per-item WAC for detailed analysis
     */
    @Transactional(readOnly = true)
    public List<ItemWACDTO> calculatePerItemWAC(
        String supplierId,
        LocalDate fromDate
    ) {
        Map<String, ItemWACData> itemWacs = new HashMap<>();
        
        try (Stream<Object[]> events = stockHistoryRepository
            .streamEventsForWAC(
                fromDate.atStartOfDay(),
                supplierId
            )) {
            
            events.forEach(event -> {
                String itemId = (String) event[1];
                String itemName = (String) event[2];
                Integer quantity = (Integer) event[3];
                BigDecimal value = (BigDecimal) event[5];
                
                ItemWACData data = itemWacs.computeIfAbsent(
                    itemId,
                    k -> new ItemWACData(itemName)
                );
                
                data.addValue(quantity, value);
            });
        }
        
        return itemWacs.values().stream()
            .map(ItemWACData::toDTO)
            .collect(Collectors.toList());
    }
    
    private static class ItemWACData {
        String itemId;
        String itemName;
        BigDecimal totalValue = BigDecimal.ZERO;
        int totalUnits = 0;
        
        ItemWACData(String itemName) {
            this.itemName = itemName;
        }
        
        void addValue(int units, BigDecimal value) {
            totalUnits += units;
            totalValue = totalValue.add(value);
        }
        
        ItemWACDTO toDTO() {
            BigDecimal wac = totalUnits > 0 ?
                totalValue.divide(
                    BigDecimal.valueOf(totalUnits),
                    2,
                    RoundingMode.HALF_UP
                ) :
                BigDecimal.ZERO;
            
            return ItemWACDTO.builder()
                .itemId(itemId)
                .itemName(itemName)
                .totalValue(totalValue)
                .totalUnits(totalUnits)
                .weightedAverageCost(wac)
                .build();
        }
    }
}
```

---

## Testing

```java
@DataJpaTest
class StockDetailQueryRepositoryTest {
    
    @Autowired
    private StockHistoryRepository repository;
    
    @Autowired
    private InventoryItemRepository itemRepository;
    
    @Autowired
    private SupplierRepository supplierRepository;
    
    @Test
    void testSearchStockUpdates() {
        // Setup
        Supplier supplier = supplierRepository.save(
            Supplier.builder()
                .id("SUP-001")
                .name("Widget Corp")
                .build()
        );
        
        InventoryItem item = itemRepository.save(
            InventoryItem.builder()
                .id("ITEM-001")
                .name("Widget")
                .price(new BigDecimal("10.00"))
                .quantity(100)
                .supplierId(supplier.getId())
                .minimumQuantity(10)
                .createdBy("test")
                .createdAt(LocalDateTime.now())
                .build()
        );
        
        LocalDateTime date = LocalDateTime.now();
        repository.save(StockHistory.builder()
            .id("SH-001")
            .itemId(item.getId())
            .quantityBefore(0)
            .quantityAfter(100)
            .reason("RESTOCK")
            .eventDate(date)
            .createdBy("test")
            .build());
        
        // Test search
        List<Object[]> results = repository.searchStockUpdates(
            "ITEM-001",
            "SUP-001",
            "RESTOCK",
            date.minusHours(1),
            date.plusHours(1)
        );
        
        assertEquals(1, results.size());
        assertEquals("Widget", results.get(0)[2]);
    }
    
    @Test
    void testStreamEventsForWAC() {
        // Setup supplier and item
        Supplier supplier = supplierRepository.save(
            Supplier.builder()
                .id("SUP-001")
                .name("Supplier 1")
                .build()
        );
        
        InventoryItem item = itemRepository.save(
            InventoryItem.builder()
                .id("ITEM-001")
                .name("Product")
                .price(new BigDecimal("50.00"))
                .quantity(100)
                .supplierId(supplier.getId())
                .minimumQuantity(10)
                .createdBy("test")
                .createdAt(LocalDateTime.now())
                .build()
        );
        
        LocalDateTime date = LocalDateTime.now();
        repository.save(StockHistory.builder()
            .id("SH-001")
            .itemId(item.getId())
            .quantityBefore(0)
            .quantityAfter(100)
            .reason("INITIAL")
            .eventDate(date)
            .createdBy("test")
            .build());
        
        // Test WAC stream
        try (Stream<Object[]> events = repository.streamEventsForWAC(
            date.minusHours(1),
            supplier.getId()
        )) {
            List<Object[]> results = events.collect(Collectors.toList());
            
            assertEquals(1, results.size());
            assertEquals(100, results.get(0)[3]); // quantity
        }
    }
}
```

---

## Performance Notes

- **Stream API:** Memory efficient for large datasets
- **Multi-table JOINs:** Adds item price and supplier info efficiently
- **Optional Filtering:** NULL parameters excluded from WHERE clause
- **WAC Calculation:** Stream processing prevents loading all data into memory
- **Suitable for:** Reports, audits, compliance, financial statements

---

## Related Documentation

- [Stock History Repository](./stock-history-repository.html) (implements mixin)
- [Stock Metrics Repository](./stock-metrics-repository.html)
- [Stock Trend Analytics Repository](./stock-trend-analytics-repository.html)
- [Repository Layer Index](./index.html)

---

[⬅️ Back to Repository Index](./index.html)
