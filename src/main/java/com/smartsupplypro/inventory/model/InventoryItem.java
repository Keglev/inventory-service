package com.smartsupplypro.inventory.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
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
 * Represents an inventory item in the stock management domain.
 *
 * <p>Tracks quantity, pricing, and supplier association for each stocked item.
 * Low-stock alerts are triggered when quantity falls below {@code minimumQuantity}.</p>
 *
 * @see Supplier
 * @see StockHistory
 */
@Entity
@Table(name = "INVENTORY_ITEM")
@Getter
@Setter
@ToString(exclude = "supplier")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryItem {

    @Id
    @Column(name = "ID", nullable = false, length = 36)
    private String id;

    @Column(name = "NAME", nullable = false)
    private String name;

    @Column(name = "QUANTITY", nullable = false)
    private int quantity;

    @Column(name = "PRICE", nullable = false)
    private BigDecimal price;

    @Column(name = "SUPPLIER_ID", nullable = false)
    private String supplierId;

    @Column(name = "CREATED_BY", nullable = false)
    private String createdBy;

    @Column(name = "MINIMUM_QUANTITY", nullable = false)
    private int minimumQuantity;

    @Column(name = "CREATED_AT", nullable = false)
    private LocalDateTime createdAt;

    // read-only join; SUPPLIER_ID is the authoritative FK column
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SUPPLIER_ID", insertable = false, updatable = false)
    private Supplier supplier;

    @PrePersist
    protected void onCreate() {
        if (this.id == null || this.id.isBlank()) {
            this.id = UUID.randomUUID().toString();
        }
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.createdBy == null || this.createdBy.isBlank()) {
            this.createdBy = "system";
        }
        if (this.minimumQuantity <= 0) {
            this.minimumQuantity = 10;
        }
        // denormalized supplierId must match the supplier relationship when only the entity is set
        boolean supplierIdMissing = (this.supplierId == null || this.supplierId.isBlank());
        if (supplierIdMissing) {
            if (this.supplier != null) {
                this.supplierId = this.supplier.getId();
            } else {
                this.supplierId = "default-supplier";
            }
        }
    }
}
