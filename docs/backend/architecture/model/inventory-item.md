[⬅️ Back to Models Index](./index.html)

# InventoryItem Entity

## Entity Definition

```java
@Entity
@Table(name = "INVENTORY_ITEM")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryItem {
    
    @Id
    private String id;
    
    @Column(name = "NAME", nullable = false, unique = true)
    private String name;
    
    @Column(name = "QUANTITY", nullable = false)
    private int quantity;
    
    @Column(name = "PRICE", nullable = false, precision = 10, scale = 2)
    private BigDecimal price;
    
    @Column(name = "SUPPLIER_ID", nullable = false)
    private String supplierId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SUPPLIER_ID", insertable = false, updatable = false)
    private Supplier supplier;
    
    @Column(name = "MINIMUM_QUANTITY")
    private int minimumQuantity;
    
    @Column(name = "CREATED_BY", nullable = false)
    private String createdBy;
    
    @Column(name = "CREATED_AT", nullable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;
}
```

## Purpose

InventoryItem represents a **physical or digital product** tracked in inventory with:
- Current stock quantity
- Unit price (BigDecimal for precision)
- Supplier source (M:1 relationship)
- Low-stock threshold (minimum quantity)
- Complete audit trail

**Domain Context:**
Core entity of the inventory management system. Enables:
- Stock tracking and visibility
- Reorder point management (low stock alerts)
- Cost analysis per item
- Supplier traceability
- Inventory auditing

---

## Database Schema

### Table: INVENTORY_ITEM

```sql
CREATE TABLE INVENTORY_ITEM (
    ID VARCHAR2(36) PRIMARY KEY,
    NAME VARCHAR2(255) NOT NULL UNIQUE,
    QUANTITY NUMBER(10) NOT NULL,
    PRICE NUMBER(10,2) NOT NULL,
    SUPPLIER_ID VARCHAR2(36) NOT NULL,
    MINIMUM_QUANTITY NUMBER(10) DEFAULT 10,
    CREATED_BY VARCHAR2(255) NOT NULL,
    CREATED_AT TIMESTAMP NOT NULL,
    
    CONSTRAINT FK_ITEM_SUPPLIER 
        FOREIGN KEY (SUPPLIER_ID) 
        REFERENCES SUPPLIER(ID)
);

CREATE INDEX IX_ITEM_NAME ON INVENTORY_ITEM(NAME);
CREATE INDEX IX_ITEM_SUPPLIER_ID ON INVENTORY_ITEM(SUPPLIER_ID);
```

### Field Reference

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| `id` | VARCHAR2(36) | PRIMARY KEY | UUID identifier |
| `name` | VARCHAR2(255) | NOT NULL, UNIQUE | Item name/SKU |
| `quantity` | NUMBER(10) | NOT NULL | Current stock count |
| `price` | NUMBER(10,2) | NOT NULL | Unit price (cents precision) |
| `supplierId` | VARCHAR2(36) | NOT NULL, FK | Supplier reference |
| `minimumQuantity` | NUMBER(10) | DEFAULT 10 | Reorder threshold |
| `createdBy` | VARCHAR2(255) | NOT NULL | Audit: who created |
| `createdAt` | TIMESTAMP | NOT NULL | Audit: when created |

---

## Field Details

### id
**Type:** String (UUID)

**Database:** Primary Key

**Characteristics:**
- Universally unique identifier
- 36 characters (including hyphens)
- Never changes after creation

**Example:**
```
550e8400-e29b-41d4-a716-446655440000
```

**Auto-Generation:**
```java
// Pre-persist logic in entity
@PrePersist
public void prePersist() {
    if (this.id == null) {
        this.id = UUID.randomUUID().toString();
    }
}
```

**Usage:**
```java
// Fetch by ID
InventoryItem item = repository.findById("550e8400-e29b-41d4-a716-446655440000");

// Update by ID
item.setQuantity(item.getQuantity() + 50);
repository.save(item);
```

---

### name
**Type:** String

