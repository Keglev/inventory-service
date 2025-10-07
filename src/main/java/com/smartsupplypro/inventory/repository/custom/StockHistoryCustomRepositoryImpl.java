package com.smartsupplypro.inventory.repository.custom;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import com.smartsupplypro.inventory.dto.PriceTrendDTO;
import com.smartsupplypro.inventory.dto.StockEventRowDTO;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;

/**
 * Custom repository implementation for stock history analytics with database-specific SQL.
 *
 * <p><strong>Purpose</strong>:
 * Encapsulates native SQL and JPQL for analytics, supporting both H2 (test) and Oracle (prod)
 * without leaking dialect specifics to controllers or services.
 *
 * <p><strong>Design Notes</strong>:
 * <ul>
 *   <li><strong>Field Mapping</strong>: timestamp → CREATED_AT, change → CHANGE, priceAtChange → PRICE_AT_CHANGE</li>
 *   <li><strong>H2 Mode</strong>: Uses quoted uppercase identifiers, YEAR/MONTH/DAY functions, CONCAT</li>
 *   <li><strong>Oracle Mode</strong>: Uses unquoted identifiers, TO_CHAR formatting, TRUNC for day grouping</li>
 *   <li><strong>Filtering</strong>: All parameters bound (no string concat) to prevent SQL injection</li>
 *   <li><strong>Return Types</strong>: Object[] for aggregations, StockEventRowDTO for WAC calculations</li>
 * </ul>
 *
 * @see StockHistoryCustomRepository
 * @see <a href="../../../../../../../docs/architecture/patterns/repository-patterns.md">Repository Patterns</a>
 */
public class StockHistoryCustomRepositoryImpl implements StockHistoryCustomRepository {
    
    @PersistenceContext
    private EntityManager em;
    
    @org.springframework.beans.factory.annotation.Autowired
    private org.springframework.core.env.Environment environment;
    
    /**
     * Detects if H2 profile is active (test/h2) vs Oracle (default/prod).
     *
     * @return true if H2 mode
     */
    private boolean isH2() {
        return Arrays.stream(environment.getActiveProfiles())
            .anyMatch(p -> p.equalsIgnoreCase("test") || p.equalsIgnoreCase("h2"));
    }
    
    /**
     * Monthly stock-in/stock-out aggregations over time window (native SQL).
     * Returns: [month (YYYY-MM), stockIn, stockOut]
     *
     * @param start inclusive lower bound
     * @param end inclusive upper bound
     * @return monthly aggregations ordered by month
     */
    @SuppressWarnings("unchecked")
    @Override
    public List<Object[]> getMonthlyStockMovement(LocalDateTime start, LocalDateTime end) {
        final String sql;
        if (isH2()) {
            sql = """
                SELECT CONCAT(CAST(YEAR(sh.created_at) AS VARCHAR), '-',
                              LPAD(CAST(MONTH(sh.created_at) AS VARCHAR), 2, '0')) AS month_str,
                       SUM(CASE WHEN sh.quantity_change > 0 THEN sh.quantity_change ELSE 0 END) AS stock_in,
                       SUM(CASE WHEN sh.quantity_change < 0 THEN ABS(sh.quantity_change) ELSE 0 END) AS stock_out
                FROM stock_history sh
                WHERE sh.created_at BETWEEN :start AND :end
                GROUP BY CONCAT(CAST(YEAR(sh.created_at) AS VARCHAR), '-',
                                LPAD(CAST(MONTH(sh.created_at) AS VARCHAR), 2, '0'))
                ORDER BY 1
            """;
        } else {
            sql = """
                SELECT TO_CHAR(sh.created_at, 'YYYY-MM') AS month_str,
                       SUM(CASE WHEN sh.quantity_change > 0 THEN sh.quantity_change ELSE 0 END) AS stock_in,
                       SUM(CASE WHEN sh.quantity_change < 0 THEN ABS(sh.quantity_change) ELSE 0 END) AS stock_out
                FROM stock_history sh
                WHERE sh.created_at BETWEEN :start AND :end
                GROUP BY TO_CHAR(sh.created_at, 'YYYY-MM')
                ORDER BY 1
            """;
        }
        Query nativeQuery = em.createNativeQuery(sql);
        nativeQuery.setParameter("start", start);
        nativeQuery.setParameter("end", end);
        return nativeQuery.getResultList();
    }
    
