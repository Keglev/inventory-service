# Stock History Service Architecture

## Overview

The **StockHistoryService** is the cornerstone of the inventory audit trail system, providing comprehensive logging and tracking of all inventory movements. It implements an event sourcing pattern where every stock change is recorded as an immutable event, enabling complete auditability, compliance reporting, and analytics support.

## Core Responsibilities

### 1. Audit Trail Logging
- **Complete Movement Tracking**: Every quantity change recorded with full context
- **User Attribution**: Who made each change with authenticated user context
- **Business Reason Tracking**: Why each change occurred with enumerated reasons
- **Price Snapshots**: Historical pricing at time of change for financial accuracy

### 2. Event Sourcing Implementation
- **Immutable Events**: Stock history entries never modified after creation
- **Complete Reconstruction**: Ability to rebuild current state from history
- **Time-based Queries**: Historical state at any point in time
- **Compliance Support**: Regulatory audit trail requirements

### 3. Financial Integration
- **WAC Support**: Price snapshots enable Weighted Average Cost calculations
- **COGS Tracking**: Cost of Goods Sold data for accounting systems
- **Inventory Valuation**: Historical cost basis for financial reporting
- **Tax Compliance**: Detailed records for tax audit requirements

### 4. Analytics Foundation
- **Movement Patterns**: Data source for inventory analytics
- **Performance Metrics**: Transaction velocity and frequency analysis
- **Trend Analysis**: Historical patterns for demand forecasting
- **Operational Insights**: Identify bottlenecks and optimization opportunities

## Architecture Patterns

### Event Sourcing Design
```java
@Service
@Transactional
public class StockHistoryService {
    private final StockHistoryRepository repository;
    
    // Immutable event logging
    public void logStockChange(String itemId, int quantityDelta, 
                              StockChangeReason reason, String user, BigDecimal price) {
        StockHistory event = StockHistory.builder()
            .inventoryItemId(itemId)
            .quantityChange(quantityDelta)
            .reason(reason)
            .createdBy(user)
            .priceAtChange(price)
            .timestamp(LocalDateTime.now())
            .build();
        
        repository.save(event);  // Append-only operation
    }
}
```

**Event Sourcing Characteristics**:
- **Append-Only**: Never update or delete history entries
- **Immutable Events**: Each entry represents a point-in-time fact
- **Complete History**: Reconstruct any historical state
- **Audit Compliance**: Regulatory requirements for financial auditing

### Domain Event Pattern
```java
public class StockHistory {
    @Id
    private String id;                    // Unique event identifier
    
    private String inventoryItemId;       // What item changed
    private int quantityChange;           // How much changed (+ or -)
    private StockChangeReason reason;     // Why it changed
    private String createdBy;             // Who made the change
    private BigDecimal priceAtChange;     // Price snapshot
    private LocalDateTime createdAt;      // When it happened
    
    // Immutable after creation - no setters for core fields
}
```

**Domain Event Properties**:
- **What**: inventoryItemId identifies the subject
- **When**: createdAt provides precise timing
- **Who**: createdBy for user accountability
- **Why**: reason provides business context
- **How Much**: quantityChange for magnitude
- **Financial Context**: priceAtChange for cost calculations

## Key Methods Deep Dive

### 1. logStockChange() - Primary Event Logger
**Purpose**: Record a stock movement event with complete context.

**Method Signature**:
```java
@Transactional
public void logStockChange(String inventoryItemId, 
                          int quantityChange,
                          StockChangeReason reason, 
                          String createdBy,
                          BigDecimal priceAtChange) {
    // Implementation details
}
```

