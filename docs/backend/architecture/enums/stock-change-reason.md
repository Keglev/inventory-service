[⬅️ Back to Enums Hub](./index.html)

# StockChangeReason Enum

## Overview

The `StockChangeReason` enum provides enterprise-level categorization for all inventory movement tracking. It ensures consistent audit compliance, enables financial reconciliation, and supports operational analytics across the system. Every stock change must be classified with one of these standardized reasons.

**Location:** `src/main/java/com/smartsupplypro/inventory/enums/StockChangeReason.java`

**Package:** `com.smartsupplypro.inventory.enums`

**Purpose:** Type-safe stock movement classification for audit trails, financial reporting, and compliance

---

## Enum Values

### All Reasons (12 total)

```java
public enum StockChangeReason {
    INITIAL_STOCK,          // Initial inventory entry
    MANUAL_UPDATE,          // Administrative adjustment
    PRICE_CHANGE,           // Price modification only
    SOLD,                   // Customer purchase
    SCRAPPED,               // Quality control removal
    DESTROYED,              // Catastrophic loss
    DAMAGED,                // Temporary quality hold
    EXPIRED,                // Expiration date breach
    LOST,                   // Unaccounted shrinkage
    RETURNED_TO_SUPPLIER,   // Vendor return
    RETURNED_BY_CUSTOMER;   // Customer return
}
```

---

## Detailed Reason Descriptions

### INITIAL_STOCK

**Category:** Initial Operations

**Description:** Initial inventory entry during item creation. Establishes the baseline for audit trail.

**Business Impact:**
- Critical for audit trail establishment
- First transaction in stock history
- Baseline for variance analysis

**Approval Required:** No (auto-generated on item creation)

**Affects Quantity:** Yes

**Compliance Documentation:** No

**Example:**
```
Item created: Widget A, Quantity: 100
Reason: INITIAL_STOCK
Effect: Inventory increases to 100 units
```

**Audit Severity:** HIGH

---

### MANUAL_UPDATE

**Category:** Administrative

**Description:** Manual administrative adjustment for inventory discrepancies discovered during physical counts or system corrections.

**Business Impact:**
- Requires manager approval
- Used for physical count reconciliation
- Records discrepancies

**Approval Required:** Yes (Manager)

**Affects Quantity:** Yes

**Compliance Documentation:** No

**Example:**
```
Physical count found: 95 units (system: 100)
Adjustment: -5 units
Reason: MANUAL_UPDATE
Effect: Inventory corrected to 95 units
```

**Audit Severity:** MEDIUM

---

### PRICE_CHANGE

**Category:** Administrative

**Description:** Price adjustment without quantity impact. Used for cost updates, supplier price changes, or financial corrections.

**Business Impact:**
- Financial reporting classification
- Affects cost basis and COGS
- No quantity change

**Approval Required:** No (Financial team reviews)

**Affects Quantity:** No (only affects financial valuation)

**Compliance Documentation:** No

**Example:**
```
Supplier price update: $10 → $12 per unit
Quantity: 100 units (unchanged)
Reason: PRICE_CHANGE
Effect: Total value increases from $1,000 to $1,200
```

**Audit Severity:** LOW

---

### SOLD

**Category:** Customer Transaction

**Description:** Customer purchase transaction. Revenue recognition and COGS calculation trigger.

**Business Impact:**
- Revenue recognition event
- COGS calculation trigger
- Customer satisfaction metric
- Sales tracking

**Approval Required:** No (auto-confirmed on order)

**Affects Quantity:** Yes (decreases)

**Compliance Documentation:** No

**Example:**
```
Order #ORD-001: Customer purchased 50 units
Price per unit: $12
Reason: SOLD
Effect: Inventory decreases to 50 units, Revenue = $600
```

**Audit Severity:** HIGH

---

### SCRAPPED

**Category:** Quality Control

**Description:** Quality control removal for damaged, defective, or non-conforming items permanently removed from inventory.

**Business Impact:**
- Loss prevention tracking
- Quality metrics
- Waste accounting
- Potential supplier quality reviews

**Approval Required:** No (QC decision)