    /**
     * Monthly stock-in/stock-out filtered by supplier (native SQL).
     * Returns: [month (YYYY-MM), stockIn, stockOut]
     *
     * @param start inclusive lower bound
     * @param end inclusive upper bound
     * @param supplierId optional supplier filter (case-insensitive for H2)
     * @return monthly aggregations ordered by month
     */
    @SuppressWarnings("unchecked")
    @Override
    public List<Object[]> getMonthlyStockMovementFiltered(LocalDateTime start, LocalDateTime end, String supplierId) {
        final String sql;
        if (isH2()) {
            sql = """
                SELECT CONCAT(CAST(YEAR(sh.created_at) AS VARCHAR), '-',
                              LPAD(CAST(MONTH(sh.created_at) AS VARCHAR), 2, '0')) AS month_str,
                       SUM(CASE WHEN sh.quantity_change > 0 THEN sh.quantity_change ELSE 0 END) AS stock_in,
                       SUM(CASE WHEN sh.quantity_change < 0 THEN ABS(sh.quantity_change) ELSE 0 END) AS stock_out
                FROM stock_history sh
                JOIN inventory_item i ON sh.item_id = i.id
                WHERE sh.created_at BETWEEN :start AND :end
                  AND (:supplierId IS NULL OR UPPER(i.supplier_id) = UPPER(:supplierId))
                GROUP BY CONCAT(CAST(YEAR(sh.created_at) AS VARCHAR), '-',
                                LPAD(CAST(MONTH(sh.created_at) AS VARCHAR), 2, '0'))
                ORDER BY 1
            """;
        } else {
            sql = """
                SELECT TO_CHAR(sh.created_at, 'YYYY-MM') AS month_str,
                       SUM(CASE WHEN sh.quantity_change > 0 THEN sh.quantity_change ELSE 0 END) AS stock_in,
                       SUM(CASE WHEN sh.quantity_change < 0 THEN ABS(sh.quantity_change) ELSE 0 END) AS stock_out
                FROM stock_history sh
                JOIN inventory_item i ON sh.item_id = i.id
                WHERE sh.created_at BETWEEN :start AND :end
                  AND (:supplierId IS NULL OR i.supplier_id = :supplierId)
                GROUP BY TO_CHAR(sh.created_at, 'YYYY-MM')
                ORDER BY 1
            """;
        }
        final String normalizedSupplier = (supplierId == null || supplierId.isBlank()) ? null : supplierId;
        final Query nativeQuery = em.createNativeQuery(sql);
        nativeQuery.setParameter("start", start);
        nativeQuery.setParameter("end", end);
        nativeQuery.setParameter("supplierId", normalizedSupplier);
        return nativeQuery.getResultList();
    }
    
