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
* Custom repository implementation for analytics queries over STOCK_HISTORY.
*
* <h2>Purpose</h2>
* Encapsulates all native SQL / JPQL needed by analytics so we can:
* <ul>
*   <li>Support both H2 (test profile) and Oracle (prod) without leaking dialect specifics upward.</li>
*   <li>Keep controllers/services DB-agnostic (only rely on entity properties or DTOs).</li>
*   <li>Centralize SQL tuning (indexes, hints, date truncation functions, etc.).</li>
* </ul>
*
* <h2>Entity / Column conventions</h2>
* <ul>
*   <li><code>StockHistory.timestamp</code> → DB column <code>CREATED_AT</code> (DATE/TIMESTAMP)</li>
*   <li><code>StockHistory.change</code>    → DB column <code>"CHANGE"</code> (NUMBER/INT)</li>
*   <li><code>StockHistory.priceAtChange</code> → DB column <code>"PRICE_AT_CHANGE"</code></li>
*   <li><code>StockHistory.itemId</code>    → DB column <code>"ITEM_ID"</code></li>
*   <li><code>StockHistory.supplierId</code>→ DB column <code>"SUPPLIER_ID"</code></li>
*   <li>H2 branch uses quoted UPPERCASE identifiers (e.g., <code>"STOCK_HISTORY"</code>) to match how
*       Hibernate created the tables in tests; Oracle branch uses unquoted identifiers.</li>
*   <li>All parameters are bound (no string concatenation) to avoid SQL injection.</li>
* </ul>
*
* <h2>Filtering conventions</h2><h2>H2 vs Oracle</h2>
* <ul>
*   <li>H2 (Oracle mode): use <code>YEAR()/MONTH()/DAY()</code>, <code>CAST(... AS DATE)</code>, string <code>CONCAT</code>.</li>
*   <li>Oracle: use <code>TO_CHAR(...)</code> for formatting, <code>TRUNC(...)</code> for day grouping.</li>
*   <li>Table/column names are unquoted, case‑insensitive, and identical across DBs.</li>
* </ul>
*
* <h2>Return shapes</h2>
* <ul>
*   <li>Most native methods return <code>List&lt;Object[]&gt;</code> for simple aggregations.</li>
*   <li>Event streaming for cost-flow (WAC) uses a constructor projection into
*       {@link com.smartsupplypro.inventory.dto.StockEventRowDTO} via JPQL.</li>
* </ul>
*/
public class StockHistoryCustomRepositoryImpl implements StockHistoryCustomRepository {
    
    @PersistenceContext
    private EntityManager em;
    
    @org.springframework.beans.factory.annotation.Autowired
    private org.springframework.core.env.Environment environment;
    
    /**
    * Detects whether we should run H2-compatible SQL (test/h2 profiles) or Oracle SQL (default/prod).
    */
    private boolean isH2() {
        return Arrays.stream(environment.getActiveProfiles())
            .anyMatch(p -> p.equalsIgnoreCase("test") || p.equalsIgnoreCase("h2"));
    }
    
