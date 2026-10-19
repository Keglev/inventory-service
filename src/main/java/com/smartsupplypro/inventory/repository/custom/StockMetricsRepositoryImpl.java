package com.smartsupplypro.inventory.repository.custom;

import java.util.List;

import org.springframework.stereotype.Repository;

import com.smartsupplypro.inventory.repository.custom.util.StockMetricsSqlBuilder;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

/**
 * Custom repository implementation for aggregated stock KPI metrics.
 *
 * <p>Delegates SQL generation to {@link StockMetricsSqlBuilder}; the same statements run on H2
 * and Oracle.</p>
 *
 * @see StockMetricsRepository
 */
@Repository
public class StockMetricsRepositoryImpl implements StockMetricsRepository {

    @PersistenceContext
    private EntityManager em;

    /**
     * Executes native SQL for total stock per supplier.
     *
     * @return per-supplier totals ordered by value descending, then supplier name
     */
    @SuppressWarnings("unchecked")
    @Override
    public List<Object[]> getTotalStockBySupplier() {
        return em.createNativeQuery(StockMetricsSqlBuilder.buildSupplierTotalsSql()).getResultList();
    }

    /**
     * Executes native SQL for update count per item with optional supplier filter.
     *
     * @param supplierId optional supplier filter (null returns all suppliers)
     * @return per-item counts ordered by update_count descending
     */
    @SuppressWarnings("unchecked")
    @Override
    public List<Object[]> getUpdateCountByItem(String supplierId) {
        return em.createNativeQuery(StockMetricsSqlBuilder.buildUpdateCountSql())
                .setParameter("supplierId", OptionalQueryParam.normalize(supplierId))
                .getResultList();
    }
}