**Database Constraints:**
- NOT NULL
- UNIQUE
- Max 255 characters

**Purpose:** 
Unique identifier for the product in human-readable format (like SKU or product name)

**Examples:**
```
"Widget A - 500ml"
"Premium Spring Bolt M6x25"
"Industrial Grade Lubricant"
"Laptop Stand Adjustable"
```

**Uniqueness Enforcement:**
```java
// Before save, check no duplicate exists
InventoryItem existing = repository.findByName(item.getName());
if (existing != null && !existing.getId().equals(item.getId())) {
    throw new DuplicateItemException("Item name already exists");
}
```

**Search/Query Usage:**
```java
// Fast query (indexed)
InventoryItem item = repository.findByName("Widget A - 500ml");

// Search (potentially slower, no index)
List<InventoryItem> results = repository
    .findByNameContainingIgnoreCase("widget");
```

---

### quantity
**Type:** int

**Database Constraints:**
- NOT NULL
- Typically >= 0 (enforced in service)

**Purpose:** 
Current stock level (number of units in inventory)

**Value Range:**
- 0 to 2,147,483,647 (max int)
- In practice: 0 to millions of units

**Examples:**
```
100    // 100 units in stock
0      // Out of stock
1500   // Large quantity
```

**Business Logic:**
```java
// Query low-stock items
List<InventoryItem> lowStock = 
    repository.findByQuantityLessThan(minimumQuantity);

// Check if in stock
boolean inStock = item.getQuantity() > 0;

// Check if below minimum
boolean reorderNeeded = item.getQuantity() <= item.getMinimumQuantity();
```

**Constraints (Service Layer):**
```java
// Stock cannot be negative
if (newQuantity < 0) {
    throw new InvalidQuantityException("Quantity cannot be negative");
}

// Prevent overstocking alerts
if (newQuantity > item.getMaximumQuantity()) {
    logger.warn("Item {} exceeds maximum quantity", item.getName());
}
```

**Movement Example:**
```
Initial: quantity = 100

Receive: quantity = 100 + 50 = 150    // Supplier delivery
Sell:    quantity = 150 - 10 = 140    // Customer sale
Adjust:  quantity = 140 - 5 = 135     // Inventory correction
```

---

### price
**Type:** BigDecimal

**Database Constraints:**
- NOT NULL
- PRECISION(10,2) → Total 10 digits, 2 after decimal
- Max value: 99,999,999.99

**Purpose:** 
Unit cost/price of the item (cents precision)

**Why BigDecimal (not Double):**
```
❌ Double: 0.1 + 0.2 = 0.30000000000000004 (rounding error)
✅ BigDecimal: new BigDecimal("0.1").add(new BigDecimal("0.2")) 
                = 0.3 (exact)
```

**Examples:**
```java
// Constructor ways
BigDecimal price1 = new BigDecimal("99.99");      // ✅ Correct
BigDecimal price2 = BigDecimal.valueOf(99.99);    // ✅ Safe
BigDecimal price3 = new BigDecimal(99.99);        // ❌ Avoid (float issue)
```

**Business Logic:**
```java
// Calculate inventory value
BigDecimal totalValue = item.getPrice()
    .multiply(new BigDecimal(item.getQuantity()));

// Apply discount
BigDecimal discountedPrice = item.getPrice()
    .multiply(new BigDecimal("0.9"));  // 10% discount

// Track price history in StockHistory
public void recordStockChange(int quantityChange, StockChangeReason reason) {
    StockHistory history = StockHistory.builder()
        .itemId(item.getId())
        .change(quantityChange)
        .priceAtChange(item.getPrice())  // Capture current price
        .reason(reason)
        .timestamp(LocalDateTime.now())
        .build();
}
```

**Database Mapping:**
```
PRICE NUMBER(10,2)
├─ 10 total digits
├─ 2 decimal places
└─ Examples:
   1234567.89 ✅ Valid
   99999999.99 ✅ Max value
   0.01 ✅ Min non-zero
   123.456 ❌ Too many decimals (rounded)
```

