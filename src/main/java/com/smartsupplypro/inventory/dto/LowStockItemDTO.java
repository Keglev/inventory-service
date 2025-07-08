package com.smartsupplypro.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * DTO representing an inventory item that has fallen below its minimum stock threshold.
 *
 * <p>Used in low-stock alerts, dashboards, or automated restocking workflows.
 * Helps identify products that need attention based on business-defined minimums.
 */
@Data
@AllArgsConstructor
public class LowStockItemDTO {

    /**
     * Name of the inventory item.
     */
    private String itemName;

    /**
     * Current stock quantity available.
     */
    private int quantity;

    /**
     * Business-defined minimum threshold for this item.
     * If {@code quantity < minimumQuantity}, the item is considered low in stock.
     */
    private int minimumQuantity;
}
