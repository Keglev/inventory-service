package com.smartsupplypro.inventory.repository.custom;

import java.time.LocalDateTime;
import java.util.List;

import com.smartsupplypro.inventory.dto.PriceTrendDTO;
import com.smartsupplypro.inventory.dto.StockEventRowDTO;

/**
 * Custom repository interface for database-specific stock history analytics queries.
 *
 * <p><strong>Purpose</strong>:
 * Supports conditional SQL syntax for H2 (testing) and Oracle (production),
 * keeping services database-agnostic while enabling performance-optimized native queries.
 *
 * <p><strong>Capabilities</strong>:
 * <ul>
 *   <li><strong>Monthly Aggregations</strong>: Stock-in/stock-out by month</li>
 *   <li><strong>Value Tracking</strong>: Daily stock value trends</li>
 *   <li><strong>Dashboard Analytics</strong>: Per-supplier totals, update counts</li>
 *   <li><strong>Low Stock Alerts</strong>: Items below minimum thresholds</li>
 *   <li><strong>Advanced Filtering</strong>: Multi-criteria tabular exports</li>
 *   <li><strong>Price Trends</strong>: Historical price snapshots per item</li>
 *   <li><strong>WAC Support</strong>: Event streaming for cost-flow calculations</li>
 * </ul>
 *
 * @see StockHistoryCustomRepositoryImpl
 * @see <a href="file:../../../../../../../docs/architecture/patterns/repository-patterns.md">Repository Patterns</a>
 */
public interface StockHistoryCustomRepository  {

    /**
     * Retrieves monthly stock movement (all suppliers) using native SQL.
     * Returns: [month, stockIn, stockOut]
     *
     * @param start start date (inclusive)
     * @param end end date (inclusive)
     * @return monthly aggregations
     */
    List<Object[]> getMonthlyStockMovement(LocalDateTime start, LocalDateTime end);

    /**
     * Retrieves monthly stock movement filtered by supplier using native SQL.
     * Returns: [month, stockIn, stockOut]
     *
     * @param start start date (inclusive)
     * @param end end date (inclusive)
     * @param supplierId optional supplier filter
     * @return monthly aggregations
     */
    List<Object[]> getMonthlyStockMovementFiltered(LocalDateTime start, LocalDateTime end, String supplierId);

    /**
     * Calculates daily stock value (quantity × price) with supplier/date filtering.
     * Returns: [date, totalValue]
     *
     * @param start start timestamp
     * @param end end timestamp
     * @param supplierId optional supplier filter
     * @return daily value aggregations
     */
    List<Object[]> getStockValueGroupedByDateFiltered(LocalDateTime start, LocalDateTime end, String supplierId);

    /**
     * Returns total stock quantity per supplier for dashboard.
     * Returns: [supplierName, totalQuantity]
     *
     * @return per-supplier totals
     */
    List<Object[]> getTotalStockPerSupplier();

    /**
     * Returns update count per item with optional supplier filter.
     * Returns: [itemName, updateCount]
     *
     * @param supplierId optional supplier filter
     * @return item update frequencies
     */
    List<Object[]> getUpdateCountPerItemFiltered(String supplierId);

    /**
     * Lists items below minimum stock threshold with optional supplier filter.
     * Returns: [itemName, quantity, minimumQuantity]
     *
     * @param supplierId optional supplier filter
     * @return low-stock items
     */
    List<Object[]> findItemsBelowMinimumStockFiltered(String supplierId);

    /**
     * Advanced multi-criteria filter for tabular stock history exports.
     *
     * @param startDate start timestamp (optional)
     * @param endDate end timestamp (optional)
     * @param itemName item name filter (optional)
     * @param supplierId supplier filter (optional)
     * @param createdBy creator username filter (optional)
     * @param minChange minimum quantity (optional)
     * @param maxChange maximum quantity (optional)
     * @return filtered stock history data
     */
    List<Object[]> findFilteredStockUpdates(
            LocalDateTime startDate,
            LocalDateTime endDate,
            String itemName,
            String supplierId,
            String createdBy,
            Integer minChange,
            Integer maxChange
    );

    /**
     * Retrieves price trend data for specific item within date range.
     *
     * @param itemId item ID
     * @param supplierId supplier ID (optional)
     * @param start start date (inclusive)
     * @param end end date (inclusive)
     * @return price trend data points
     */
    List<PriceTrendDTO> getPriceTrend(String itemId, String supplierId, LocalDateTime start, LocalDateTime end);

    /**
     * Streams stock events ordered by item then timestamp for WAC ledger calculations.
     *
     * @param end upper bound (inclusive)
     * @param supplierId optional supplier filter
     * @return ordered event rows for cost-flow calculation
     */
    List<StockEventRowDTO> findEventsUpTo(LocalDateTime end, String supplierId);

}
