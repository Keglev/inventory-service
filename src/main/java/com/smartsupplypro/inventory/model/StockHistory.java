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
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

/**
 * Represents an immutable stock movement record in the audit trail.
 *
 * <p>Captures who changed what, when, why, and at what price — enabling
 * compliance reporting, WAC calculations, and stock reconciliation.</p>
 *
 * @see InventoryItem
 * @see StockChangeReason
 */
@Entity
@Getter
@Setter
@ToString(exclude = {"inventoryItem", "supplier"})
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(
    name = "STOCK_HISTORY",
    indexes = {
        @Index(name = "IX_SH_ITEM_TS",     columnList = "ITEM_ID, CREATED_AT"),    // item history views
        @Index(name = "IX_SH_TS",          columnList = "CREATED_AT"),             // recent activity scans
        @Index(name = "IX_SH_SUPPLIER_TS", columnList = "SUPPLIER_ID, CREATED_AT") // supplier analytics
    }
)
public class StockHistory {

    @Id
    @Column(name = "ID")
    private String id;

    @Column(name = "ITEM_ID", nullable = false)
    private String itemId;

    // denormalized from InventoryItem for supplier-scoped analytics queries
    @Column(name = "SUPPLIER_ID")
    private String supplierId;

    // positive for stock-in, negative for stock-out
    @Column(name = "QUANTITY_CHANGE", nullable = false)
    private int change;

    @Enumerated(EnumType.STRING)
    // Stored as STRING for DB readability; renaming enum constants requires a data migration
    @Column(name = "REASON", nullable = false)
    private StockChangeReason reason;

    @Column(name = "CREATED_BY", nullable = false)
    private String createdBy;

    @Column(name = "CREATED_AT", nullable = false)
    private LocalDateTime timestamp;

    // snapshot of the unit price at the time of this movement, used for WAC calculations
    @Column(name = "PRICE_AT_CHANGE", precision = 12, scale = 2)
    private BigDecimal priceAtChange;

    @PrePersist
    public void prePersist() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }

    // read-only joins; ITEM_ID and SUPPLIER_ID are the authoritative FK columns
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ITEM_ID", insertable = false, updatable = false)
    private InventoryItem inventoryItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SUPPLIER_ID", insertable = false, updatable = false)
    private Supplier supplier;
}
