package com.smartsupplypro.inventory.repository.custom;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Repository;

import com.smartsupplypro.inventory.dto.StockEventRowDTO;
import com.smartsupplypro.inventory.repository.custom.util.DatabaseDialectDetector;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;

/**
 * Detail query repository implementation with multi-database support.
 *
 * <p>Encapsulates complex filtering logic and JPQL event streaming for
 * audit trails and cost-flow calculations across H2 and Oracle.
 *
 * @author Smart Supply Pro Development Team
 * @version 1.0.0
 * @since 2.0.0
 */
@Repository
public class StockDetailQueryRepositoryImpl implements StockDetailQueryRepository {

    @PersistenceContext
    private EntityManager em;

    private final DatabaseDialectDetector dialectDetector;

    public StockDetailQueryRepositoryImpl(DatabaseDialectDetector dialectDetector) {
        this.dialectDetector = dialectDetector;
    }

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
            ? buildH2FilteredSearchSql()
            : buildOracleFilteredSearchSql();

        // Normalize optional parameters for NULL-safe SQL filtering
        final String itemPattern = (itemName == null || itemName.isBlank())
            ? null : "%" + itemName.toLowerCase() + "%";
        final String normalizedSupplier = normalizeOptionalParam(supplierId);
        final String normalizedCreator = (createdBy == null || createdBy.isBlank())
            ? null : createdBy.toLowerCase();

        final Query query = em.createNativeQuery(sql);
        query.setParameter("startDate", startDate);
        query.setParameter("endDate", endDate);
        query.setParameter("itemPattern", itemPattern);
        query.setParameter("supplierId", normalizedSupplier);
        query.setParameter("createdByNorm", normalizedCreator);
        query.setParameter("minChange", minChange);
        query.setParameter("maxChange", maxChange);

        return query.getResultList();
    }

    @Override
    public List<StockEventRowDTO> streamEventsForWAC(LocalDateTime end, String supplierId) {
        // Use JPQL for entity-based event streaming (database-agnostic)
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

    /* ======================================================================
     * SQL Builder Methods - H2 Dialect
     * ====================================================================== */

    private String buildH2FilteredSearchSql() {
        return """
            SELECT i.name AS item_name, 
                   s.name AS supplier_name, 
                   sh.quantity_change, 
                   sh.reason, 
                   sh.created_by, 
                   sh.created_at
            FROM stock_history sh
            JOIN inventory_item i ON sh.item_id = i.id
            JOIN supplier s ON i.supplier_id = s.id
            WHERE (:startDate IS NULL OR sh.created_at >= :startDate)
              AND (:endDate IS NULL OR sh.created_at <= :endDate)
              AND (:itemPattern IS NULL OR LOWER(i.name) LIKE :itemPattern)
              AND (:supplierId IS NULL OR UPPER(i.supplier_id) = UPPER(:supplierId))
              AND (:createdByNorm IS NULL OR LOWER(sh.created_by) = :createdByNorm)
              AND (:minChange IS NULL OR sh.quantity_change >= :minChange)
              AND (:maxChange IS NULL OR sh.quantity_change <= :maxChange)
            ORDER BY sh.created_at DESC
        """;
    }

    /* ======================================================================
     * SQL Builder Methods - Oracle Dialect
     * ====================================================================== */

    private String buildOracleFilteredSearchSql() {
        return """
            SELECT i.name AS item_name, 
                   s.name AS supplier_name, 
                   sh.quantity_change, 
                   sh.reason, 
                   sh.created_by, 
                   sh.created_at
            FROM stock_history sh
            JOIN inventory_item i ON sh.item_id = i.id
            JOIN supplier s ON i.supplier_id = s.id
            WHERE (:startDate IS NULL OR sh.created_at >= :startDate)
              AND (:endDate IS NULL OR sh.created_at <= :endDate)
              AND (:itemPattern IS NULL OR LOWER(i.name) LIKE :itemPattern)
              AND (:supplierId IS NULL OR i.supplier_id = :supplierId)
              AND (:createdByNorm IS NULL OR LOWER(sh.created_by) = :createdByNorm)
              AND (:minChange IS NULL OR sh.quantity_change >= :minChange)
              AND (:maxChange IS NULL OR sh.quantity_change <= :maxChange)
            ORDER BY sh.created_at DESC
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
