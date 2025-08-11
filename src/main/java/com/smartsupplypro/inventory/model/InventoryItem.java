package com.smartsupplypro.inventory.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity representing a physical or digital item in inventory.
 *
 * <p>This model maps to the {@code INVENTORY_ITEM} table in the database.
 * Each item is uniquely identified by an {@code id}, linked to a supplier,
 * and supports key attributes such as quantity, price, and audit metadata.
 *
 * <p>Used in:
 * <ul>
 *   <li>Inventory management</li>
 *   <li>Stock analytics</li>
 *   <li>Low stock alerts and dashboards</li>
 * </ul>
 */
@Entity
@Table(name = "INVENTORY_ITEM")
@Data
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InventoryItem {

    /** Unique item identifier (UUID or business-generated) */
    @Id
    private String id;

    /** Unique name of the item (used for display and lookups) */
    @Column(unique = true)
    private String name;

    /** Quantity currently available in stock (non-negative) */
    private int quantity;

    /** Price per unit (used in total value and analytics) */
    private BigDecimal price;

    /** Foreign key reference to the item's supplier */
    @Column(name = "supplier_id", insertable = false, updatable = false)
    private String supplierId;

    /** Username or email of the person who created this item */
    @Column(name = "created_by")
    private String createdBy;

    /** Minimum acceptable quantity before considered "low stock" */
    @Column(name = "minimum_quantity")
    private int minimumQuantity;

    /** Timestamp when the item was created (set automatically if not provided) */
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /**
     * Automatically sets the creation timestamp if not already set.
     * Invoked before the entity is persisted.
     */
    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    /**
     * Supplier entity reference (read-only). Used for reporting and joins.
     * This mapping is optional and is not used during insert/update.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;
}
// This model is designed to be used in service layers where inventory items are managed,
// such as in REST controllers, service classes, and repositories. It provides a clear
// structure for representing items, including their relationships to suppliers and
// audit metadata. The use of Lombok annotations simplifies boilerplate code, while
// JPA annotations ensure that the entity is correctly mapped to the database schema.