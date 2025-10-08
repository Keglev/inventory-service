package com.smartsupplypro.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Monthly stock movement aggregation DTO for trend analysis and forecasting.
 * Provides inbound/outbound movement summaries for inventory planning.
 * @see AnalyticsController#getMonthlyStockMovement()
 * @see dto-patterns.md for aggregation patterns
 */
@Data
@AllArgsConstructor
public class MonthlyStockMovementDTO {

    /** Month identifier (YYYY-MM format, e.g., "2025-07"). */
    private String month;

    /** Total inbound stock quantity (received, restocked). */
    private long stockIn;

    /** Total outbound stock quantity (sold, scrapped) as positive value. */
    private long stockOut;
}

