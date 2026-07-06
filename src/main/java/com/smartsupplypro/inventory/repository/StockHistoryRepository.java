package com.smartsupplypro.inventory.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.smartsupplypro.inventory.dto.PriceTrendDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.model.StockHistory;
import com.smartsupplypro.inventory.repository.custom.StockDetailQueryRepository;
import com.smartsupplypro.inventory.repository.custom.StockMetricsRepository;
import com.smartsupplypro.inventory.repository.custom.StockTrendAnalyticsRepository;

/**
 * Repository for {@link StockHistory} audit data with analytics support.
 *
 * <p>Extends three specialised custom repositories for complex analytics queries.
 * The Java field {@code timestamp} maps to DB column {@code CREATED_AT}; native SQL
 * uses the column name while JPQL uses the field name.</p>
 *
 * @see StockHistory
 * @see StockTrendAnalyticsRepository
 * @see StockMetricsRepository
 * @see StockDetailQueryRepository
 */
public interface StockHistoryRepository
        extends JpaRepository<StockHistory, String>,
                StockTrendAnalyticsRepository,
                StockMetricsRepository,
                StockDetailQueryRepository {

    /**
     * Returns a paginated, filtered view of stock history ordered by creation time descending.
     *
     * <p>All filter parameters are optional; pass {@code null} to omit a filter.
     * Uses a separate {@code countQuery} to avoid re-executing the JOIN for pagination counts.
     *
     * @param startDate  optional start timestamp (inclusive)
     * @param endDate    optional end timestamp (inclusive)
     * @param itemName   optional partial item name (case-insensitive)
     * @param supplierId optional supplier ID filter
     * @param pageable   pagination parameters
     * @return paginated stock history records
     */
    @Query(
        value = """
            SELECT s.*
            FROM stock_history s
            JOIN inventory_item i ON s.item_id = i.id
            WHERE (:startDate IS NULL OR s.CREATED_AT >= :startDate)
              AND (:endDate   IS NULL OR s.CREATED_AT <= :endDate)
              AND (:itemName  IS NULL OR LOWER(i.name) LIKE LOWER(CONCAT('%', :itemName, '%')))
              AND (:supplierId IS NULL OR s.SUPPLIER_ID = :supplierId)
            ORDER BY s.CREATED_AT DESC
        """,
        countQuery = """
            SELECT COUNT(*)
            FROM stock_history s
            JOIN inventory_item i ON s.item_id = i.id
            WHERE (:startDate IS NULL OR s.CREATED_AT >= :startDate)
              AND (:endDate   IS NULL OR s.CREATED_AT <= :endDate)
              AND (:itemName  IS NULL OR LOWER(i.name) LIKE LOWER(CONCAT('%', :itemName, '%')))
              AND (:supplierId IS NULL OR s.SUPPLIER_ID = :supplierId)
        """,
        nativeQuery = true
    )
    Page<StockHistory> findFiltered(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        @Param("itemName") String itemName,
        @Param("supplierId") String supplierId,
        Pageable pageable
    );

    /**
     * Aggregates stock movement per reason inside a time window, sign-split into
     * increase (positive changes) and decrease (absolute value of negative changes).
     *
     * <p>All filters besides the window are optional; pass {@code null} to omit.
     * String concatenation uses {@code ||} (portable across Oracle and H2).
     *
     * @param start      inclusive lower bound
     * @param end        inclusive upper bound
     * @param supplierId optional supplier filter
     * @param itemName   optional partial item name (case-insensitive)
     * @return rows of [reason, increase, decrease] ordered by reason ascending
     */
    @Query(
        value = """
            SELECT sh.reason,
                   SUM(CASE WHEN sh.quantity_change > 0 THEN sh.quantity_change ELSE 0 END) AS increase_qty,
                   SUM(CASE WHEN sh.quantity_change < 0 THEN ABS(sh.quantity_change) ELSE 0 END) AS decrease_qty
            FROM stock_history sh
            JOIN inventory_item i ON sh.item_id = i.id
            WHERE sh.created_at BETWEEN :start AND :end
              AND (:supplierId IS NULL OR sh.supplier_id = :supplierId)
              AND (:itemName IS NULL OR LOWER(i.name) LIKE LOWER('%' || :itemName || '%'))
            GROUP BY sh.reason
            ORDER BY sh.reason
        """,
        nativeQuery = true
    )
    List<Object[]> getReasonBreakdown(
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end,
        @Param("supplierId") String supplierId,
        @Param("itemName") String itemName
    );

    List<StockHistory> findByItemIdOrderByTimestampDesc(String itemId);

    List<StockHistory> findByReasonOrderByTimestampDesc(StockChangeReason reason);

    List<StockHistory> findByItemId(String itemId);

    List<StockHistory> findByReason(StockChangeReason reason);

    /**
     * Retrieves time-ordered price snapshots for an item within a date range.
     * Only entries with a non-null {@code priceAtChange} are included.
     *
     * @param itemId item ID
     * @param start  start timestamp (inclusive)
     * @param end    end timestamp (inclusive)
     * @return {@link PriceTrendDTO} projections ordered by timestamp ascending
     */
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
}
