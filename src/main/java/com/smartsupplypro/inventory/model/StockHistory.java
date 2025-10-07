package com.smartsupplypro.inventory.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.smartsupplypro.inventory.enums.StockChangeReason;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Stock history entity for immutable audit trail of inventory movements.
 * Maps to STOCK_HISTORY table with indexed columns for analytics.
 *
 * <p><strong>Purpose</strong>: Captures stock changes (receive, sell, scrap, adjust) with who, what, when, why, and price context.
 *
 * <p><strong>Indexes</strong>: IX_SH_ITEM_TS (item_id, created_at), IX_SH_TS (created_at), IX_SH_SUPPLIER_TS (supplier_id, created_at).
 *
 * <p><strong>Usage</strong>: Analytics, compliance, debugging, WAC calculations.
 *
 * @see InventoryItem
 * @see Supplier
 * @see StockChangeReason
 * @see <a href="../../../../../docs/architecture/patterns/model-patterns.md">Model Patterns</a>
 */
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(
    name = "STOCK_HISTORY",
    indexes = {
        // itemId + timestamp lookups (common for item history views)
        @Index(name = "IX_SH_ITEM_TS",     columnList = "ITEM_ID, CREATED_AT"),
        // timestamp range scans (recent activity)
        @Index(name = "IX_SH_TS",          columnList = "CREATED_AT"),
        // supplier + timestamp analytics
        @Index(name = "IX_SH_SUPPLIER_TS", columnList = "SUPPLIER_ID, CREATED_AT")
    }
)
public class StockHistory {

    /** Unique identifier for stock history event (UUID). */
    @Id
    @Column(name="ID")
    private String id;

    /** Foreign key reference to affected inventory item. */
    @Column(name = "ITEM_ID", nullable = false)
    private String itemId;

    /** Denormalized supplier reference for fast analytics (populated by service layer). */
    @Column(name = "SUPPLIER_ID")
    private String supplierId;

    /** Quantity delta (positive for increases, negative for decreases). */
    @Column(name = "QUANTITY_CHANGE", nullable = false)
    private int change;

    /** Reason for stock change (stored as STRING). */
    @Enumerated(EnumType.STRING)
    @Column(name = "REASON", nullable = false)
    private StockChangeReason reason;

    /** User who initiated the stock change. */
    @Column(name = "CREATED_BY", nullable = false)
    private String createdBy;

    /** Timestamp of stock change event. */
    @Column(name = "CREATED_AT", nullable = false)
    private LocalDateTime timestamp;

    /** Price at time of change (for valuation analytics). */
    @Column(name = "PRICE_AT_CHANGE", precision = 12, scale = 2)
    private BigDecimal priceAtChange;

    /**
     * Sets timestamp before persist if not already set.
     */
    @PrePersist
    public void prePersist() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }

    /**
     * Inventory item entity reference (read-only, for joins).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ITEM_ID", insertable = false, updatable = false)
    private InventoryItem inventoryItem;

    /**
     * Supplier entity reference (read-only, for joins).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SUPPLIER_ID", insertable = false, updatable = false)
    private Supplier supplier;
}