---

### supplierId
**Type:** String

**Database Constraints:**
- NOT NULL
- Foreign Key to SUPPLIER(ID)
- VARCHAR2(36)

**Purpose:** 
Reference to the Supplier entity that provides this item

**Relationship:**
```
InventoryItem.supplierId → Supplier.id
    |
    └─→ Must exist in SUPPLIER table
```

**Examples:**
```
"SUP-001"           // Named ID
"acme-corp-uuid"
"550e8400-e29b-41d4-a716-446655440000"  // UUID
```

**Business Logic:**
```java
// Get supplier of item
Supplier supplier = item.getSupplier();  // Lazy loaded
if (supplier != null) {
    System.out.println("Item supplied by: " + supplier.getName());
}

// Find all items from specific supplier
List<InventoryItem> acmeItems = 
    repository.findBySupplierIdOrderByName("SUP-001");

// Items by supplier with filters
List<InventoryItem> expensiveAcmeItems = 
    repository.findBySupplierIdAndPriceGreaterThan(
        "SUP-001", 
        new BigDecimal("100.00")
    );
```

**Lazy Loading (Important):**
```java
// ✅ Within transaction - works
@Transactional
public void processItem(InventoryItem item) {
    String supplierName = item.getSupplier().getName();  // Query executed
}

// ❌ Outside transaction - LazyInitializationException
InventoryItem item = repository.findById("id").get();
String supplierName = item.getSupplier().getName();  // ERROR!

// ✅ Fix: Eagerly fetch or join
@Query("SELECT i FROM InventoryItem i JOIN FETCH i.supplier WHERE i.id = ?1")
Optional<InventoryItem> findByIdWithSupplier(String id);
```

**Foreign Key Constraint:**
```sql
-- Database prevents orphaning items
DELETE FROM SUPPLIER WHERE ID = 'SUP-001';
-- ERROR: Constraint violation (InventoryItem references this supplier)
```

---

### minimumQuantity
**Type:** int

**Database Constraints:**
- NULL allowed
- Typically >= 0
- Default: 10

**Purpose:** 
Low-stock threshold for reordering alerts

**Examples:**
```
5      // Reorder when fewer than 5 units
10     // Default - reorder at 10 units (common practice)
100    // High-demand item - reorder at 100 units
```

**Auto-Default:**
```java
@PrePersist
public void prePersist() {
    if (this.minimumQuantity == 0) {
        this.minimumQuantity = 10;  // Default to 10
    }
}
```

**Business Logic:**
```java
// Check if item needs reordering
public boolean needsReorder() {
    return this.quantity <= this.minimumQuantity;
}

// Get low-stock items
List<InventoryItem> lowStock = repository
    .findByQuantityLessThanEqual(item.getMinimumQuantity());

// Safety stock calculation
int safetyStock = minimumQuantity;
int reorderQuantity = calculateOptimalOrder(safetyStock, 
                                             usageRate, 
                                             leadTime);
```

**Usage Example:**
```
Item: Widget A
Current Quantity: 8
Minimum Quantity: 10
Status: ⚠️ NEEDS REORDER (8 <= 10)

Item: Widget B
Current Quantity: 150
Minimum Quantity: 100
Status: ✅ OK (150 > 100)
```

---

### createdBy
**Type:** String

**Database Constraints:**
- NOT NULL
- Max 255 characters

**Purpose:** 
Audit trail - records who created this inventory item

**Examples:**
```
"admin@company.com"     // OAuth2 user email
"system"                // Bulk import
"import@company.com"    // Batch process
```

**Typical Values:**
- OAuth2 authenticated users: Their email address
- System processes: "system" or "import"
- Service accounts: Service email

**Audit Usage:**
```java
// Find items created by specific user
List<InventoryItem> userItems = 
    repository.findByCreatedByOrderByCreatedAtDesc("john@company.com");

// Admin items vs user items
List<InventoryItem> adminCreated = 
    repository.findByCreatedByContaining("@company.com");

// Track who made changes
System.out.println("Created by: " + item.getCreatedBy());
System.out.println("Created at: " + item.getCreatedAt());
```

