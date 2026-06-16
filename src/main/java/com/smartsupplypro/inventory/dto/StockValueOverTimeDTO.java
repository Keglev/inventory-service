package com.smartsupplypro.inventory.dto;

import java.time.LocalDate;

/**
 * Response payload for a daily inventory valuation data point.
 *
 * <p>Returned by {@link com.smartsupplypro.inventory.controller.AnalyticsController#getStockValueOverTime()}.</p>
 *
 * @param date       date of this valuation snapshot
 * @param totalValue total inventory value on this date, calculated as the sum of quantity × price
 */
public record StockValueOverTimeDTO(
        LocalDate date,
        double totalValue
) {}
