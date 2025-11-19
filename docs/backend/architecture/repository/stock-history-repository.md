[⬅️ Back to Repository Index](./index.html)

# StockHistoryRepository

## Definition

```java
public interface StockHistoryRepository extends JpaRepository<StockHistory, String>,
                                               StockMetricsRepository,
                                               StockTrendAnalyticsRepository,
                                               StockDetailQueryRepository {

    List<StockHistory> findByItemId(String itemId);

    @Query("""
        SELECT sh FROM StockHistory sh
        WHERE sh.itemId = :itemId
        ORDER BY sh.eventDate DESC
        LIMIT 1
    """)
    Optional<StockHistory> findLatestByItemId(@Param("itemId") String itemId);

    @Query("""
        SELECT sh FROM StockHistory sh
        WHERE sh.itemId = :itemId
            AND sh.eventDate BETWEEN :startDate AND :endDate
        ORDER BY sh.eventDate DESC
    """)
    List<StockHistory> findByItemIdAndDateRange(
        @Param("itemId") String itemId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    @Query(value = """
        SELECT COUNT(DISTINCT item_id)
        FROM stock_history
        WHERE event_date >= :date
        """, nativeQuery = true)
    long countUniqueItemsUpdatedSince(@Param("date") LocalDateTime date);

    @Query(value = """
        SELECT sh.*, i.price
        FROM stock_history sh
        JOIN inventory_item i ON sh.item_id = i.id
        WHERE sh.event_date >= :startDate
            AND sh.quantity_after > 0
        ORDER BY sh.event_date DESC
        """, nativeQuery = true, name = "findEventsSinceWithPrice")
    List<Object[]> findEventsSinceWithPrice(@Param("startDate") LocalDateTime startDate);

    Stream<StockHistory> findByEventDateAfter(LocalDateTime eventDate);

    Stream<StockHistory> findByItemIdOrderByEventDateDesc(String itemId);
}
```

## Purpose

Provides data access for **StockHistory** entities with capabilities for:
- CRUD operations via JpaRepository
- Append-only event sourcing pattern
- Complex time-series analysis queries
- Audit trail retrieval
- Advanced analytics via mixin repositories

---

## Architecture Notes

**Mixin Pattern:** StockHistoryRepository implements three custom repository interfaces:

```
StockHistoryRepository
├── extends JpaRepository<StockHistory, String>
├── implements StockMetricsRepository (KPI dashboards)
├── implements StockTrendAnalyticsRepository (time-series trends)
└── implements StockDetailQueryRepository (advanced searching)
```

This pattern allows StockHistory to provide:
- Basic CRUD operations (JpaRepository)
- Performance metrics (StockMetricsRepository)
- Trend analysis (StockTrendAnalyticsRepository)
- Detailed querying (StockDetailQueryRepository)

---

## Core Query Methods

### findByItemId(String itemId)

**Purpose:** Get all historical updates for an item

**Type:** Method-derived JPQL

**Usage:**
```java
// Get complete audit trail for item
List<StockHistory> history = repository.findByItemId(itemId);

for (StockHistory event : history) {
    System.out.printf(
        "%s: %d -> %d (reason: %s)%n",
        event.getEventDate(),
        event.getQuantityBefore(),
        event.getQuantityAfter(),
        event.getReason()
    );
}
```

**Append-only Design:**
- Events are never deleted
- Provides immutable audit trail
- Enables compliance reporting

---

### findLatestByItemId(String itemId)

**Purpose:** Get most recent stock update for an item

**Type:** Custom @Query (JPQL with LIMIT)

**Usage:**
```java
Optional<StockHistory> latest = repository.findLatestByItemId(itemId);

if (latest.isPresent()) {
    StockHistory event = latest.get();
    System.out.printf(
        "Last update: %s (now: %d units)%n",
        event.getEventDate(),
        event.getQuantityAfter()
    );
}
```

**Performance:**
- Returns single record (fast)
- Often used with projection to get only quantity

---

### findByItemIdAndDateRange(itemId, startDate, endDate)

**Purpose:** Query stock history for date range (analytics)

**Type:** Custom @Query (JPQL)

**Usage:**
```java
LocalDateTime monthStart = LocalDateTime.of(2024, 1, 1, 0, 0);
LocalDateTime monthEnd = LocalDateTime.of(2024, 1, 31, 23, 59);

List<StockHistory> monthlyHistory = repository
    .findByItemIdAndDateRange(itemId, monthStart, monthEnd);

// Analyze inventory patterns
double avgQuantity = monthlyHistory.stream()
    .mapToInt(StockHistory::getQuantityAfter)
    .average()
    .orElse(0.0);

System.out.println("Average stock: " + avgQuantity);
```

