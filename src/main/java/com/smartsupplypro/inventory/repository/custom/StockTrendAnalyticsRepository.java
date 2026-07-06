package com.smartsupplypro.inventory.repository.custom;

import java.time.LocalDateTime;
import java.util.List;

import com.smartsupplypro.inventory.dto.PriceTrendDTO;

/**
 * Custom repository for time-series stock and price trend analytics.
 *
 * <p>Handles monthly aggregations, daily valuations, and price trends that require
 * dialect-specific date functions (TO_CHAR, TRUNC, YEAR/MONTH) not available
 * through Spring Data derived query methods.</p>
 *
 * @see StockHistoryRepository
 */
public interface StockTrendAnalyticsRepository {

    /**
     * Returns monthly stock-in/stock-out aggregations over a time window.
     *
     * <p>Result format: [month (YYYY-MM String), stockIn (Number), stockOut (Number)].
     *
     * @param start inclusive lower bound
     * @param end   inclusive upper bound
     * @return monthly aggregations ordered by month ascending
     */
    List<Object[]> getMonthlyStockMovement(LocalDateTime start, LocalDateTime end);

    /**
     * Returns monthly stock-in/stock-out aggregations filtered by supplier.
     *
     * <p>Result format: [month (YYYY-MM String), stockIn (Number), stockOut (Number)].
     *
     * @param start      inclusive lower bound
     * @param end        inclusive upper bound
     * @param supplierId optional supplier filter
     * @return monthly aggregations ordered by month ascending
     */
    List<Object[]> getMonthlyStockMovementBySupplier(LocalDateTime start, LocalDateTime end, String supplierId);

    /**
     * Returns daily total inventory value (closing quantity × price) over a time window.
     *
     * <p>Computes the closing quantity per item per day using cumulative window sums,
     * then multiplies by the price at that point and aggregates across all items.
     * Result format: [day_date (DATE), total_value (Number)].
     *
     * @param start      inclusive lower bound
     * @param end        inclusive upper bound
     * @param supplierId optional supplier filter
     * @return daily valuations ordered by day ascending
     */
    List<Object[]> getDailyStockValuation(LocalDateTime start, LocalDateTime end, String supplierId);

    /**
     * Returns the daily average price trend for a specific item.
     *
     * <p>Result format: {@link PriceTrendDTO} with day (YYYY-MM-DD) and avgPrice.
     *
     * @param itemId     required item identifier
     * @param supplierId optional supplier filter
     * @param start      inclusive lower bound
     * @param end        inclusive upper bound
     * @return daily price trend ordered by day ascending
     */
    List<PriceTrendDTO> getItemPriceTrend(String itemId, String supplierId, LocalDateTime start, LocalDateTime end);

    /**
     * Returns per-employee daily change counts inside a time window.
     *
     * <p>Result rows: [createdBy, day (YYYY-MM-DD string), changeCount],
     * ordered by day ascending then creator. Weekly/monthly rollups are a
     * service-layer concern.
     *
     * @param start inclusive lower bound
     * @param end   inclusive upper bound
     * @return raw aggregation rows
     */
    List<Object[]> getDailyEmployeeActivity(LocalDateTime start, LocalDateTime end);
}
