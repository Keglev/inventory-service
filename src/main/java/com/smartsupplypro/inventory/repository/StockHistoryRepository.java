package com.smartsupplypro.inventory.repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Limit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.NativeQuery;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
    @NativeQuery("""
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
        """)
    List<Object[]> getReasonBreakdown(
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end,
        @Param("supplierId") String supplierId,
        @Param("itemName") String itemName
    );

    /**
     * Paginated per-employee change list joined with item and supplier names.
     *
     * <p>{@code createdBy} matches case-insensitively; pass {@code null} for all
     * employees. Ordering is fixed to newest first; callers pass an UNSORTED
     * {@link Pageable} (page/size only) because the ORDER BY is part of the SQL.
     *
     * @param start     inclusive lower bound
     * @param end       inclusive upper bound
     * @param createdBy optional creator (email) filter
     * @param pageable  page/size (unsorted)
     * @return rows of [itemName, supplierName, quantityChange, reason, createdBy, createdAt]
     */
    @NativeQuery(
        value = """
            SELECT i.name AS item_name,
                   s.name AS supplier_name,
                   sh.quantity_change,
                   sh.reason,
                   sh.created_by,
                   sh.created_at
            FROM stock_history sh
            JOIN inventory_item i ON sh.item_id = i.id
            LEFT JOIN supplier s ON sh.supplier_id = s.id
            WHERE sh.created_at BETWEEN :start AND :end
              AND (:createdBy IS NULL OR LOWER(sh.created_by) = LOWER(:createdBy))
              AND (:supplierId IS NULL OR sh.supplier_id = :supplierId)
            ORDER BY sh.created_at DESC
        """,
        countQuery = """
            SELECT COUNT(*)
            FROM stock_history sh
            WHERE sh.created_at BETWEEN :start AND :end
              AND (:createdBy IS NULL OR LOWER(sh.created_by) = LOWER(:createdBy))
              AND (:supplierId IS NULL OR sh.supplier_id = :supplierId)
        """)
    Page<Object[]> findEmployeeChanges(
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end,
        @Param("createdBy") String createdBy,
        @Param("supplierId") String supplierId,
        Pageable pageable
    );

    /**
     * Returns the item's recorded unit prices before a point in time, newest first.
     *
     * <p>Every history row snapshots the item's price, so the newest row before
     * {@code before} holds the price in force at that moment. The supplier filter
     * matches the item's current supplier, as the price-trend window query does.
     *
     * @param itemId     item identifier
     * @param supplierId optional supplier filter; {@code null} for any supplier
     * @param before     exclusive upper bound
     * @param limit      maximum number of prices to return
     * @return prices ordered by timestamp descending
     */
    @Query("""
        SELECT sh.priceAtChange
        FROM StockHistory sh, InventoryItem i
        WHERE i.id = sh.itemId
          AND sh.itemId = :itemId
          AND sh.timestamp < :before
          AND sh.priceAtChange IS NOT NULL
          AND (:supplierId IS NULL OR i.supplierId = :supplierId)
        ORDER BY sh.timestamp DESC
        """)
    List<BigDecimal> findPricesBefore(
        @Param("itemId") String itemId,
        @Param("supplierId") String supplierId,
        @Param("before") LocalDateTime before,
        Limit limit
    );
}