---

### createdAt
**Type:** LocalDateTime

**Database Constraints:**
- NOT NULL
- Set automatically by @CreationTimestamp

**Purpose:** 
Audit trail - records when item was created

**Auto-Population:**
```java
@CreationTimestamp
private LocalDateTime createdAt;  // Hibernate sets automatically
```

**Examples:**
```
2024-01-15T14:30:45.123456
2024-03-20T08:00:00.000000
```

**Query Examples:**
```java
// Items created this week
LocalDateTime weekAgo = LocalDateTime.now().minusWeeks(1);
List<InventoryItem> recent = 
    repository.findByCreatedAtAfter(weekAgo);

// Recent additions (last 24 hours)
LocalDateTime yesterday = LocalDateTime.now().minusHours(24);
List<InventoryItem> newItems = 
    repository.findByCreatedAtAfterOrderByCreatedAtDesc(yesterday);

// Created in date range
LocalDateTime start = LocalDateTime.of(2024, 1, 1, 0, 0);
LocalDateTime end = LocalDateTime.of(2024, 3, 31, 23, 59);
List<InventoryItem> q1Items = 
    repository.findByCreatedAtBetween(start, end);
```

---

## Relationships

### Many-to-One: InventoryItem → Supplier

**Cardinality:** M:1 (Many items, One supplier)

**Definition:**
```java
// In InventoryItem
@Column(name = "SUPPLIER_ID", nullable = false)
private String supplierId;  // Foreign key column

@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "SUPPLIER_ID", insertable = false, updatable = false)
private Supplier supplier;  // Related entity
```

**Database:**
```
INVENTORY_ITEM.SUPPLIER_ID → SUPPLIER.ID
```

**Semantics:**
- Many items can come from one supplier
- Each item must have exactly one supplier
- Supplier cannot be changed (immutable design)
- Foreign key enforces referential integrity

**Lazy Loading Pattern:**
```java
// Safe within transaction
@Transactional(readOnly = true)
public InventoryItemResponse getItemWithSupplier(String itemId) {
    InventoryItem item = repository.findById(itemId).get();
    
    // Trigger lazy load within transaction
    Supplier supplier = item.getSupplier();
    String supplierName = supplier.getName();
    
    return mapToResponse(item);  // Supplier data available
}

// Avoid outside transaction
InventoryItem item = repository.findById(itemId).get();
// Supplier is not initialized
String name = item.getSupplier().getName();  // LazyInitializationException!
```

**Join Fetch Pattern:**
```java
// Eager load supplier in single query
@Query("SELECT i FROM InventoryItem i " +
       "JOIN FETCH i.supplier " +
       "WHERE i.id = ?1")
Optional<InventoryItem> findByIdWithSupplier(String id);

// Usage (no lazy loading needed)
InventoryItem item = repository.findByIdWithSupplier(itemId).get();
String supplierName = item.getSupplier().getName();  // Already loaded
```

---

### One-to-Many: InventoryItem → StockHistory

**Cardinality:** 1:N (One item, Many history records)

**Inverse Relationship:**
```java
// In StockHistory
@Column(name = "ITEM_ID", nullable = false)
private String itemId;

@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "ITEM_ID", insertable = false, updatable = false)
private InventoryItem inventoryItem;
```

**Semantics:**
- Each item has zero or more stock history records
- Each history record belongs to exactly one item
- History is immutable (never updated or deleted)
- Used for complete audit trail

**Query Example:**
```java
// Get all stock movements for an item
List<StockHistory> itemHistory = 
    historyRepository.findByItemIdOrderByTimestampDesc(itemId);

// Recent transactions (last 30 days)
LocalDateTime monthAgo = LocalDateTime.now().minusMonths(1);
List<StockHistory> recent = 
    historyRepository.findByItemIdAndTimestampAfter(
        itemId, 
        monthAgo
    );

// Filter by reason
List<StockHistory> purchases = 
    historyRepository.findByItemIdAndReasonOrderByTimestampDesc(
        itemId, 
        StockChangeReason.PURCHASE
    );
```

