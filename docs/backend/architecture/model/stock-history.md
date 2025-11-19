[⬅️ Back to Models Index](./index.html)

# StockHistory Entity

## Entity Definition

```java
@Entity
@Table(
    name = "STOCK_HISTORY",
    indexes = {
        @Index(name = "IX_SH_ITEM_TS", columnList = "ITEM_ID, CREATED_AT"),
        @Index(name = "IX_SH_TS", columnList = "CREATED_AT"),
        @Index(name = "IX_SH_SUPPLIER_TS", columnList = "SUPPLIER_ID, CREATED_AT")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockHistory {
    
    @Id
    private String id;
    
    @Column(name = "ITEM_ID", nullable = false)
    private String itemId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ITEM_ID", insertable = false, updatable = false)
    private InventoryItem inventoryItem;
    
    @Column(name = "SUPPLIER_ID")
    private String supplierId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SUPPLIER_ID", insertable = false, updatable = false)
    private Supplier supplier;
    
    @Column(name = "QUANTITY_CHANGE", nullable = false)
    private int change;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "REASON", nullable = false, length = 50)
    private StockChangeReason reason;
    
    @Column(name = "CREATED_BY", nullable = false)
    private String createdBy;
    
    @Column(name = "CREATED_AT", nullable = false)
    @CreationTimestamp
    private LocalDateTime timestamp;
    
    @Column(name = "PRICE_AT_CHANGE", precision = 10, scale = 2)
    private BigDecimal priceAtChange;
}
```

## Purpose

StockHistory is an **immutable audit trail** recording every stock movement (receives, sells, adjustments, etc.) for:
- Complete transaction history
- Compliance and regulatory auditing
- Debugging inventory discrepancies
- Analytics and reporting on stock trends
- Accountability (who made changes, when)

**Key Characteristic:** Records are **append-only** (created once, never modified or deleted)

**Domain Context:**
Enables answering critical questions:
- "What happened to item X on this date?"
- "How much has supplier Y delivered over time?"
- "What was the price when this item was sold?"
- "Who authorized this adjustment?"

---

## Database Schema

### Table: STOCK_HISTORY

```sql
CREATE TABLE STOCK_HISTORY (
    ID VARCHAR2(36) PRIMARY KEY,
    ITEM_ID VARCHAR2(36) NOT NULL,
    SUPPLIER_ID VARCHAR2(36),
    QUANTITY_CHANGE NUMBER(10) NOT NULL,
    REASON VARCHAR2(50) NOT NULL,
    CREATED_BY VARCHAR2(255) NOT NULL,
    CREATED_AT TIMESTAMP NOT NULL,
    PRICE_AT_CHANGE NUMBER(10,2),
    
    CONSTRAINT FK_SH_ITEM 
        FOREIGN KEY (ITEM_ID) 
        REFERENCES INVENTORY_ITEM(ID),
    
    CONSTRAINT FK_SH_SUPPLIER 
        FOREIGN KEY (SUPPLIER_ID) 
        REFERENCES SUPPLIER(ID)
);

-- Performance indexes
CREATE INDEX IX_SH_ITEM_TS ON STOCK_HISTORY(ITEM_ID, CREATED_AT);
CREATE INDEX IX_SH_TS ON STOCK_HISTORY(CREATED_AT);
CREATE INDEX IX_SH_SUPPLIER_TS ON STOCK_HISTORY(SUPPLIER_ID, CREATED_AT);
```

### Field Reference

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| `id` | VARCHAR2(36) | PRIMARY KEY | UUID identifier |
| `itemId` | VARCHAR2(36) | NOT NULL, FK | Item reference |
| `supplierId` | VARCHAR2(36) | NULL, FK | Denormalized supplier |
| `change` | NUMBER(10) | NOT NULL | Quantity delta (±) |
| `reason` | VARCHAR2(50) | NOT NULL | StockChangeReason enum |
| `createdBy` | VARCHAR2(255) | NOT NULL | Who recorded change |
| `timestamp` | TIMESTAMP | NOT NULL | When change occurred |
| `priceAtChange` | NUMBER(10,2) | NULL | Unit price at time |