**Affects Quantity:** Yes (decreases)

**Compliance Documentation:** No

**Example:**
```
Quality inspection identified: 5 defective units
Action: Permanent removal
Reason: SCRAPPED
Effect: Inventory decreases by 5 units
```

**Audit Severity:** MEDIUM

---

### DESTROYED

**Category:** Catastrophic Loss

**Description:** Catastrophic loss requiring insurance claim documentation. Represents major unrecoverable loss events.

**Business Impact:**
- Insurance claim trigger
- Asset write-off trigger
- Loss investigation requirement
- Potential legal/regulatory implications

**Approval Required:** Yes (Manager approval mandatory)

**Affects Quantity:** Yes (decreases significantly)

**Compliance Documentation:** Yes (Insurance claim required)

**Example:**
```
Warehouse fire destroyed inventory
Estimated loss: $50,000
Reason: DESTROYED
Effect: Total inventory write-off, Insurance claim filed
```

**Audit Severity:** CRITICAL

---

### DAMAGED

**Category:** Quality Control

**Description:** Temporary quality hold for items pending repair, assessment, or disposition decision. Not a permanent removal.

**Business Impact:**
- Operational impact tracking
- Temporary inventory exclusion
- Potential recovery option
- Quality hold period monitoring

**Approval Required:** No (Quality team decision)

**Affects Quantity:** Yes (temporarily excluded from available inventory)

**Compliance Documentation:** No

**Example:**
```
Inspection found: 10 units with shipping damage
Action: Hold for assessment
Reason: DAMAGED
Effect: Inventory held, pending repair evaluation
```

**Audit Severity:** LOW

---

### EXPIRED

**Category:** Regulatory Compliance

**Description:** Expiration date breach removal. Regulatory compliance requirement for perishable or time-sensitive goods.

**Business Impact:**
- Regulatory compliance
- Waste management
- Quality assurance
- Potential liability reduction

**Approval Required:** No (Auto-detected on date check)

**Affects Quantity:** Yes (decreases)

**Compliance Documentation:** Yes (Disposal records required)

**Example:**
```
Expiration date breach detected: 20 units expired 11/15/2025
Current date: 11/19/2025
Reason: EXPIRED
Effect: Inventory removed permanently, Disposal documented
```

**Audit Severity:** CRITICAL

---

### LOST

**Category:** Security Incident

**Description:** Inventory shrinkage for unaccounted losses. Represents items that cannot be located in warehouse or system.

**Business Impact:**
- Security review trigger
- Shrinkage analysis
- Warehouse process review
- Potential theft investigation

**Approval Required:** Yes (Manager approval required)

**Affects Quantity:** Yes (decreases)

**Compliance Documentation:** Yes (Shrinkage report required)

**Example:**
```
Cycle count variance: 15 units missing
Cannot locate in warehouse
Reason: LOST
Effect: Inventory decreased, Shrinkage investigation initiated
```

**Audit Severity:** CRITICAL

---

### RETURNED_TO_SUPPLIER

**Category:** Supplier Transaction

**Description:** Vendor return for defective, incorrect, or surplus merchandise. Supplier performance tracking trigger.

**Business Impact:**
- Supplier performance tracking
- Return process management
- Inventory recovery
- Cost recovery attempt

**Approval Required:** No (Supplier coordination)

**Affects Quantity:** Yes (decreases)

**Compliance Documentation:** No (RMA process applies)

**Example:**
```
Return merchandise authorization (RMA): RMA-5432
Reason: Defective merchandise from batch
Items returned: 8 units
Reason: RETURNED_TO_SUPPLIER
Effect: Inventory decreases, Cost recovery pending
```

**Audit Severity:** MEDIUM

---

### RETURNED_BY_CUSTOMER

**Category:** Customer Transaction

**Description:** Customer return processing. Customer satisfaction and refund management trigger.

**Business Impact:**
- Customer satisfaction
- Refund management
- Return process tracking
- Potential restocking
- Customer feedback

**Approval Required:** No (Customer service)

**Affects Quantity:** Yes (increases, if restockable)

