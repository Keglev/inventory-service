package com.smartsupplypro.inventory.repository.custom;

import java.util.List;

/**
 * Custom repository for aggregated stock KPI metrics and threshold monitoring.
 *
 * <p>Handles dashboard statistics that require GROUP BY aggregations and multi-dialect
 * native SQL — expressions not expressible as Spring Data derived query methods.</p>
 *
 * @see StockHistoryRepository
 */
public interface StockMetricsRepository {

    /**
     * Returns total stock quantity per supplier, ordered by quantity descending.
     *
     * <p>Result format: [supplier_name (String), total_quantity (Number)].
     *
     * @return per-supplier totals for dashboard KPI widgets
     */
    List<Object[]> getTotalStockBySupplier();

    /**
     * Returns stock update event counts per item with optional supplier filter.
     *
     * <p>Result format: [item_name (String), update_count (Number)].
     *
     * @param supplierId optional supplier filter (null returns all suppliers)
     * @return per-item counts ordered by update_count descending
     */
    List<Object[]> getUpdateCountByItem(String supplierId);

    /**
     * Returns items currently below their minimum stock threshold.
     *
     * <p>Result format: [name (String), quantity (Number), minimum_quantity (Number)].
     *
     * @param supplierId optional supplier filter (null returns all suppliers)
     * @return items below minimum ordered by severity (lowest quantity first)
     */
    List<Object[]> findItemsBelowMinimumStock(String supplierId);
}
