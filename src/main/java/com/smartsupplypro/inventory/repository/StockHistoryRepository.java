package com.smartsupplypro.inventory.repository;

import com.smartsupplypro.inventory.dto.PriceTrendDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.model.StockHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for managing {@link StockHistory} entities.
 * <p>
 * Provides full audit trail access, historical reporting, and
 * advanced filtering capabilities, including support for dashboard visualizations.
 */
public interface StockHistoryRepository extends JpaRepository<StockHistory, String> {

    /**
     * Retrieves paginated stock history entries based on optional filters:
     * date range, item name, and supplier ID.
     *
     * @param startDate   Start of date range (optional)
     * @param endDate     End of date range (optional)
     * @param itemName    Item name to search (optional, case-insensitive)
     * @param supplierId  Supplier ID filter (optional)
     * @param pageable    Pagination configuration
     * @return Page of filtered stock history records
     */
    @Query("""
        SELECT s FROM StockHistory s 
        JOIN InventoryItem i ON s.itemId = i.id
        WHERE (:startDate IS NULL OR s.timestamp >= :startDate)
          AND (:endDate IS NULL OR s.timestamp <= :endDate)
          AND (:itemName IS NULL OR LOWER(i.name) LIKE LOWER(CONCAT('%', :itemName, '%')))
          AND (:supplierId IS NULL OR i.supplier.id = :supplierId)
        """)
    Page<StockHistory> findFiltered(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        @Param("itemName") String itemName,
        @Param("supplierId") String supplierId,
        Pageable pageable
    );

    /**
     * Finds all stock history records for a given inventory item.
     *
     * @param itemId Inventory item ID
     * @return List of stock changes for the item
     */
    List<StockHistory> findByItemId(String itemId);

    /**
     * Finds stock history records by reason code.
     *
     * @param reason Enum reason (e.g., SOLD, SCRAPPED)
     * @return List of matching history entries
     */
    List<StockHistory> findByReason(StockChangeReason reason);

    /**
     * Aggregates stock value per day based on quantity × price.
     *
     * @param start      Start date
     * @param end        End date
     * @param supplierId Supplier filter (optional)
     * @return List of Object[] { date, totalValue }
     */
    @Query(value = """
        SELECT TRUNC(sh.timestamp), SUM(sh.change * i.price)
        FROM stock_history sh
        JOIN inventory_item i ON sh.item_id = i.id
        WHERE sh.timestamp BETWEEN :start AND :end
          AND (:supplierId IS NULL OR i.supplier_id = :supplierId)
        GROUP BY TRUNC(sh.timestamp)
        ORDER BY TRUNC(sh.timestamp)
        """, nativeQuery = true)
    List<Object[]> getStockValueGroupedByDateFiltered(
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end,
        @Param("supplierId") String supplierId
    );

    /**
     * Returns total quantity of stock held by each supplier.
     *
     * @return List of Object[] { supplierName, totalQuantity }
     */
    @Query(value = """
        SELECT s.name AS supplier_name, SUM(i.quantity) AS total_quantity
        FROM supplier s
        JOIN inventory_item i ON s.id = i.supplier_id
        GROUP BY s.name
        ORDER BY total_quantity DESC
        """, nativeQuery = true)
    List<Object[]> getTotalStockPerSupplier();

    /**
     * Returns update frequency per item (for dashboard).
     *
     * @param supplierId Supplier filter (optional)
     * @return List of Object[] { itemName, updateCount }
     */
    @Query(value = """
        SELECT i.name AS item_name, COUNT(sh.id) AS update_count
        FROM stock_history sh
        JOIN inventory_item i ON sh.item_id = i.id
        WHERE (:supplierId IS NULL OR i.supplier_id = :supplierId)
        GROUP BY i.name
        ORDER BY update_count DESC
        """, nativeQuery = true)
    List<Object[]> getUpdateCountPerItemFiltered(@Param("supplierId") String supplierId);

    /**
     * Retrieves monthly stock movement (global).
     *
     * @param start Start date
     * @param end   End date
     * @return List of Object[] { month, stockIn, stockOut }
     */
    @Query(value = """
        SELECT TO_CHAR(sh.timestamp, 'YYYY-MM') AS month,
               SUM(CASE WHEN sh.change > 0 THEN sh.change ELSE 0 END) AS stock_in,
               SUM(CASE WHEN sh.change < 0 THEN ABS(sh.change) ELSE 0 END) AS stock_out
        FROM stock_history sh
        WHERE sh.timestamp BETWEEN :start AND :end
        GROUP BY TO_CHAR(sh.timestamp, 'YYYY-MM')
        ORDER BY month
        """, nativeQuery = true)
    List<Object[]> getMonthlyStockMovement(
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end
    );

