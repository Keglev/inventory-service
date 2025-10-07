package com.smartsupplypro.inventory.service;

import java.time.LocalDate;
import java.util.List;

import com.smartsupplypro.inventory.dto.FinancialSummaryDTO;
import com.smartsupplypro.inventory.dto.ItemUpdateFrequencyDTO;
import com.smartsupplypro.inventory.dto.LowStockItemDTO;
import com.smartsupplypro.inventory.dto.MonthlyStockMovementDTO;
import com.smartsupplypro.inventory.dto.PriceTrendDTO;
import com.smartsupplypro.inventory.dto.StockPerSupplierDTO;
import com.smartsupplypro.inventory.dto.StockUpdateFilterDTO;
import com.smartsupplypro.inventory.dto.StockUpdateResultDTO;
import com.smartsupplypro.inventory.dto.StockValueOverTimeDTO;

/**
 * Service interface for inventory analytics and dashboard reporting.
 *
 * <p><strong>Capabilities</strong>:
 * <ul>
 *   <li><strong>Stock Valuation</strong>: Daily trends over time with supplier filtering</li>
 *   <li><strong>Supplier Analytics</strong>: Per-supplier stock distribution and performance</li>
 *   <li><strong>Low Stock Alerts</strong>: Items below minimum thresholds</li>
 *   <li><strong>Movement Analysis</strong>: Monthly stock-in/stock-out summaries</li>
 *   <li><strong>Financial Reporting</strong>: Weighted Average Cost (WAC) summaries</li>
 *   <li><strong>Price Trends</strong>: Historical price tracking per item</li>
 * </ul>
 *
 * @see AnalyticsServiceImpl
 */
public interface AnalyticsService {

    /**
     * Retrieves daily stock value over date range with optional supplier filter.
     *
     * @param startDate start date (nullable, defaults to last 30 days)
     * @param endDate end date (nullable, defaults to today)
     * @param supplierId optional supplier filter
     * @return list of daily stock valuations
     */
    List<StockValueOverTimeDTO> getTotalStockValueOverTime(LocalDate startDate, LocalDate endDate, String supplierId);

    /**
     * Returns current stock quantities grouped by supplier.
     *
     * @return per-supplier inventory totals
     */
    List<StockPerSupplierDTO> getTotalStockPerSupplier();

    /**
     * Returns item update frequency for given supplier.
     *
     * @param supplierId supplier ID (required)
     * @return update counts per item
     */
    List<ItemUpdateFrequencyDTO> getItemUpdateFrequency(String supplierId);

    /**
     * Identifies items below minimum stock threshold for given supplier.
     *
     * @param supplierId supplier ID (required)
     * @return low-stock items requiring attention
     */
    List<LowStockItemDTO> getItemsBelowMinimumStock(String supplierId);

    /**
     * Returns monthly stock-in/stock-out aggregations with optional filters.
     *
     * @param startDate start date (nullable, defaults to last 30 days)
     * @param endDate end date (nullable, defaults to today)
     * @param supplierId optional supplier filter
     * @return monthly movement summaries
     */
    List<MonthlyStockMovementDTO> getMonthlyStockMovement(LocalDate startDate, LocalDate endDate, String supplierId);

    /**
     * Retrieves stock history events matching advanced filter criteria.
     *
     * @param filter time, supplier, user, and quantity filters
     * @return filtered stock update events
     */
    List<StockUpdateResultDTO> getFilteredStockUpdates(StockUpdateFilterDTO filter);

    /**
     * Retrieves historical price trend data for given item.
     *
     * @param itemId inventory item ID (required)
     * @param supplierId optional supplier filter
     * @param start start date (inclusive)
     * @param end end date (inclusive)
     * @return price history data points
     */
    List<PriceTrendDTO> getPriceTrend(String itemId, String supplierId, LocalDate start, LocalDate end);

    /**
     * Retrieves Weighted Average Cost (WAC) financial summary for date range.
     * Includes opening/ending inventory, purchases, COGS, write-offs, and returns.
     *
     * @param from start date (inclusive)
     * @param to end date (inclusive)
     * @param supplierId optional supplier filter
     * @return aggregated financial metrics
     */
    FinancialSummaryDTO getFinancialSummaryWAC(LocalDate from, LocalDate to, String supplierId);

    /**
     * Counts items below minimum stock threshold across all suppliers (KPI).
     *
     * @return total count of low-stock items
     */
    long lowStockCount();

}

