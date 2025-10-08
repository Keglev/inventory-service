package com.smartsupplypro.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Item activity tracking DTO showing update frequency for volatility analysis.
 * Identifies high-activity items for operational insights and audit reporting.
 * @see AnalyticsController#getTopUpdatedItems()
 * @see dto-patterns.md for activity tracking patterns
 */
@Data
@AllArgsConstructor
public class ItemUpdateFrequencyDTO {

    /** Item name being tracked for activity. */
    private String itemName;

    /** Number of update events recorded for this item. */
    private long updateCount;
}