---

## Lifecycle

### Creation Flow

```
1. Client sends POST /items request
   Body: InventoryItemRequest DTO
   
2. Controller validates request
   - @Valid annotation triggers validation
   - Maps DTO to Entity
   - Sets audit fields (createdBy, createdAt)
   
3. Service layer
   - Checks name uniqueness
   - Validates supplier exists
   - Validates price > 0
   - Calls repository.save()
   
4. Repository saves
   - Generates UUID (if not provided)
   - Persists to INVENTORY_ITEM table
   - Foreign key constraint verified
   
5. Controller returns
   - Entity → InventoryItemResponse DTO
   - HTTP 201 Created
```

### Example: Creating an Item

```java
// Step 1: Client request DTO
InventoryItemRequest request = new InventoryItemRequest();
request.setName("Laptop Stand");
request.setQuantity(50);
request.setPrice(new BigDecimal("29.99"));
request.setSupplierId("SUP-001");
request.setMinimumQuantity(5);

// Step 2: Service validates and creates
if (inventoryItemRepository.findByName(request.getName()) != null) {
    throw new DuplicateItemException("Item name already exists");
}

Supplier supplier = supplierRepository.findById(request.getSupplierId())
    .orElseThrow(() -> new SupplierNotFoundException("Supplier not found"));

InventoryItem item = InventoryItem.builder()
    .id(UUID.randomUUID().toString())  // Generated
    .name(request.getName())
    .quantity(request.getQuantity())
    .price(request.getPrice())
    .supplierId(request.getSupplierId())
    .minimumQuantity(request.getMinimumQuantity())
    .createdBy(currentUserEmail)      // From SecurityContext
    .createdAt(LocalDateTime.now())   // Set automatically via @CreationTimestamp
    .build();

item = repository.save(item);

// Step 3: Return response
return InventoryItemResponse.builder()
    .id(item.getId())
    .name(item.getName())
    .quantity(item.getQuantity())
    .price(item.getPrice())
    .supplierId(item.getSupplierId())
    .minimumQuantity(item.getMinimumQuantity())
    .createdAt(item.getCreatedAt())
    .createdBy(item.getCreatedBy())
    .build();
```

### Immutability

**Design Principle:** InventoryItem fields are immutable after creation.

**Why:**
- Audit compliance (no silent changes)
- History preservation (know original state)
- Data consistency

**Implementation:**
```java
// ❌ Don't update fields directly
item.setName("New Name");  // Violates audit trail
repository.save(item);

// ✅ Create new record instead
InventoryItem updated = InventoryItem.builder()
    .id(UUID.randomUUID().toString())  // New ID
    .name("New Name")
    .quantity(item.getQuantity())
    .price(item.getPrice())
    .supplierId(item.getSupplierId())
    .minimumQuantity(item.getMinimumQuantity())
    .createdBy(currentUserEmail)
    .createdAt(LocalDateTime.now())
    .build();
repository.save(updated);

// Track stock changes separately
StockHistory.builder()
    .itemId(item.getId())
    .change(quantityDelta)
    .reason(StockChangeReason.ADJUSTMENT)
    .timestamp(LocalDateTime.now())
    .build();
```

---

## Usage Examples

### 1. Basic CRUD Operations

```java
// Create
InventoryItem item = InventoryItem.builder()
    .name("Test Item")
    .quantity(100)
    .price(new BigDecimal("49.99"))
    .supplierId("SUP-001")
    .minimumQuantity(10)
    .createdBy("test-user")
    .createdAt(LocalDateTime.now())
    .build();
repository.save(item);

// Read
Optional<InventoryItem> found = repository.findById(item.getId());

// Search
InventoryItem byName = repository.findByName("Test Item");

// List all
List<InventoryItem> all = repository.findAll();

// Delete (not recommended - breaks history)
repository.deleteById(item.getId());
```