**Compliance Documentation:** No

**Example:**
```
Return request: Customer found items defective
Order: ORD-001, Quantity: 5 units
Reason: RETURNED_BY_CUSTOMER
Effect: Inventory increased by 5 units, Refund processed
```

**Audit Severity:** LOW

---

## Reason Categories

### By Business Domain

**Initial Operations:**
- INITIAL_STOCK

**Administrative:**
- MANUAL_UPDATE
- PRICE_CHANGE

**Customer Transactions:**
- SOLD
- RETURNED_BY_CUSTOMER

**Quality Control:**
- DAMAGED
- SCRAPPED

**Security/Compliance:**
- DESTROYED
- EXPIRED
- LOST

**Supplier Relations:**
- RETURNED_TO_SUPPLIER

### By Quantity Impact

**Affects Quantity (11):**
```java
INITIAL_STOCK, MANUAL_UPDATE, SOLD, SCRAPPED, DESTROYED,
DAMAGED, EXPIRED, LOST, RETURNED_TO_SUPPLIER, RETURNED_BY_CUSTOMER
```

**Does NOT Affect Quantity (1):**
```java
PRICE_CHANGE
```

---

## Enum Methods

### Instance Methods

#### requiresManagerApproval()

Returns `true` if the reason requires manager-level approval before recording.

```java
public boolean requiresManagerApproval()
```

**Returns:** true for: `MANUAL_UPDATE`, `DESTROYED`, `LOST`

**Usage:**
```java
StockChangeReason reason = StockChangeReason.DESTROYED;
if (reason.requiresManagerApproval()) {
    // Require manager signature before processing
    requireManagerApproval(reason);
}
```

#### affectsQuantity()

Checks if this reason represents a quantity change.

```java
public boolean affectsQuantity()
```

**Returns:** false only for `PRICE_CHANGE`, true for all others

**Usage:**
```java
if (reason.affectsQuantity()) {
    inventory.adjustQuantity(change);
}
```

#### isLossReason()

Determines if this reason represents a financial loss.

```java
public boolean isLossReason()
```

**Returns:** true for: `SCRAPPED`, `DESTROYED`, `EXPIRED`, `LOST`

**Usage:**
```java
if (reason.isLossReason()) {
    financialReport.recordLoss(amount);
}
```

#### requiresComplianceDocumentation()

Checks if compliance documentation is required.

```java
public boolean requiresComplianceDocumentation()
```

**Returns:** true for: `EXPIRED`, `DESTROYED`, `LOST`

**Usage:**
```java
if (reason.requiresComplianceDocumentation()) {
    complianceSystem.createDocument(reason);
}
```

#### getAuditSeverity()

Returns the audit severity level for this reason.

```java
public AuditSeverity getAuditSeverity()
```

**Returns:** `AuditSeverity` enum value

**Mapping:**
- `CRITICAL`: DESTROYED, LOST
- `HIGH`: INITIAL_STOCK, SOLD
- `MEDIUM`: MANUAL_UPDATE, SCRAPPED, EXPIRED
- `LOW`: PRICE_CHANGE, DAMAGED, RETURNED_BY_CUSTOMER, RETURNED_TO_SUPPLIER

**Usage:**
```java
AuditSeverity severity = reason.getAuditSeverity();
logger.log(severity.getLogLevel(), "Stock change: " + reason);
```

---

### Static Classification Methods

#### getLossReasons()

Returns all reasons representing inventory losses.

```java
public static Set<StockChangeReason> getLossReasons()
```

**Returns:**
```java
{SCRAPPED, DESTROYED, EXPIRED, LOST}
```

**Usage:**
```java
Set<StockChangeReason> losses = StockChangeReason.getLossReasons();
BigDecimal totalLoss = stockHistory.stream()
    .filter(h -> losses.contains(h.getReason()))
    .map(StockHistory::getAmount)
    .reduce(BigDecimal.ZERO, BigDecimal::add);
```

#### getCustomerReasons()

Returns all reasons representing customer transactions.

```java
public static Set<StockChangeReason> getCustomerReasons()
```

