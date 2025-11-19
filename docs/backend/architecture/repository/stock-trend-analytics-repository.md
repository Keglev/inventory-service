[⬅️ Back to Repository Index](./index.html)

# StockTrendAnalyticsRepository

## Definition

```java
public interface StockTrendAnalyticsRepository {

    @Query(value = """
        SELECT 
            DATETRUNC('month', sh.event_date) as month,
            sh.item_id,
            SUM(CASE WHEN sh.quantity_after > sh.quantity_before THEN sh.quantity_after - sh.quantity_before ELSE 0 END) as inbound,
            SUM(CASE WHEN sh.quantity_after < sh.quantity_before THEN sh.quantity_before - sh.quantity_after ELSE 0 END) as outbound
        FROM stock_history sh
        WHERE sh.item_id = :itemId
            AND sh.event_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        GROUP BY DATETRUNC('month', sh.event_date), sh.item_id
        ORDER BY month DESC
        """, nativeQuery = true)
    List<Object[]> getMonthlyStockMovement(@Param("itemId") String itemId);

    @Query(value = """
        SELECT 
            sh.event_date::date as event_date,
            i.price,
            sh.quantity_after,
            (sh.quantity_after * i.price) as daily_valuation
        FROM stock_history sh
        JOIN inventory_item i ON sh.item_id = i.id
        WHERE sh.event_date::date = :date
        ORDER BY sh.event_date DESC
        """, nativeQuery = true)
    List<Object[]> getDailyStockValuation(@Param("date") LocalDate date);

    @Query(value = """
        SELECT 
            sh.event_date::date as price_date,
            i.price,
            sh.quantity_after,
            LAG(i.price) OVER (PARTITION BY sh.item_id ORDER BY sh.event_date) as previous_price
        FROM stock_history sh
        JOIN inventory_item i ON sh.item_id = i.id
        WHERE sh.item_id = :itemId
            AND sh.event_date BETWEEN :startDate AND :endDate
        ORDER BY sh.event_date DESC
        """, nativeQuery = true)
    List<Object[]> getItemPriceTrend(
        @Param("itemId") String itemId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate);
}
```

## Purpose

Custom analytics repository providing **time-series trends** for:
- Monthly inventory movements (inbound/outbound)
- Daily inventory valuation analysis
- Item price history and trends
- Supply chain velocity analysis
- Financial inventory metrics

---

## Query Methods

### getMonthlyStockMovement(itemId)

**Purpose:** Analyze monthly inbound/outbound stock movements

**Type:** Native SQL with DATETRUNC and aggregations

**Returns:** List<Object[]> with [month, item_id, inbound, outbound]

**Usage:**
```java
// Get 12-month trend for item
List<Object[]> movement = trendRepository
    .getMonthlyStockMovement(itemId);

System.out.println("Monthly Stock Movements:");
for (Object[] row : movement) {
    LocalDateTime month = (LocalDateTime) row[0];
    String itemId = (String) row[1];
    Integer inbound = (Integer) row[2];
    Integer outbound = (Integer) row[3];
    int netFlow = inbound - outbound;
    
    System.out.printf(
        "%s: IN=%d, OUT=%d, NET=%+d%n",
        month,
        inbound,
        outbound,
        netFlow
    );
}
```

**Use Cases:**
- Seasonal demand analysis
- Inventory turnover rate
- Supply chain velocity trends
- Year-over-year comparisons
- Reorder planning

**Example Output:**
```
2024-12: IN=200, OUT=180, NET=+20
2024-11: IN=150, OUT=160, NET=-10
2024-10: IN=300, OUT=250, NET=+50
```

---

### getDailyStockValuation(date)

**Purpose:** Calculate daily inventory value by item

**Type:** Native SQL with JOIN

**Returns:** List<Object[]> with [event_date, price, quantity_after, daily_valuation]

