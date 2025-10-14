# Analytics Service Architecture

## Overview

The **AnalyticsServiceImpl** provides comprehensive business intelligence and reporting capabilities for the inventory management system. It aggregates data from inventory items and stock history to deliver insights on financial performance, stock movements, and operational efficiency.

## Core Responsibilities

### 1. Financial Analytics
- **Stock Valuation**: Calculate total inventory value using current prices
- **WAC Calculations**: Weighted Average Cost for accurate COGS reporting
- **Financial Summaries**: Revenue, costs, and profitability metrics

### 2. Stock Movement Analytics
- **Activity Analysis**: Most/least active items by transaction volume
- **Trend Detection**: Identify stock movement patterns over time
- **Performance Metrics**: Velocity, turnover, and utilization rates

### 3. Operational Insights
- **Low Stock Alerts**: Items approaching minimum thresholds
- **Inventory Health**: Dead stock, fast movers, slow movers
- **Supplier Performance**: Analytics by supplier relationships

## Architecture Patterns

### Service Layer Design
```java
@Service
@Transactional(readOnly = true)  // All operations are read-only
public class AnalyticsServiceImpl implements AnalyticsService {
    // Repository dependencies for data access
    // Complex aggregation query methods
    // Business logic for metric calculations
}
```

**Key Characteristics**:
- **Read-Only Operations**: No mutations, only data aggregation
- **Repository Aggregation**: Leverages database-level calculations
- **DTO Response Pattern**: Clean API contracts with calculated fields

### Data Access Strategy
```java
// Repository aggregation queries
@Query("SELECT new FinancialSummaryDTO(...) FROM InventoryItem i ...")
List<FinancialSummaryDTO> getFinancialSummary();

// Complex WAC calculation
@Query("SELECT AVG(sh.priceAtChange) FROM StockHistory sh ...")
BigDecimal calculateWAC(String itemId);
```

**Benefits**:
- **Database Efficiency**: Calculations performed at DB level
- **Reduced Memory Usage**: Aggregated results vs full data transfer
- **Performance Optimization**: Native SQL for complex analytics

## Key Methods Deep Dive

### 1. getTotalStockValue()
**Purpose**: Calculate total inventory valuation across all items.

**Implementation**:
```java
public BigDecimal getTotalStockValue() {
    return repository.findAll().stream()
        .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
        .reduce(BigDecimal.ZERO, BigDecimal::add);
}
```

**Business Logic**:
- Uses **current price × quantity** for each item
- Aggregates across entire inventory
- Returns real-time valuation for financial reporting

**Performance Notes**:
- Streams over all inventory items
- In-memory calculation for flexibility
- Consider repository aggregation for large datasets

### 2. getFinancialSummaryWAC()
**Purpose**: Calculate Weighted Average Cost for accurate financial reporting.

**WAC Algorithm** (Critical Business Logic):
```java
private BigDecimal calculateWAC(String itemId) {
    List<StockHistory> purchases = stockHistoryRepository.findPurchaseHistory(itemId);
    
    if (purchases.isEmpty()) return BigDecimal.ZERO;
    
    BigDecimal totalCost = BigDecimal.ZERO;
    int totalQuantity = 0;
    
    // WAC = (Σ(quantity × price)) / Σ(quantity)
    for (StockHistory purchase : purchases) {
        if (purchase.getQuantityChange() > 0) {  // Only stock-in events
            BigDecimal cost = purchase.getPriceAtChange()
                .multiply(BigDecimal.valueOf(purchase.getQuantityChange()));
            totalCost = totalCost.add(cost);
            totalQuantity += purchase.getQuantityChange();
        }
    }
    
    return totalQuantity > 0 
        ? totalCost.divide(BigDecimal.valueOf(totalQuantity), 4, RoundingMode.HALF_UP)
        : BigDecimal.ZERO;
}
```

**WAC Calculation Logic**:
1. **Retrieve Purchase History**: Only stock-in events (positive quantity changes)
2. **Calculate Weighted Total**: Sum of (quantity × price) for each purchase
3. **Calculate Weighted Average**: Total cost ÷ total quantity
4. **Precision Handling**: 4 decimal places with HALF_UP rounding