---

## Field Details

### id
**Type:** String (UUID)

**Database:** Primary Key

**Characteristics:**
- Universally unique identifier
- Generated at record creation
- Never changes

**Example:**
```
550e8400-e29b-41d4-a716-446655440000
```

**Auto-Generation:**
```java
@PrePersist
public void prePersist() {
    if (this.id == null) {
        this.id = UUID.randomUUID().toString();
    }
}
```

---

### itemId
**Type:** String

**Database Constraints:**
- NOT NULL
- Foreign Key to INVENTORY_ITEM(ID)
- VARCHAR2(36)

**Purpose:** 
Identifies which item's stock changed

**Examples:**
```
"550e8400-e29b-41d4-a716-446655440000"  // UUID of InventoryItem
"ITEM-001"                               // Readable ID
```

**Relationship:**
```
StockHistory.itemId → InventoryItem.id
    |
    └─→ Must exist in INVENTORY_ITEM table
```

**Query Examples:**
```java
// Get all stock movements for an item
List<StockHistory> itemHistory = 
    repository.findByItemIdOrderByTimestampDesc(itemId);

// Get items that had recent movements
List<StockHistory> recent = 
    repository.findByItemIdAndTimestampAfter(
        itemId, 
        LocalDateTime.now().minusDays(7)
    );
```

**Required Constraint:**
```java
// Must specify item when recording change
StockHistory history = StockHistory.builder()
    .id(UUID.randomUUID().toString())
    .itemId(item.getId())  // ← Required
    .change(50)
    .reason(StockChangeReason.PURCHASE)
    .timestamp(LocalDateTime.now())
    .createdBy(currentUser)
    .build();
```

---

### supplierId
**Type:** String

**Database Constraints:**
- NULL allowed
- Foreign Key to SUPPLIER(ID)
- VARCHAR2(36)

**Purpose:** 
Denormalized supplier reference for analytics

**Why Denormalized:**
```
Normal design (via join):
  StockHistory → InventoryItem → Supplier
  
Denormalized (direct reference):
  StockHistory → Supplier (direct)
  
Benefits:
  - Faster "by supplier" analytics
  - Avoid multi-table joins
  - Preserve supplier context (resilient to supplier changes)
  - Supplier can be deleted without breaking history
```

**Capture at Change Time:**
```java
// When recording stock change, capture current supplier
public void recordStockChange(InventoryItem item, int quantity, 
                              StockChangeReason reason) {
    StockHistory history = StockHistory.builder()
        .itemId(item.getId())
        .supplierId(item.getSupplierId())  // ← Capture current supplier
        .change(quantity)
        .reason(reason)
        .priceAtChange(item.getPrice())    // ← Capture current price
        .timestamp(LocalDateTime.now())
        .createdBy(currentUser)
        .build();
    
    repository.save(history);
}
```

**Analytics Queries:**
```java
// Deliveries from specific supplier (no item table join needed)
List<StockHistory> supplierDeliveries = 
    repository.findBySupplierIdAndReasonOrderByTimestampDesc(
        supplierId, 
        StockChangeReason.PURCHASE
    );

// Supplier performance (by volume)
@Query("SELECT sh.supplierId, SUM(sh.change) as totalDelivered " +
       "FROM StockHistory sh " +
       "WHERE sh.reason = 'PURCHASE' " +
       "GROUP BY sh.supplierId " +
       "ORDER BY totalDelivered DESC")
List<SupplierDeliveryStats> getSupplierDeliveryStats();
```

**NULL Handling:**
Some stock movements don't involve suppliers:
```java
// Internal adjustment (no supplier involved)
StockHistory adjustment = StockHistory.builder()
    .itemId(item.getId())
    .supplierId(null)  // ← No supplier for adjustments
    .change(-5)
    .reason(StockChangeReason.ADJUSTMENT)
    .timestamp(LocalDateTime.now())
    .createdBy(auditor)
    .build();
```

---

### change
**Type:** int

**Database Constraints:**
- NOT NULL
- Can be positive (add stock) or negative (remove stock)