**Implementation Flow**:
```java
public void logStockChange(String inventoryItemId, int quantityChange,
                          StockChangeReason reason, String createdBy,
                          BigDecimal priceAtChange) {
    // 1. Validate parameters
    validateLogStockChangeParameters(inventoryItemId, reason, createdBy, priceAtChange);
    
    // 2. Create immutable event
    StockHistory event = StockHistory.builder()
        .id(UUID.randomUUID().toString())
        .inventoryItemId(inventoryItemId)
        .quantityChange(quantityChange)
        .reason(reason)
        .createdBy(createdBy)
        .priceAtChange(priceAtChange)
        .createdAt(LocalDateTime.now())
        .build();
    
    // 3. Persist event (append-only)
    repository.save(event);
    
    // 4. Optional: Publish domain event for other systems
    applicationEventPublisher.publishEvent(new StockChangedEvent(event));
}
```

**Parameter Validation**:
- **inventoryItemId**: Must not be null/blank
- **reason**: Must be valid enum value
- **createdBy**: Must not be null/blank (default to "system")
- **priceAtChange**: Must be positive for financial accuracy

**Business Rules**:
- **Immutable Creation**: Once created, events never change
- **Mandatory Context**: All fields required for complete audit trail
- **Precision Timing**: Server-side timestamp for consistency
- **Unique IDs**: UUID generation for global uniqueness

### 2. getStockHistoryByItem() - Event Retrieval
**Purpose**: Retrieve complete history for a specific inventory item.

**Implementation**:
```java
@Transactional(readOnly = true)
public List<StockHistoryDTO> getStockHistoryByItem(String inventoryItemId) {
    return repository.findByInventoryItemIdOrderByCreatedAtDesc(inventoryItemId)
        .stream()
        .map(StockHistoryMapper::toDTO)
        .collect(toList());
}
```

**Query Characteristics**:
- **Ordered Results**: Most recent events first
- **Complete History**: All events for the item
- **DTO Conversion**: Clean API contract
- **Read-Only Transaction**: Optimization hint

**Usage Patterns**:
```java
// Get complete item history
List<StockHistoryDTO> history = stockHistoryService.getStockHistoryByItem("item-123");

// Analyze movement patterns
int totalTransactions = history.size();
BigDecimal totalVolume = history.stream()
    .map(h -> Math.abs(h.getQuantityChange()))
    .mapToInt(Integer::intValue)
    .sum();
```

### 3. getStockHistoryByDateRange() - Time-based Queries
**Purpose**: Retrieve events within a specific time window for reporting.

**Implementation**:
```java
@Transactional(readOnly = true)
public List<StockHistoryDTO> getStockHistoryByDateRange(LocalDateTime startDate, 
                                                       LocalDateTime endDate) {
    return repository.findByCreatedAtBetweenOrderByCreatedAtDesc(startDate, endDate)
        .stream()
        .map(StockHistoryMapper::toDTO)
        .collect(toList());
}
```

**Time-based Analysis**:
- **Reporting Periods**: Monthly, quarterly, yearly reports
- **Compliance Windows**: Audit period analysis
- **Performance Metrics**: Activity levels over time
- **Trend Analysis**: Movement patterns by time period

### 4. getHistoryByReason() - Reason-based Analysis
**Purpose**: Analyze movements by business reason for operational insights.

**Implementation**:
```java
@Transactional(readOnly = true)
public List<StockHistoryDTO> getHistoryByReason(StockChangeReason reason) {
    return repository.findByReasonOrderByCreatedAtDesc(reason)
        .stream()
        .map(StockHistoryMapper::toDTO)
        .collect(toList());
}
```

**Reason Analysis Examples**:
```java
// Analyze sales patterns
List<StockHistoryDTO> sales = service.getHistoryByReason(StockChangeReason.SALE);

// Track damage/loss patterns
List<StockHistoryDTO> losses = service.getHistoryByReason(StockChangeReason.DAMAGED);

// Monitor purchase patterns
List<StockHistoryDTO> purchases = service.getHistoryByReason(StockChangeReason.PURCHASE);
```

## Stock Change Reasons