**Financial Accuracy**:
- **FIFO vs WAC**: WAC provides smoother cost basis for COGS
- **Price Change Handling**: Only actual purchases affect WAC (not price updates)
- **Compliance**: Supports GAAP/IFRS inventory valuation standards

### 3. getMostActiveItems()
**Purpose**: Identify items with highest transaction volume.

**Implementation**:
```java
public List<ItemActivityDTO> getMostActiveItems(int limit) {
    return stockHistoryRepository.findMostActiveItems(PageRequest.of(0, limit))
        .stream()
        .map(this::mapToActivityDTO)
        .collect(toList());
}
```

**Activity Metrics**:
- **Transaction Count**: Total number of stock movements
- **Volume Moved**: Sum of absolute quantity changes
- **Frequency**: Transactions per time period
- **Velocity**: Inventory turnover rate

**Business Value**:
- **Demand Planning**: High-activity items need more attention
- **Supplier Relationships**: Focus on key product categories
- **Inventory Optimization**: Balance stock levels with demand

### 4. getLowStockItems()
**Purpose**: Alert management to items approaching minimum thresholds.

**Implementation**:
```java
public List<InventoryItemDTO> getLowStockItems() {
    return repository.findLowStockItems()
        .stream()
        .map(InventoryItemMapper::toDTO)
        .collect(toList());
}
```

**Low Stock Detection**:
```sql
-- Repository query
SELECT i FROM InventoryItem i 
WHERE i.quantity <= i.minimumQuantity 
ORDER BY (i.quantity / i.minimumQuantity), i.name
```

**Alert Logic**:
- **Threshold Comparison**: quantity ≤ minimumQuantity
- **Priority Ordering**: Most critical items first (lowest ratio)
- **Operational Trigger**: Automatic reorder recommendations

## Data Flow Architecture

### Read-Only Analytics Pipeline
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Controllers   │───▶│  AnalyticsService │───▶│   Repositories  │
│                 │    │                  │    │                 │
│ • REST endpoints│    │ • Business logic │    │ • Aggregation   │
│ • DTO responses │    │ • Calculations   │    │ • Complex joins │
│ • HTTP caching  │    │ • Validations    │    │ • Native queries│
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Data Sources                                │
│  ┌─────────────┐           ┌──────────────────┐                │
│  │ Inventory   │◀─────────▶│  Stock History   │                │
│  │ Items       │           │                  │                │
│  │             │           │ • Transaction log│                │
│  │ • Current   │           │ • Price history  │                │
│  │   state     │           │ • User tracking  │                │
│  │ • Prices    │           │ • Audit trail    │                │
│  │ • Quantities│           │ • WAC data       │                │
│  └─────────────┘           └──────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