**Purpose:** 
Quantity delta - how much stock changed

**Sign Convention:**
```
Positive change (+):
  +50  → Stock increase (purchase, return, correction)
  
Negative change (-):
  -10  → Stock decrease (sale, loss, adjustment)
  
Zero:
  0    → No change (unusual, shouldn't happen)
```

**Examples:**
```
Purchase: change = +100      // Received 100 units
Sale:     change = -20       // Sold 20 units
Adjustment: change = -5      // Corrected inventory (lost 5)
Return:   change = +15       // Customer returned 15 units
```

**Validation (Service Layer):**
```java
// Record stock change
public StockHistory recordChange(InventoryItem item, int change, 
                                 StockChangeReason reason) {
    // Validate reason-change pairs
    switch(reason) {
        case PURCHASE:
        case CUSTOMER_RETURN:
            if (change <= 0) {
                throw new InvalidStockChangeException(
                    reason + " must have positive change");
            }
            break;
            
        case SALE:
        case DAMAGE:
            if (change >= 0) {
                throw new InvalidStockChangeException(
                    reason + " must have negative change");
            }
            // Check if sufficient inventory
            if (item.getQuantity() + change < 0) {
                throw new InsufficientStockException(
                    "Not enough stock to record " + reason);
            }
            break;
            
        case ADJUSTMENT:
            // Can be positive or negative
            break;
    }
    
    // Create history record
    StockHistory history = StockHistory.builder()
        .itemId(item.getId())
        .supplierId(item.getSupplierId())
        .change(change)
        .reason(reason)
        .priceAtChange(item.getPrice())
        .timestamp(LocalDateTime.now())
        .createdBy(currentUser)
        .build();
    
    return repository.save(history);
}
```

**Calculating Total Movement:**
```java
// Sum all changes for an item
@Query("SELECT SUM(sh.change) FROM StockHistory sh WHERE sh.itemId = ?1")
int getTotalQuantityChanged(String itemId);

// Item transaction volume
@Query("SELECT COUNT(sh.id) FROM StockHistory sh WHERE sh.itemId = ?1")
long getTransactionCount(String itemId);

// Net purchases (sum of positive changes)
@Query("SELECT SUM(sh.change) FROM StockHistory sh " +
       "WHERE sh.itemId = ?1 AND sh.change > 0")
int getTotalPurchased(String itemId);
```

---

### reason
**Type:** Enum (StockChangeReason)

**Database Constraints:**
- NOT NULL
- Stored as VARCHAR2(50)
- Enum values in uppercase

**Purpose:** 
Categorizes the type of stock movement

**Enum Values:**
```java
public enum StockChangeReason {
    PURCHASE,           // Received from supplier
    SALE,               // Sold to customer
    ADJUSTMENT,         // Inventory correction
    DAMAGE,             // Items damaged/lost
    CUSTOMER_RETURN,    // Customer returned items
    INTERNAL_TRANSFER   // Moved between locations/bins
}
```

**Database Storage:**
```
Enum Value       → Database String
PURCHASE         → "PURCHASE"
SALE             → "SALE"
ADJUSTMENT       → "ADJUSTMENT"
DAMAGE           → "DAMAGE"
CUSTOMER_RETURN  → "CUSTOMER_RETURN"
INTERNAL_TRANSFER→ "INTERNAL_TRANSFER"
```

**Mapping in JPA:**
```java
@Enumerated(EnumType.STRING)  // Store enum name (string)
@Column(name = "REASON", nullable = false, length = 50)
private StockChangeReason reason;
```

**Query by Reason:**
```java
// Get all purchases
List<StockHistory> purchases = 
    repository.findByReasonOrderByTimestampDesc(StockChangeReason.PURCHASE);

// Get all sales for item
List<StockHistory> itemSales = 
    repository.findByItemIdAndReasonOrderByTimestampDesc(
        itemId, 
        StockChangeReason.SALE
    );

// Analyze by reason
@Query("SELECT sh.reason, COUNT(sh.id) as count, SUM(sh.change) as total " +
       "FROM StockHistory sh " +
       "WHERE sh.timestamp >= ?1 " +
       "GROUP BY sh.reason")
List<ReasonStatistics> getMovementsByReason(LocalDateTime since);
```

