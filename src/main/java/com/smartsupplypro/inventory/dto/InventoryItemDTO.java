package com.smartsupplypro.inventory.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Null;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Core inventory item DTO with validation groups for create/update operations.
 * Supports full CRUD operations with validation constraints and audit trail fields.
 * @see InventoryItemController
 * @see dto-patterns.md for validation group patterns
 */
@Data
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InventoryItemDTO {

    // Enterprise Comment: Validation groups pattern - separate constraints for create vs update operations
    // enabling flexible validation rules while maintaining single DTO for multiple use cases
    public interface Create {}
    public interface Update {}

    /** Unique identifier, system-generated on creation. */
    @Null(message = "ID must be absent when creating", groups = Create.class)
    private String id;

    /** Display name of the inventory item. */
    @NotBlank(message = "Item name is mandatory")
    private String name;

    /** Current stock quantity (non-negative). */
    @NotNull(message = "Quantity is mandatory")
    @PositiveOrZero(message = "Quantity must be zero or positive")
    private int quantity;

    /** Price per unit (positive value required). */
    @NotNull(message = "Price is mandatory")
    @Positive(message = "Price must be greater than zero")
    private BigDecimal price;

    /** Calculated total value (quantity × price), backend-populated. */
    private BigDecimal totalValue;

    /** Associated supplier identifier. */
    @NotBlank(message = "Supplier ID is mandatory")
    private String supplierId;

    /** User who created this record (audit trail). */
    private String createdBy;

    /** Creation timestamp (system-generated). */
    private LocalDateTime createdAt;

    /** Supplier name for UI display (projection field). */
    private String supplierName;

    /** Minimum stock threshold for low-stock alerts. */
    private int minimumQuantity;


}
