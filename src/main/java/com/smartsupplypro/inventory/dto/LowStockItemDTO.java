package com.smartsupplypro.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Low stock alert DTO identifying items below minimum thresholds.
 * Used for automated restocking workflows and inventory management dashboards.
 * @see AnalyticsController#getLowStockItems()
 * @see dto-patterns.md for alert system patterns
 */
@Data
@AllArgsConstructor
public class LowStockItemDTO {

    /** Item name requiring attention. */
    private String itemName;

    /** Current available stock quantity. */
    private int quantity;

    /** Minimum threshold (alert triggers when quantity < minimumQuantity). */
    private int minimumQuantity;
}
