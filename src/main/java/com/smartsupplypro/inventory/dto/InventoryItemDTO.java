package com.smartsupplypro.inventory.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Null;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.groups.Default;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Inventory item payload used for both create and update operations.
 *
 * <p>Submitted to and returned by
 * {@link com.smartsupplypro.inventory.controller.InventoryItemController}.
 * Validation groups {@link Create} and {@link Update} allow controllers
 * to apply context-specific constraints via {@code @Validated}.</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryItemDTO {

    /** Validation group applied on item creation. */
    public interface Create {}
    /** Validation group applied on item update. */
    public interface Update {}

    @Null(message = "ID must be absent when creating", groups = Create.class)
    private String id;

    @NotBlank(message = "Item name is mandatory")
    private String name;

    /** Stock Keeping Unit; required on create and update, unique across items. */
    @NotBlank(message = "SKU is mandatory", groups = {Default.class, Create.class})
    private String sku;

    @NotNull(message = "Quantity is mandatory")
    @PositiveOrZero(message = "Quantity must be zero or positive")
    private int quantity;

    @NotNull(message = "Price is mandatory")
    @Positive(message = "Price must be greater than zero")
    private BigDecimal price;

    /** Backend-calculated product of quantity × price; not submitted by clients. */
    private BigDecimal totalValue;

    @NotBlank(message = "Supplier ID is mandatory")
    private String supplierId;

    private String createdBy;
    private LocalDateTime createdAt;

    /** Denormalized supplier name for display purposes; avoids a separate client lookup. */
    private String supplierName;

    private int minimumQuantity;
}