**Usage:**
```java
// Get daily inventory valuation
LocalDate today = LocalDate.now();
List<Object[]> valuations = trendRepository
    .getDailyStockValuation(today);

BigDecimal totalValuation = BigDecimal.ZERO;

System.out.println("Daily Inventory Valuation:");
for (Object[] row : valuations) {
    LocalDate date = (LocalDate) row[0];
    BigDecimal price = (BigDecimal) row[1];
    Integer quantity = (Integer) row[2];
    BigDecimal value = (BigDecimal) row[3];
    
    totalValuation = totalValuation.add(value);
    
    System.out.printf(
        "%s: %d units @ $%.2f = $%.2f%n",
        date,
        quantity,
        price,
        value
    );
}

System.out.println("Total Inventory Value: $" + totalValuation);
```

**Use Cases:**
- Daily inventory valuation reports
- Balance sheet inventory accounting
- Financial reporting
- Working capital analysis

---

### getItemPriceTrend(itemId, startDate, endDate)

**Purpose:** Track price changes over time for item

**Type:** Native SQL with window function (LAG)

**Returns:** List<Object[]> with [price_date, price, quantity_after, previous_price]

**Usage:**
```java
// Analyze price trend for item over last 90 days
LocalDateTime endDate = LocalDateTime.now();
LocalDateTime startDate = endDate.minusDays(90);

List<Object[]> priceTrend = trendRepository
    .getItemPriceTrend(itemId, startDate, endDate);

System.out.println("Price Trend Analysis:");
for (Object[] row : priceTrend) {
    LocalDate date = (LocalDate) row[0];
    BigDecimal currentPrice = (BigDecimal) row[1];
    Integer quantity = (Integer) row[2];
    BigDecimal previousPrice = (BigDecimal) row[3];
    
    String priceDirection = "→";
    if (previousPrice != null) {
        if (currentPrice.compareTo(previousPrice) > 0) {
            priceDirection = "↑ (+$" + currentPrice.subtract(previousPrice) + ")";
        } else if (currentPrice.compareTo(previousPrice) < 0) {
            priceDirection = "↓ (-$" + previousPrice.subtract(currentPrice) + ")";
        }
    }
    
    System.out.printf(
        "%s: $%.2f %s (qty: %d)%n",
        date,
        currentPrice,
        priceDirection,
        quantity
    );
}
```

**Window Function Rationale:**
- LAG() gets previous price without separate query
- Enables price change detection
- Efficient single-pass analysis

**Use Cases:**
- Price elasticity analysis
- Procurement cost trends
- Supplier price negotiations
- Cost of goods analysis

---

## Mixin Pattern Integration

StockTrendAnalyticsRepository is implemented as a **mixin** by:
- `StockHistoryRepository` (main data source)

```java
public interface StockHistoryRepository extends JpaRepository<StockHistory, String>,
                                               StockMetricsRepository,
                                               StockTrendAnalyticsRepository,  // ← Mixin
                                               StockDetailQueryRepository {
    // Additional query methods...
}
```

This allows StockHistoryRepository to expose trend analysis methods:
```java
// Can call trend methods through StockHistoryRepository
List<Object[]> movement = stockHistoryRepository
    .getMonthlyStockMovement(itemId);

List<Object[]> valuation = stockHistoryRepository
    .getDailyStockValuation(LocalDate.now());

List<Object[]> priceTrend = stockHistoryRepository
    .getItemPriceTrend(itemId, startDate, endDate);
```

---

## Service Integration Pattern

