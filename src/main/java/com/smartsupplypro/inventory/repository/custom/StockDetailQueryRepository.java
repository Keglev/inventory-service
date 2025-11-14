package com.smartsupplypro.inventory.repository.custom;

import java.time.LocalDateTime;
import java.util.List;

import com.smartsupplypro.inventory.dto.StockEventRowDTO;

/**
 * Detail query repository for granular stock history searches and event streaming.
 *
 * <p>Provides flexible multi-criteria filtering for stock updates and sequential
 * event streaming for Weighted Average Cost (WAC) calculations.
 *
 * <p><strong>Use Cases</strong>:
 * <ul>
 *   <li>Advanced search with multiple filter combinations</li>
 *   <li>Audit trail queries (who changed what, when)</li>
 *   <li>WAC cost-flow algorithm event replay</li>
 * </ul>
 *
 * @author Smart Supply Pro Development Team
 * @version 1.0.0
 * @since 2.0.0
 * @see StockTrendAnalyticsRepository
 * @see StockMetricsRepository
 */
public interface StockDetailQueryRepository {

    /**
     * Returns stock updates with flexible multi-criteria filtering.
     *
     * <p>Supports optional filtering by date range, item name, supplier, creator,
     * and quantity change bounds. All filters are nullable (omit to ignore).
     *
     * <p><strong>Result format</strong>:
     * [item_name, supplier_name, quantity_change, reason, created_by, created_at]
     *
     * @param startDate optional minimum creation timestamp
     * @param endDate optional maximum creation timestamp
     * @param itemName optional item name filter (case-insensitive partial match)
     * @param supplierId optional supplier ID filter
     * @param createdBy optional creator username filter (case-insensitive exact match)
     * @param minChange optional minimum quantity change filter
     * @param maxChange optional maximum quantity change filter
     * @return filtered stock updates ordered by creation time descending
     */
    List<Object[]> searchStockUpdates(
        LocalDateTime startDate,
        LocalDateTime endDate,
        String itemName,
        String supplierId,
        String createdBy,
        Integer minChange,
        Integer maxChange
    );

    /**
     * Streams stock events up to specified time for WAC algorithm.
     *
     * <p>Provides time-ordered event stream for Weighted Average Cost calculations.
     * Events are sorted by item and timestamp to enable sequential replay for
     * opening inventory reconstruction and period-specific cost aggregations.
     *
     * @param end inclusive upper bound timestamp
     * @param supplierId optional supplier filter
     * @return ordered event stream projected to StockEventRowDTO
     */
    List<StockEventRowDTO> streamEventsForWAC(LocalDateTime end, String supplierId);
}