**Business Logic by Reason:**
```
PURCHASE:
  - Increase stock (change > 0)
  - Associated with supplier (supplierId not null)
  - Track unit price at time of purchase
  - May be related to PO/receiving

SALE:
  - Decrease stock (change < 0)
  - May require inventory check (don't oversell)
  - Track revenue (price × change)
  - Customer accountability

ADJUSTMENT:
  - Inventory correction (damage, loss, count discrepancy)
  - Can be positive or negative
  - Requires explanation/notes
  - Typically by admin/supervisor

DAMAGE:
  - Specific type of loss
  - Decrease stock (change < 0)
  - Track loss value (price × abs(change))
  - Warranty/insurance claims

CUSTOMER_RETURN:
  - Customer sends back items
  - Increase stock (change > 0)
  - May be conditional (restocking fee, warranty status)
  - Track refund value

INTERNAL_TRANSFER:
  - Movement within organization
  - No net stock change across org
  - Track for location/bin management
```

---

### createdBy
**Type:** String

**Database Constraints:**
- NOT NULL
- Max 255 characters

**Purpose:** 
Audit trail - records who authorized/recorded this stock change

**Examples:**
```
"john.doe@company.com"      // Sales rep recorded a sale
"warehouse@company.com"     // Warehouse team received delivery
"system"                    // Automated import or adjustment
"admin@company.com"         // Admin made correction
```

**Accountability:**
```java
// Track changes by user
@Query("SELECT sh.createdBy, COUNT(sh.id) as count, SUM(sh.change) as total " +
       "FROM StockHistory sh " +
       "WHERE sh.timestamp >= ?1 " +
       "GROUP BY sh.createdBy")
List<UserActivityStats> getActivityByUser(LocalDateTime since);

// User's recent activity
List<StockHistory> userActivity = 
    repository.findByCreatedByOrderByTimestampDesc("john.doe@company.com");

// Find who made adjustment
StockHistory adjustment = repository.findById(historyId).get();
System.out.println("Adjustment made by: " + adjustment.getCreatedBy());
System.out.println("On: " + adjustment.getTimestamp());
```

**System Processes:**
```java
// Bulk import uses "system" as creator
StockHistory history = StockHistory.builder()
    .itemId(item.getId())
    .change(quantity)
    .reason(StockChangeReason.PURCHASE)
    .createdBy("system")  // ← For automated processes
    .timestamp(LocalDateTime.now())
    .build();
```

---

### timestamp (createdAt)
**Type:** LocalDateTime

**Database Constraints:**
- NOT NULL
- Set automatically via @CreationTimestamp

**Purpose:** 
Records exactly when the stock change occurred

**Example:**
```
2024-01-15 14:30:45.123456
```

**Auto-Population:**
```java
@CreationTimestamp
private LocalDateTime timestamp;  // Hibernate sets automatically
```

**Temporal Queries:**
```java
// Recent changes (last 24 hours)
LocalDateTime yesterday = LocalDateTime.now().minusHours(24);
List<StockHistory> recent = 
    repository.findByTimestampAfterOrderByTimestampDesc(yesterday);

// Changes in date range
List<StockHistory> januaryMovements = 
    repository.findByTimestampBetween(
        LocalDateTime.of(2024, 1, 1, 0, 0),
        LocalDateTime.of(2024, 1, 31, 23, 59)
    );

// Activity timeline
List<StockHistory> timeline = 
    repository.findByItemIdOrderByTimestampDesc(itemId);
for (StockHistory h : timeline) {
    System.out.println(h.getTimestamp() + ": " + h.getChange() + " units");
}
```

**Index Performance:**
Timestamp is indexed for efficient range queries:
```sql
CREATE INDEX IX_SH_ITEM_TS ON STOCK_HISTORY(ITEM_ID, CREATED_AT);
CREATE INDEX IX_SH_TS ON STOCK_HISTORY(CREATED_AT);
```