```java
@Service
public class InventoryTrendAnalysisService {
    
    @Autowired
    private StockHistoryRepository stockHistoryRepository;
    
    /**
     * Analyze item velocity and seasonal patterns
     */
    @Transactional(readOnly = true)
    public ItemTrendAnalysisDTO analyzeItemTrends(String itemId) {
        List<Object[]> movements = stockHistoryRepository
            .getMonthlyStockMovement(itemId);
        
        // Calculate statistics
        double avgInbound = movements.stream()
            .mapToInt(row -> (Integer) row[2])
            .average()
            .orElse(0.0);
        
        double avgOutbound = movements.stream()
            .mapToInt(row -> (Integer) row[3])
            .average()
            .orElse(0.0);
        
        double turnoverRate = (avgOutbound / 30) * 12 * 100; // Annual turnover %
        
        return ItemTrendAnalysisDTO.builder()
            .itemId(itemId)
            .avgMonthlyInbound(avgInbound)
            .avgMonthlyOutbound(avgOutbound)
            .annualTurnoverRate(turnoverRate)
            .trend(determineTrend(movements))
            .build();
    }
    
    /**
     * Get daily inventory valuation for financial reporting
     */
    @Transactional(readOnly = true)
    public InventoryValuationReportDTO getDailyValuationReport(LocalDate date) {
        List<Object[]> valuations = stockHistoryRepository
            .getDailyStockValuation(date);
        
        BigDecimal totalValue = BigDecimal.ZERO;
        int totalUnits = 0;
        
        for (Object[] row : valuations) {
            BigDecimal value = (BigDecimal) row[3];
            Integer quantity = (Integer) row[2];
            
            totalValue = totalValue.add(value);
            totalUnits += quantity;
        }
        
        return InventoryValuationReportDTO.builder()
            .reportDate(date)
            .totalInventoryValue(totalValue)
            .totalUnits(totalUnits)
            .averageUnitValue(
                totalUnits > 0 ? 
                    totalValue.divide(
                        BigDecimal.valueOf(totalUnits),
                        2,
                        RoundingMode.HALF_UP
                    ) : 
                    BigDecimal.ZERO
            )
            .itemCount(valuations.size())
            .build();
    }
    
    /**
     * Analyze price trends for procurement decisions
     */
    @Transactional(readOnly = true)
    public PriceTrendAnalysisDTO analyzePriceTrends(
        String itemId,
        int monthsBack
    ) {
        LocalDateTime endDate = LocalDateTime.now();
        LocalDateTime startDate = endDate.minusMonths(monthsBack);
        
        List<Object[]> priceTrend = stockHistoryRepository
            .getItemPriceTrend(itemId, startDate, endDate);
        
        BigDecimal minPrice = BigDecimal.ZERO;
        BigDecimal maxPrice = BigDecimal.ZERO;
        BigDecimal avgPrice = BigDecimal.ZERO;
        
        if (!priceTrend.isEmpty()) {
            List<BigDecimal> prices = priceTrend.stream()
                .map(row -> (BigDecimal) row[1])
                .collect(Collectors.toList());
            
            minPrice = prices.stream().min(Comparator.naturalOrder()).orElse(BigDecimal.ZERO);
            maxPrice = prices.stream().max(Comparator.naturalOrder()).orElse(BigDecimal.ZERO);
            
            avgPrice = prices.stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(prices.size()), 2, RoundingMode.HALF_UP);
        }
        
        String trend = "STABLE";
        if (!priceTrend.isEmpty()) {
            BigDecimal firstPrice = (BigDecimal) priceTrend.get(0)[1];
            BigDecimal lastPrice = (BigDecimal) priceTrend.get(priceTrend.size() - 1)[1];
            
            if (firstPrice.compareTo(lastPrice) > 0) {
                trend = "DECLINING";
            } else if (firstPrice.compareTo(lastPrice) < 0) {
                trend = "INCREASING";
            }
        }
        
        return PriceTrendAnalysisDTO.builder()
            .itemId(itemId)
            .periodMonths(monthsBack)
            .minPrice(minPrice)
            .maxPrice(maxPrice)
            .avgPrice(avgPrice)
            .priceRange(maxPrice.subtract(minPrice))
            .trend(trend)
            .dataPoints(priceTrend.size())
            .build();
    }
    
    private String determineTrend(List<Object[]> movements) {
        if (movements.isEmpty()) return "UNKNOWN";
        
        int inbound = (Integer) movements.get(0)[2];
        int outbound = (Integer) movements.get(0)[3];
        
        if (inbound > outbound * 1.2) return "ACCUMULATING";
        if (outbound > inbound * 1.2) return "DEPLETING";
        return "STABLE";
    }
}
```

---

## Dashboard Integration

Typical usage in analytics dashboards:

