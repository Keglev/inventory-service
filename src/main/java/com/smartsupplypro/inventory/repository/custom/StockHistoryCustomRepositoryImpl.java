package com.smartsupplypro.inventory.repository.custom;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Repository;

import com.smartsupplypro.inventory.dto.PriceTrendDTO;
import com.smartsupplypro.inventory.dto.StockEventRowDTO;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Custom repository implementation for analytics queries over <code>stock_history</code>.
 *
 * <p><strong>Purpose</strong><br>
 * Encapsulates native SQL and JPQL required by analytics so we can:
 * <ul>
 *   <li>Support both H2 (test profile) and Oracle (prod) without leaking dialect specifics upward.</li>
 *   <li>Keep controllers/services database-agnostic (they depend on entity property names or DTOs).</li>
 *   <li>Centralize any future SQL tuning (indexes, hints, truncation functions, etc.).</li>
 * </ul>
 *
 * <p><strong>Conventions</strong>
 * <ul>
 *   <li>Entity property <code>createdAt</code> is mapped to DB column <code>created_at</code>.</li>
 *   <li>Entity property <code>quantityChange</code> is mapped to DB column <code>quantity_change</code>.</li>
 *   <li>Native SQL uses column names; JPQL uses entity property names.</li>
 *   <li>All parameters are bound (no string concatenation) to avoid SQL injection.</li>
 * </ul>
 *
 * <p><strong>Return Shapes</strong>
 * <ul>
 *   <li>Most native methods return <code>List&lt;Object[]&gt;</code> for simple aggregations.</li>
 *   <li>Event streaming for cost-flow (WAC) uses a constructor projection into
 *       {@link com.smartsupplypro.inventory.dto.StockEventRowDTO} via JPQL.</li>
 * </ul>
 */
@Repository
@RequiredArgsConstructor
public class StockHistoryCustomRepositoryImpl implements StockHistoryCustomRepository {

    @PersistenceContext
    private EntityManager em;

    private final Environment environment;

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
            // H2: CAST/DATE() yields a DATE without time
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
            // Oracle: TRUNC(date) returns DATE at midnight
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
        final Query nativeQuery = em.createNativeQuery(sql);
        nativeQuery.setParameter("start", start);
        nativeQuery.setParameter("end", end);
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
        final String sql = """
            SELECT s.name AS supplier_name, SUM(i.quantity) AS total_quantity
            FROM supplier s
            JOIN inventory_item i ON s.id = i.supplier_id
            GROUP BY s.name
            ORDER BY total_quantity DESC
        """;
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
        final String sql = """
            SELECT i.name AS item_name, COUNT(sh.id) AS update_count
            FROM stock_history sh
            JOIN inventory_item i ON sh.item_id = i.id
            WHERE (:supplierId IS NULL OR UPPER(i.supplier_id) = UPPER(:supplierId))
            GROUP BY i.name
            ORDER BY update_count DESC
        """;
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
        final String sql = """
            SELECT name, quantity, minimum_quantity
            FROM inventory_item i
            WHERE quantity < minimum_quantity
              AND (:supplierId IS NULL OR UPPER(i.supplier_id) = UPPER(:supplierId))
            ORDER BY quantity ASC
        """;
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
                sh.itemId, sh.supplierId, sh.createdAt, sh.quantityChange, sh.priceAtChange, sh.reason
            )
            from StockHistory sh
            where sh.createdAt <= :end
              and (:supplierId is null or sh.supplierId = :supplierId)
            order by sh.itemId asc, sh.createdAt asc
        """;
        return em.createQuery(jpql, StockEventRowDTO.class)
                 .setParameter("end", end)
                 .setParameter("supplierId", supplierId)
                 .getResultList();
    }
}
