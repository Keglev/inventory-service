package com.smartsupplypro.inventory.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Consolidated summary of key inventory metrics for dashboards.
 *
 * Returned by {@code GET /api/analytics/summary}.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardSummaryDTO {

    /* 
     * Total number of distinct items in inventory.
     */
    private List<StockPerSupplierDTO> stockPerSupplier;

    /* 
     * Financial summary including total inventory value and recent changes.
     */
    private List<LowStockItemDTO> lowStockItems;

    /* 
     * Price trend data for key items over time.
     */
    private List<MonthlyStockMovementDTO> monthlyStockMovement;

    /* 
     * Items with the highest frequency of updates.
     */
    private List<ItemUpdateFrequencyDTO> topUpdatedItems;
}
