[⬅️ Back to Model Index](./index.md)

# Stock History Entity

**Purpose:** Immutable audit trail of all stock movements and changes

**Database Table:** `STOCK_HISTORY`

## Entity Definition

```java
@Entity
@Table(name = "STOCK_HISTORY")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockHistory {
    
    @Id
    @Column(name = "ID", nullable = false)
    private String id;  // UUID
    
    @Column(name = "ITEM_ID", nullable = false)
    private String itemId;  // Foreign key to INVENTORY_ITEM
    
    @Column(name = "SUPPLIER_ID", nullable = false)
    private String supplierId;  // Denormalized for analytics
    
    @Column(name = "OLD_QUANTITY", nullable = false)
    private int oldQuantity;  // Previous quantity
    
    @Column(name = "NEW_QUANTITY", nullable = false)
    private int newQuantity;  // Updated quantity
    
    @Enumerated(EnumType.STRING)
    @Column(name = "REASON", nullable = false)
    private StockChangeReason reason;  // Why changed (PURCHASE/SALE/etc)
    
    @Column(name = "NOTES")
    private String notes;  // Additional details
    
    @Column(name = "CREATED_BY", nullable = false)
    private String createdBy;
    
    @CreationTimestamp
    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
```

## Business Rules

1. **Immutable Records:** Stock history entries are **immutable** - no updates or deletes allowed
2. **Automatic Creation:** Entries are created only through inventory item updates (via service layer)
3. **Quantity Delta:** Calculated as `newQuantity - oldQuantity` (can be positive or negative)
4. **Reason Required:** Every change must include reason for full traceability
5. **No Manual Entries:** Records cannot be manually inserted; only service layer creates them
6. **Supplier Denormalization:** Supplier stored directly for analytics efficiency

## Key Features

- **Complete Audit Trail:** Records every stock change with before/after values
- **Immutable Design:** Prevents data tampering and ensures compliance
- **Reason Tracking:** Every change explains business reason (PURCHASE, SALE, ADJUSTMENT, etc.)
- **Supplier Denormalization:** Includes supplier ID for direct filtering without expensive joins
- **Timestamp Accuracy:** Created timestamp captures exact moment of change

## Key Relationships

- **Many-to-One with InventoryItem:** Many entries for one item (1:M relationship)
- **Many-to-One with Supplier:** Many entries for one supplier (1:M relationship through item)

---

[⬅️ Back to Model Index](./index.md)