### Enumerated Business Reasons
```java
public enum StockChangeReason {
    // Stock increases (positive quantity changes)
    INITIAL_STOCK,           // First entry when item created
    PURCHASE,                // Buying from supplier
    RETURNED_BY_CUSTOMER,    // Customer returned items
    FOUND,                   // Inventory count correction (found items)
    
    // Stock decreases (negative quantity changes)
    SALE,                    // Selling to customer
    RETURNED_TO_SUPPLIER,    // Returning to supplier
    DAMAGED,                 // Write-off damaged inventory
    EXPIRED,                 // Write-off expired items
    LOST,                    // Shrinkage, theft, misplacement
    SCRAPPED,                // Disposed as scrap
    DESTROYED,               // Intentionally destroyed
    
    // Special reasons
    MANUAL_UPDATE,           // Generic manual adjustment
    PRICE_CHANGE            // Price update (quantity delta = 0)
}
```

### Reason Categories and Business Impact

#### **Stock-In Reasons** (Positive Delta)
- **INITIAL_STOCK**: Baseline establishment for new items
- **PURCHASE**: Revenue generation, supplier relationship
- **RETURNED_BY_CUSTOMER**: Customer service, quality issues
- **FOUND**: Inventory accuracy, process improvement

#### **Stock-Out Reasons** (Negative Delta)
- **SALE**: Revenue recognition, COGS calculation
- **RETURNED_TO_SUPPLIER**: Quality issues, overstock management
- **DAMAGED/EXPIRED/LOST**: Shrinkage analysis, process gaps
- **SCRAPPED/DESTROYED**: Regulatory compliance, recalls

#### **Special Operations**
- **MANUAL_UPDATE**: Catch-all for administrative adjustments
- **PRICE_CHANGE**: Financial tracking without stock movement

### Financial Categorization
```java
public class ReasonAnalyzer {
    public static boolean isRevenueImpacting(StockChangeReason reason) {
        return reason == SALE || reason == RETURNED_BY_CUSTOMER;
    }
    
    public static boolean isCostImpacting(StockChangeReason reason) {
        return reason == PURCHASE || reason == RETURNED_TO_SUPPLIER;
    }
    
    public static boolean isShrinkage(StockChangeReason reason) {
        return reason == DAMAGED || reason == EXPIRED || 
               reason == LOST || reason == SCRAPPED || reason == DESTROYED;
    }
}
```

## Event Sourcing Implementation

### Immutable Event Store
```java
@Entity
@Table(name = "stock_history")
public class StockHistory {
    @Id
    private String id;
    
    @Column(nullable = false)
    private String inventoryItemId;
    
    @Column(nullable = false)
    private int quantityChange;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StockChangeReason reason;
    
    @Column(nullable = false)
    private String createdBy;
    
    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal priceAtChange;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    // No setters for immutability
    // Builder pattern for creation
}
```

**Immutability Guarantees**:
- **No Setters**: Fields set only during construction
- **Final Fields**: Where possible, mark fields as final
- **Builder Pattern**: Controlled object creation
- **Database Constraints**: NOT NULL constraints for data integrity

### State Reconstruction
```java
public class InventoryStateReconstructor {
    
    public InventoryState reconstructStateAt(String itemId, LocalDateTime pointInTime) {
        List<StockHistory> events = repository
            .findByInventoryItemIdAndCreatedAtBeforeOrderByCreatedAt(itemId, pointInTime);
        
        int currentQuantity = 0;
        BigDecimal lastPrice = BigDecimal.ZERO;
        
        for (StockHistory event : events) {
            currentQuantity += event.getQuantityChange();
            if (event.getQuantityChange() != 0) {  // Skip price-only changes
                lastPrice = event.getPriceAtChange();
            }
        }
        
        return new InventoryState(itemId, currentQuantity, lastPrice, pointInTime);
    }
    
    public List<InventorySnapshot> generateHistoricalSnapshots(String itemId) {
        List<StockHistory> events = repository
            .findByInventoryItemIdOrderByCreatedAt(itemId);
        
        List<InventorySnapshot> snapshots = new ArrayList<>();
        int runningQuantity = 0;
        
        for (StockHistory event : events) {
            runningQuantity += event.getQuantityChange();
            snapshots.add(new InventorySnapshot(
                event.getCreatedAt(),
                runningQuantity,
                event.getPriceAtChange(),
                event.getReason()
            ));
        }
        
        return snapshots;
    }
}
```

