[⬅️ Back to Model Index](./index.md)

# Inventory Item Entity

**Purpose:** Represents individual products/items in inventory with stock tracking

**Database Table:** `INVENTORY_ITEM`

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
    @Column(name = "ID", nullable = false)
    private String id;  // UUID
    
    @Column(name = "NAME", nullable = false, unique = true)
    private String name;  // Unique item name
    
    @Column(name = "SKU")
    private String sku;  // Stock keeping unit
    
    @Column(name = "SUPPLIER_ID", nullable = false)
    private String supplierId;  // Foreign key to SUPPLIER
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "SUPPLIER_ID", insertable = false, updatable = false)
    private Supplier supplier;  // Relationship object (eagerly loaded)
    
    @Column(name = "QUANTITY", nullable = false)
    private int quantity;  // Current stock quantity
    
    @Column(name = "UNIT_PRICE", nullable = false)
    private BigDecimal unitPrice;  // Cost per unit
    
    @Column(name = "CREATED_BY", nullable = false)
    private String createdBy;
    
    @CreationTimestamp
    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Version  // Optimistic locking
    @Column(name = "VERSION")
    private Long version;  // Incremented on updates
}
```

## Business Rules

1. **Unique Name:** Item name must be unique within system
2. **Valid Supplier:** Item must reference an existing supplier
3. **Non-Negative Quantity:** Stock quantity must be >= 0
4. **Non-Negative Price:** Unit price must be >= 0
5. **Deletion Policy:** Item cannot be deleted if stock > 0 (business policy)
6. **Audit Trail:** Every stock change creates entry in STOCK_HISTORY
7. **Immutable Creation:** createdAt and createdBy fields cannot be updated

## Key Features

- **Optimistic Locking:** Version field prevents concurrent modification conflicts
  - Hibernate automatically increments on each update
  - Throws OptimisticLockException if stale data detected
- **Eager Supplier Loading:** Supplier always loaded with item (eliminates N+1 query problems)
- **Immutable Timestamps:** createdAt and createdBy protected with `updatable = false`

## Key Relationships

- **Many-to-One with Supplier:** Many items belong to one supplier
- **One-to-Many with StockHistory:** One item can have multiple stock history entries (audit trail)

---

[⬅️ Back to Model Index](./index.md)