### 2. Stock Level Queries

```java
// Items below minimum quantity
List<InventoryItem> lowStock = repository
    .findByQuantityLessThanEqual(10);

// Out of stock items
List<InventoryItem> outOfStock = repository
    .findByQuantityEquals(0);

// Items by quantity range
List<InventoryItem> mediumStock = repository
    .findByQuantityBetween(10, 100);

// High-value items
List<InventoryItem> expensive = repository
    .findByPriceGreaterThan(new BigDecimal("100.00"));
```

### 3. Supplier-Based Queries

```java
// All items from specific supplier
List<InventoryItem> acmeItems = repository
    .findBySupplierIdOrderByName("SUP-001");

// Items from supplier with low stock
List<InventoryItem> acmeLowStock = repository
    .findBySupplierIdAndQuantityLessThanEqual(
        "SUP-001", 
        minimumQuantity
    );

// Count items per supplier
long itemCount = repository.countBySupplierId("SUP-001");
```

### 4. Audit Trail Queries

```java
// Items created by user
List<InventoryItem> userItems = repository
    .findByCreatedByOrderByCreatedAtDesc("user@company.com");

// Recently created items (last week)
LocalDateTime weekAgo = LocalDateTime.now().minusWeeks(1);
List<InventoryItem> recent = repository
    .findByCreatedAtAfter(weekAgo);

// Items created in date range
List<InventoryItem> q1Items = repository
    .findByCreatedAtBetween(
        LocalDateTime.of(2024, 1, 1, 0, 0),
        LocalDateTime.of(2024, 3, 31, 23, 59)
    );
```

### 5. Complex Queries

```java
// Items that need reordering from specific supplier
List<InventoryItem> reorders = repository
    .findBySupplierIdAndQuantityLessThanEqualOrderByQuantityAsc(
        "SUP-001",
        minimumQuantity
    );

// Expensive items with low stock
List<InventoryItem> criticalItems = repository
    .findByQuantityLessThanAndPriceGreaterThan(
        minimumQuantity,
        new BigDecimal("100.00")
    );
```

---

## Testing

### Unit Test: Persistence

```java
@DataJpaTest
class InventoryItemRepositoryTest {
    
    @Autowired
    private InventoryItemRepository repository;
    
    @Test
    void testItemPersistence() {
        InventoryItem item = InventoryItem.builder()
            .name("Test Item")
            .quantity(100)
            .price(new BigDecimal("49.99"))
            .supplierId("SUP-001")
            .minimumQuantity(10)
            .createdBy("test-user")
            .createdAt(LocalDateTime.now())
            .build();
        
        InventoryItem saved = repository.save(item);
        
        assertEquals("Test Item", saved.getName());
        assertEquals(100, saved.getQuantity());
        assertNotNull(saved.getId());
    }
    
    @Test
    void testUniqueNameConstraint() {
        InventoryItem item1 = InventoryItem.builder()
            .name("Unique Item")
            .quantity(50)
            .price(new BigDecimal("25.00"))
            .supplierId("SUP-001")
            .createdBy("test")
            .createdAt(LocalDateTime.now())
            .build();
        
        repository.save(item1);
        
        InventoryItem item2 = InventoryItem.builder()
            .name("Unique Item")  // Duplicate!
            .quantity(30)
            .price(new BigDecimal("25.00"))
            .supplierId("SUP-001")
            .createdBy("test")
            .createdAt(LocalDateTime.now())
            .build();
        
        assertThrows(DataIntegrityViolationException.class, 
            () -> repository.save(item2));
    }
}
```

### Integration Test: Service