**State Reconstruction Use Cases**:
- **Historical Reporting**: "What was the quantity on March 15th?"
- **Audit Compliance**: "Show the complete history of this item"
- **Debugging**: "How did we get to this current state?"
- **Analytics**: "What was the inventory value trend over time?"

## Integration Patterns

### Inventory Service Integration
```java
// Called from InventoryItemService after every mutation
public class InventoryItemServiceImpl {
    
    @Transactional
    public InventoryItemDTO save(InventoryItemDTO dto) {
        // ... business logic ...
        InventoryItem saved = repository.save(entity);
        
        // Audit trail integration
        stockHistoryService.logStockChange(
            saved.getId(),
            saved.getQuantity(),              // Initial quantity
            StockChangeReason.INITIAL_STOCK,  // Creation reason
            currentUsername(),                // Who created
            saved.getPrice()                  // Initial price
        );
        
        return InventoryItemMapper.toDTO(saved);
    }
}
```

### Analytics Service Integration
```java
// Used by AnalyticsService for WAC calculations and reporting
public class AnalyticsServiceImpl {
    
    public BigDecimal calculateWAC(String itemId) {
        List<StockHistory> purchases = stockHistoryService
            .getPurchaseHistory(itemId);  // Only positive quantity changes
        
        return WeightedAverageCostCalculator.calculate(purchases);
    }
    
    public List<ItemActivityDTO> getMostActiveItems() {
        // Use stock history to calculate transaction frequency
        return stockHistoryService.getTransactionSummaryByItem();
    }
}
```

### External System Integration
```java
@Component
public class StockHistoryEventPublisher {
    
    @EventListener
    @Async
    public void handleStockChange(StockChangedEvent event) {
        // Publish to external systems
        if (event.getReason() == StockChangeReason.SALE) {
            orderManagementSystem.notifySale(event);
        }
        
        if (event.getQuantityChange() < 0) {
            warehouseManagementSystem.notifyStockDecrease(event);
        }
        
        // Real-time analytics
        analyticsEventStream.publish(event);
    }
}
```

## Performance Considerations

### Database Optimization
```sql
-- Primary indexes for common queries
CREATE INDEX idx_stock_history_item_id ON stock_history(inventory_item_id);
CREATE INDEX idx_stock_history_created_at ON stock_history(created_at);
CREATE INDEX idx_stock_history_reason ON stock_history(reason);

-- Composite indexes for complex queries
CREATE INDEX idx_stock_history_item_date ON stock_history(inventory_item_id, created_at);
CREATE INDEX idx_stock_history_reason_date ON stock_history(reason, created_at);
```

### Pagination for Large Datasets
```java
@Transactional(readOnly = true)
public Page<StockHistoryDTO> getStockHistoryPaginated(String itemId, Pageable pageable) {
    Page<StockHistory> page = repository
        .findByInventoryItemIdOrderByCreatedAtDesc(itemId, pageable);
    
    return page.map(StockHistoryMapper::toDTO);
}
```

### Archival Strategy
```java
@Component
public class StockHistoryArchivalService {
    
    @Scheduled(cron = "0 0 2 1 * ?")  // Monthly at 2 AM
    public void archiveOldHistory() {
        LocalDateTime archiveDate = LocalDateTime.now().minusYears(7);
        
        // Move old records to archive table
        List<StockHistory> oldRecords = repository
            .findByCreatedAtBefore(archiveDate);
        
        archiveRepository.saveAll(oldRecords);
        repository.deleteAll(oldRecords);
        
        log.info("Archived {} stock history records older than {}", 
                oldRecords.size(), archiveDate);
    }
}
```

