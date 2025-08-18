package com.smartsupplypro.inventory.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.smartsupplypro.inventory.enums.StockChangeReason;

/**
 * Domain entity representing a single stock movement (receive, sell, scrap, manual adjust).
 *
 * <h2>Purpose</h2>
 * <ul>
 *   <li>Provides an immutable audit trail for analytics, compliance, and debugging.</li>
 *   <li>Captures who did what, when, why, and at what price (if applicable).</li>
 *   <li>Supports frequent query patterns via targeted indexes (by item, by supplier, by time).</li>
 * </ul>
 *
 * <h2>Schema Notes</h2>
 * <ul>
 *   <li>Mapped to table {@code STOCK_HISTORY}.</li>
 *   <li>DB column {@code CREATED_AT} is used instead of {@code TIMESTAMP} to avoid keyword conflicts on H2/Oracle.</li>
 *   <li>{@code SUPPLIER_ID} exists for efficient supplier-based analytics; it is populated by the service layer
 *       from the associated {@code InventoryItem} at write time.</li>
 *   <li>Read-only associations are provided for convenience in reporting (no cascading writes from this entity).</li>
 * </ul>
 *
 * <h2>Indexing Strategy</h2>
 * <ul>
 *   <li>{@code IX_SH_ITEM_TS} on ({@code ITEM_ID}, {@code CREATED_AT}) accelerates “item timeline” queries.</li>
 *   <li>{@code IX_SH_TS} on ({@code CREATED_AT}) supports range scans (e.g., recent changes).</li>
 *   <li>{@code IX_SH_SUPPLIER_TS} on ({@code SUPPLIER_ID}, {@code CREATED_AT}) supports supplier-centric analytics.</li>
 * </ul>
 */
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(
    name = "STOCK_HISTORY",
    indexes = {
        @Index(name = "IX_SH_ITEM_TS",     columnList = "ITEM_ID, CREATED_AT"),
        @Index(name = "IX_SH_TS",          columnList = "CREATED_AT"),
        @Index(name = "IX_SH_SUPPLIER_TS", columnList = "SUPPLIER_ID, CREATED_AT")
    }
)
public class StockHistory {

    /** Unique identifier for the stock history event (UUID or external key). */
    @Id
    private String id;

    /** Foreign key reference to the affected inventory item. */
    @Column(name = "ITEM_ID", nullable = false)
    private String itemId;

    /**
     * Optional denormalized reference to the supplier (for fast supplier analytics).
     * <p>Populated by the service layer when creating history records:
     * {@code history.setSupplierId(item.getSupplierId());}
     */
    @Column(name = "SUPPLIER_ID")
    private String supplierId;

    /**
     * Quantity delta. Positive for increases (RECEIVED), negative for decreases (SOLD/SCRAPPED).
     */
    @Column(name = "CHANGE", nullable = false)
    private int change;

    /**
     * Reason for the stock change. Stored as string for forward compatibility.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "REASON", nullable = false)
    private StockChangeReason reason;

    /** Identifier of the user who initiated the stock change. */
    @Column(name = "CREATED_BY")
    private String createdBy;

    /**
     * When the stock change occurred (application time).
     * <p><b>DB column name:</b> {@code CREATED_AT} (chosen to avoid reserved-word conflicts).</p>
     * <p>The Java field remains {@code timestamp} for backward compatibility with existing code/tests.</p>
     */
    @Column(name = "CREATED_AT", nullable = false)
    private LocalDateTime timestamp;

    /**
     * Unit price at the time of the change (used for price-trend analytics and audit).
     */
    @Column(name = "PRICE_AT_CHANGE", precision = 12, scale = 2)
    private BigDecimal priceAtChange;

    /**
     * Set defaults prior to initial persist.
     * <ul>
     *   <li>Backfills {@code timestamp} if missing.</li>
     * </ul>
     */
    @PrePersist
    public void prePersist() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }

    // ---------------------------
    // Read-only associations
    // ---------------------------

    /**
     * Read-only association to the related InventoryItem.
     * <p>Use for joins/reporting; not used for writes.</p>
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ITEM_ID", insertable = false, updatable = false)
    private InventoryItem inventoryItem;

    /**
     * Read-only association to the related Supplier (if {@code supplierId} is populated).
     * <p>Use for joins/reporting; not used for writes.</p>
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SUPPLIER_ID", insertable = false, updatable = false)
    private Supplier supplier;
}
