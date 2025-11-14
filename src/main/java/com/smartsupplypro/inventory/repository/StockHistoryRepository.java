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
 * Repository for stock history audit data with analytics support.
 *
 * <p><strong>Capabilities</strong>:
 * <ul>
 *   <li><strong>Paginated Filtering</strong>: Time range, item name, supplier queries</li>
 *   <li><strong>Ordered Finders</strong>: Newest-first sorting to avoid in-memory sorts</li>
 *   <li><strong>Price Trends</strong>: Historical price snapshots for item analytics</li>
 *   <li><strong>Custom Queries</strong>: Extends specialized analytics repositories for complex operations</li>
 * </ul>
 *
 * <p><strong>Design Notes</strong>:
 * <ul>
 *   <li>Java field <code>timestamp</code> maps to DB column <code>CREATED_AT</code></li>
 *   <li>Denormalized <code>supplierId</code> on stock_history for index-friendly analytics</li>
 *   <li>Native SQL uses <code>CREATED_AT</code>, JPQL uses <code>timestamp</code></li>
 *   <li>Stable default ordering (CREATED_AT DESC) in native queries</li>
 * </ul>
 *
 * @see StockHistory
 * @see StockTrendAnalyticsRepository
 * @see StockMetricsRepository
 * @see StockDetailQueryRepository
 * @see <a href="file:../../../../../../docs/architecture/patterns/repository-patterns.md">Repository Patterns</a>
 */
public interface StockHistoryRepository
        extends JpaRepository<StockHistory, String>,
                StockTrendAnalyticsRepository,
                StockMetricsRepository,
                StockDetailQueryRepository {

    /**
     * Paginated stock history with optional time/item/supplier filters.
     * Stable ordering by CREATED_AT DESC (native SQL).
     *
     * @param startDate optional start (inclusive)
     * @param endDate optional end (inclusive)
     * @param itemName optional partial item name match
     * @param supplierId optional supplier filter
     * @param pageable pagination parameters
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
     * Finds all records for item ordered newest first (uses timestamp field).
     *
     * @param itemId inventory item ID
     * @return ordered stock history records
     */
    List<StockHistory> findByItemIdOrderByTimestampDesc(String itemId);

    /**
     * Finds all records by reason ordered newest first (uses timestamp field).
     *
     * @param reason stock change reason
     * @return ordered stock history records
     */
    List<StockHistory> findByReasonOrderByTimestampDesc(StockChangeReason reason);

    /**
     * Finds all records for item (unordered - prefer timestampDesc variant).
     *
     * @param itemId inventory item ID
     * @return stock history records
     */
    List<StockHistory> findByItemId(String itemId);

    /**
     * Finds records by reason (unordered - prefer timestampDesc variant).
     *
     * @param reason stock change reason
     * @return stock history records
     */
    List<StockHistory> findByReason(StockChangeReason reason);

    /**
     * Retrieves time-ordered price snapshots for item within date range.
     * Only includes entries with non-null priceAtChange.
     *
     * @param itemId item ID
     * @param start start date (inclusive)
     * @param end end date (inclusive)
     * @return price trend data points
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