**Returns:**
```java
{SOLD, RETURNED_BY_CUSTOMER}
```

**Usage:**
```java
Set<StockChangeReason> customerTransactions = StockChangeReason.getCustomerReasons();
if (customerTransactions.contains(reason)) {
    customerAnalytics.recordTransaction(reason);
}
```

#### getSupplierReasons()

Returns all reasons representing supplier transactions.

```java
public static Set<StockChangeReason> getSupplierReasons()
```

**Returns:**
```java
{RETURNED_TO_SUPPLIER}
```

**Usage:**
```java
if (StockChangeReason.getSupplierReasons().contains(reason)) {
    supplierPerformance.recordReturn(reason);
}
```

#### getSecuritySensitiveReasons()

Returns all reasons requiring security investigation.

```java
public static Set<StockChangeReason> getSecuritySensitiveReasons()
```

**Returns:**
```java
{LOST, DESTROYED}
```

**Usage:**
```java
if (StockChangeReason.getSecuritySensitiveReasons().contains(reason)) {
    securityAlert.notifyWarehouse(reason);
}
```

#### parseReason(String)

Safely parses a string to `StockChangeReason` with detailed error handling.

```java
public static StockChangeReason parseReason(String reasonString)
```

**Features:**
- Null/empty check with descriptive error
- Case-insensitive parsing
- Clear error messages listing valid options

**Parameters:**
- `reasonString` - String to parse (may be null)

**Returns:** Corresponding enum value

**Throws:** `IllegalArgumentException` with helpful error message

**Examples:**
```java
// Valid parses
StockChangeReason r1 = StockChangeReason.parseReason("SOLD");           // ✅
StockChangeReason r2 = StockChangeReason.parseReason("sold");           // ✅ (case-insensitive)
StockChangeReason r3 = StockChangeReason.parseReason("  DAMAGED  ");    // ✅ (trimmed)

// Invalid parses
StockChangeReason r4 = StockChangeReason.parseReason("INVALID");        // ❌ Throws exception
StockChangeReason r5 = StockChangeReason.parseReason(null);             // ❌ Throws exception
StockChangeReason r6 = StockChangeReason.parseReason("");               // ❌ Throws exception
```

**Error Message Example:**
```
Invalid stock change reason 'INVALID'. Valid options: 
[INITIAL_STOCK, MANUAL_UPDATE, PRICE_CHANGE, SOLD, SCRAPPED, 
 DESTROYED, DAMAGED, EXPIRED, LOST, RETURNED_TO_SUPPLIER, RETURNED_BY_CUSTOMER]
```

---

## Nested Enum: AuditSeverity

Classifies the severity level of stock change for audit and compliance purposes.

```java
public enum AuditSeverity {
    LOW,        // Routine operations
    MEDIUM,     // Administrative adjustments
    HIGH,       // Revenue-impacting transactions
    CRITICAL    // Loss events requiring investigation
}
```

### Severity Levels

| Level | Examples | Action Required |
|-------|----------|-----------------|
| `LOW` | PRICE_CHANGE, DAMAGED, customer returns | Monitor, routine logging |
| `MEDIUM` | MANUAL_UPDATE, SCRAPPED, EXPIRED | Review, document reason |
| `HIGH` | INITIAL_STOCK, SOLD | Track closely, audit trail |
| `CRITICAL` | DESTROYED, LOST | Immediate escalation, investigation |

---

## Database Schema

### Storage

The enum is persisted as a STRING in the `stock_history` table:

```sql
ALTER TABLE stock_history ADD COLUMN reason VARCHAR(30);

-- Recommended index for frequent filtering
CREATE INDEX idx_stock_history_reason ON stock_history(reason);

-- Values: 'INITIAL_STOCK', 'SOLD', 'DAMAGED', etc.
```

### Sample Data

```sql
-- Initial stock entry
INSERT INTO stock_history (id, item_id, change, reason, created_by, created_at)
VALUES ('SH-001', 'ITEM-001', 100, 'INITIAL_STOCK', 'system', NOW());

-- Customer sale
INSERT INTO stock_history (id, item_id, change, reason, created_by, created_at)
VALUES ('SH-002', 'ITEM-001', -50, 'SOLD', 'order@system', NOW());

-- Loss event
INSERT INTO stock_history (id, item_id, change, reason, created_by, created_at)
VALUES ('SH-003', 'ITEM-001', -5, 'LOST', 'warehouse-mgr', NOW());
```

