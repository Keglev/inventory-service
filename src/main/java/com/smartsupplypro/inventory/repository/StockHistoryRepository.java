package com.smartsupplypro.inventory.repository;

import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.model.StockHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface StockHistoryRepository extends JpaRepository<StockHistory, String> {

    // For paginated admin view
    @Query("""
        SELECT s FROM StockHistory s 
        JOIN InventoryItem i ON s.itemId = i.id
        WHERE (:startDate IS NULL OR s.timestamp >= :startDate)
          AND (:endDate IS NULL OR s.timestamp <= :endDate)
          AND (:itemName IS NULL OR LOWER(i.name) LIKE LOWER(CONCAT('%', :itemName, '%')))
          AND (:supplierId IS NULL OR i.supplierId = :supplierId)
        """)
    Page<StockHistory> findFiltered(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        @Param("itemName") String itemName,
        @Param("supplierId") String supplierId,
        Pageable pageable
    );

    List<StockHistory> findByItemId(String itemId);
    List<StockHistory> findByReason(StockChangeReason reason);

    // Chart: Stock value over time
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

    // Chart: Total stock quantity per supplier
    @Query(value = """
        SELECT s.name AS supplier_name, SUM(i.quantity) AS total_quantity
        FROM supplier s
        JOIN inventory_item i ON s.id = i.supplier_id
        GROUP BY s.name
        ORDER BY total_quantity DESC
        """, nativeQuery = true)
    List<Object[]> getTotalStockPerSupplier();

    // Chart: Item update frequency
    @Query(value = """
        SELECT i.name AS item_name, COUNT(sh.id) AS update_count
        FROM stock_history sh
        JOIN inventory_item i ON sh.item_id = i.id
        WHERE (:supplierId IS NULL OR i.supplier_id = :supplierId)
        GROUP BY i.name
        ORDER BY update_count DESC
        """, nativeQuery = true)
    List<Object[]> getUpdateCountPerItemFiltered(@Param("supplierId") String supplierId);

    // Chart: Monthly stock movement (all)
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

    // Chart: Monthly stock movement (filtered)
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

    // Table: Low-stock items (filtered)
    @Query(value = """
        SELECT name, quantity, minimum_quantity
        FROM inventory_item
        WHERE quantity < minimum_quantity
          AND (:supplierId IS NULL OR supplier_id = :supplierId)
        ORDER BY quantity ASC
        """, nativeQuery = true)
    List<Object[]> findItemsBelowMinimumStockFiltered(@Param("supplierId") String supplierId);

    // Advanced analytics: Filtered stock history results
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
}
