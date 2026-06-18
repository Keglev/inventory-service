package com.smartsupplypro.inventory.repository.custom;

import java.lang.reflect.Field;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.repository.custom.util.DatabaseDialectDetector;

import jakarta.persistence.EntityManager;

/**
 * Integration tests for dynamic query methods in {@link StockMetricsRepositoryImpl}.
 *
 * <p>Verifies supplier filter normalization and dialect-specific SQL selection
 * for stock metrics queries.</p>
 */
@DataJpaTest
@ActiveProfiles("test")
@Import(DatabaseDialectDetector.class)
class StockMetricsRepositoryImplTest {

    @Autowired private EntityManager em;

    private void seedTestData() {
        em.createNativeQuery("DELETE FROM stock_history").executeUpdate();
        em.createNativeQuery("DELETE FROM inventory_item").executeUpdate();
        em.createNativeQuery("DELETE FROM supplier").executeUpdate();

        em.createNativeQuery(
            "INSERT INTO supplier (id, name, created_at, created_by) VALUES " +
            "('sup1','Supplier One', CURRENT_TIMESTAMP, 'test')," +
            "('sup2','Supplier Two', CURRENT_TIMESTAMP, 'test')," +
            "('default-supplier','Default Supplier', CURRENT_TIMESTAMP, 'test')"
        ).executeUpdate();

        em.createNativeQuery(
            "INSERT INTO inventory_item (id, name, price, quantity, minimum_quantity, supplier_id, created_at, created_by) VALUES " +
            "('itemA','Item A', 2.00, 2, 10, 'sup1', CURRENT_TIMESTAMP, 'test')," +
            "('itemB','Item B', 5.00, 20, 10, 'sup2', CURRENT_TIMESTAMP, 'test')"
        ).executeUpdate();

        em.createNativeQuery(
            "INSERT INTO stock_history (id, item_id, supplier_id, quantity_change, reason, created_by, created_at, price_at_change) VALUES " +
            "('sh1','itemA','sup1', 5, 'INITIAL_STOCK', 'alice', TIMESTAMP '2024-02-01 09:00:00', 2.00)," +
            "('sh2','itemA','sup1',-1, 'SOLD',          'alice', TIMESTAMP '2024-02-01 10:00:00', 2.00)," +
            "('sh3','itemB','sup2', 3, 'INITIAL_STOCK', 'bob',   TIMESTAMP '2024-02-02 10:00:00', 5.00)"
        ).executeUpdate();

        em.flush();
        em.clear();
    }

    /**
     * Total stock per supplier, ordered by quantity descending.
     */
    @Nested
    class TotalStockBySupplier {

        @Test
        void should_return_totals_ordered_by_quantity_in_h2_dialect() {
            seedTestData();
            StockMetricsRepositoryImpl repo = repoWithDialect(true);

            List<Object[]> out = repo.getTotalStockBySupplier();

            assertEquals(2, out.size());
            assertEquals("Supplier Two", out.get(0)[0]);
            assertEquals(20L, ((Number) out.get(0)[1]).longValue());
            assertEquals("Supplier One", out.get(1)[0]);
            assertEquals(2L, ((Number) out.get(1)[1]).longValue());
        }
    }

    /**
     * Update count per item with optional supplier filter and blank normalization.
     */
    @Nested
    class UpdateCountByItem {

        @Test
        void should_filter_by_supplier_and_treat_blank_as_null_in_oracle_dialect() {
            seedTestData();
            StockMetricsRepositoryImpl repo = repoWithDialect(false);

            List<Object[]> forSup1 = repo.getUpdateCountByItem("sup1");
            assertEquals(1, forSup1.size());
            assertEquals("Item A", forSup1.get(0)[0]);
            assertEquals(2L, ((Number) forSup1.get(0)[1]).longValue());

            // blank normalizes to null â†’ supplier filter disabled â†’ all items returned
            List<Object[]> forAll = repo.getUpdateCountByItem("   ");
            assertTrue(forAll.size() >= 2);
            assertEquals("Item A", forAll.get(0)[0]);
            assertEquals(2L, ((Number) forAll.get(0)[1]).longValue());
        }
    }

    /**
     * Below-minimum-stock query with case-insensitive supplier filter.
     */
    @Nested
    class BelowMinimumStock {

        @Test
        void should_filter_below_minimum_stock_by_supplier_case_insensitive_in_oracle_dialect() {
            seedTestData();
            StockMetricsRepositoryImpl repo = repoWithDialect(false);

            List<Object[]> all = repo.findItemsBelowMinimumStock(null);
            assertEquals(1, all.size());
            assertEquals("Item A", all.get(0)[0]);
            assertEquals(2L, ((Number) all.get(0)[1]).longValue());
            assertEquals(10L, ((Number) all.get(0)[2]).longValue());

            // case-insensitive: 'SUP1' must match 'sup1'
            assertEquals(1, repo.findItemsBelowMinimumStock("SUP1").size());
            assertEquals(0, repo.findItemsBelowMinimumStock("sup2").size());
        }
    }

    // forces the dialect branch without needing an Oracle database in CI
    private StockMetricsRepositoryImpl repoWithDialect(boolean isH2) {
        DatabaseDialectDetector detector = org.mockito.Mockito.mock(DatabaseDialectDetector.class);
        org.mockito.Mockito.when(detector.isH2()).thenReturn(isH2);
        StockMetricsRepositoryImpl repo = new StockMetricsRepositoryImpl(detector);
        injectEntityManager(repo, em);
        return repo;
    }

    private static void injectEntityManager(Object target, EntityManager em) {
        try {
            Field f = target.getClass().getDeclaredField("em");
            f.setAccessible(true);
            f.set(target, em);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException("Failed to inject EntityManager into repository under test", e);
        }
    }
}
