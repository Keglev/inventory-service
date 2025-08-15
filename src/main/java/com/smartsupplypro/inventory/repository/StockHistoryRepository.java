package com.smartsupplypro.inventory.repository;

import com.smartsupplypro.inventory.dto.PriceTrendDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.model.StockHistory;
import com.smartsupplypro.inventory.repository.custom.StockHistoryCustomRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for managing {@link StockHistory} entities.
 *
 * <p>Responsibilities:
 * <ul>
 *   <li>Provide efficient access to stock movement audit data.</li>
 *   <li>Support dashboard/reporting filters and time-range queries.</li>
 *   <li>Offer ordered finders to avoid in-memory sorting in services.</li>
 * </ul>
 *
 * <p><strong>Notes:</strong>
 * <ul>
 *   <li>{@code findFiltered(...)} uses a native query for flexibility across Oracle/H2.</li>
 *   <li>Because it is native, Pageable <em>sorting</em> is not injected automatically by Spring Data;
 *       we include a stable {@code ORDER BY s.timestamp DESC} in the query.</li>
 *   <li>Time bounds are inclusive (uses {@code >=} and {@code <=}).</li>
 *   <li>If your column is literally named {@code timestamp}, be mindful it's a SQL keyword in some dialects.
 *       This query works on Oracle/H2 as-is; if your schema quotes the column name,
 *       align the query accordingly or prefer a safer name like {@code changed_at} in future migrations.</li>
 * </ul>
 */
public interface StockHistoryRepository
        extends JpaRepository<StockHistory, String>, StockHistoryCustomRepository {

    /**
     * Paginated stock history entries with optional filters.
     *
     * <p><strong>Sorting:</strong> A stable default ordering by {@code s.timestamp DESC} is applied
     * inside the native query because Spring Data does not inject sort clauses into native queries.</p>
     *
     * @param startDate optional start (inclusive)
     * @param endDate   optional end (inclusive)
     * @param itemName  optional partial match (case-insensitive) on item name
     * @param supplierId optional exact supplier id
     */
    @Query(
        value = """
            SELECT s.*
            FROM stock_history s
            JOIN inventory_item i ON s.item_id = i.id
            WHERE (:startDate IS NULL OR s.timestamp >= :startDate)
              AND (:endDate   IS NULL OR s.timestamp <= :endDate)
              AND (:itemName  IS NULL OR LOWER(i.name) LIKE LOWER(CONCAT('%', :itemName, '%')))
              AND (:supplierId IS NULL OR i.supplier_id = :supplierId)
            ORDER BY s.timestamp DESC
        """,
        countQuery = """
            SELECT COUNT(*)
            FROM stock_history s
            JOIN inventory_item i ON s.item_id = i.id
            WHERE (:startDate IS NULL OR s.timestamp >= :startDate)
              AND (:endDate   IS NULL OR s.timestamp <= :endDate)
              AND (:itemName  IS NULL OR LOWER(i.name) LIKE LOWER(CONCAT('%', :itemName, '%')))
              AND (:supplierId IS NULL OR i.supplier_id = :supplierId)
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
     * Ordered finder for all records of an item (newest first).
     * Prefer this over {@link #findByItemId(String)} to avoid in-memory sorting.
     */
    List<StockHistory> findByItemIdOrderByTimestampDesc(String itemId);

    /**
     * Ordered finder for all records with the given reason (newest first).
     * Prefer this over {@link #findByReason(StockChangeReason)} to avoid in-memory sorting.
     */
    List<StockHistory> findByReasonOrderByTimestampDesc(StockChangeReason reason);

    /**
     * Finds all stock history records for a given inventory item.
     * <p><strong>Note:</strong> Prefer {@link #findByItemIdOrderByTimestampDesc(String)} for stable ordering.</p>
     */
    List<StockHistory> findByItemId(String itemId);

    /**
     * Finds stock history records by reason code.
     * <p><strong>Note:</strong> Prefer {@link #findByReasonOrderByTimestampDesc(StockChangeReason)} for stable ordering.</p>
     */
    List<StockHistory> findByReason(StockChangeReason reason);

    /**
     * Time-ordered price snapshots for a specific item within a range.
     * <p>Only entries with non-null {@code priceAtChange} are included.</p>
     * <p>Bounds are inclusive.</p>
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

/**
 * This repository interface provides methods for querying stock history data
 * with advanced filtering and aggregation capabilities, suitable for reporting
 * and dashboard visualizations.
 *
 * <p>Vendor-specific analytics that exceed JPQL are implemented in
 * {@link com.smartsupplypro.inventory.repository.custom.StockHistoryCustomRepositoryImpl}
 * to isolate dialect differences.</p>
 */
