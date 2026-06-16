package com.smartsupplypro.inventory.dto;

/**
 * Response payload for a low-stock alert entry.
 *
 * <p>Returned by {@link com.smartsupplypro.inventory.controller.AnalyticsController#getLowStockItems()}.
 * An item appears here when its {@code quantity} falls below {@code minimumQuantity}.</p>
 *
 * @param itemName        display name of the inventory item
 * @param quantity        current available stock
 * @param minimumQuantity configured reorder threshold
 */
public record LowStockItemDTO(
        String itemName,
        int quantity,
        int minimumQuantity
) {}
