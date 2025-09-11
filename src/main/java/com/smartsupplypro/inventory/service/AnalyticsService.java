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
 * Service interface for inventory analytics and dashboard reporting operations.
 * <p>
 * Provides business-layer contract for querying stock-related statistics such as
 * value trends, supplier-wise stock distribution, low stock warnings, item update
 * frequencies, and monthly movement summaries.
 * </p>
 *
 * <p>
 * Implementations of this interface should aggregate and transform raw inventory data
 * into structured DTOs for frontend consumption and decision-making support.
 * </p>
 *
 * <p><b>Key Use Cases:</b></p>
 * <ul>
 *   <li>Visualize stock valuation trends over time</li>
 *   <li>Identify top/bottom performing suppliers</li>
 *   <li>Trigger low-stock alerts</li>
 *   <li>Analyze monthly inventory movements</li>
 *   <li>Export filtered inventory activity logs</li>
 * </ul>
 *
 * @author SmartSupply
 */
public interface AnalyticsService {

    /**
     * Retrieves the total daily stock value across the selected date range,
     * optionally filtered by supplier.
     *
     * @param startDate  the start date (nullable, defaults to last 30 days)
     * @param endDate    the end date (nullable, defaults to today)
     * @param supplierId optional supplier ID filter
     * @return list of {@link StockValueOverTimeDTO} representing daily stock valuation
     */
    List<StockValueOverTimeDTO> getTotalStockValueOverTime(LocalDate startDate, LocalDate endDate, String supplierId);

    /**
     * Returns current total stock quantities grouped by supplier.
     *
     * @return list of {@link StockPerSupplierDTO} representing per-supplier inventory totals
     */
    List<StockPerSupplierDTO> getTotalStockPerSupplier();

    /**
     * Returns how frequently items have been updated for the given supplier.
     *
     * @param supplierId the supplier ID (required)
     * @return list of {@link ItemUpdateFrequencyDTO} containing update counts per item
     */
    List<ItemUpdateFrequencyDTO> getItemUpdateFrequency(String supplierId);

    /**
     * Identifies all items below their minimum stock threshold for the given supplier.
     *
     * @param supplierId the supplier ID (required)
     * @return list of {@link LowStockItemDTO} containing warning-level stock items
     */
    List<LowStockItemDTO> getItemsBelowMinimumStock(String supplierId);

    /**
     * Returns monthly aggregation of stock-in and stock-out movements
     * within the selected date range and supplier filter.
     *
     * @param startDate  start date (nullable, defaults to last 30 days)
     * @param endDate    end date (nullable, defaults to today)
     * @param supplierId optional supplier ID
     * @return list of {@link MonthlyStockMovementDTO} showing monthly trends
     */
    List<MonthlyStockMovementDTO> getMonthlyStockMovement(LocalDate startDate, LocalDate endDate, String supplierId);

    /**
     * Applies advanced filtering to retrieve raw stock history events matching multiple criteria.
     *
     * @param filter the {@link StockUpdateFilterDTO} with time, supplier, user, and quantity filters
     * @return list of {@link StockUpdateResultDTO} matching the filter
     */
    List<StockUpdateResultDTO> getFilteredStockUpdates(StockUpdateFilterDTO filter);

    /**
    * Retrieves historical price trend data for a given inventory item,
    * optionally filtered by supplier.
    *
    * @param itemId the ID of the inventory item (required)
    * @param supplierId optional supplier filter (nullable)
    * @param start start date (inclusive)
    * @param end end date (inclusive)
    * @return list of {@link PriceTrendDTO} containing price history
    */
    List<PriceTrendDTO> getPriceTrend(String itemId, String supplierId, LocalDate start, LocalDate end);


    /** WAC summary (purchases, COGS, write-offs, returns, opening/ending) for [from..to]. */
    FinancialSummaryDTO getFinancialSummaryWAC(LocalDate from, LocalDate to, String supplierId);

    /**
     * @return total number of items below their minimum stock across all suppliers.
     * items where quantity < 5 (absolute KPI threshold)
     */
    long lowStockCount();

}

