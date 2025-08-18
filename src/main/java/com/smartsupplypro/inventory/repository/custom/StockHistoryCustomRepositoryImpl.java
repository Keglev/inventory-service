package com.smartsupplypro.inventory.repository.custom;

import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Repository;

import com.smartsupplypro.inventory.dto.PriceTrendDTO;
import com.smartsupplypro.inventory.dto.StockEventRowDTO;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Custom implementation for StockHistory native queries that require
 * database-specific SQL compatibility (e.g., TO_CHAR in Oracle vs FORMATDATETIME in H2).
 * <p>
 * This class isolates native query logic and supports conditional execution
 * based on the active Spring profile ("test"/"h2" vs "oracle").
 */
@Repository
@RequiredArgsConstructor
public class StockHistoryCustomRepositoryImpl implements StockHistoryCustomRepository {

    private static final Logger log = LoggerFactory.getLogger(StockHistoryCustomRepositoryImpl.class);

    @PersistenceContext
    private final EntityManager em;

    @Autowired
    private Environment environment;

    private boolean isH2() {
        return Arrays.asList(environment.getActiveProfiles()).stream()
                    .anyMatch(p -> p.equalsIgnoreCase("test") || p.equalsIgnoreCase("h2"));
    }

    @PostConstruct
    public void logDatabaseDetection() {
        log.info("Active profiles: {}", Arrays.toString(environment.getActiveProfiles()));
        log.info("[Database Detection] Using {} SQL syntax for analytics queries.",
                 isH2() ? "H2-compatible" : "Oracle");
    }


    @SuppressWarnings("unchecked")
    @Override
    public List<Object[]> getMonthlyStockMovement(LocalDateTime start, LocalDateTime end) {
        final String sql;
        if (isH2()) {
            // Fallback for H2: extract year and month separately, then concat
            sql = """
                SELECT CONCAT(CAST(YEAR(sh.timestamp) AS VARCHAR), '-',
                            LPAD(CAST(MONTH(sh.timestamp) AS VARCHAR), 2, '0')) AS month_str,
                        SUM(CASE WHEN sh.change > 0 THEN sh.change ELSE 0 END) AS stock_in,
                        SUM(CASE WHEN sh.change < 0 THEN ABS(sh.change) ELSE 0 END) AS stock_out
                FROM stock_history sh
                WHERE sh.timestamp BETWEEN :start AND :end
                GROUP BY CONCAT(CAST(YEAR(sh.timestamp) AS VARCHAR), '-',
                                LPAD(CAST(MONTH(sh.timestamp) AS VARCHAR), 2, '0'))
                ORDER BY 1
            """;
        } else {
            sql = """
                SELECT TO_CHAR(sh.timestamp, 'YYYY-MM') AS month_str,
                        SUM(CASE WHEN sh.change > 0 THEN sh.change ELSE 0 END) AS stock_in,
                        SUM(CASE WHEN sh.change < 0 THEN ABS(sh.change) ELSE 0 END) AS stock_out
                FROM stock_history sh
                WHERE sh.timestamp BETWEEN :start AND :end
                GROUP BY TO_CHAR(sh.timestamp, 'YYYY-MM')
                ORDER BY 1
            """;
        }

        log.debug("Executing SQL for getMonthlyStockMovement (isH2={}): {}", isH2(), sql);

        Query nativeQuery = em.createNativeQuery(sql);
        nativeQuery.setParameter("start", start);
        nativeQuery.setParameter("end", end);
        return nativeQuery.getResultList();
    }