---

## DTO Serialization

### StockHistoryDTO

```java
@Data
public class StockHistoryDTO {
    private String id;
    private String itemId;
    private Integer change;
    private String reason;              // Serialized as string
    private String createdBy;
    private LocalDateTime timestamp;
}
```

### API Examples

**Request:**
```json
POST /api/stock-history
{
  "itemId": "ITEM-001",
  "change": -50,
  "reason": "SOLD"
}
```

**Response (200 OK):**
```json
{
  "id": "SH-002",
  "itemId": "ITEM-001",
  "change": -50,
  "reason": "SOLD",
  "createdBy": "order@system",
  "timestamp": "2025-11-19T14:30:00Z"
}
```

### Mapper Integration

```java
public class StockHistoryMapper {
    
    public StockHistoryDTO toDTO(StockHistory entity) {
        return StockHistoryDTO.builder()
            .id(entity.getId())
            .itemId(entity.getItemId())
            .change(entity.getChange())
            .reason(entity.getReason().name())              // enum → string
            .createdBy(entity.getCreatedBy())
            .timestamp(entity.getCreatedAt())
            .build();
    }
    
    public StockHistory toEntity(StockHistoryDTO dto) {
        return StockHistory.builder()
            .itemId(dto.getItemId())
            .change(dto.getChange())
            .reason(StockChangeReason.parseReason(dto.getReason()))  // string → enum
            .createdBy(getCurrentUser())
            .createdAt(LocalDateTime.now())
            .build();
    }
}
```

---

## Validation

### Spring Validation

```java
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = ValidStockChangeReasonValidator.class)
public @interface ValidStockChangeReason {
    String message() default "Invalid stock change reason";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

public class ValidStockChangeReasonValidator 
    implements ConstraintValidator<ValidStockChangeReason, String> {
    
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        try {
            StockChangeReason.parseReason(value);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}
```

### DTO Validation

```java
@Data
public class StockHistoryDTO {
    @NotNull(message = "Item ID is required")
    private String itemId;
    
    @NotNull(message = "Change quantity is required")
    private Integer change;
    
    @NotNull(message = "Stock change reason is required")
    @ValidStockChangeReason(message = "Invalid stock change reason")
    private String reason;
}
```

---

## Testing

### Unit Tests

```java
@Test
void testStockChangeReasonMethods() {
    // Test requiresManagerApproval
    assertTrue(StockChangeReason.DESTROYED.requiresManagerApproval());
    assertFalse(StockChangeReason.SOLD.requiresManagerApproval());
    
    // Test affectsQuantity
    assertTrue(StockChangeReason.SOLD.affectsQuantity());
    assertFalse(StockChangeReason.PRICE_CHANGE.affectsQuantity());
    
    // Test isLossReason
    assertTrue(StockChangeReason.DESTROYED.isLossReason());
    assertFalse(StockChangeReason.SOLD.isLossReason());
    
    // Test requiresComplianceDocumentation
    assertTrue(StockChangeReason.EXPIRED.requiresComplianceDocumentation());
    assertFalse(StockChangeReason.DAMAGED.requiresComplianceDocumentation());
}

@Test
void testEnumClassification() {
    Set<StockChangeReason> losses = StockChangeReason.getLossReasons();
    assertEquals(4, losses.size());
    assertTrue(losses.contains(StockChangeReason.DESTROYED));
    assertTrue(losses.contains(StockChangeReason.LOST));
    assertFalse(losses.contains(StockChangeReason.SOLD));
}

@Test
void testReasonParsing() {
    // Valid
    assertEquals(StockChangeReason.SOLD, StockChangeReason.parseReason("SOLD"));
    assertEquals(StockChangeReason.DAMAGED, StockChangeReason.parseReason("  DAMAGED  "));
    
    // Invalid
    assertThrows(IllegalArgumentException.class,
        () -> StockChangeReason.parseReason("INVALID"));
    assertThrows(IllegalArgumentException.class,
        () -> StockChangeReason.parseReason(null));
}

@Test
void testAuditSeverity() {
    assertEquals(AuditSeverity.CRITICAL, StockChangeReason.DESTROYED.getAuditSeverity());
    assertEquals(AuditSeverity.HIGH, StockChangeReason.SOLD.getAuditSeverity());
    assertEquals(AuditSeverity.LOW, StockChangeReason.PRICE_CHANGE.getAuditSeverity());
}
```

