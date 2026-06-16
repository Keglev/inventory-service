package com.smartsupplypro.inventory.dto;

/**
 * Response payload for item update frequency analytics.
 *
 * <p>Returned by {@link com.smartsupplypro.inventory.controller.AnalyticsController#getTopUpdatedItems()}.</p>
 *
 * @param itemName    display name of the inventory item
 * @param updateCount number of stock change events recorded for this item
 */
public record ItemUpdateFrequencyDTO(
        String itemName,
        long updateCount
) {}
