package com.smartsupplypro.inventory.repository.custom;

import java.util.List;

/**
 * KPI metrics repository for dashboard statistics and inventory thresholds.
 *
 * <p>Provides aggregated metrics for operational dashboards, including
 * per-supplier totals, update frequencies, and stock threshold alerts.
 *
 * <p><strong>Use Cases</strong>:
 * <ul>
 *   <li>Dashboard KPI widgets (total stock by supplier)</li>
 *   <li>Activity monitoring (update counts per item)</li>
 *   <li>Stock alert systems (below minimum thresholds)</li>
 * </ul>
 *
 * @author Smart Supply Pro Development Team
 * @version 1.0.0
 * @since 2.0.0
 * @see StockTrendAnalyticsRepository
 * @see StockDetailQueryRepository
 */
public interface StockMetricsRepository {

    /**
     * Returns total stock quantity per supplier for dashboard KPIs.
     *
     * <p><strong>Result format</strong>: [supplier_name (String), total_quantity (Number)]
     *
     * @return per-supplier totals ordered by quantity descending
     */
    List<Object[]> getTotalStockBySupplier();

    /**
     * Returns stock update event count per item with optional supplier filtering.
     *
     * <p>Useful for identifying frequently updated items and activity patterns.
     *
     * <p><strong>Result format</strong>: [item_name (String), update_count (Number)]
     *
     * @param supplierId optional supplier filter
     * @return per-item update counts ordered by count descending
     */
    List<Object[]> getUpdateCountByItem(String supplierId);

    /**
     * Returns items currently below their minimum stock threshold.
     *
     * <p>Identifies stock alert candidates requiring replenishment action.
     *
     * <p><strong>Result format</strong>: [name (String), quantity (Number), minimum_quantity (Number)]
     *
     * @param supplierId optional supplier filter
     * @return items below minimum ordered by severity (lowest quantity first)
     */
    List<Object[]> findItemsBelowMinimumStock(String supplierId);
}
