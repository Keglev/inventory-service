package com.smartsupplypro.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * DTO representing the number of times an inventory item has been updated.
 *
 * <p>This metric is useful for identifying frequently adjusted items,
 * which may indicate operational volatility, high demand, or data correction needs.
 *
 * <p>Used in analytics dashboards or audit reports to provide visibility
 * into item activity frequency over time.
 */
@Data
@AllArgsConstructor
public class ItemUpdateFrequencyDTO {

    /**
     * The name of the inventory item.
     */
    private String itemName;

    /**
     * The number of update events recorded for this item.
     */
    private long updateCount;
}