## Security and Compliance

### Audit Trail Integrity
```java
@Component
public class AuditTrailValidator {
    
    public boolean validateIntegrity(String itemId) {
        List<StockHistory> history = repository
            .findByInventoryItemIdOrderByCreatedAt(itemId);
        
        // Check for gaps in timeline
        for (int i = 1; i < history.size(); i++) {
            LocalDateTime prev = history.get(i-1).getCreatedAt();
            LocalDateTime curr = history.get(i).getCreatedAt();
            
            if (curr.isBefore(prev)) {
                log.warn("Timeline inconsistency detected for item {}", itemId);
                return false;
            }
        }
        
        // Validate quantity consistency
        int calculatedQuantity = history.stream()
            .mapToInt(StockHistory::getQuantityChange)
            .sum();
        
        InventoryItem currentItem = inventoryRepository.findById(itemId)
            .orElseThrow();
        
        if (calculatedQuantity != currentItem.getQuantity()) {
            log.error("Quantity mismatch for item {}: calculated={}, actual={}", 
                     itemId, calculatedQuantity, currentItem.getQuantity());
            return false;
        }
        
        return true;
    }
}
```

### Data Retention Policies
```java
@Configuration
public class DataRetentionConfig {
    
    // Financial records: 7 years (regulatory requirement)
    public static final Duration FINANCIAL_RETENTION = Duration.ofDays(7 * 365);
    
    // Operational records: 3 years
    public static final Duration OPERATIONAL_RETENTION = Duration.ofDays(3 * 365);
    
    // Hot data (frequent access): 1 year
    public static final Duration HOT_DATA_RETENTION = Duration.ofDays(365);
}
```

## Error Handling and Recovery

### Transaction Failure Recovery
```java
@Component
public class StockHistoryRecoveryService {
    
    @Retryable(value = {DataAccessException.class}, maxAttempts = 3)
    public void recoverFailedEvent(String itemId, int quantityDelta, 
                                  StockChangeReason reason, String user, 
                                  BigDecimal price, LocalDateTime timestamp) {
        try {
            StockHistory recoveryEvent = StockHistory.builder()
                .id(UUID.randomUUID().toString())
                .inventoryItemId(itemId)
                .quantityChange(quantityDelta)
                .reason(reason)
                .createdBy(user + "_RECOVERY")
                .priceAtChange(price)
                .createdAt(timestamp)
                .build();
            
            repository.save(recoveryEvent);
            log.info("Successfully recovered stock history event for item {}", itemId);
            
        } catch (Exception e) {
            log.error("Failed to recover stock history event for item {}: {}", 
                     itemId, e.getMessage());
            throw e;
        }
    }
}
```

### Data Consistency Checks
```java
@Component
public class StockHistoryConsistencyChecker {
    
    @Scheduled(cron = "0 0 1 * * ?")  // Daily at 1 AM
    public void performConsistencyCheck() {
        List<String> allItemIds = inventoryRepository.findAllIds();
        
        for (String itemId : allItemIds) {
            if (!auditTrailValidator.validateIntegrity(itemId)) {
                alertingService.sendAlert(
                    "Stock history inconsistency detected for item: " + itemId
                );
            }
        }
    }
}
```

## Testing Strategies