    /**
     * Retrieves monthly stock movement per supplier.
     *
     * @param start      Start date
     * @param end        End date
     * @param supplierId Supplier ID filter
     * @return List of Object[] { month, stockIn, stockOut }
     */
    @Query(value = """
        SELECT TO_CHAR(sh.timestamp, 'YYYY-MM') AS month,
               SUM(CASE WHEN sh.change > 0 THEN sh.change ELSE 0 END) AS stock_in,
               SUM(CASE WHEN sh.change < 0 THEN ABS(sh.change) ELSE 0 END) AS stock_out
        FROM stock_history sh
        JOIN inventory_item i ON sh.item_id = i.id
        WHERE sh.timestamp BETWEEN :start AND :end
          AND (:supplierId IS NULL OR i.supplier_id = :supplierId)
        GROUP BY TO_CHAR(sh.timestamp, 'YYYY-MM')
        ORDER BY month
        """, nativeQuery = true)
    List<Object[]> getMonthlyStockMovementFiltered(
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end,
        @Param("supplierId") String supplierId
    );

    /**
     * Returns low-stock items where quantity is below minimum threshold.
     *
     * @param supplierId Optional supplier filter
     * @return List of Object[] { itemName, quantity, minimumQuantity }
     */
    @Query(value = """
        SELECT name, quantity, minimum_quantity
        FROM inventory_item
        WHERE quantity < minimum_quantity
          AND (:supplierId IS NULL OR supplier_id = :supplierId)
        ORDER BY quantity ASC
        """, nativeQuery = true)
    List<Object[]> findItemsBelowMinimumStockFiltered(@Param("supplierId") String supplierId);

    /**
     * Advanced reporting: Filtered stock history records for tabular export.
     *
     * @param startDate  Optional start timestamp
     * @param endDate    Optional end timestamp
     * @param itemName   Optional item name (partial match)
     * @param supplierId Optional supplier ID
     * @param createdBy  Optional creator username
     * @param minChange  Optional minimum quantity threshold
     * @param maxChange  Optional maximum quantity threshold
     * @return List of Object[] { itemName, supplierName, change, reason, createdBy, timestamp }
     */
    @Query(value = """
        SELECT i.name AS item_name, s.name AS supplier_name, sh.change, sh.reason, sh.created_by, sh.timestamp
        FROM stock_history sh
        JOIN inventory_item i ON sh.item_id = i.id
        JOIN supplier s ON i.supplier_id = s.id
        WHERE (:startDate IS NULL OR sh.timestamp >= :startDate)
          AND (:endDate IS NULL OR sh.timestamp <= :endDate)
          AND (:itemName IS NULL OR LOWER(i.name) LIKE LOWER(CONCAT('%', :itemName, '%')))
          AND (:supplierId IS NULL OR i.supplier_id = :supplierId)
          AND (:createdBy IS NULL OR LOWER(sh.created_by) = LOWER(:createdBy))
          AND (:minChange IS NULL OR sh.change >= :minChange)
          AND (:maxChange IS NULL OR sh.change <= :maxChange)
        ORDER BY sh.timestamp DESC
        """, nativeQuery = true)
    List<Object[]> findFilteredStockUpdates(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        @Param("itemName") String itemName,
        @Param("supplierId") String supplierId,
        @Param("createdBy") String createdBy,
        @Param("minChange") Integer minChange,
        @Param("maxChange") Integer maxChange
    );
    @Query("""
        SELECT new com.smartsupplypro.inventory.dto.PriceTrendDTO(sh.timestamp, sh.priceAtChange)
        FROM StockHistory sh
        WHERE sh.itemId = :itemId
            AND sh.timestamp BETWEEN :start AND :end
            AND sh.priceAtChange IS NOT NULL
            ORDER BY sh.timestamp
        """)
    List<PriceTrendDTO> getPriceTrend(
        @Param("itemId") String itemId,
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end
    );

    @Query("""
        SELECT new com.smartsupplypro.inventory.dto.PriceTrendDTO(sh.timestamp, sh.priceAtChange)
        FROM StockHistory sh
        JOIN InventoryItem i on sh.itemId = i.id
        WHERE sh.itemId = :itemId
            AND (:supplierId IS NULL OR i.supplier.id = :supplierId)
            AND sh.timestamp BETWEEN :start AND :end
            AND sh.priceAtChange IS NOT NULL
            ORDER BY sh.timestamp
        """)
    List<PriceTrendDTO> getPriceTrend(
        @Param("itemId") String itemId,
        @Param("supplierId") String supplierId,
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end
    );

}
/**
 * This repository interface provides methods for querying stock history data
 * with advanced filtering and aggregation capabilities, suitable for reporting
 * and dashboard visualizations.
 * <p>
 * It supports pagination, date range filtering, item and supplier searches,
 * and various aggregations to facilitate comprehensive inventory management.
 */