    /**
    * Daily total stock value (quantity × price) for a time window, optionally filtered by supplier.
    *
    * <p>Returns a real DATE in column 1 to align with service mapping
    * (<code>(Date) row[0]</code> → <code>toLocalDate()</code>), not a string.</p>
    *
    * <p><strong>Output row format:</strong> [day_date (DATE), total_value (Number)]</p>
    *
    * <p>Definition of “daily value”:
    * For each item on a given calendar day, compute the <em>closing quantity</em> as the
    * cumulative sum of {@code quantity_change} up to the last event of that day, then multiply
    * by the price at that change (fallback to {@code inventory_item.price} when null).
    * Sum across items for that day.</p>
    *
    * @param start      inclusive lower bound
    * @param end        inclusive upper bound
    * @param supplierId optional supplier filter (null or blank = all)
    * @return rows ordered by day ascending
    */
    @SuppressWarnings("unchecked")
    @Override
    public List<Object[]> getStockValueGroupedByDateFiltered(
    LocalDateTime start, LocalDateTime end, String supplierId) {
        
        final String sql;
        if (isH2()) {
            // H2: CAST to DATE; window functions are supported in H2 2.x
            sql = """
            WITH events AS (
                SELECT
                    CAST(sh.created_at AS DATE) AS day_date,
                    sh.item_id                  AS item_id,
                    sh.created_at               AS created_at,
                    sh.quantity_change          AS quantity_change,
                    sh.price_at_change          AS price_at_change,
                    /* Running balance per item up to the current row = closing qty at day's last row */
                    SUM(sh.quantity_change) OVER (
                        PARTITION BY sh.item_id
                        ORDER BY sh.created_at
                        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                    )                           AS qty_after,
                    ROW_NUMBER() OVER (
                        PARTITION BY CAST(sh.created_at AS DATE), sh.item_id
                        ORDER BY sh.created_at DESC
                    )                           AS rn
                FROM stock_history sh
                JOIN inventory_item i ON i.id = sh.item_id
                WHERE sh.created_at BETWEEN :start AND :end
                  AND (:supplierId IS NULL OR UPPER(i.supplier_id) = UPPER(:supplierId))
            )
            SELECT
                e.day_date,
                SUM(
                    COALESCE(e.qty_after, 0) * COALESCE(e.price_at_change, i.price, 0)
                ) AS total_value
            FROM events e
            JOIN inventory_item i ON i.id = e.item_id
            WHERE e.rn = 1
            GROUP BY e.day_date
            ORDER BY e.day_date
        """;
        } else {
            // Oracle: TRUNC to day, cast to DATE for clarity; analytic SUM works the same
            sql = """
            WITH events AS (
                SELECT
                    CAST(TRUNC(sh.created_at) AS DATE) AS day_date,
                    sh.item_id                           AS item_id,
                    sh.created_at                        AS created_at,
                    sh.quantity_change                   AS quantity_change,
                    sh.price_at_change                   AS price_at_change,
                    SUM(sh.quantity_change) OVER (
                        PARTITION BY sh.item_id
                        ORDER BY sh.created_at
                    )                                    AS qty_after,
                    ROW_NUMBER() OVER (
                        PARTITION BY TRUNC(sh.created_at), sh.item_id
                        ORDER BY sh.created_at DESC
                    )                                    AS rn
                FROM stock_history sh
                JOIN inventory_item i ON i.id = sh.item_id
                WHERE sh.created_at BETWEEN :start AND :end
                  AND (:supplierId IS NULL OR i.supplier_id = :supplierId)
            )
            SELECT
                e.day_date,
                SUM(
                    COALESCE(e.qty_after, 0) * COALESCE(e.price_at_change, i.price, 0)
                ) AS total_value
            FROM events e
            JOIN inventory_item i ON i.id = e.item_id
            WHERE e.rn = 1
            GROUP BY e.day_date
            ORDER BY e.day_date
        """;
        }
        
        final String normalizedSupplier =
        (supplierId == null || supplierId.isBlank()) ? null : supplierId.trim();
        
        // Use Timestamps explicitly for both H2 and Oracle drivers
        final java.sql.Timestamp startTs = java.sql.Timestamp.valueOf(start);
        final java.sql.Timestamp endTs   = java.sql.Timestamp.valueOf(end);
        
        final Query nativeQuery = em.createNativeQuery(sql);
        nativeQuery.setParameter("start", startTs);
        nativeQuery.setParameter("end", endTs);
        nativeQuery.setParameter("supplierId", normalizedSupplier);
        
        return nativeQuery.getResultList();
    }
    
    
    /**
     * Returns total stock quantity per supplier for dashboard (native SQL).
     * Returns: [supplier_name (String), total_quantity (Number)]
     *
     * @return per-supplier totals ordered by quantity descending
     */
    @SuppressWarnings("unchecked")
    @Override
    public List<Object[]> getTotalStockPerSupplier() {
        final String sql;
        if (isH2()) {
            sql = """
                SELECT s."NAME" AS supplier_name, SUM(i."QUANTITY") AS total_quantity
                FROM "SUPPLIER" s
                JOIN "INVENTORY_ITEM" i ON s."ID" = i."SUPPLIER_ID"
                GROUP BY s."NAME"
                ORDER BY total_quantity DESC
            """;
        } else {
            sql = """
                SELECT s.name AS supplier_name, SUM(i.quantity) AS total_quantity
            FROM supplier s
            JOIN inventory_item i ON s.id = i.supplier_id
            GROUP BY s.name
            ORDER BY total_quantity DESC
            """;
        }
        return em.createNativeQuery(sql).getResultList();
    }
    