    /**
    * Monthly stock movement (stock-in / stock-out) over a time window.
    *
    * <p><strong>Output row format:</strong> [month_str (YYYY-MM), stock_in (Number), stock_out (Number)]</p>
    *
    * @param start inclusive lower bound (uses <code>created_at</code>)
    * @param end   inclusive upper bound (uses <code>created_at</code>)
    * @return aggregated rows ordered by month ascending
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
    * Monthly stock movement (stock-in / stock-out) filtered by supplier over a time window.
    *
    * <p><strong>Output row format:</strong> [month_str (YYYY-MM), stock_in (Number), stock_out (Number)]</p>
    *
    * @param start      inclusive lower bound
    * @param end        inclusive upper bound
    * @param supplierId optional supplier ID (case-insensitive for H2 branch)
    * @return aggregated rows ordered by month ascending
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
    * @param start      inclusive lower bound
    * @param end        inclusive upper bound
    * @param supplierId optional supplier filter (null or blank = all)
    * @return rows ordered by day ascending
    */
    @SuppressWarnings("unchecked")
    @Override
    public List<Object[]> getStockValueGroupedByDateFiltered(LocalDateTime start, LocalDateTime end, String supplierId) {
        final String sql;
        if (isH2()) {
            sql = """
                 SELECT CAST(sh.created_at AS DATE) AS day_date,
                       SUM(sh.quantity_change * i.price) AS total_value
                FROM stock_history sh
                JOIN inventory_item i ON sh.item_id = i.id
                WHERE sh.created_at BETWEEN :start AND :end
                  AND (:supplierId IS NULL OR UPPER(i.supplier_id) = UPPER(:supplierId))
                GROUP BY CAST(sh.created_at AS DATE)
                ORDER BY day_date
            """;
        } else {
            sql = """
               SELECT TRUNC(sh.created_at) AS day_date,
                       SUM(sh.quantity_change * i.price) AS total_value
                FROM stock_history sh
                JOIN inventory_item i ON sh.item_id = i.id
                WHERE sh.created_at BETWEEN :start AND :end
                  AND (:supplierId IS NULL OR i.supplier_id = :supplierId)
                GROUP BY TRUNC(sh.created_at)
                ORDER BY day_date
            """;
        }
        
        final String normalizedSupplier = (supplierId == null || supplierId.isBlank()) ? null : supplierId;

        // Use Timestamps to match driver expectations
        final java.sql.Timestamp startTs = java.sql.Timestamp.valueOf(start);
        final java.sql.Timestamp endTs   = java.sql.Timestamp.valueOf(end);


        final Query nativeQuery = em.createNativeQuery(sql);
        nativeQuery.setParameter("start", startTs);
        nativeQuery.setParameter("end", endTs);
        nativeQuery.setParameter("supplierId", normalizedSupplier);
        return nativeQuery.getResultList();
    }
    
    /**
    * Current total stock quantity by supplier (simple dashboard pie/bar).
    *
    * <p><strong>Output row format:</strong> [supplier_name (String), total_quantity (Number)]</p>
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
    * Update frequency per item, optionally filtered by supplier.
    *
    * <p><strong>Output row format:</strong> [item_name (String), update_count (Number)]</p>
    *
    * @param supplierId optional supplier ID (case-insensitive for H2 branch)
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
    * Items currently below their minimum threshold, optionally filtered by supplier.
    *
    * <p><strong>Output row format:</strong> [name (String), quantity (Number), minimum_quantity (Number)]</p>
    *
    * @param supplierId optional supplier ID (case-insensitive for H2 branch)
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
    * Flexible stock update search with time/supplier/item/user/quantity filters.
    *
    * <p><strong>Output row format:</strong>
    * [item_name (String), supplier_name (String), quantity_change (Number),
    *  reason (String or enum name), created_by (String), created_at (TIMESTAMP)]</p>
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
    * Average price trend per day for a specific item (optional supplier filter).
    *
    * <p><strong>Output row format:</strong> [day_str (String YYYY-MM-DD), price (BigDecimal)]</p>
    *
    * @param itemId     required item ID
    * @param supplierId optional supplier ID (null/blank = all)
    * @param start      inclusive lower bound (created_at)
    * @param end        inclusive upper bound (created_at)
    * @return list of day/price pairs ordered by day ascending
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
    * Streams events up to the given time (inclusive) using JPQL over entity properties.
    *
    * <p>Used by the WAC (weighted-average-cost) algorithm to:
    * <ul>
    *   <li>replay events before the analysis window to build opening inventory, and</li>
    *   <li>aggregate purchases/COGS/write-offs/returns within the window.</li>
    * </ul>
    *
    * @param end        inclusive upper bound (compared to entity property {@code createdAt})
    * @param supplierId optional supplier filter (null = all)
    * @return ordered rows projected into {@link StockEventRowDTO}
    */
    @Override
    public List<StockEventRowDTO> findEventsUpTo(LocalDateTime end, String supplierId) {
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