### Analytics Request Flow
1. **Controller**: Receives analytics request (GET /analytics/*)
2. **Service**: Executes business logic and calculations
3. **Repository**: Performs database aggregations
4. **Data Sources**: Query inventory + stock history tables
5. **Response**: Return calculated DTOs with metrics

## Performance Considerations

### Database Optimization
```java
// Efficient aggregation at database level
@Query("SELECT new StockValueDTO(SUM(i.price * i.quantity)) FROM InventoryItem i")
StockValueDTO getTotalValue();

// Indexed queries for performance
@Query("SELECT i FROM InventoryItem i WHERE i.quantity <= i.minimumQuantity")
List<InventoryItem> findLowStockItems();
```

**Optimization Strategies**:
- **Aggregation Queries**: Push calculations to database
- **Indexed Fields**: quantity, minimumQuantity, price fields indexed
- **Pagination**: Large result sets use PageRequest
- **Caching**: Consider @Cacheable for expensive calculations

### Memory Management
```java
// Stream processing for large datasets
public List<ItemAnalyticsDTO> processLargeDataset() {
    return repository.findAll().stream()
        .filter(this::meetsCriteria)
        .map(this::calculateMetrics)
        .limit(1000)  // Prevent memory overflow
        .collect(toList());
}
```

**Memory Best Practices**:
- **Stream Processing**: Avoid loading entire datasets
- **Result Limiting**: Use pagination and limits
- **DTO Conversion**: Convert to DTOs early to release entity references
- **Garbage Collection**: Prefer immutable DTOs

## Error Handling Patterns

### Defensive Calculations
```java
public BigDecimal calculateSafeRatio(BigDecimal numerator, BigDecimal denominator) {
    if (denominator == null || denominator.equals(BigDecimal.ZERO)) {
        return BigDecimal.ZERO;  // Avoid division by zero
    }
    return numerator.divide(denominator, 4, RoundingMode.HALF_UP);
}
```

### Null Safety
```java
public FinancialSummaryDTO getFinancialSummary() {
    List<InventoryItem> items = repository.findAll();
    
    if (items.isEmpty()) {
        return FinancialSummaryDTO.empty();  // Safe empty response
    }
    
    // Process non-empty dataset
    return calculateFinancialMetrics(items);
}
```

## Integration Points

### Stock History Integration
**Critical Dependency**: Analytics relies heavily on stock history for:
- **WAC Calculations**: Historical purchase prices
- **Activity Metrics**: Transaction volume and frequency
- **Trend Analysis**: Movement patterns over time

```java
// Example: Activity calculation using stock history
public int calculateTransactionCount(String itemId) {
    return stockHistoryRepository.countByInventoryItemId(itemId);
}
```

### Inventory Item Integration
**Current State Data**: Analytics uses current inventory state for:
- **Stock Valuation**: Current price × quantity
- **Low Stock Alerts**: Current quantity vs minimum threshold
- **Item Information**: Names, suppliers, categories

## Testing Strategy

### Unit Testing Focus
```java
@Test
public void testWACCalculation() {
    // Given: Mock stock history with known purchases
    List<StockHistory> mockHistory = Arrays.asList(
        createPurchase(100, new BigDecimal("10.00")),  // 100 units @ $10
        createPurchase(50, new BigDecimal("12.00"))    // 50 units @ $12
    );
    
    // When: Calculate WAC
    BigDecimal result = analyticsService.calculateWAC(mockHistory);
    
    // Then: WAC = (100*10 + 50*12) / (100+50) = 1600/150 = $10.67
    assertEquals(new BigDecimal("10.6667"), result);
}
```

### Integration Testing
```java
@Test
@Transactional
public void testFinancialSummaryIntegration() {
    // Given: Test data in database
    createTestInventoryItems();
    createTestStockHistory();
    
    // When: Get financial summary
    FinancialSummaryDTO summary = analyticsService.getFinancialSummary();
    
    // Then: Verify calculated values
    assertNotNull(summary.getTotalValue());
    assertTrue(summary.getTotalValue().compareTo(BigDecimal.ZERO) > 0);
}
```

## Future Enhancements

### Advanced Analytics
1. **Predictive Analytics**: Machine learning for demand forecasting
2. **Seasonal Analysis**: Identify seasonal patterns in stock movements
3. **Supplier Analytics**: Performance metrics by supplier
4. **Cost Optimization**: Identify cost-saving opportunities

### Performance Improvements
1. **Caching Layer**: Redis for frequently accessed analytics
2. **Materialized Views**: Pre-calculated metrics for complex queries
3. **Async Processing**: Background calculation of expensive analytics
4. **Data Warehousing**: Separate OLAP database for complex analytics

### Real-Time Analytics
1. **Event Streaming**: Real-time updates using Kafka/RabbitMQ
2. **WebSocket Dashboards**: Live analytics dashboards
3. **Alert System**: Real-time notifications for critical thresholds
4. **Mobile Analytics**: Mobile-optimized analytics APIs

## Compliance and Audit

### Financial Reporting Standards
- **WAC Compliance**: Supports GAAP/IFRS inventory valuation
- **Audit Trail**: All calculations traceable to source transactions
- **Precision**: 4-decimal precision for financial accuracy
- **Documentation**: Complete calculation methodology documented

### Data Integrity
- **Read-Only Operations**: No data mutations in analytics
- **Consistent Calculations**: Deterministic algorithms
- **Error Handling**: Graceful handling of edge cases
- **Logging**: Comprehensive logging for debugging

## Related Documentation

- [Service Layer Overview](../services/README.md)
- [Stock History Service](stock-history-service.md)
- [Inventory Item Service](inventory-item-service.md)
- [Repository Patterns](../patterns/repository-patterns.md)
- [Performance Optimization](../patterns/performance-patterns.md)
