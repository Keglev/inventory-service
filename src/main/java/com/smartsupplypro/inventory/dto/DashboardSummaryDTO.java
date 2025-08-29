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

    
    private List<StockPerSupplierDTO> stockPerSupplier;


    private List<LowStockItemDTO> lowStockItems;


    private List<MonthlyStockMovementDTO> monthlyStockMovement;


    private List<ItemUpdateFrequencyDTO> topUpdatedItems;
}
