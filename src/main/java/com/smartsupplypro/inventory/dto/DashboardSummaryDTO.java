package com.smartsupplypro.inventory.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO representing a consolidated summary of key inventory metrics for dashboards.
 *
 * <p>Used by the {@code /api/analytics/summary} endpoint to provide:
 * <ul>
 *     <li>Stock levels grouped by supplier</li>
 *     <li>Low stock warnings (usually top 3)</li>
 *     <li>Monthly stock movement data</li>
 *     <li>Top updated items by frequency</li>
 * </ul>
 *
 * <p>Intended for use in dashboards, analytics panels, or executive reports.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardSummaryDTO {

    /**
     * Current total stock quantity per supplier.
     */
    private List<StockPerSupplierDTO> stockPerSupplier;

    /**
     * Subset of items below their minimum stock threshold.
     * Typically limited to the top 3 most urgent items.
     */
    private List<LowStockItemDTO> lowStockItems;

    /**
     * Monthly additions/removals within the selected time frame.
     */
    private List<MonthlyStockMovementDTO> monthlyStockMovement;

    /**
     * Items with the highest number of stock changes.
     * Useful for highlighting frequently handled or volatile items.
     */
    private List<ItemUpdateFrequencyDTO> topUpdatedItems;
}
// Note: This DTO is designed to be flexible and extensible for future analytics needs.
