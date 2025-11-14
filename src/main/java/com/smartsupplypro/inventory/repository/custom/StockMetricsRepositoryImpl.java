package com.smartsupplypro.inventory.repository.custom;

import java.util.List;

import org.springframework.stereotype.Repository;

import com.smartsupplypro.inventory.repository.custom.util.DatabaseDialectDetector;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

/**
 * KPI metrics repository implementation with multi-database support.
 *
 * <p>Encapsulates native SQL for dashboard statistics and threshold monitoring
 * across H2 (test) and Oracle (prod) environments.
 *
 * @author Smart Supply Pro Development Team
 * @version 1.0.0
 * @since 2.0.0
 */
@Repository
public class StockMetricsRepositoryImpl implements StockMetricsRepository {

    @PersistenceContext
    private EntityManager em;

    private final DatabaseDialectDetector dialectDetector;

    public StockMetricsRepositoryImpl(DatabaseDialectDetector dialectDetector) {
        this.dialectDetector = dialectDetector;
    }

    @SuppressWarnings("unchecked")
    @Override
    public List<Object[]> getTotalStockBySupplier() {
        final String sql = dialectDetector.isH2()
            ? buildH2SupplierTotalsSql()
            : buildOracleSupplierTotalsSql();

        return em.createNativeQuery(sql).getResultList();
    }

    @SuppressWarnings("unchecked")
    @Override
    public List<Object[]> getUpdateCountByItem(String supplierId) {
        final String sql = dialectDetector.isH2()
            ? buildH2UpdateCountSql()
            : buildOracleUpdateCountSql();

        final String normalizedSupplier = normalizeOptionalParam(supplierId);

        return em.createNativeQuery(sql)
                .setParameter("supplierId", normalizedSupplier)
                .getResultList();
    }

    @SuppressWarnings("unchecked")
    @Override
    public List<Object[]> findItemsBelowMinimumStock(String supplierId) {
        final String sql = dialectDetector.isH2()
            ? buildH2BelowMinimumSql()
            : buildOracleBelowMinimumSql();

        final String normalizedSupplier = normalizeOptionalParam(supplierId);

        return em.createNativeQuery(sql)
                .setParameter("supplierId", normalizedSupplier)
                .getResultList();
    }

    /* ======================================================================
     * SQL Builder Methods - H2 Dialect
     * ====================================================================== */

    private String buildH2SupplierTotalsSql() {
        return """
            SELECT s."NAME" AS supplier_name, SUM(i."QUANTITY") AS total_quantity
            FROM "SUPPLIER" s
            JOIN "INVENTORY_ITEM" i ON s."ID" = i."SUPPLIER_ID"
            GROUP BY s."NAME"
            ORDER BY total_quantity DESC
        """;
    }

    private String buildH2UpdateCountSql() {
        return """
            SELECT i."NAME" AS item_name, COUNT(sh."ID") AS update_count
            FROM "INVENTORY_ITEM" i
            JOIN "STOCK_HISTORY" sh ON sh."ITEM_ID" = i."ID"
            WHERE (:supplierId IS NULL OR UPPER(i."SUPPLIER_ID") = UPPER(:supplierId))
            GROUP BY i."NAME"
            ORDER BY update_count DESC
        """;
    }

    private String buildH2BelowMinimumSql() {
        return """
            SELECT i."NAME", i."QUANTITY", i."MINIMUM_QUANTITY"
            FROM "INVENTORY_ITEM" i
            WHERE i."QUANTITY" < i."MINIMUM_QUANTITY"
              AND (:supplierId IS NULL OR UPPER(i."SUPPLIER_ID") = UPPER(:supplierId))
            ORDER BY i."QUANTITY" ASC
        """;
    }

    /* ======================================================================
     * SQL Builder Methods - Oracle Dialect
     * ====================================================================== */

    private String buildOracleSupplierTotalsSql() {
        return """
            SELECT s.name AS supplier_name, SUM(i.quantity) AS total_quantity
            FROM supplier s
            JOIN inventory_item i ON s.id = i.supplier_id
            GROUP BY s.name
            ORDER BY total_quantity DESC
        """;
    }

    private String buildOracleUpdateCountSql() {
        return """
            SELECT i.name AS item_name, COUNT(sh.id) AS update_count
            FROM stock_history sh
            JOIN inventory_item i ON sh.item_id = i.id
            WHERE (:supplierId IS NULL OR UPPER(i.supplier_id) = UPPER(:supplierId))
            GROUP BY i.name
            ORDER BY update_count DESC
        """;
    }

    private String buildOracleBelowMinimumSql() {
        return """
            SELECT i.name, i.quantity, i.minimum_quantity
            FROM inventory_item i
            WHERE i.quantity < i.minimum_quantity
              AND (:supplierId IS NULL OR UPPER(i.supplier_id) = UPPER(:supplierId))
            ORDER BY i.quantity ASC
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
