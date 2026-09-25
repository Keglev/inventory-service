package com.smartsupplypro.inventory.repository.custom;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
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
        final Query query = em.createNativeQuery(filteredSearchSql());
        bindSearchParameters(query, startDate, endDate, itemName, supplierId, createdBy, minChange, maxChange);
        return query.getResultList();
    }

    /**
     * Runs the filtered search for one page, plus a count of all matching rows.
     *
     * <p>The count wraps the same SQL, so page and total always agree. The SQL
     * orders newest first with the id as tie-breaker, a total order, so
     * consecutive pages neither repeat nor skip a row.
     *
     * @param startDate  optional minimum creation timestamp
     * @param endDate    optional maximum creation timestamp
     * @param itemName   optional partial item name (case-insensitive)
     * @param supplierId optional supplier ID
     * @param createdBy  optional creator username (case-insensitive exact match)
     * @param minChange  optional minimum quantity change
     * @param maxChange  optional maximum quantity change
     * @param pageable   page index and size; its sort is ignored
     * @return the requested page with the total number of matching rows
     */
    @SuppressWarnings("unchecked")
    @Override
    public Page<Object[]> searchStockUpdatesPage(
        LocalDateTime startDate,
        LocalDateTime endDate,
        String itemName,
        String supplierId,
        String createdBy,
        Integer minChange,
        Integer maxChange,
        Pageable pageable
    ) {
        final String sql = filteredSearchSql();

        final Query count = em.createNativeQuery("SELECT COUNT(*) FROM (" + sql + ") q");
        bindSearchParameters(count, startDate, endDate, itemName, supplierId, createdBy, minChange, maxChange);
        final long total = ((Number) count.getSingleResult()).longValue();

        final Query rows = em.createNativeQuery(sql);
        bindSearchParameters(rows, startDate, endDate, itemName, supplierId, createdBy, minChange, maxChange);
        rows.setFirstResult((int) pageable.getOffset());
        rows.setMaxResults(pageable.getPageSize());

        return new PageImpl<>(rows.getResultList(), pageable, total);
    }

    private String filteredSearchSql() {
        return dialectDetector.isH2()
            ? StockDetailSqlBuilder.buildH2FilteredSearchSql()
            : StockDetailSqlBuilder.buildOracleFilteredSearchSql();
    }

    /**
     * Binds the seven search filters. Optional values are normalised to {@code null}
     * so the SQL's {@code :param IS NULL} guards skip the filter.
     */
    private void bindSearchParameters(
        Query query,
        LocalDateTime startDate,
        LocalDateTime endDate,
        String itemName,
        String supplierId,
        String createdBy,
        Integer minChange,
        Integer maxChange
    ) {
        final String itemPattern = (itemName == null || itemName.isBlank())
            ? null : "%" + itemName.toLowerCase() + "%";
        final String normalizedCreator = (createdBy == null || createdBy.isBlank())
            ? null : createdBy.toLowerCase();
        // Use java.sql.Timestamp for JDBC/native query compatibility with LocalDateTime parameters
        query.setParameter("startDate", (startDate == null) ? null : java.sql.Timestamp.valueOf(startDate));
        query.setParameter("endDate", (endDate == null) ? null : java.sql.Timestamp.valueOf(endDate));
        query.setParameter("itemPattern", itemPattern);
        query.setParameter("supplierId", normalizeOptionalParam(supplierId));
        query.setParameter("createdByNorm", normalizedCreator);
        query.setParameter("minChange", minChange);
        query.setParameter("maxChange", maxChange);
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