    @SuppressWarnings("unchecked")
    @Override
    public List<Object[]> getMonthlyStockMovementFiltered(LocalDateTime start, LocalDateTime end, String supplierId) {
        final String sql;
        if (isH2()) {
            sql = """
                SELECT CONCAT(CAST(YEAR(sh.timestamp) AS VARCHAR), '-',
                            LPAD(CAST(MONTH(sh.timestamp) AS VARCHAR), 2, '0')) AS month_str,
                        SUM(CASE WHEN sh.change > 0 THEN sh.change ELSE 0 END) AS stock_in,
                        SUM(CASE WHEN sh.change < 0 THEN ABS(sh.change) ELSE 0 END) AS stock_out
                FROM stock_history sh
                JOIN inventory_item i ON sh.item_id = i.id
                WHERE sh.timestamp BETWEEN :start AND :end
                    AND (:supplierId IS NULL OR UPPER(i.supplier_id) = UPPER(:supplierId))
                GROUP BY CONCAT(CAST(YEAR(sh.timestamp) AS VARCHAR), '-',
                            LPAD(CAST(MONTH(sh.timestamp) AS VARCHAR), 2, '0'))
                ORDER BY 1
            """;
        } else {
            sql = """
                SELECT TO_CHAR(sh.timestamp, 'YYYY-MM') AS month_str,
                        SUM(CASE WHEN sh.change > 0 THEN sh.change ELSE 0 END) AS stock_in,
                        SUM(CASE WHEN sh.change < 0 THEN ABS(sh.change) ELSE 0 END) AS stock_out
                FROM stock_history sh
                JOIN inventory_item i ON sh.item_id = i.id
                WHERE sh.timestamp BETWEEN :start AND :end
                    AND (:supplierId IS NULL OR i.supplier_id = :supplierId)
                GROUP BY TO_CHAR(sh.timestamp, 'YYYY-MM')
                ORDER BY 1
            """;
        }

        log.debug("Executing SQL for getMonthlyStockMovementFiltered (isH2={}): {}", isH2(), sql);

        final String normalizedSupplier = (supplierId == null || supplierId.isBlank()) ? null : supplierId;

        final Query nativeQuery = em.createNativeQuery(sql);
        nativeQuery.setParameter("start", start);
        nativeQuery.setParameter("end", end);
        nativeQuery.setParameter("supplierId", normalizedSupplier);
        return nativeQuery.getResultList();
    }

    @SuppressWarnings("unchecked")
    @Override
    public List<Object[]> getStockValueGroupedByDateFiltered(LocalDateTime start, LocalDateTime end, String supplierId) {
        String sql;
        if (isH2()) {
            sql = """
                SELECT CONCAT(CAST(YEAR(sh.timestamp) AS VARCHAR), '-',
                            LPAD(CAST(MONTH(sh.timestamp) AS VARCHAR), 2, '0'), '-',
                            LPAD(CAST(DAY(sh.timestamp) AS VARCHAR), 2, '0')) AS day_str,
                        SUM(sh.change * i.price) AS total_value
                FROM stock_history sh
                JOIN inventory_item i ON sh.item_id = i.id
                WHERE sh.timestamp BETWEEN :start AND :end
                    AND (:supplierId IS NULL OR UPPER(i.supplier_id) = UPPER(:supplierId))
                GROUP BY CONCAT(CAST(YEAR(sh.timestamp) AS VARCHAR), '-',
                                LPAD(CAST(MONTH(sh.timestamp) AS VARCHAR), 2, '0'), '-',
                                LPAD(CAST(DAY(sh.timestamp) AS VARCHAR), 2, '0'))
                ORDER BY 1
            """;
        } else {
            sql = """
                SELECT TO_CHAR(sh.timestamp, 'YYYY-MM-DD') AS day_str,
                        SUM(sh.change * i.price) AS total_value
                FROM stock_history sh
                JOIN inventory_item i ON sh.item_id = i.id
                WHERE sh.timestamp BETWEEN :start AND :end
                    AND (:supplierId IS NULL OR i.supplier_id = :supplierId)
                GROUP BY TO_CHAR(sh.timestamp, 'YYYY-MM-DD')
                ORDER BY 1
            """;
        }

        final String normalizedSupplier = (supplierId == null || supplierId.isBlank()) ? null : supplierId;
        Query nativeQuery = em.createNativeQuery(sql);
        nativeQuery.setParameter("start", start);
        nativeQuery.setParameter("end", end);
        nativeQuery.setParameter("supplierId", normalizedSupplier);
        return nativeQuery.getResultList();
    }
 

