package com.smartsupplypro.inventory.repository.custom;

import com.smartsupplypro.inventory.dto.PriceTrendDTO;
import com.smartsupplypro.inventory.repository.custom.util.DatabaseDialectDetector;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Trend analytics repository implementation with multi-database support.
 *
 * <p>Encapsulates native SQL for time-series aggregations across H2 (test) and
 * Oracle (prod) without exposing dialect specifics to service layer.
 *
 * @author Smart Supply Pro Development Team
 * @version 1.0.0
 * @since 2.0.0
 */
@Repository
public class StockTrendAnalyticsRepositoryImpl implements StockTrendAnalyticsRepository {

    @PersistenceContext
    private EntityManager em;

    private final DatabaseDialectDetector dialectDetector;

    public StockTrendAnalyticsRepositoryImpl(DatabaseDialectDetector dialectDetector) {
        this.dialectDetector = dialectDetector;
    }

    @SuppressWarnings("unchecked")
    @Override
    public List<Object[]> getMonthlyStockMovement(LocalDateTime start, LocalDateTime end) {
        final String sql = dialectDetector.isH2()
            ? buildH2MonthlyMovementSql(false)
            : buildOracleMonthlyMovementSql(false);

        return em.createNativeQuery(sql)
                .setParameter("start", start)
                .setParameter("end", end)
                .getResultList();
    }

    @SuppressWarnings("unchecked")
    @Override
    public List<Object[]> getMonthlyStockMovementBySupplier(LocalDateTime start, LocalDateTime end, String supplierId) {
        final String sql = dialectDetector.isH2()
            ? buildH2MonthlyMovementSql(true)
            : buildOracleMonthlyMovementSql(true);

        final String normalizedSupplier = normalizeOptionalParam(supplierId);

        return em.createNativeQuery(sql)
                .setParameter("start", start)
                .setParameter("end", end)
                .setParameter("supplierId", normalizedSupplier)
                .getResultList();
    }

    @SuppressWarnings("unchecked")
    @Override
    public List<Object[]> getDailyStockValuation(LocalDateTime start, LocalDateTime end, String supplierId) {
        final String sql = dialectDetector.isH2()
            ? buildH2DailyValuationSql()
            : buildOracleDailyValuationSql();

        final String normalizedSupplier = normalizeOptionalParam(supplierId);

        // Convert LocalDateTime to java.sql.Timestamp for JDBC compatibility
        final java.sql.Timestamp startTs = java.sql.Timestamp.valueOf(start);
        final java.sql.Timestamp endTs = java.sql.Timestamp.valueOf(end);

        return em.createNativeQuery(sql)
                .setParameter("start", startTs)
                .setParameter("end", endTs)
                .setParameter("supplierId", normalizedSupplier)
                .getResultList();
    }

    @SuppressWarnings("unchecked")
    @Override
    public List<PriceTrendDTO> getItemPriceTrend(String itemId, String supplierId, LocalDateTime start, LocalDateTime end) {
        final String sql = dialectDetector.isH2()
            ? buildH2PriceTrendSql()
            : buildOraclePriceTrendSql();

        final String normalizedSupplier = normalizeOptionalParam(supplierId);

        final Query query = em.createNativeQuery(sql);
        query.setParameter("start", start);
        query.setParameter("end", end);
        query.setParameter("itemId", itemId);
        query.setParameter("supplierId", normalizedSupplier);

        final List<Object[]> raw = query.getResultList();
        return raw.stream()
                .map(r -> new PriceTrendDTO((String) r[0], (BigDecimal) r[1]))
                .collect(Collectors.toList());
    }

    /* ======================================================================
     * SQL Builder Methods - H2 Dialect
     * ====================================================================== */

    private String buildH2MonthlyMovementSql(boolean withSupplierFilter) {
        final String baseQuery = """
            SELECT CONCAT(CAST(YEAR(sh.created_at) AS VARCHAR), '-',
                          LPAD(CAST(MONTH(sh.created_at) AS VARCHAR), 2, '0')) AS month_str,
                   SUM(CASE WHEN sh.quantity_change > 0 THEN sh.quantity_change ELSE 0 END) AS stock_in,
                   SUM(CASE WHEN sh.quantity_change < 0 THEN ABS(sh.quantity_change) ELSE 0 END) AS stock_out
            FROM stock_history sh
            %s
            WHERE sh.created_at BETWEEN :start AND :end
            %s
            GROUP BY CONCAT(CAST(YEAR(sh.created_at) AS VARCHAR), '-',
                            LPAD(CAST(MONTH(sh.created_at) AS VARCHAR), 2, '0'))
            ORDER BY 1
        """;

        final String join = withSupplierFilter ? "JOIN inventory_item i ON sh.item_id = i.id" : "";
        final String supplierFilter = withSupplierFilter ? "AND (:supplierId IS NULL OR UPPER(i.supplier_id) = UPPER(:supplierId))" : "";

        return String.format(baseQuery, join, supplierFilter);
    }

