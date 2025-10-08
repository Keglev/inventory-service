package com.smartsupplypro.inventory.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Dashboard metrics aggregation DTO providing comprehensive inventory analytics.
 * Contains supplier distribution, low stock alerts, trends, and activity summaries.
 * @see AnalyticsController#getDashboardSummary()
 * @see dto-patterns.md for analytics DTO design patterns
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardSummaryDTO {

    /** Stock distribution across all suppliers with quantities and values. */
    private List<StockPerSupplierDTO> stockPerSupplier;

    /** Items requiring attention due to low stock levels. */
    private List<LowStockItemDTO> lowStockItems;

    /** Monthly stock movement trends for analytics visualization. */
    private List<MonthlyStockMovementDTO> monthlyStockMovement;

    /** Most frequently updated items indicating high activity levels. */
    private List<ItemUpdateFrequencyDTO> topUpdatedItems;
}