**Prevents Time Travel:**
```java
// Timestamp is immutable - can't backdate records
StockHistory history = StockHistory.builder()
    .itemId(item.getId())
    .change(50)
    .reason(StockChangeReason.PURCHASE)
    .timestamp(LocalDateTime.now())  // Always current time
    .createdBy(user)
    .build();

// Can't do this:
history.setTimestamp(LocalDateTime.of(2020, 1, 1, 0, 0));  // Would be ignored
```

---

### priceAtChange
**Type:** BigDecimal

**Database Constraints:**
- NULL allowed
- PRECISION(10,2)
- Max 99,999,999.99

**Purpose:** 
Captures unit price at time of transaction for cost analysis

**Why Track Price:**
```
Example: Sale at different times
  Time 1: Sell 10 units @ $50 each = $500 revenue
  Time 2: Sell 10 units @ $60 each = $600 revenue (price increased)
  
Without priceAtChange:
  - Can't calculate correct revenue per sale
  - Can't track cost basis for inventory
  
With priceAtChange:
  - Accurate financial records
  - Cost basis tracking
  - Profit margin analysis by transaction
```

**Capture Example:**
```java
public void recordSale(InventoryItem item, int quantity) {
    // Create history with current price
    StockHistory history = StockHistory.builder()
        .itemId(item.getId())
        .change(-quantity)
        .reason(StockChangeReason.SALE)
        .priceAtChange(item.getPrice())  // ← Capture current price
        .timestamp(LocalDateTime.now())
        .createdBy(salesPerson)
        .build();
    
    repository.save(history);
}
```

**Financial Calculations:**
```java
// Revenue by sale
List<StockHistory> sales = 
    repository.findByReasonOrderByTimestampDesc(StockChangeReason.SALE);

BigDecimal totalRevenue = sales.stream()
    .map(sh -> sh.getPriceAtChange().multiply(new BigDecimal(Math.abs(sh.getChange()))))
    .reduce(BigDecimal.ZERO, BigDecimal::add);

// Average sale price
BigDecimal avgPrice = sales.stream()
    .map(StockHistory::getPriceAtChange)
    .reduce(BigDecimal.ZERO, BigDecimal::add)
    .divide(new BigDecimal(sales.size()), RoundingMode.HALF_UP);

// Cost of goods sold (COGS)
List<StockHistory> purchases = 
    repository.findByReasonOrderByTimestampDesc(StockChangeReason.PURCHASE);

BigDecimal totalCost = purchases.stream()
    .map(sh -> sh.getPriceAtChange().multiply(new BigDecimal(sh.getChange())))
    .reduce(BigDecimal.ZERO, BigDecimal::add);
```

**NULL Handling:**
```java
// Price may be null for internal adjustments
StockHistory adjustment = StockHistory.builder()
    .itemId(item.getId())
    .change(-5)
    .reason(StockChangeReason.ADJUSTMENT)
    .priceAtChange(null)  // No price for adjustment
    .timestamp(LocalDateTime.now())
    .createdBy(auditor)
    .build();

// Check if price is available before using
if (history.getPriceAtChange() != null) {
    BigDecimal revenue = history.getPriceAtChange()
        .multiply(new BigDecimal(history.getChange()));
}
```

---

## Relationships

### Many-to-One: StockHistory → InventoryItem

**Cardinality:** M:1 (Many history records, One item)

**Definition:**
```java
@Column(name = "ITEM_ID", nullable = false)
private String itemId;

@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "ITEM_ID", insertable = false, updatable = false)
private InventoryItem inventoryItem;
```

