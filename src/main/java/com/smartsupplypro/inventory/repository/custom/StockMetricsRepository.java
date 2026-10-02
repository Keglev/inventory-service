package com.smartsupplypro.inventory.repository.custom;

import java.util.List;

/**
 * Custom repository for aggregated stock KPI metrics.
 *
 * <p>Handles dashboard statistics that require GROUP BY aggregations and multi-dialect
 * native SQL — expressions not expressible as Spring Data derived query methods.</p>
 *
 * @see StockHistoryRepository
 */
public interface StockMetricsRepository {

    /**
     * Returns stock quantity and value per supplier over active items, ordered by
     * value descending, then supplier name.
     *
     * <p>Result format: [supplier_name (String), total_quantity (Number),
     * total_value (Number)], the value being quantity times current unit price.
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
}