    private String buildH2DailyValuationSql() {
        return """
            WITH events AS (
                SELECT
                    CAST(sh.created_at AS DATE) AS day_date,
                    sh.item_id,
                    sh.created_at,
                    sh.quantity_change,
                    sh.price_at_change,
                    SUM(sh.quantity_change) OVER (
                        PARTITION BY sh.item_id
                        ORDER BY sh.created_at
                        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                    ) AS qty_after,
                    ROW_NUMBER() OVER (
                        PARTITION BY CAST(sh.created_at AS DATE), sh.item_id
                        ORDER BY sh.created_at DESC
                    ) AS rn
                FROM stock_history sh
                JOIN inventory_item i ON i.id = sh.item_id
                WHERE sh.created_at BETWEEN :start AND :end
                  AND (:supplierId IS NULL OR UPPER(i.supplier_id) = UPPER(:supplierId))
            )
            SELECT
                e.day_date,
                SUM(COALESCE(e.qty_after, 0) * COALESCE(e.price_at_change, i.price, 0)) AS total_value
            FROM events e
            JOIN inventory_item i ON i.id = e.item_id
            WHERE e.rn = 1
            GROUP BY e.day_date
            ORDER BY e.day_date
        """;
    }

    private String buildH2PriceTrendSql() {
        return """
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
    }

    /* ======================================================================
     * SQL Builder Methods - Oracle Dialect
     * ====================================================================== */

    private String buildOracleMonthlyMovementSql(boolean withSupplierFilter) {
        final String baseQuery = """
            SELECT TO_CHAR(sh.created_at, 'YYYY-MM') AS month_str,
                   SUM(CASE WHEN sh.quantity_change > 0 THEN sh.quantity_change ELSE 0 END) AS stock_in,
                   SUM(CASE WHEN sh.quantity_change < 0 THEN ABS(sh.quantity_change) ELSE 0 END) AS stock_out
            FROM stock_history sh
            %s
            WHERE sh.created_at BETWEEN :start AND :end
            %s
            GROUP BY TO_CHAR(sh.created_at, 'YYYY-MM')
            ORDER BY 1
        """;

        final String join = withSupplierFilter ? "JOIN inventory_item i ON sh.item_id = i.id" : "";
        final String supplierFilter = withSupplierFilter ? "AND (:supplierId IS NULL OR i.supplier_id = :supplierId)" : "";

        return String.format(baseQuery, join, supplierFilter);
    }

    private String buildOracleDailyValuationSql() {
        return """
            WITH events AS (
                SELECT
                    CAST(TRUNC(sh.created_at) AS DATE) AS day_date,
                    sh.item_id,
                    sh.created_at,
                    sh.quantity_change,
                    sh.price_at_change,
                    SUM(sh.quantity_change) OVER (
                        PARTITION BY sh.item_id
                        ORDER BY sh.created_at
                    ) AS qty_after,
                    ROW_NUMBER() OVER (
                        PARTITION BY TRUNC(sh.created_at), sh.item_id
                        ORDER BY sh.created_at DESC
                    ) AS rn
                FROM stock_history sh
                JOIN inventory_item i ON i.id = sh.item_id
                WHERE sh.created_at BETWEEN :start AND :end
                  AND (:supplierId IS NULL OR i.supplier_id = :supplierId)
            )
            SELECT
                e.day_date,
                SUM(COALESCE(e.qty_after, 0) * COALESCE(e.price_at_change, i.price, 0)) AS total_value
            FROM events e
            JOIN inventory_item i ON i.id = e.item_id
            WHERE e.rn = 1
            GROUP BY e.day_date
            ORDER BY e.day_date
        """;
    }

    private String buildOraclePriceTrendSql() {
        return """
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

    /* ======================================================================
     * Utility Methods
     * ====================================================================== */

    /** Normalizes optional string parameters (null/blank → null). */
    private String normalizeOptionalParam(String param) {
        return (param == null || param.isBlank()) ? null : param.trim();
    }
}
