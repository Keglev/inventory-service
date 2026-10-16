package com.smartsupplypro.inventory.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.type.NumericBooleanConverter;
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

    /**
     * Minimum quantity applied when an item is created without one.
     *
     * <p>A domain default, so it lives with the entity;
     * {@code InventoryItemValidationHelper.populateServerFields} applies it
     * before the entity is saved.</p>
     */
    public static final int DEFAULT_MINIMUM_QUANTITY = 10;

    @Id
    @Column(name = "ID", nullable = false, length = 36)
    private String id;

    @Column(name = "NAME", nullable = false)
    private String name;

    /** Stock Keeping Unit - unique, human-readable item code (see DB migration V2/V4). */
    @Column(name = "SKU", nullable = false, length = 32, unique = true)
    private String sku;

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

    /**
     * Soft-delete flag. Items are never physically removed;
     * deletion marks them inactive so stock history survives for auditing.
     * Defaults to true for new and builder-created instances; the column
     * default covers legacy inserts that omit the field.
     */
    @Builder.Default
    @Convert(converter = NumericBooleanConverter.class)
    @Column(name = "ACTIVE", nullable = false)
    private boolean active = true;

    // read-only join; SUPPLIER_ID is the authoritative FK column
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SUPPLIER_ID", insertable = false, updatable = false)
    private Supplier supplier;
}
