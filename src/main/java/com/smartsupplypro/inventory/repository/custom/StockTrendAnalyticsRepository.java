package com.smartsupplypro.inventory.repository.custom;

import java.time.LocalDateTime;
import java.util.List;

import com.smartsupplypro.inventory.dto.PriceTrendDTO;

/**
 * Trend analytics repository for time-series stock and price analysis.
 *
 * <p>Provides aggregated historical data for reporting dashboards and charts,
 * including monthly stock movements, daily valuations, and price trends.
 *
 * <p><strong>Use Cases</strong>:
 * <ul>
 *   <li>Monthly stock-in/stock-out reports</li>
 *   <li>Daily inventory valuation tracking</li>
 *   <li>Item price trend analysis</li>
 * </ul>
 *
 * @author Smart Supply Pro Development Team
 * @version 1.0.0
 * @since 2.0.0
 * @see StockMetricsRepository
 * @see StockDetailQueryRepository
 */
public interface StockTrendAnalyticsRepository {

    /**
     * Returns monthly stock-in/stock-out aggregations for time window.
     *
     * <p><strong>Result format</strong>: [month (YYYY-MM), stockIn, stockOut]
     *
     * @param start inclusive lower bound
     * @param end inclusive upper bound
     * @return monthly aggregations ordered by month ascending
     */
    List<Object[]> getMonthlyStockMovement(LocalDateTime start, LocalDateTime end);

    /**
     * Returns monthly stock-in/stock-out filtered by supplier.
     *
     * <p><strong>Result format</strong>: [month (YYYY-MM), stockIn, stockOut]
     *
     * @param start inclusive lower bound
     * @param end inclusive upper bound
     * @param supplierId optional supplier filter
     * @return monthly aggregations ordered by month ascending
     */
    List<Object[]> getMonthlyStockMovementBySupplier(LocalDateTime start, LocalDateTime end, String supplierId);

    /**
     * Returns daily total stock value (quantity × price) over time window.
     *
     * <p>Computes closing quantity per item per day using cumulative sums,
     * then multiplies by price at that point. Aggregates across items.
     *
     * <p><strong>Result format</strong>: [day_date (DATE), total_value (Number)]
     *
     * @param start inclusive lower bound
     * @param end inclusive upper bound
     * @param supplierId optional supplier filter
     * @return daily valuations ordered by day ascending
     */
    List<Object[]> getDailyStockValuation(LocalDateTime start, LocalDateTime end, String supplierId);

    /**
     * Returns daily average price trend for specific item.
     *
     * <p><strong>Result format</strong>: PriceTrendDTO with day and avgPrice
     *
     * @param itemId required item identifier
     * @param supplierId optional supplier filter
     * @param start inclusive lower bound
     * @param end inclusive upper bound
     * @return daily price trend ordered by day ascending
     */
    List<PriceTrendDTO> getItemPriceTrend(String itemId, String supplierId, LocalDateTime start, LocalDateTime end);
}