    /**
     * Returns update event count per item with optional supplier filtering (native SQL).
     * Returns: [item_name (String), update_count (Number)]
     *
     * @param supplierId optional supplier ID filter (case-insensitive)
     * @return per-item update counts ordered by count descending
     */
    @SuppressWarnings("unchecked")
    @Override
    public List<Object[]> getUpdateCountPerItemFiltered(String supplierId) {
        final String sql;
        if (isH2()) {
            sql = """
                SELECT i."NAME" AS item_name, COUNT(sh."ID") AS update_count
                FROM "INVENTORY_ITEM" i
                JOIN "STOCK_HISTORY" sh ON sh."ITEM_ID" = i."ID"
                WHERE (:supplierId IS NULL OR UPPER(i."SUPPLIER_ID") = UPPER(:supplierId))
                GROUP BY i."NAME"
                ORDER BY update_count DESC
            """;
        } else {
            sql = """
                SELECT i.name AS item_name, COUNT(sh.id) AS update_count
            FROM stock_history sh
            JOIN inventory_item i ON sh.item_id = i.id
            WHERE (:supplierId IS NULL OR UPPER(i.supplier_id) = UPPER(:supplierId))
            GROUP BY i.name
            ORDER BY update_count DESC
            """;
        }
        final String normalizedSupplier = (supplierId == null || supplierId.isBlank()) ? null : supplierId;
        final Query nativeQuery = em.createNativeQuery(sql);
        nativeQuery.setParameter("supplierId", normalizedSupplier);
        return nativeQuery.getResultList();
    }
    
    /**
     * Returns items currently below their minimum stock threshold (native SQL).
     * Returns: [name (String), quantity (Number), minimum_quantity (Number)]
     *
     * @param supplierId optional supplier ID filter (case-insensitive)
     * @return items below minimum ordered by severity
     */
    @SuppressWarnings("unchecked")
    @Override
    public List<Object[]> findItemsBelowMinimumStockFiltered(String supplierId) {
        final String sql;
        if (isH2()) {
            sql = """
                SELECT i."NAME", i."QUANTITY", i."MINIMUM_QUANTITY"
                FROM "INVENTORY_ITEM" i
                WHERE i."QUANTITY" < i."MINIMUM_QUANTITY"
                  AND (:supplierId IS NULL OR UPPER(i."SUPPLIER_ID") = UPPER(:supplierId))
                ORDER BY i."QUANTITY" ASC
            """;
        } else {
            sql = """
                SELECT i.name, i.quantity, i.minimum_quantity
            FROM inventory_item i
            WHERE i.quantity < i.minimum_quantity
              AND (:supplierId IS NULL OR UPPER(i.supplier_id) = UPPER(:supplierId))
            ORDER BY i.quantity ASC
            """;
        }
        final String normalizedSupplier = (supplierId == null || supplierId.isBlank()) ? null : supplierId;
        final Query nativeQuery = em.createNativeQuery(sql);
        nativeQuery.setParameter("supplierId", normalizedSupplier);
        return nativeQuery.getResultList();
    }
    
