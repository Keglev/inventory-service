package com.smartsupplypro.inventory.repository.custom;

import java.time.LocalDateTime;
import java.util.List;
import com.smartsupplypro.inventory.dto.StockEventRowDTO;

import com.smartsupplypro.inventory.dto.PriceTrendDTO;

/**
 * Custom repository interface for StockHistory, used to support
 * database-specific SQL fallbacks or optimized native queries.
 *
 * <p>This interface defines all native query methods that require
 * conditional SQL syntax depending on the active Spring profile
 * (e.g., H2 for testing, Oracle in production).
 */
public interface StockHistoryCustomRepository  {

    /**
     * Retrieves monthly stock movement (all suppliers).
     * Uses native SQL (TO_CHAR or FORMATDATETIME).
     *
     * @param start Start date (inclusive)
     * @param end   End date (inclusive)
     * @return List of Object[] { month, stockIn, stockOut }
     */
    List<Object[]> getMonthlyStockMovement(LocalDateTime start, LocalDateTime end);

    /**
     * Retrieves monthly stock movement for a given supplier.
     * Uses native SQL with supplier filtering.
     *
     * @param start      Start date (inclusive)
     * @param end        End date (inclusive)
     * @param supplierId Optional supplier ID
     * @return List of Object[] { month, stockIn, stockOut }
     */
    List<Object[]> getMonthlyStockMovementFiltered(LocalDateTime start, LocalDateTime end, String supplierId);

    /**
     * Calculates total stock value per day (quantity × price),
     * filtered by supplier and date range.
     *
     * @param start      Start timestamp
     * @param end        End timestamp
     * @param supplierId Optional supplier ID
     * @return List of Object[] { date, totalValue }
     */
    List<Object[]> getStockValueGroupedByDateFiltered(LocalDateTime start, LocalDateTime end, String supplierId);

    /**
     * Returns total quantity of stock per supplier for dashboard.
     *
     * @return List of Object[] { supplierName, totalQuantity }
     */
    List<Object[]> getTotalStockPerSupplier();

    /**
     * Returns number of stock changes per item, optionally filtered by supplier.
     *
     * @param supplierId Optional supplier ID
     * @return List of Object[] { itemName, updateCount }
     */
    List<Object[]> getUpdateCountPerItemFiltered(String supplierId);

    /**
     * Lists all items where stock is below the minimum quantity.
     *
     * @param supplierId Optional supplier ID
     * @return List of Object[] { itemName, quantity, minimumQuantity }
     */
    List<Object[]> findItemsBelowMinimumStockFiltered(String supplierId);

    /**
     * Advanced stock update filter used for tabular exports.
     *
     * @param startDate  Start timestamp (optional)
     * @param endDate    End timestamp (optional)
     * @param itemName   Item name filter (optional)
     * @param supplierId Supplier ID filter (optional)
     * @param createdBy  Creator username filter (optional)
     * @param minChange  Minimum quantity (optional)
     * @param maxChange  Maximum quantity (optional)
     * @return List of Object[] with tabular stock history data
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
     * Retrieves price trend data for a specific item
     * within a date range.
     * @param itemId Item ID to filter by
     * @param start Start date (inclusive)
     * @param end End date (inclusive)
     * @return List of PriceTrendDTO containing price trend data
     * 
     * */
    List<PriceTrendDTO> getPriceTrend(String itemId, String supplierId, LocalDateTime start, LocalDateTime end);

    /**
    * Streams stock events up to a given time (inclusive), ordered by item then createdAt.
    * Used by the WAC ledger to compute opening state and in-period totals.
    * Uses entity property names (createdAt, quantityChange), portable across H2/Oracle.
    *
    * @param end        upper bound (inclusive)
    * @param supplierId optional supplier filter (null = all)
    * @return ordered event rows for cost-flow calculation
    */
    List<StockEventRowDTO> findEventsUpTo(LocalDateTime end, String supplierId);

}