**Use Cases:**
- Monthly inventory analysis
- Year-over-year comparisons
- Trend identification

---

### countUniqueItemsUpdatedSince(date)

**Purpose:** Get count of items updated since date (KPI)

**Type:** Native SQL

**Usage:**
```java
LocalDateTime yesterday = LocalDateTime.now().minusDays(1);

long itemsUpdated = repository.countUniqueItemsUpdatedSince(yesterday);

System.out.println("Items updated today: " + itemsUpdated);
```

**Use Cases:**
- Daily operations dashboard
- Activity monitoring
- Performance metrics

---

### findEventsSinceWithPrice(startDate)

**Purpose:** Get stock events with current item prices

**Type:** Native SQL with JOIN

**Returns:** Object[] with [all stock_history columns, price]

**Usage:**
```java
LocalDateTime lastHour = LocalDateTime.now().minusHours(1);

List<Object[]> recentEvents = repository
    .findEventsSinceWithPrice(lastHour);

// Calculate value of recent movements
for (Object[] event : recentEvents) {
    StockHistory history = mapToEntity(event); // First columns
    BigDecimal price = (BigDecimal) event[event.length - 1];
    
    int quantityChange = history.getQuantityAfter() - history.getQuantityBefore();
    BigDecimal valueChange = price.multiply(
        BigDecimal.valueOf(quantityChange)
    );
    
    System.out.printf(
        "%s: %s (value impact: $%.2f)%n",
        history.getItemId(),
        history.getReason(),
        valueChange
    );
}
```

**Use Cases:**
- Financial impact analysis
- Value-based inventory management
- Supply chain costing

---

## Stream Query Methods

### findByEventDateAfter(LocalDateTime eventDate)

**Purpose:** Stream recent events without loading all into memory

**Type:** Method-derived JPQL returning Stream

**Usage:**
```java
LocalDateTime threshold = LocalDateTime.now().minusHours(24);

// Process large datasets without memory overflow
repository.findByEventDateAfter(threshold)
    .filter(event -> event.getQuantityAfter() > 100)
    .forEach(event -> 
        System.out.println("High stock: " + event.getItemId())
    );
```

**Performance Benefits:**
- Lazy loads results
- Memory efficient for large datasets
- Suitable for batch processing

---

### findByItemIdOrderByEventDateDesc(String itemId)

**Purpose:** Stream item history in reverse chronological order

**Type:** Method-derived JPQL returning Stream

**Usage:**
```java
// Find when stock last went below minimum
Stream<StockHistory> history = repository
    .findByItemIdOrderByEventDateDesc(itemId);

Optional<StockHistory> lastLowStock = history
    .filter(event -> event.getQuantityAfter() < 10)
    .findFirst();

if (lastLowStock.isPresent()) {
    System.out.println(
        "Last low stock: " + lastLowStock.get().getEventDate()
    );
}
```

**IMPORTANT:** Stream must be closed (use try-with-resources):
```java
try (Stream<StockHistory> history = repository
        .findByItemIdOrderByEventDateDesc(itemId)) {
    // Process stream
}
```

---

## Mixin Repository Methods

### From StockMetricsRepository

See [stock-metrics-repository.html](./stock-metrics-repository.html) for:
- `getTotalStockBySupplier(supplierId)` - Total units from supplier
- `getUpdateCountByItem(itemId)` - Historical update count
- `findItemsBelowMinimumStock()` - Low-stock items

### From StockTrendAnalyticsRepository

See [stock-trend-analytics-repository.html](./stock-trend-analytics-repository.html) for:
- `getMonthlyStockMovement(itemId, month)` - Monthly analysis
- `getDailyStockValuation(date)` - Daily inventory value
- `getItemPriceTrend(itemId, startDate, endDate)` - Price trends

### From StockDetailQueryRepository

See [stock-detail-query-repository.html](./stock-detail-query-repository.html) for:
- `searchStockUpdates(criteria)` - Advanced search
- `streamEventsForWAC(date, supplierId)` - WAC calculations

---

## Event Sourcing Pattern

StockHistory implements **append-only event sourcing**:

```java
@Entity
@Getter
@NoArgsConstructor
public class StockHistory {
    @Id
    private String id;
    
    private String itemId;
    private int quantityBefore;
    private int quantityAfter;
    private String reason; // RESTOCK, SALE, ADJUSTMENT, etc.
    
    @CreationTimestamp
    private LocalDateTime eventDate;
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    private String createdBy;
    
    // NEVER modified after creation
}
```

**Benefits:**
- Complete audit trail
- No data loss (immutable)
- Temporal queries possible
- Compliance friendly

---

## Service Integration Pattern