    /**
     * Returns stock updates with flexible multi-criteria filtering (native SQL).
     * Returns: [item_name, supplier_name, quantity_change, reason, created_by, created_at]
     *
     * @param startDate optional minimum creation timestamp
     * @param endDate optional maximum creation timestamp
     * @param itemName optional item name filter (case-insensitive partial match)
     * @param supplierId optional supplier ID filter
     * @param createdBy optional creator username filter (case-insensitive exact match)
     * @param minChange optional minimum quantity change filter
     * @param maxChange optional maximum quantity change filter
     * @return filtered stock updates ordered by creation time descending
     * @see com.smartsupplypro.inventory.repository for parameter normalization patterns
     */
    @SuppressWarnings("unchecked")
    @Override
    public List<Object[]> findFilteredStockUpdates(
    LocalDateTime startDate,
    LocalDateTime endDate,
    String itemName,
    String supplierId,
    String createdBy,
    Integer minChange,
    Integer maxChange
    ) {
        // Enterprise Comment: Multi-Criteria Filtering Pattern
        // Uses NULL-safe WHERE clauses allowing optional filters. Each parameter
        // is normalized (null/blank checks) and converted to search patterns
        // (e.g., LIKE %term% for partial match). This enables flexible queries
        // without building dynamic SQL strings.
        final String sql;
        if (isH2()) {
            sql = """
                SELECT i.name AS item_name, s.name AS supplier_name, sh.quantity_change, sh.reason, sh.created_by, sh.created_at
                FROM stock_history sh
                JOIN inventory_item i ON sh.item_id = i.id
                JOIN supplier s ON i.supplier_id = s.id
                WHERE (:startDate     IS NULL OR sh.created_at >= :startDate)
                  AND (:endDate       IS NULL OR sh.created_at <= :endDate)
                  AND (:itemPattern   IS NULL OR LOWER(i.name) LIKE :itemPattern)
                  AND (:supplierId    IS NULL OR UPPER(i.supplier_id) = UPPER(:supplierId))
                  AND (:createdByNorm IS NULL OR LOWER(sh.created_by) = :createdByNorm)
                  AND (:minChange     IS NULL OR sh.quantity_change >= :minChange)
                  AND (:maxChange     IS NULL OR sh.quantity_change <= :maxChange)
                ORDER BY sh.created_at DESC
            """;
        } else {
            sql = """
                SELECT i.name AS item_name, s.name AS supplier_name, sh.quantity_change, sh.reason, sh.created_by, sh.created_at
                FROM stock_history sh
                JOIN inventory_item i ON sh.item_id = i.id
                JOIN supplier s ON i.supplier_id = s.id
                WHERE (:startDate     IS NULL OR sh.created_at >= :startDate)
                  AND (:endDate       IS NULL OR sh.created_at <= :endDate)
                  AND (:itemPattern   IS NULL OR LOWER(i.name) LIKE :itemPattern)
                  AND (:supplierId    IS NULL OR i.supplier_id = :supplierId)
                  AND (:createdByNorm IS NULL OR LOWER(sh.created_by) = :createdByNorm)
                  AND (:minChange     IS NULL OR sh.quantity_change >= :minChange)
                  AND (:maxChange     IS NULL OR sh.quantity_change <= :maxChange)
                ORDER BY sh.created_at DESC
            """;
        }
        final String itemPattern     = (itemName == null || itemName.isBlank()) ? null : "%" + itemName.toLowerCase() + "%";
        final String normalizedSupp  = (supplierId == null || supplierId.isBlank()) ? null : supplierId;
        final String createdByNorm   = (createdBy == null || createdBy.isBlank()) ? null : createdBy.toLowerCase();
        
        final Query q = em.createNativeQuery(sql);
        q.setParameter("startDate", startDate);
        q.setParameter("endDate", endDate);
        q.setParameter("itemPattern", itemPattern);
        q.setParameter("supplierId", normalizedSupp);
        q.setParameter("createdByNorm", createdByNorm);
        q.setParameter("minChange", minChange);
        q.setParameter("maxChange", maxChange);
        
        return q.getResultList();
    }
    
