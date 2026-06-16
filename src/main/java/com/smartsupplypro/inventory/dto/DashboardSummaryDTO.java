package com.smartsupplypro.inventory.dto;

import java.util.List;

import lombok.Builder;

/**
 * Response payload for the analytics dashboard summary.
 *
 * <p>Returned by {@link com.smartsupplypro.inventory.controller.AnalyticsController#getDashboardSummary()}.</p>
 *
 * @param stockPerSupplier     stock distribution aggregated by supplier
 * @param lowStockItems        items currently below their minimum quantity threshold
 * @param monthlyStockMovement inbound/outbound movement totals per calendar month
 * @param topUpdatedItems      items with the highest number of recent stock changes
 */
@Builder
public record DashboardSummaryDTO(
        List<StockPerSupplierDTO> stockPerSupplier,
        List<LowStockItemDTO> lowStockItems,
        List<MonthlyStockMovementDTO> monthlyStockMovement,
        List<ItemUpdateFrequencyDTO> topUpdatedItems
) {}