    @SuppressWarnings("unchecked")
    @Override
    public List<Object[]> getTotalStockPerSupplier() {
        List<Object[]> allSuppliers = em.createNativeQuery("SELECT id, name FROM supplier").getResultList();
        log.debug("Suppliers table content:");
        for (Object[] row : allSuppliers) {
            log.debug("Supplier: id={}, name={}", row[0], row[1]);
        }
        String sql = """
            SELECT s.name AS supplier_name, SUM(i.quantity) AS total_quantity
            FROM supplier s
            JOIN inventory_item i ON s.id = i.supplier_id
            GROUP BY s.name
            ORDER BY total_quantity DESC
        """;
        return em.createNativeQuery(sql).getResultList();
    }

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
        log.debug("Executing findItemsBelowMinimumStockFiltered with supplierId={}, normalizedSupplier={}", supplierId, normalizedSupplier);

        // Debug: dump all items in table before filtering
        List<Object[]> allItems = em.createNativeQuery("SELECT id, name, quantity, minimum_quantity, supplier_id FROM inventory_item ORDER BY name")
                                    .getResultList();
        log.debug("Inventory items before filter:");
        for (Object[] row : allItems) {
            log.debug("Item: id={}, name={}, qty={}, minQty={}, supplierId={}", row[0], row[1], row[2], row[3], row[4]);
        }