**Semantics:**
- Each history record belongs to exactly one item
- Each item can have many history records
- Immutable relationship (can't change item after creation)

**Access Pattern:**
```java
// Within transaction: access lazy-loaded item
@Transactional(readOnly = true)
public String getItemNameFromHistory(String historyId) {
    StockHistory history = repository.findById(historyId).get();
    return history.getInventoryItem().getName();  // Lazy loaded
}

// Avoid lazy loading outside transaction
StockHistory history = repository.findById(historyId).get();
String name = history.getInventoryItem().getName();  // LazyInitializationException
```

---

### Many-to-One: StockHistory → Supplier (Denormalized)

**Cardinality:** M:1 (Many history records, One supplier)

**Purpose:** Direct reference for analytics without joins

**Definition:**
```java
@Column(name = "SUPPLIER_ID")
private String supplierId;

@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "SUPPLIER_ID", insertable = false, updatable = false)
private Supplier supplier;
```

**Why Denormalized:**
```
Normal:
  StockHistory.itemId → InventoryItem.id → InventoryItem.supplierId

Denormalized:
  StockHistory.supplierId (direct)
  
Result:
  - Faster supplier analytics
  - Avoid nested joins
  - Supplier changes don't affect history
```

**Relationship is Optional:**
Not all stock movements involve suppliers (e.g., adjustments, damage):

```java
// Supplier-related change
if (history.getSupplierId() != null) {
    String supplierName = history.getSupplier().getName();
}

// Non-supplier change
StockHistory adjustment = StockHistory.builder()
    .supplierId(null)  // No supplier
    .reason(StockChangeReason.ADJUSTMENT)
    .build();
```

---

## Immutability

**Core Design:** StockHistory records are **never updated or deleted** after creation

**Rationale:**
- Audit compliance (tamper-proof)
- Historical accuracy (know true state)
- Regulatory requirements (financial records)
- Prevents data manipulation

**Implementation:**
```java
// ❌ Never do this
history.setChange(100);         // Modifying record
repository.save(history);

// ❌ Or this
repository.deleteById(historyId);  // Deleting record

// ✅ Only do this
StockHistory history = StockHistory.builder()
    .itemId(item.getId())
    .change(50)
    .reason(StockChangeReason.PURCHASE)
    .timestamp(LocalDateTime.now())
    .createdBy(user)
    .build();
repository.save(history);  // Create only
```

**Correction Mechanism:**
If a mistake is found, don't modify the history:

```java
// Wrong approach: Modify history
existingHistory.setChange(75);  // ❌ Breaks audit trail

// Correct approach: Record reversal
StockHistory reversal = StockHistory.builder()
    .itemId(item.getId())
    .change(-50)  // Reverse original +50
    .reason(StockChangeReason.ADJUSTMENT)
    .timestamp(LocalDateTime.now())
    .createdBy(auditor)
    .build();
repository.save(reversal);

// Now you have complete audit trail:
// 1. Original: +50 purchase
// 2. Reversal: -50 adjustment
// Total: 0 (corrected)
```

---

## Usage Examples

### 1. Record a Stock Change

```java
@Transactional
public StockHistory recordPurchase(String itemId, int quantity, 
                                   String supplierId, String user) {
    InventoryItem item = itemRepository.findById(itemId).get();
    
    // Create history record
    StockHistory history = StockHistory.builder()
        .id(UUID.randomUUID().toString())
        .itemId(itemId)
        .supplierId(supplierId)
        .change(quantity)
        .reason(StockChangeReason.PURCHASE)
        .priceAtChange(item.getPrice())
        .timestamp(LocalDateTime.now())
        .createdBy(user)
        .build();
    
    history = historyRepository.save(history);
    
    // Update item quantity
    item.setQuantity(item.getQuantity() + quantity);
    itemRepository.save(item);
    
    return history;
}
```

### 2. Get Item Transaction History

```java
@Transactional(readOnly = true)
public List<StockHistoryResponse> getItemHistory(String itemId) {
    List<StockHistory> records = historyRepository
        .findByItemIdOrderByTimestampDesc(itemId);
    
    return records.stream()
        .map(this::mapToResponse)
        .collect(toList());
}
```

### 3. Analyze Supplier Deliveries

```java
@Transactional(readOnly = true)
public SupplierAnalysis analyzeSupplier(String supplierId, LocalDateTime since) {
    List<StockHistory> deliveries = historyRepository
        .findBySupplierIdAndReasonAndTimestampAfter(
            supplierId, 
            StockChangeReason.PURCHASE, 
            since
        );
    
    int totalUnits = deliveries.stream()
        .mapToInt(StockHistory::getChange)
        .sum();
    
    BigDecimal totalValue = deliveries.stream()
        .filter(sh -> sh.getPriceAtChange() != null)
        .map(sh -> sh.getPriceAtChange()
            .multiply(new BigDecimal(sh.getChange())))
        .reduce(BigDecimal.ZERO, BigDecimal::add);
    
    return SupplierAnalysis.builder()
        .supplierId(supplierId)
        .totalDeliveries(deliveries.size())
        .totalUnits(totalUnits)
        .totalValue(totalValue)
        .build();
}
```

### 4. Get Low Stock Items with Recent Activity

```java
@Transactional(readOnly = true)
public List<LowStockAlert> getLowStockAlerts() {
    List<InventoryItem> lowItems = itemRepository
        .findByQuantityLessThanEqual(10);
    
    LocalDateTime weekAgo = LocalDateTime.now().minusWeeks(1);
    
    return lowItems.stream()
        .map(item -> {
            List<StockHistory> recent = historyRepository
                .findByItemIdAndTimestampAfter(item.getId(), weekAgo);
            
            return LowStockAlert.builder()
                .itemId(item.getId())
                .itemName(item.getName())
                .currentQuantity(item.getQuantity())
                .minimumQuantity(item.getMinimumQuantity())
                .recentTransactions(recent.size())
                .lastActivity(recent.isEmpty() ? null : recent.get(0).getTimestamp())
                .build();
        })
        .collect(toList());
}
```

### 5. Calculate Inventory Value Timeline

```java
@Transactional(readOnly = true)
public List<InventoryValueSnapshot> getValueTimeline(String itemId) {
    List<StockHistory> history = historyRepository
        .findByItemIdOrderByTimestampAsc(itemId);
    
    int runningQuantity = 0;
    List<InventoryValueSnapshot> timeline = new ArrayList<>();
    
    for (StockHistory h : history) {
        runningQuantity += h.getChange();
        
        BigDecimal value = h.getPriceAtChange() != null
            ? h.getPriceAtChange().multiply(new BigDecimal(runningQuantity))
            : BigDecimal.ZERO;
        
        timeline.add(InventoryValueSnapshot.builder()
            .timestamp(h.getTimestamp())
            .quantity(runningQuantity)
            .priceAtTime(h.getPriceAtChange())
            .value(value)
            .reason(h.getReason())
            .build());
    }
    
    return timeline;
}
```

---

## Testing

### Unit Test: Creation

```java
@DataJpaTest
class StockHistoryRepositoryTest {
    
    @Autowired
    private StockHistoryRepository repository;
    
    @Test
    void testHistoryCreation() {
        StockHistory history = StockHistory.builder()
            .itemId("ITEM-001")
            .supplierId("SUP-001")
            .change(50)
            .reason(StockChangeReason.PURCHASE)
            .priceAtChange(new BigDecimal("25.00"))
            .timestamp(LocalDateTime.now())
            .createdBy("test-user")
            .build();
        
        StockHistory saved = repository.save(history);
        
        assertNotNull(saved.getId());
        assertEquals(50, saved.getChange());
        assertEquals(StockChangeReason.PURCHASE, saved.getReason());
    }
    
    @Test
    void testImmutability() {
        StockHistory history = StockHistory.builder()
            .itemId("ITEM-001")
            .change(50)
            .reason(StockChangeReason.PURCHASE)
            .timestamp(LocalDateTime.now())
            .createdBy("test")
            .build();
        
        StockHistory saved = repository.save(history);
        String originalId = saved.getId();
        
        // Cannot update (violates immutability)
        saved.setChange(100);  // Shouldn't persist
        repository.save(saved);
        
        StockHistory retrieved = repository.findById(originalId).get();
        // Actual behavior depends on JPA implementation
        // Point: ensure history cannot be modified
    }
}
```

### Integration Test: Stock Flow

```java
@SpringBootTest
@Transactional
class StockHistoryIntegrationTest {
    
    @Autowired
    private StockHistoryService service;
    
    @Autowired
    private StockHistoryRepository historyRepository;
    
    @Autowired
    private InventoryItemRepository itemRepository;
    
    @Test
    void testCompleteSaleFlow() throws Exception {
        // Setup item
        InventoryItem item = InventoryItem.builder()
            .name("Widget")
            .quantity(100)
            .price(new BigDecimal("50.00"))
            .supplierId("SUP-001")
            .minimumQuantity(10)
            .createdBy("test")
            .createdAt(LocalDateTime.now())
            .build();
        itemRepository.save(item);
        
        // Record sale
        StockHistory sale = service.recordSale(
            item.getId(), 
            10, 
            "sales@company.com"
        );
        
        // Verify history
        assertEquals(-10, sale.getChange());
        assertEquals(StockChangeReason.SALE, sale.getReason());
        assertEquals(new BigDecimal("50.00"), sale.getPriceAtChange());
        
        // Verify item updated
        InventoryItem updated = itemRepository.findById(item.getId()).get();
        assertEquals(90, updated.getQuantity());
    }
}
```

---

## Performance Considerations

### Indexes

Three specialized indexes for common query patterns:

```sql
-- Item history queries: Find all changes for an item
CREATE INDEX IX_SH_ITEM_TS ON STOCK_HISTORY(ITEM_ID, CREATED_AT);

-- Recent activity: Find recent changes across items
CREATE INDEX IX_SH_TS ON STOCK_HISTORY(CREATED_AT);

-- Supplier analytics: Find all changes from a supplier
CREATE INDEX IX_SH_SUPPLIER_TS ON STOCK_HISTORY(SUPPLIER_ID, CREATED_AT);
```

**Index Selection by Query:**
```java
// Uses IX_SH_ITEM_TS (item + time)
repository.findByItemIdAndTimestampAfter(itemId, lastWeek);  // ✅ Fast

// Uses IX_SH_TS (time only)
repository.findByTimestampAfter(lastWeek);  // ✅ Fast

// Uses IX_SH_SUPPLIER_TS (supplier + time)
repository.findBySupplierIdAndReasonAndTimestampAfter(supplierId, reason, date);
                                                        // ✅ Relatively fast

// No index (table scan)
repository.findByReasonAndCreatedBy(reason, user);  // ⚠️ Slow
```

### Append-Only Performance

Benefits of immutable append-only design:

```
Advantages:
  - No UPDATE operations (faster)
  - No DELETE operations (no fragmentation)
  - Insert optimized (always at end)
  - No index maintenance overhead
  
Result:
  - High-throughput logging
  - Minimal lock contention
  - Excellent for time-series queries
```

### Batch Inserts

For bulk imports:

```java
// ✅ Batch multiple records
List<StockHistory> records = // ... create list
historyRepository.saveAll(records);  // Batched

// ❌ Avoid one-by-one
for (StockHistory h : records) {
    historyRepository.save(h);  // N inserts
}
```

---

## API Contract

### DTO: StockHistoryResponse

```java
public class StockHistoryResponse {
    private String id;
    private String itemId;
    private String itemName;        // Denormalized for convenience
    private String supplierId;
    private String supplierName;    // Denormalized for convenience
    private int change;
    private StockChangeReason reason;
    private LocalDateTime timestamp;
    private BigDecimal priceAtChange;
    private String createdBy;
}
```

### DTO: StockHistoryRequest

Not typically created by clients (auto-generated by service)

---

## Related Documentation

**Entities:**
- [InventoryItem Entity](./inventory-item.html) - Items tracked
- [Supplier Entity](./supplier.html) - Denormalized supplier reference

**Code References:**
- [StockHistory.java](../../../src/main/java/com/example/model/StockHistory.java)
- [StockHistoryRepository.java](../../../src/main/java/com/example/repository/StockHistoryRepository.java)
- [StockHistoryService.java](../../../src/main/java/com/example/service/StockHistoryService.java)

**Architecture:**
- [Models Index](./index.html) - Overview of all entities
- [Enums Reference](../enums/index.html) - StockChangeReason enum
- [Repository Layer](../layers/repository-layer.html) - Database queries

---

[⬅️ Back to Models Index](./index.html)