```java
@Service
public class StockManagementService {
    
    @Autowired
    private StockHistoryRepository historyRepository;
    
    @Autowired
    private InventoryItemRepository itemRepository;
    
    @Transactional
    public void recordStockAdjustment(
        String itemId, 
        int newQuantity, 
        String reason,
        String userId
    ) {
        InventoryItem item = itemRepository
            .findById(itemId)
            .orElseThrow();
        
        int quantityBefore = item.getQuantity();
        
        // Update item
        item.setQuantity(newQuantity);
        itemRepository.save(item);
        
        // Record history (immutable)
        StockHistory event = StockHistory.builder()
            .id(UUID.randomUUID().toString())
            .itemId(itemId)
            .quantityBefore(quantityBefore)
            .quantityAfter(newQuantity)
            .reason(reason)
            .createdBy(userId)
            .createdAt(LocalDateTime.now())
            .build();
        
        historyRepository.save(event);
    }
    
    @Transactional(readOnly = true)
    public List<StockHistoryDTO> getItemAuditTrail(String itemId) {
        return historyRepository.findByItemId(itemId)
            .stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public StockAnalyticsDTO analyzeItemTrends(String itemId, LocalDate month) {
        LocalDateTime startDate = month.atStartOfDay();
        LocalDateTime endDate = month.plusMonths(1).atStartOfDay().minusNanos(1);
        
        List<StockHistory> events = historyRepository
            .findByItemIdAndDateRange(itemId, startDate, endDate);
        
        double avgStock = events.stream()
            .mapToInt(StockHistory::getQuantityAfter)
            .average()
            .orElse(0.0);
        
        int totalMovements = events.size();
        
        return new StockAnalyticsDTO(
            itemId,
            avgStock,
            totalMovements,
            month
        );
    }
}
```

---

## Testing

```java
@DataJpaTest
class StockHistoryRepositoryTest {
    
    @Autowired
    private StockHistoryRepository repository;
    
    @Test
    void testAppendOnlyPattern() {
        String itemId = "ITEM-001";
        
        // Record initial stock
        repository.save(createEvent(itemId, 0, 100, "INITIAL"));
        repository.save(createEvent(itemId, 100, 80, "SALE"));
        repository.save(createEvent(itemId, 80, 120, "RESTOCK"));
        
        List<StockHistory> history = repository.findByItemId(itemId);
        
        assertEquals(3, history.size());
        assertEquals(120, history.get(0).getQuantityAfter());
    }
    
    @Test
    void testDateRangeQuery() {
        LocalDateTime start = LocalDateTime.of(2024, 1, 1, 0, 0);
        LocalDateTime end = LocalDateTime.of(2024, 1, 31, 23, 59);
        
        repository.save(createEventAt("ITEM-001", 100, 80, start.plusHours(1)));
        repository.save(createEventAt("ITEM-001", 80, 120, start.plusHours(2)));
        
        List<StockHistory> events = repository
            .findByItemIdAndDateRange("ITEM-001", start, end);
        
        assertEquals(2, events.size());
    }
    
    @Test
    void testStreamLargeDataset() {
        for (int i = 0; i < 1000; i++) {
            repository.save(createEvent("ITEM-" + i, 0, 100, "INITIAL"));
        }
        
        long count = repository.findByEventDateAfter(
            LocalDateTime.now().minusDays(1)
        ).count();
        
        assertEquals(1000, count);
    }
    
    private StockHistory createEvent(String itemId, int before, int after, String reason) {
        return createEventAt(itemId, before, after, LocalDateTime.now());
    }
    
    private StockHistory createEventAt(
        String itemId, 
        int before, 
        int after, 
        LocalDateTime date
    ) {
        return StockHistory.builder()
            .id(UUID.randomUUID().toString())
            .itemId(itemId)
            .quantityBefore(before)
            .quantityAfter(after)
            .reason(reason)
            .eventDate(date)
            .createdBy("test")
            .build();
    }
}
```

---

## Performance Considerations

- **Append-only Design:** No UPDATE operations, only INSERT - faster, simpler indices
- **Date Range Queries:** Index on `itemId` + `eventDate` for range scans
- **Stream Processing:** Use streams for large historical queries
- **Pagination:** Not typically needed (sorted by date DESC naturally)

---

## Related Documentation

- [Data Models - StockHistory Entity](../model/stock-history.html)
- [Stock Metrics Repository](./stock-metrics-repository.html)
- [Stock Trend Analytics Repository](./stock-trend-analytics-repository.html)
- [Stock Detail Query Repository](./stock-detail-query-repository.html)
- [Repository Layer Index](./index.html)

---

[⬅️ Back to Repository Index](./index.html)
