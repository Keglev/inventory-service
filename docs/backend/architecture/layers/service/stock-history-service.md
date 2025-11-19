[⬅️ Back to Layers Overview](./index.md)

# Stock History Service

## Purpose

Log and query stock movement audit trail. Maintains immutable records of all inventory changes.

## Key Responsibilities

- Create audit entries for stock changes
- Query stock history with filtering
- Generate stock movement reports
- Calculate inventory metrics from history

## Interface Methods

```java
StockHistoryDTO create(StockHistoryCreateDTO dto);
List<StockHistoryDTO> findByItemId(String itemId, Pageable pageable);
List<StockHistoryDTO> findAll(Pageable pageable);
StockMovementSummary getSummaryByPeriod(LocalDateTime from, 
    LocalDateTime to);
```

## Business Rules

1. **Immutable Records** - Stock history entries are immutable (create-only)
2. **Required Reason** - Every stock change must have reason and timestamp
3. **Cross-Reference** - Entries linked to both item and supplier for cross-reference
4. **Compliance** - Historical data retained for compliance and analytics

---

[⬅️ Back to Layers Overview](./index.md)