        final Query nativeQuery = em.createNativeQuery(sql);
        nativeQuery.setParameter("supplierId", normalizedSupplier);
        return nativeQuery.getResultList();
    }

    @Override
    @SuppressWarnings("unchecked")
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
                    SELECT i.name AS item_name, s.name AS supplier_name, sh.change, sh.reason, sh.created_by, sh.timestamp
                    FROM stock_history sh
                    JOIN inventory_item i ON sh.item_id = i.id
                    JOIN supplier s ON i.supplier_id = s.id
                    WHERE (:startDate   IS NULL OR sh.timestamp >= :startDate)
                        AND (:endDate     IS NULL OR sh.timestamp <= :endDate)
                        AND (:itemPattern IS NULL OR LOWER(i.name) LIKE :itemPattern)
                        AND (:supplierId  IS NULL OR UPPER(i.supplier_id) = UPPER(:supplierId))
                        AND (:createdByNorm IS NULL OR LOWER(sh.created_by) = :createdByNorm)
                        AND (:minChange   IS NULL OR sh.change >= :minChange)
                        AND (:maxChange   IS NULL OR sh.change <= :maxChange)
                    ORDER BY sh.timestamp DESC
                """;
            } else {
                // Oracle: use ||
                sql = """
                    SELECT i.name AS item_name, s.name AS supplier_name, sh.change, sh.reason, sh.created_by, sh.timestamp
                    FROM stock_history sh
                    JOIN inventory_item i ON sh.item_id = i.id
                    JOIN supplier s ON i.supplier_id = s.id
                    WHERE (:startDate   IS NULL OR sh.timestamp >= :startDate)
                        AND (:endDate     IS NULL OR sh.timestamp <= :endDate)
                        AND (:itemPattern IS NULL OR LOWER(i.name) LIKE :itemPattern)
                        AND (:supplierId  IS NULL OR i.supplier_id = :supplierId)
                        AND (:createdByNorm IS NULL OR LOWER(sh.created_by) = :createdByNorm)
                        AND (:minChange   IS NULL OR sh.change >= :minChange)
                        AND (:maxChange   IS NULL OR sh.change <= :maxChange)
                    ORDER BY sh.timestamp DESC
                """;
            }

        final String itemPattern   = (itemName == null || itemName.isBlank()) ? null : "%"+itemName.toLowerCase() + "%";
        final String normalizedSupplier = (supplierId == null || supplierId.isBlank()) ? null : supplierId;
        final String createdByNorm  = (createdBy == null || createdBy.isBlank()) ? null : createdBy.toLowerCase();

        final Query nativeQuery = em.createNativeQuery(sql);
        nativeQuery.setParameter("startDate", startDate);
        nativeQuery.setParameter("endDate", endDate);
        nativeQuery.setParameter("itemPattern", itemPattern);
        nativeQuery.setParameter("supplierId", normalizedSupplier);
        nativeQuery.setParameter("createdByNorm", createdByNorm);
        nativeQuery.setParameter("minChange", minChange);
        nativeQuery.setParameter("maxChange", maxChange);

        return nativeQuery.getResultList();
    }

    @SuppressWarnings("unchecked")
    @Override
    public List<PriceTrendDTO> getPriceTrend(String itemId, String supplierId, LocalDateTime start, LocalDateTime end) {
        final String sql;
        if (isH2()) {
            sql = """
                SELECT CONCAT(
                            CAST(YEAR(sh.timestamp) AS VARCHAR), '-',
                            LPAD(CAST(MONTH(sh.timestamp) AS VARCHAR), 2, '0'), '-',
                            LPAD(CAST(DAY(sh.timestamp) AS VARCHAR), 2, '0')
                        ) AS day_str,
                        AVG(sh.price_at_change) AS price
                FROM stock_history sh
                JOIN inventory_item i ON sh.item_id = i.id
                WHERE sh.timestamp BETWEEN :start AND :end
                    AND sh.item_id = :itemId
                    AND (:supplierId IS NULL OR UPPER(i.supplier_id) = UPPER(:supplierId))
                GROUP BY CONCAT(
                            CAST(YEAR(sh.timestamp) AS VARCHAR), '-',
                            LPAD(CAST(MONTH(sh.timestamp) AS VARCHAR), 2, '0'), '-',
                            LPAD(CAST(DAY(sh.timestamp) AS VARCHAR), 2, '0')
                        )
                ORDER BY 1
            """;
        } else {
            sql = """
                SELECT TO_CHAR(sh.timestamp, 'YYYY-MM-DD') AS day_str,
                        AVG(sh.price_at_change) AS price
                FROM stock_history sh
                JOIN inventory_item i ON sh.item_id = i.id
                WHERE sh.timestamp BETWEEN :start AND :end
                    AND sh.item_id = :itemId
                    AND (:supplierId IS NULL OR i.supplier_id = :supplierId)
                GROUP BY TO_CHAR(sh.timestamp, 'YYYY-MM-DD')
                ORDER BY 1
            """;
        }

        // normalize supplierId so blank = null
        final String normalizedSupplier = (supplierId == null || supplierId.isBlank()) ? null : supplierId;

        Query nativeQuery = em.createNativeQuery(sql);
        nativeQuery.setParameter("start", start);
        nativeQuery.setParameter("end", end);
        nativeQuery.setParameter("itemId", itemId);
        nativeQuery.setParameter("supplierId", normalizedSupplier);

        // Manually map the result to PriceTrendDTO
        final List<Object[]> raw = nativeQuery.getResultList();
        return raw.stream()
                .map(r -> new PriceTrendDTO((String) r[0], (BigDecimal) r[1]))
                .collect(Collectors.toList());
    }

    @Override
    public List<StockEventRowDTO> findEventsUpTo(LocalDateTime end, String supplierId) {
        // JPQL uses entity property names (portable across H2 / Oracle)
        String jpql = """
            select new com.smartsupplypro.inventory.dto.StockEventRowDTO(
                sh.itemId, sh.supplierId, sh.timestamp, sh.change, sh.priceAtChange, sh.reason
            )
            from StockHistory sh
            where sh.timestamp <= :end
              and (:supplierId is null or sh.supplierId = :supplierId)
            order by sh.itemId asc, sh.timestamp asc
        """;
        return em.createQuery(jpql, StockEventRowDTO.class)
                 .setParameter("end", end)
                 .setParameter("supplierId", supplierId)
                 .getResultList();
    }

}
