package com.smartsupplypro.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * DTO representing aggregated stock movement for a specific month.
 *
 * <p>Used in reporting dashboards, trend analysis, and inventory
 * forecasting to show how much stock was added and removed monthly.
 */
@Data
@AllArgsConstructor
public class MonthlyStockMovementDTO {

    /**
     * The month for which the stock movement is reported.
     * Format: {@code YYYY-MM} (e.g., "2025-07")
     */
    private String month;

    /**
     * Total quantity of stock added (e.g., received, restocked).
     */
    private long stockIn;

    /**
     * Total quantity of stock removed (e.g., sold, scrapped).
     * Represented as a positive value.
     */
    private long stockOut;
}

