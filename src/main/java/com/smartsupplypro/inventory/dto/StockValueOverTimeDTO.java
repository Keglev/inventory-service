package com.smartsupplypro.inventory.dto;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Time series DTO for inventory valuation trends and analytics visualization.
 * Provides daily snapshots of total inventory value for KPI dashboards.
 * @see AnalyticsController#getStockValueOverTime()
 * @see dto-patterns.md for time series patterns
 */
@Data
@AllArgsConstructor
public class StockValueOverTimeDTO {

    /** Date point for time series (typically daily snapshots). */
    private LocalDate date;

    /** Total inventory value on this date (sum of quantity × price). */
    private double totalValue;
}

