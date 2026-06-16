package com.smartsupplypro.inventory.dto;

/**
 * Response payload for monthly stock movement aggregates.
 *
 * <p>Returned by {@link com.smartsupplypro.inventory.controller.AnalyticsController#getMonthlyStockMovement()}.</p>
 *
 * @param month    calendar month in {@code YYYY-MM} format (e.g., {@code "2025-07"})
 * @param stockIn  total inbound units received or restocked this month
 * @param stockOut total outbound units sold or scrapped this month (positive value)
 */
public record MonthlyStockMovementDTO(
        String month,
        long stockIn,
        long stockOut
) {}
