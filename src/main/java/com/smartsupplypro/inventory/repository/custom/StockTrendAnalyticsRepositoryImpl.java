package com.smartsupplypro.inventory.repository.custom;

import com.smartsupplypro.inventory.dto.PriceTrendDTO;
import com.smartsupplypro.inventory.repository.custom.util.DatabaseDialectDetector;
import com.smartsupplypro.inventory.repository.custom.util.StockTrendSqlBuilder;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Custom repository implementation for time-series stock and price trend analytics.
 *
 * <p>Delegates SQL generation to {@link StockTrendSqlBuilder} and selects the correct
 * dialect variant at runtime via {@link DatabaseDialectDetector}.</p>
 *
 * @see StockTrendAnalyticsRepository
 */
@Repository
public class StockTrendAnalyticsRepositoryImpl implements StockTrendAnalyticsRepository {

    @PersistenceContext
    private EntityManager em;

    private final DatabaseDialectDetector dialectDetector;

    public StockTrendAnalyticsRepositoryImpl(DatabaseDialectDetector dialectDetector) {
        this.dialectDetector = dialectDetector;
    }

    /**
     * Executes dialect-specific native SQL for monthly stock movement aggregation.
     *
     * @param start inclusive lower bound
     * @param end   inclusive upper bound
     * @return monthly aggregations ordered by month ascending
     */
    @SuppressWarnings("unchecked")
    @Override
    public List<Object[]> getMonthlyStockMovement(LocalDateTime start, LocalDateTime end) {
        final String sql = dialectDetector.isH2()
            ? StockTrendSqlBuilder.buildH2MonthlyMovementSql(false)
            : StockTrendSqlBuilder.buildOracleMonthlyMovementSql(false);
        return em.createNativeQuery(sql)
                .setParameter("start", start)
                .setParameter("end", end)
                .getResultList();
    }

    /**
     * Executes dialect-specific native SQL for monthly stock movement filtered by supplier.
     *
     * @param start      inclusive lower bound
     * @param end        inclusive upper bound
     * @param supplierId optional supplier filter
     * @return monthly aggregations ordered by month ascending
     */
    @SuppressWarnings("unchecked")
    @Override
    public List<Object[]> getMonthlyStockMovementBySupplier(LocalDateTime start, LocalDateTime end, String supplierId) {
        final String sql = dialectDetector.isH2()
            ? StockTrendSqlBuilder.buildH2MonthlyMovementSql(true)
            : StockTrendSqlBuilder.buildOracleMonthlyMovementSql(true);
        return em.createNativeQuery(sql)
                .setParameter("start", start)
                .setParameter("end", end)
                .setParameter("supplierId", normalizeOptionalParam(supplierId))
                .getResultList();
    }

    /**
     * Executes dialect-specific native SQL for daily inventory valuation.
     *
     * <p>Passes {@code start}/{@code end} as {@code java.sql.Timestamp} because some JDBC
     * drivers do not coerce {@code LocalDateTime} for native query parameters automatically.
     *
     * @param start      inclusive lower bound
     * @param end        inclusive upper bound
     * @param supplierId optional supplier filter
     * @return daily valuations ordered by day ascending
     */
    @SuppressWarnings("unchecked")
    @Override
    public List<Object[]> getDailyStockValuation(LocalDateTime start, LocalDateTime end, String supplierId) {
        final String sql = dialectDetector.isH2()
            ? StockTrendSqlBuilder.buildH2DailyValuationSql()
            : StockTrendSqlBuilder.buildOracleDailyValuationSql();

        // Convert LocalDateTime to java.sql.Timestamp for JDBC compatibility
        final java.sql.Timestamp startTs = java.sql.Timestamp.valueOf(start);
        final java.sql.Timestamp endTs = java.sql.Timestamp.valueOf(end);

        return em.createNativeQuery(sql)
                .setParameter("start", startTs)
                .setParameter("end", endTs)
                .setParameter("supplierId", normalizeOptionalParam(supplierId))
                .getResultList();
    }

    /**
     * Executes dialect-specific native SQL for daily average price trend of a specific item.
     *
     * <p>Maps raw Object[] rows to {@link PriceTrendDTO} projections after query execution.
     *
     * @param itemId     required item identifier
     * @param supplierId optional supplier filter
     * @param start      inclusive lower bound
     * @param end        inclusive upper bound
     * @return daily price trend ordered by day ascending
     */
    @SuppressWarnings("unchecked")
    @Override
    public List<PriceTrendDTO> getItemPriceTrend(String itemId, String supplierId, LocalDateTime start, LocalDateTime end) {
        final String sql = dialectDetector.isH2()
            ? StockTrendSqlBuilder.buildH2PriceTrendSql()
            : StockTrendSqlBuilder.buildOraclePriceTrendSql();

        final Query query = em.createNativeQuery(sql);
        query.setParameter("start", start);
        query.setParameter("end", end);
        query.setParameter("itemId", itemId);
        query.setParameter("supplierId", normalizeOptionalParam(supplierId));

        final List<Object[]> raw = query.getResultList();
        return raw.stream()
                .map(r -> new PriceTrendDTO((String) r[0], (BigDecimal) r[1]))
                .collect(Collectors.toList());
    }

    private String normalizeOptionalParam(String param) {
        return (param == null || param.isBlank()) ? null : param.trim();
    }
}
