package com.smartsupplypro.inventory.repository.custom;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Repository;

import com.smartsupplypro.inventory.dto.StockEventRowDTO;
import com.smartsupplypro.inventory.repository.custom.util.DatabaseDialectDetector;
import com.smartsupplypro.inventory.repository.custom.util.StockDetailSqlBuilder;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;

/**
 * Custom repository implementation for granular stock history searches and WAC event streaming.
 *
 * <p>Delegates SQL generation to {@link StockDetailSqlBuilder} and selects the correct
 * dialect variant at runtime via {@link DatabaseDialectDetector}.</p>
 *
 * @see StockDetailQueryRepository
 */
@Repository
public class StockDetailQueryRepositoryImpl implements StockDetailQueryRepository {

    @PersistenceContext
    private EntityManager em;

    private final DatabaseDialectDetector dialectDetector;

    public StockDetailQueryRepositoryImpl(DatabaseDialectDetector dialectDetector) {
        this.dialectDetector = dialectDetector;
    }

    /**
     * Executes dialect-specific native SQL for filtered stock history search.
     *
     * <p>Delegates SQL construction to {@link StockDetailSqlBuilder}. Optional string
     * parameters are normalised to {@code null} before binding so the SQL's
     * {@code :param IS NULL} guards can short-circuit the filter correctly.
     *
     * @param startDate  optional minimum creation timestamp
     * @param endDate    optional maximum creation timestamp
     * @param itemName   optional partial item name (case-insensitive)
     * @param supplierId optional supplier ID
     * @param createdBy  optional creator username (case-insensitive exact match)
     * @param minChange  optional minimum quantity change
     * @param maxChange  optional maximum quantity change
     * @return filtered records ordered by creation time descending
     */
    @SuppressWarnings("unchecked")
    @Override
    public List<Object[]> searchStockUpdates(
        LocalDateTime startDate,
        LocalDateTime endDate,
        String itemName,
        String supplierId,
        String createdBy,
        Integer minChange,
        Integer maxChange
    ) {
        final String sql = dialectDetector.isH2()
            ? StockDetailSqlBuilder.buildH2FilteredSearchSql()
            : StockDetailSqlBuilder.buildOracleFilteredSearchSql();

        // Normalize optional parameters so the SQL's :param IS NULL guards work correctly
        final String itemPattern = (itemName == null || itemName.isBlank())
            ? null : "%" + itemName.toLowerCase() + "%";
        final String normalizedSupplier = normalizeOptionalParam(supplierId);
        final String normalizedCreator = (createdBy == null || createdBy.isBlank())
            ? null : createdBy.toLowerCase();

        final Query query = em.createNativeQuery(sql);
        // Use java.sql.Timestamp for JDBC/native query compatibility with LocalDateTime parameters
        final java.sql.Timestamp startTs = (startDate == null) ? null : java.sql.Timestamp.valueOf(startDate);
        final java.sql.Timestamp endTs = (endDate == null) ? null : java.sql.Timestamp.valueOf(endDate);

        query.setParameter("startDate", startTs);
        query.setParameter("endDate", endTs);
        query.setParameter("itemPattern", itemPattern);
        query.setParameter("supplierId", normalizedSupplier);
        query.setParameter("createdByNorm", normalizedCreator);
        query.setParameter("minChange", minChange);
        query.setParameter("maxChange", maxChange);

        return query.getResultList();
    }

    /**
     * Streams stock events via JPQL for WAC cost-flow replay.
     *
     * <p>Uses JPQL instead of native SQL so the entity graph resolves correctly across
     * both H2 and Oracle without dialect-specific date casting.
     *
     * @param end        inclusive upper timestamp bound
     * @param supplierId optional supplier filter
     * @return events projected to {@link StockEventRowDTO}, ordered by itemId then timestamp
     */
    @Override
    public List<StockEventRowDTO> streamEventsForWAC(LocalDateTime end, String supplierId) {
        // JPQL ensures this query runs unchanged on H2 and Oracle
        final String jpql = """
            SELECT new com.smartsupplypro.inventory.dto.StockEventRowDTO(
                sh.itemId,
                COALESCE(sh.supplierId, i.supplierId),
                sh.timestamp,
                sh.change,
                sh.priceAtChange,
                sh.reason
            )
            FROM StockHistory sh, InventoryItem i
            WHERE i.id = sh.itemId
              AND sh.timestamp <= :end
              AND (:supplierIdNorm IS NULL OR LOWER(sh.supplierId) = :supplierIdNorm)
            ORDER BY sh.itemId ASC, sh.timestamp ASC
        """;

        final String supplierIdNorm = (supplierId == null || supplierId.isBlank())
            ? null : supplierId.trim().toLowerCase();

        return em.createQuery(jpql, StockEventRowDTO.class)
                .setParameter("end", end)
                .setParameter("supplierIdNorm", supplierIdNorm)
                .getResultList();
    }

    private String normalizeOptionalParam(String param) {
        return (param == null || param.isBlank()) ? null : param.trim();
    }
}
