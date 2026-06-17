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
 * Service contract for inventory analytics and dashboard reporting.
 *
 * <p>Defines stock valuation trends, supplier metrics, low-stock alerts,
 * movement summaries, price history, and WAC financial reporting.</p>
 *
 * @see AnalyticsServiceImpl
 */
public interface AnalyticsService {

    /**
     * Retrieves daily stock value over a date range with optional supplier filter.
     * Date bounds default to the last 30 days when null.
     *
     * @param startDate  start date (nullable)
     * @param endDate    end date (nullable)
     * @param supplierId optional supplier filter
     * @return daily stock valuations ordered by date ascending
     */
    List<StockValueOverTimeDTO> getTotalStockValueOverTime(LocalDate startDate, LocalDate endDate, String supplierId);

    /**
     * Returns current stock quantities grouped by supplier.
     * @return per-supplier inventory totals
     */
    List<StockPerSupplierDTO> getTotalStockPerSupplier();

    /**
     * Returns stock update frequency per item for a given supplier.
     * @param supplierId supplier ID (required)
     * @return update counts per item ordered by count descending
     */
    List<ItemUpdateFrequencyDTO> getItemUpdateFrequency(String supplierId);

    /**
     * Identifies items below minimum stock threshold for a given supplier.
     * @param supplierId supplier ID (required)
     * @return low-stock items ordered by current quantity ascending
     */
    List<LowStockItemDTO> getItemsBelowMinimumStock(String supplierId);

    /**
     * Returns monthly stock-in/out aggregations with optional filters.
     * Date bounds default to the last 30 days when null.
     *
     * @param startDate  start date (nullable)
     * @param endDate    end date (nullable)
     * @param supplierId optional supplier filter
     * @return monthly movement summaries ordered by month ascending
     */
    List<MonthlyStockMovementDTO> getMonthlyStockMovement(LocalDate startDate, LocalDate endDate, String supplierId);

    /**
     * Retrieves stock history events matching advanced filter criteria.
     * @param filter time, supplier, user, and quantity filters (required)
     * @return filtered stock update events ordered by timestamp descending
     */
    List<StockUpdateResultDTO> getFilteredStockUpdates(StockUpdateFilterDTO filter);

    /**
     * Retrieves historical price trend data for a given item.
     * @param itemId     item ID (required)
     * @param supplierId optional supplier filter
     * @param start      start date (inclusive, required)
     * @param end        end date (inclusive, required)
     * @return price data points ordered by date ascending
     */
    List<PriceTrendDTO> getPriceTrend(String itemId, String supplierId, LocalDate start, LocalDate end);

    /**
     * Retrieves WAC financial summary covering opening/ending inventory,
     * purchases, COGS, write-offs, and returns for a date range.
     *
     * @param from       start date (inclusive, required)
     * @param to         end date (inclusive, required)
     * @param supplierId optional supplier filter
     * @return aggregated WAC financial metrics
     */
    FinancialSummaryDTO getFinancialSummaryWAC(LocalDate from, LocalDate to, String supplierId);

    /**
     * Counts items below minimum stock threshold across all suppliers (KPI).
     * @return total count of low-stock items
     */
    long lowStockCount();

}