### Unit Testing
```java
@ExtendWith(MockitoExtension.class)
class StockHistoryServiceTest {
    
    @Mock
    private StockHistoryRepository repository;
    
    @InjectMocks
    private StockHistoryService service;
    
    @Test
    void logStockChange_ShouldCreateImmutableEvent() {
        // Given
        String itemId = "item-123";
        int quantityDelta = 10;
        StockChangeReason reason = StockChangeReason.PURCHASE;
        String user = "testuser";
        BigDecimal price = new BigDecimal("25.99");
        
        // When
        service.logStockChange(itemId, quantityDelta, reason, user, price);
        
        // Then
        ArgumentCaptor<StockHistory> captor = ArgumentCaptor.forClass(StockHistory.class);
        verify(repository).save(captor.capture());
        
        StockHistory saved = captor.getValue();
        assertThat(saved.getInventoryItemId()).isEqualTo(itemId);
        assertThat(saved.getQuantityChange()).isEqualTo(quantityDelta);
        assertThat(saved.getReason()).isEqualTo(reason);
        assertThat(saved.getCreatedBy()).isEqualTo(user);
        assertThat(saved.getPriceAtChange()).isEqualTo(price);
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getId()).isNotNull();
    }
}
```

### Integration Testing
```java
@SpringBootTest
@Transactional
class StockHistoryServiceIntegrationTest {
    
    @Autowired
    private StockHistoryService service;
    
    @Autowired
    private StockHistoryRepository repository;
    
    @Test
    void completeWorkflow_ShouldMaintainAuditTrail() {
        String itemId = "integration-test-item";
        
        // Create initial stock
        service.logStockChange(itemId, 100, StockChangeReason.INITIAL_STOCK, 
                              "system", new BigDecimal("10.00"));
        
        // Add purchase
        service.logStockChange(itemId, 50, StockChangeReason.PURCHASE, 
                              "buyer", new BigDecimal("10.50"));
        
        // Record sale
        service.logStockChange(itemId, -20, StockChangeReason.SALE, 
                              "seller", new BigDecimal("10.50"));
        
        // Verify complete history
        List<StockHistoryDTO> history = service.getStockHistoryByItem(itemId);
        
        assertThat(history).hasSize(3);
        assertThat(history.get(0).getReason()).isEqualTo(StockChangeReason.SALE);
        assertThat(history.get(1).getReason()).isEqualTo(StockChangeReason.PURCHASE);
        assertThat(history.get(2).getReason()).isEqualTo(StockChangeReason.INITIAL_STOCK);
        
        // Verify quantity consistency
        int totalQuantity = history.stream()
            .mapToInt(StockHistoryDTO::getQuantityChange)
            .sum();
        assertThat(totalQuantity).isEqualTo(130);  // 100 + 50 - 20
    }
}
```

## Future Enhancements

### Advanced Event Sourcing
1. **Event Versioning**: Handle schema evolution over time
2. **Snapshots**: Periodic state snapshots for performance
3. **Event Replay**: Rebuild projections from events
4. **Saga Pattern**: Coordinate multi-service transactions

### Real-time Capabilities
1. **Event Streaming**: Kafka/RabbitMQ integration
2. **WebSocket Updates**: Real-time dashboard updates
3. **Change Data Capture**: Database-level event publishing
4. **Event Sourcing Framework**: Axon Framework integration

### Analytics Enhancement
1. **Time-series Database**: InfluxDB for time-based analytics
2. **Machine Learning**: Predictive analytics on historical patterns
3. **Data Lake Integration**: Export to data lake for big data analytics
4. **Real-time Aggregations**: Pre-calculated metrics for dashboards

### Compliance Features
1. **Digital Signatures**: Cryptographic event integrity
2. **Blockchain Integration**: Immutable audit trail on blockchain
3. **Regulatory Reporting**: Automated compliance report generation
4. **Data Privacy**: GDPR compliance for personal data in events

## Related Documentation

- [Service Layer Overview](../services/README.md)
- [Inventory Item Service](inventory-item-service.md)
- [Analytics Service](analytics-service.md)
- [Event Sourcing Patterns](../patterns/event-sourcing.md)
- [Audit Trail Patterns](../patterns/audit-trail.md)
- [Performance Patterns](../patterns/performance-patterns.md)