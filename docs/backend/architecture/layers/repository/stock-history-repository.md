[⬅️ Back to Layers Overview](./index.md)

# Stock History Repository

## Purpose

Data access for StockHistory entities. Manages the immutable audit trail of all stock movements with reason tracking.

## Interface Methods

```java
// Basic CRUD
StockHistory save(StockHistory entity);

// Query by item
List<StockHistory> findByItemIdOrderByCreatedAtDesc(String itemId, Pageable pageable);

// Time-based queries
List<StockHistory> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);

// Filtering
List<StockHistory> findByReasonOrderByCreatedAtDesc(StockChangeReason reason);

// Custom aggregation
@Query("SELECT sh FROM StockHistory sh WHERE sh.itemId = :itemId ORDER BY sh.createdAt DESC")
List<StockHistory> findItemHistory(String itemId, Pageable pageable);
```

## Database Table

**Table Name:** `STOCK_HISTORY`

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| ID | UUID | PK | Entry identifier |
| ITEM_ID | UUID | FK → INVENTORY_ITEM | Links to item |
| SUPPLIER_ID | UUID | FK → SUPPLIER | Links to supplier (denormalized) |
| OLD_QUANTITY | INT | | Previous quantity |
| NEW_QUANTITY | INT | | Updated quantity |
| REASON | VARCHAR(50) | NOT NULL | Why changed (PURCHASE, SALE, etc) |
| NOTES | TEXT | | Additional details |
| CREATED_BY | VARCHAR(255) | NOT NULL | Who made change |
| CREATED_AT | TIMESTAMP | NOT NULL | When changed |

## Key Features

### Immutable Entries
- Create-only, no update or delete operations
- Prevents tampering with audit trail
- Preserves complete history for compliance

### Complete Audit Trail
Each entry records:
- Old and new quantities (before/after values)
- Reason for change (PURCHASE, SALE, ADJUSTMENT, AUDIT, RETURN, SHRINKAGE)
- Who made the change (createdBy)
- When the change occurred (createdAt)
- Additional notes for context

### Time-Based Filtering
Query changes by date range:
```java
List<StockHistory> findByCreatedAtBetween(
    LocalDateTime start, 
    LocalDateTime end, 
    Pageable pageable);
```
Used for reports and analytics.

### Supplier Denormalization
Supplier ID stored directly in stock history for:
- Faster analytics queries (no JOIN needed)
- Reporting by supplier without joining tables
- Historical supplier tracking (even if supplier deleted)

---

[⬅️ Back to Layers Overview](./index.md)