```java
@SpringBootTest
@Transactional
class InventoryItemServiceIT {
    
    @Autowired
    private InventoryItemService service;
    
    @Autowired
    private InventoryItemRepository itemRepository;
    
    @Autowired
    private SupplierRepository supplierRepository;
    
    @Test
    void testCreateItem() {
        // Setup
        Supplier supplier = Supplier.builder()
            .name("Test Supplier")
            .createdBy("test")
            .createdAt(LocalDateTime.now())
            .build();
        supplierRepository.save(supplier);
        
        // Create item
        InventoryItemRequest request = new InventoryItemRequest();
        request.setName("Test Item");
        request.setQuantity(100);
        request.setPrice(new BigDecimal("49.99"));
        request.setSupplierId(supplier.getId());
        
        InventoryItemResponse response = service.createItem(request, "test-user");
        
        // Verify
        assertNotNull(response.getId());
        assertEquals("Test Item", response.getName());
        
        // Verify persisted
        InventoryItem persisted = itemRepository.findById(response.getId()).get();
        assertEquals("test-user", persisted.getCreatedBy());
    }
}
```

---

## Performance Considerations

### Indexes

Key indexes for fast queries:

```sql
-- On name for findByName()
CREATE INDEX IX_ITEM_NAME ON INVENTORY_ITEM(NAME);

-- On supplier_id for findBySupplierIdXxx()
CREATE INDEX IX_ITEM_SUPPLIER_ID ON INVENTORY_ITEM(SUPPLIER_ID);

-- On quantity for reorder queries
CREATE INDEX IX_ITEM_QUANTITY ON INVENTORY_ITEM(QUANTITY);
```

### Query Optimization

```java
// ✅ Good: Return only needed fields
@Query("SELECT NEW InventoryItemListResponse(i.id, i.name, i.quantity) " +
       "FROM InventoryItem i")
List<InventoryItemListResponse> findAllForListing();

// ❌ Avoid: Load entire entity when not needed
List<InventoryItem> all = repository.findAll();

// ✅ Good: Fetch with supplier in one query
@Query("SELECT i FROM InventoryItem i " +
       "JOIN FETCH i.supplier " +
       "WHERE i.quantity <= ?1")
List<InventoryItem> findLowStockWithSupplier(int threshold);

// ❌ Avoid: N+1 queries
List<InventoryItem> items = repository.findAll();
for (InventoryItem i : items) {
    System.out.println(i.getSupplier().getName());  // N queries!
}
```

### Batch Operations

```java
// ✅ Bulk save with batch size
List<InventoryItem> items = // ... create list
repository.saveAll(items);  // Batched

// ❌ Inefficient: Save one by one
for (InventoryItem item : items) {
    repository.save(item);  // N queries
}
```

---

## API Contract

### DTO: InventoryItemRequest

```java
public class InventoryItemRequest {
    @NotBlank
    private String name;
    
    @Positive
    private int quantity;
    
    @NotNull
    @DecimalMin("0.01")
    private BigDecimal price;
    
    @NotBlank
    private String supplierId;
    
    @PositiveOrZero
    private int minimumQuantity;
}
```

### DTO: InventoryItemResponse

```java
public class InventoryItemResponse {
    private String id;
    private String name;
    private int quantity;
    private BigDecimal price;
    private String supplierId;
    private int minimumQuantity;
    private LocalDateTime createdAt;
    private String createdBy;
}
```

---

## Related Documentation

**Entities:**
- [Supplier Entity](./supplier.html) - Parent entity (M:1)
- [StockHistory Entity](./stock-history.html) - Child records (1:N)
- [AppUser Entity](./app-user.html) - Audit trail reference

**Code References:**
- [InventoryItem.java](../../../src/main/java/com/example/model/InventoryItem.java)
- [InventoryItemRepository.java](../../../src/main/java/com/example/repository/InventoryItemRepository.java)
- [InventoryItemService.java](../../../src/main/java/com/example/service/InventoryItemService.java)

**Architecture:**
- [Models Index](./index.html) - Overview of all entities
- [StockHistory Documentation](./stock-history.html) - Audit trail entity
- [DTOs & Data Transfer](../dto/index.html) - DTO patterns

---

[⬅️ Back to Models Index](./index.html)
