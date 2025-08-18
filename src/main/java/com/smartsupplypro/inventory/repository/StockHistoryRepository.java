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
 * <h2>Purpose</h2>
 * <ul>
 *   <li>Provide efficient access to stock movement audit data.</li>
 *   <li>Support dashboard/reporting filters and time-range queries.</li>
 *   <li>Offer ordered finders to avoid in-memory sorting in services.</li>
 * </ul>
 *
 * <h2>Dialect & Naming Notes</h2>
 * <ul>
 *   <li>The Java field is {@code timestamp}, but the DB column is {@code CREATED_AT}
 *       (chosen to avoid reserved-word conflicts). JPQL/derived queries use the field name,
 *       while <strong>native SQL must reference {@code CREATED_AT}</strong>.</li>
 *   <li>Supplier filter uses the denormalized {@code SUPPLIER_ID} on {@code STOCK_HISTORY}
 *       (added for index-friendly analytics). We still join {@code INVENTORY_ITEM} to filter by item name.</li>
 *   <li>Bounds are inclusive ({@code >=}, {@code <=}); native query includes a stable
 *       {@code ORDER BY} because Spring Data does not inject sort clauses into native SQL.</li>
 * </ul>
 */
public interface StockHistoryRepository
        extends JpaRepository<StockHistory, String>, StockHistoryCustomRepository {

    /**
     * Paginated stock history entries with optional filters.
     *
     * <p><strong>Sorting:</strong> A stable default ordering by {@code CREATED_AT DESC} is applied
     * inside the native query because Spring Data does not inject sort clauses into native queries.</p>
     *
     * @param startDate optional start (inclusive)
     * @param endDate   optional end (inclusive)
     * @param itemName  optional partial match (case-insensitive) on item name
     * @param supplierId optional exact supplier id (uses denormalized {@code s.SUPPLIER_ID})
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
     * Ordered finder for all records of an item (newest first).
     * <p>Uses the Java field name ({@code timestamp}); mapped to DB column {@code CREATED_AT}.</p>
     */
    List<StockHistory> findByItemIdOrderByTimestampDesc(String itemId);

    /**
     * Ordered finder for all records with the given reason (newest first).
     * <p>Uses the Java field name ({@code timestamp}); mapped to DB column {@code CREATED_AT}.</p>
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
     * <p>Only entries with non-null {@code priceAtChange} are included. Bounds are inclusive.</p>
     *
     * <p>JPQL uses the entity field {@code timestamp}, which is safely mapped to DB column {@code CREATED_AT}.</p>
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
