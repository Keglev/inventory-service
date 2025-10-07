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
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Inventory item entity with stock quantity, pricing, and supplier linkage.
 * Maps to INVENTORY_ITEM table with audit metadata.
 *
 * <p><strong>Purpose</strong>: Represents physical/digital items with quantity tracking and low-stock alerts.
 *
 * <p><strong>Usage</strong>: Inventory management, stock analytics, dashboard reporting.
 *
 * @see Supplier
 * @see StockHistory
 * @see <a href="../../../../../docs/architecture/patterns/model-patterns.md">Model Patterns</a>
 */
@Entity
@Table(name = "INVENTORY_ITEM")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryItem {

    /** Unique item identifier (UUID). */
    @Id
    @Column(name = "ID", nullable = false, length = 36)
    private String id;

    /** Item name (unique, for display and lookups). */
    @Column(name = "NAME", nullable=false) private String name;

    /** Current stock quantity (non-negative). */
    @Column(name = "QUANTITY", nullable=false) private int quantity;

    /** Price per unit. */
    @Column(name = "PRICE", nullable=false) private BigDecimal price;

    /** Foreign key to supplier. */
    @Column(name = "SUPPLIER_ID", nullable=false)
    private String supplierId;

    /** Creator username/email. */
    @Column(name = "CREATED_BY", nullable=false)
    private String createdBy;

    /** Minimum quantity threshold for low-stock alerts. */
    @Column(name = "MINIMUM_QUANTITY", nullable=false)
    private int minimumQuantity;

    /** Creation timestamp. */
    @Column(name = "CREATED_AT", nullable=false)
    private LocalDateTime createdAt;

    /**
     * Supplier entity reference (read-only, for joins).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SUPPLIER_ID", insertable = false, updatable = false)
    private Supplier supplier;

    /**
     * Sets creation metadata before persist.
     */
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
        // Enterprise Comment: Supplier ID Resolution
        // Handles test scenarios where supplier object is set but supplierId field is null
        if ((this.supplierId == null || this.supplierId.isBlank()) && this.supplier != null) {
            this.supplierId = this.supplier.getId();
        } else if ((this.supplierId == null || this.supplierId.isBlank()) && this.supplier == null) {
            this.supplierId = "default-supplier";
        }
    }
}
