package com.smartsupplypro.inventory.repository.custom;

import java.util.List;

import org.springframework.stereotype.Repository;

import com.smartsupplypro.inventory.repository.custom.util.DatabaseDialectDetector;
import com.smartsupplypro.inventory.repository.custom.util.StockMetricsSqlBuilder;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

/**
 * Custom repository implementation for aggregated stock KPI metrics.
 *
 * <p>Delegates SQL generation to {@link StockMetricsSqlBuilder} and selects the correct
 * dialect variant at runtime via {@link DatabaseDialectDetector}.</p>
 *
 * @see StockMetricsRepository
 */
@Repository
public class StockMetricsRepositoryImpl implements StockMetricsRepository {

    @PersistenceContext
    private EntityManager em;

    private final DatabaseDialectDetector dialectDetector;

    public StockMetricsRepositoryImpl(DatabaseDialectDetector dialectDetector) {
        this.dialectDetector = dialectDetector;
    }

    /**
     * Executes dialect-specific native SQL for total stock per supplier.
     *
     * @return per-supplier totals ordered by quantity descending
     */
    @SuppressWarnings("unchecked")
    @Override
    public List<Object[]> getTotalStockBySupplier() {
        final String sql = dialectDetector.isH2()
            ? StockMetricsSqlBuilder.buildH2SupplierTotalsSql()
            : StockMetricsSqlBuilder.buildOracleSupplierTotalsSql();
        return em.createNativeQuery(sql).getResultList();
    }

    /**
     * Executes dialect-specific native SQL for update count per item with optional supplier filter.
     *
     * @param supplierId optional supplier filter (null returns all suppliers)
     * @return per-item counts ordered by update_count descending
     */
    @SuppressWarnings("unchecked")
    @Override
    public List<Object[]> getUpdateCountByItem(String supplierId) {
        final String sql = dialectDetector.isH2()
            ? StockMetricsSqlBuilder.buildH2UpdateCountSql()
            : StockMetricsSqlBuilder.buildOracleUpdateCountSql();
        return em.createNativeQuery(sql)
                .setParameter("supplierId", normalizeOptionalParam(supplierId))
                .getResultList();
    }

    /**
     * Executes dialect-specific native SQL for items below minimum stock threshold.
     *
     * @param supplierId optional supplier filter (null returns all suppliers)
     * @return items below minimum ordered by quantity ascending
     */
    @SuppressWarnings("unchecked")
    @Override
    public List<Object[]> findItemsBelowMinimumStock(String supplierId) {
        final String sql = dialectDetector.isH2()
            ? StockMetricsSqlBuilder.buildH2BelowMinimumSql()
            : StockMetricsSqlBuilder.buildOracleBelowMinimumSql();
        return em.createNativeQuery(sql)
                .setParameter("supplierId", normalizeOptionalParam(supplierId))
                .getResultList();
    }

    private String normalizeOptionalParam(String param) {
        return (param == null || param.isBlank()) ? null : param.trim();
    }
}