    /**
     * Returns daily average price trend for specific item (native SQL).
     * Returns: [day_str (String YYYY-MM-DD), price (BigDecimal)]
     *
     * @param itemId required item ID
     * @param supplierId optional supplier ID filter
     * @param start inclusive lower bound timestamp
     * @param end inclusive upper bound timestamp
     * @return daily price trend ordered by day ascending
     */
    @SuppressWarnings("unchecked")
    @Override
    public List<PriceTrendDTO> getPriceTrend(String itemId, String supplierId, LocalDateTime start, LocalDateTime end) {
        final String sql;
        if (isH2()) {
            sql = """
                SELECT CONCAT(
                           CAST(YEAR(sh.created_at) AS VARCHAR), '-',
                           LPAD(CAST(MONTH(sh.created_at) AS VARCHAR), 2, '0'), '-',
                           LPAD(CAST(DAY(sh.created_at) AS VARCHAR), 2, '0')
                       ) AS day_str,
                       AVG(sh.price_at_change) AS price
                FROM stock_history sh
                JOIN inventory_item i ON sh.item_id = i.id
                WHERE sh.created_at BETWEEN :start AND :end
                  AND sh.item_id = :itemId
                  AND (:supplierId IS NULL OR UPPER(i.supplier_id) = UPPER(:supplierId))
                GROUP BY CONCAT(
                           CAST(YEAR(sh.created_at) AS VARCHAR), '-',
                           LPAD(CAST(MONTH(sh.created_at) AS VARCHAR), 2, '0'), '-',
                           LPAD(CAST(DAY(sh.created_at) AS VARCHAR), 2, '0')
                       )
                ORDER BY 1
            """;
        } else {
            sql = """
                SELECT TO_CHAR(sh.created_at, 'YYYY-MM-DD') AS day_str,
                       AVG(sh.price_at_change) AS price
                FROM stock_history sh
                JOIN inventory_item i ON sh.item_id = i.id
                WHERE sh.created_at BETWEEN :start AND :end
                  AND sh.item_id = :itemId
                  AND (:supplierId IS NULL OR i.supplier_id = :supplierId)
                GROUP BY TO_CHAR(sh.created_at, 'YYYY-MM-DD')
                ORDER BY 1
            """;
        }
        final String normalizedSupplier = (supplierId == null || supplierId.isBlank()) ? null : supplierId;
        
        final Query q = em.createNativeQuery(sql);
        q.setParameter("start", start);
        q.setParameter("end", end);
        q.setParameter("itemId", itemId);
        q.setParameter("supplierId", normalizedSupplier);
        
        final List<Object[]> raw = q.getResultList();
        return raw.stream()
        .map(r -> new PriceTrendDTO((String) r[0], (BigDecimal) r[1]))
        .collect(Collectors.toList());
    }
    
    /**
     * Streams stock events up to specified time for WAC algorithm (JPQL).
     * Used to replay events for opening inventory and aggregate purchases/COGS within window.
     *
     * @param end inclusive upper bound timestamp
     * @param supplierId optional supplier filter
     * @return ordered event stream projected to StockEventRowDTO
     * @see com.smartsupplypro.inventory.service for WAC cost-flow calculations
     */
    @Override
    public List<StockEventRowDTO> findEventsUpTo(LocalDateTime end, String supplierId) {
        // Enterprise Comment: WAC Event Streaming
        // Provides time-ordered event stream for Weighted Average Cost calculations.
        // Events are sorted by item and timestamp to enable sequential replay for
        // opening inventory reconstruction and period-specific cost aggregations.
        final String jpql = """
            select new com.smartsupplypro.inventory.dto.StockEventRowDTO(
                sh.itemId, 
                coalesce(sh.supplierId, i.supplierId), 
                sh.timestamp, 
                sh.change,
                sh.priceAtChange,
                sh.reason
            )
            from StockHistory sh, InventoryItem i
            where i.id = sh.itemId 
                and sh.timestamp <= :end
                and (
                    :supplierIdNorm is null 
                    or lower(sh.supplierId) = :supplierIdNorm
                )
            order by sh.itemId asc, sh.timestamp asc
        """;

        final String supplierIdNorm = 
            (supplierId == null || supplierId.isBlank()) ? null : supplierId.trim().toLowerCase();

        return em.createQuery(jpql, StockEventRowDTO.class)
                .setParameter("end", end)
                .setParameter("supplierIdNorm", supplierIdNorm)
                .getResultList();
    }
}