### Integration Tests

```java
@SpringBootTest
@Transactional
class StockChangeReasonIT {
    
    @Autowired
    private StockHistoryRepository repository;
    
    @Test
    void testPersistenceWithEnum() {
        StockHistory history = StockHistory.builder()
            .itemId("ITEM-001")
            .change(-50)
            .reason(StockChangeReason.SOLD)
            .createdBy("order@system")
            .createdAt(LocalDateTime.now())
            .build();
        
        repository.save(history);
        
        StockHistory retrieved = repository.findById(history.getId()).get();
        assertEquals(StockChangeReason.SOLD, retrieved.getReason());
        assertEquals(-50, retrieved.getChange());
    }
    
    @Test
    void testReasonQuery() {
        repository.save(StockHistory.builder()
            .reason(StockChangeReason.SOLD)
            .itemId("ITEM-001")
            .change(-50)
            .createdAt(LocalDateTime.now())
            .build());
        
        repository.save(StockHistory.builder()
            .reason(StockChangeReason.DAMAGED)
            .itemId("ITEM-001")
            .change(0)
            .createdAt(LocalDateTime.now())
            .build());
        
        List<StockHistory> losses = repository
            .findByReasonIn(StockChangeReason.getLossReasons());
        assertEquals(0, losses.size());  // SOLD and DAMAGED are not losses
    }
}
```

---

## Best Practices

✅ **DO:**
- Always use enum values in code (not string literals)
- Use `parseReason()` for external input validation
- Call appropriate classification methods before business logic
- Document which reasons trigger approvals or compliance steps
- Use `EnumSet` for efficient reason classification
- Test enum method logic thoroughly

❌ **DON'T:**
- Hardcode reason strings in code
- Forget to validate reason strings from API inputs
- Ignore `requiresManagerApproval()` checks
- Skip compliance documentation for sensitive reasons
- Use ordinals for persistence
- Add reasons without updating documentation

---

## Migration Path

### Adding a New Reason

**Step 1: Update Enum**
```java
public enum StockChangeReason {
    INITIAL_STOCK,
    MANUAL_UPDATE,
    PRICE_CHANGE,
    SOLD,
    // ... existing reasons ...
    CUSTOMER_DONATION,  // New reason
}
```

**Step 2: Update Methods**
```java
public boolean requiresManagerApproval() {
    return switch (this) {
        case MANUAL_UPDATE, DESTROYED, LOST, CUSTOMER_DONATION -> true;
        // ...
    };
}

// Add to appropriate classification methods
public static Set<StockChangeReason> getCustomerReasons() {
    return EnumSet.of(SOLD, RETURNED_BY_CUSTOMER, CUSTOMER_DONATION);
}
```

**Step 3: Update Database (No migration needed)**
- VARCHAR(30) accommodates all reason strings
- No data migration required

**Step 4: Update Documentation**
- Add section in this document
- Update related DTOs
- Update validation rules if needed

---

## Related Documentation

**Architecture:**
- [Enums Hub](./index.html) - Overview of all enums
- [Data Models & Entities](../model.html) - Entity definitions
- [DTOs & Data Transfer Objects](../dto/index.html) - Serialization patterns

**Code Examples:**
- [StockHistory Entity](../../model/StockHistory.java)
- [StockHistoryMapper](../../mapper/StockHistoryMapper.java)
- [StockHistoryValidator](../../validation/StockHistoryValidator.java)

---

[⬅️ Back to Enums Hub](./index.html)