```java
@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {
    
    @Autowired
    private InventoryTrendAnalysisService trendService;
    
    @GetMapping("/item/{id}/trends")
    public ResponseEntity<ItemTrendAnalysisDTO> getItemTrends(
        @PathVariable String id
    ) {
        ItemTrendAnalysisDTO trends = trendService.analyzeItemTrends(id);
        return ResponseEntity.ok(trends);
    }
    
    @GetMapping("/valuation/daily")
    public ResponseEntity<InventoryValuationReportDTO> getDailyValuation(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        InventoryValuationReportDTO report = trendService
            .getDailyValuationReport(date);
        return ResponseEntity.ok(report);
    }
    
    @GetMapping("/price-trends/{itemId}")
    public ResponseEntity<PriceTrendAnalysisDTO> getPriceTrends(
        @PathVariable String itemId,
        @RequestParam(defaultValue = "12") int months
    ) {
        PriceTrendAnalysisDTO trends = trendService
            .analyzePriceTrends(itemId, months);
        return ResponseEntity.ok(trends);
    }
}
```

---

## Testing

```java
@DataJpaTest
class StockTrendAnalyticsRepositoryTest {
    
    @Autowired
    private StockHistoryRepository repository;
    
    @Autowired
    private InventoryItemRepository itemRepository;
    
    @Test
    void testMonthlyStockMovement() {
        String itemId = "ITEM-001";
        LocalDateTime jan1 = LocalDateTime.of(2024, 1, 1, 0, 0);
        
        // January: 100 in, 50 out
        repository.save(createEventAt(itemId, 0, 100, jan1.plusHours(1)));
        repository.save(createEventAt(itemId, 100, 50, jan1.plusHours(2)));
        
        // February: 200 in, 100 out
        LocalDateTime feb1 = LocalDateTime.of(2024, 2, 1, 0, 0);
        repository.save(createEventAt(itemId, 50, 250, feb1.plusHours(1)));
        repository.save(createEventAt(itemId, 250, 150, feb1.plusHours(2)));
        
        // Test
        List<Object[]> movements = repository
            .getMonthlyStockMovement(itemId);
        
        assertTrue(movements.size() >= 2);
    }
    
    @Test
    void testDailyStockValuation() {
        // Create item with price
        InventoryItem item = itemRepository.save(
            InventoryItem.builder()
                .id("ITEM-001")
                .name("Widget")
                .price(new BigDecimal("10.00"))
                .quantity(100)
                .supplierId("SUP-001")
                .minimumQuantity(10)
                .createdBy("test")
                .createdAt(LocalDateTime.now())
                .build()
        );
        
        LocalDateTime today = LocalDateTime.now().withHour(0).withMinute(0);
        repository.save(StockHistory.builder()
            .id("SH-001")
            .itemId(item.getId())
            .quantityBefore(0)
            .quantityAfter(100)
            .reason("INITIAL")
            .eventDate(today)
            .createdBy("test")
            .build());
        
        // Test
        List<Object[]> valuations = repository
            .getDailyStockValuation(today.toLocalDate());
        
        assertEquals(1, valuations.size());
        assertEquals(new BigDecimal("10.00"), valuations.get(0)[1]);
        assertEquals(100, valuations.get(0)[2]);
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
            .reason("ADJUSTMENT")
            .eventDate(date)
            .createdBy("test")
            .build();
    }
}
```

---

## Performance Notes

- **DATETRUNC Aggregation:** Efficient monthly grouping
- **Window Function (LAG):** Single-pass price comparison
- **Date Filtering:** Pre-filters to last 12 months for movement query
- **JOIN with Inventory Items:** Adds price column efficiently
- **Suitable for Monthly Reports:** Not real-time (designed for reporting period)

---

## Related Documentation

- [Stock History Repository](./stock-history-repository.html) (implements mixin)
- [Stock Metrics Repository](./stock-metrics-repository.html)
- [Stock Detail Query Repository](./stock-detail-query-repository.html)
- [Repository Layer Index](./index.html)

---

[⬅️ Back to Repository Index](./index.html)
