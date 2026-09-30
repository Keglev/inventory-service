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
     * Returns, per item and day, the day's net quantity change and the unit price of the
     * day's last event, for the whole history up to {@code end}.
     *
     * <p>Not limited to a window: an item's quantity on any day is the sum of all its changes
     * since its INITIAL_STOCK entry, so valuing a day needs every earlier movement.
     * Result format: [item_id (String), day_date (DATE), net_change (Number), unit_price (Number)].
     *
     * @param end        inclusive upper bound
     * @param supplierId optional supplier filter
     * @return movements ordered by day, then item
     */
    List<Object[]> getDailyItemMovements(LocalDateTime end, String supplierId);

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
    List<Object[]> getDailyEmployeeActivity(LocalDateTime start, LocalDateTime end, String supplierId);
}
