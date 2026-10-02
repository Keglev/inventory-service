package com.smartsupplypro.inventory.repository.custom;

import java.lang.reflect.Field;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
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
@DataJpaTest(showSql = false)
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
            "INSERT INTO inventory_item (id, sku, name, price, quantity, minimum_quantity, supplier_id, created_at, created_by, active) VALUES " +
            "('itemA','SKU-MET-A','Item A', 2.00, 2, 10, 'sup1', CURRENT_TIMESTAMP, 'test', 1)," +
            "('itemB','SKU-MET-B','Item B', 5.00, 20, 10, 'sup2', CURRENT_TIMESTAMP, 'test', 1)"
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
     * Stock quantity and value per supplier over active items, ordered by value, then name.
     */
    @Nested
    class TotalStockBySupplier {

        @ParameterizedTest(name = "h2 dialect = {0}")
        @ValueSource(booleans = {true, false})
        void should_order_by_value_then_name_and_skip_inactive_items(boolean isH2) {
            seedTestData();
            // Supplier One: fewer units than Supplier Two, but the highest value (4 + 200).
            // Default Supplier ties Supplier Two at 100 and comes first by name.
            // The inactive item would put Supplier Two on top if it were counted.
            em.createNativeQuery(
                "INSERT INTO inventory_item (id, sku, name, price, quantity, minimum_quantity, supplier_id, created_at, created_by, active) VALUES " +
                "('itemC','SKU-MET-C','Item C', 200.00, 1, 0, 'sup1', CURRENT_TIMESTAMP, 'test', 1)," +
                "('itemD','SKU-MET-D','Item D', 10.00, 10, 0, 'default-supplier', CURRENT_TIMESTAMP, 'test', 1)," +
                "('itemE','SKU-MET-E','Item E', 1.00, 1000, 0, 'sup2', CURRENT_TIMESTAMP, 'test', 0)"
            ).executeUpdate();

            List<Object[]> out = repoWithDialect(isH2).getTotalStockBySupplier();

            assertEquals(List.of("Supplier One", "Default Supplier", "Supplier Two"),
                    out.stream().map(r -> r[0]).toList());
            assertEquals(List.of(3L, 10L, 20L),
                    out.stream().map(r -> ((Number) r[1]).longValue()).toList());
            assertEquals(List.of(204.0, 100.0, 100.0),
                    out.stream().map(r -> ((Number) r[2]).doubleValue()).toList());
        }
    }

    /**
     * Update count per item with optional supplier filter and blank normalization.
     */
    @Nested
    class UpdateCountByItem {

        @Test
        void should_filter_by_supplier_and_treat_blank_as_null_when_the_dialect_is_oracle() {
            seedTestData();
            StockMetricsRepositoryImpl repo = repoWithDialect(false);

            List<Object[]> forSup1 = repo.getUpdateCountByItem("sup1");
            assertEquals(1, forSup1.size());
            assertEquals("Item A", forSup1.get(0)[0]);
            assertEquals(2L, ((Number) forSup1.get(0)[1]).longValue());

            // blank normalizes to null -> supplier filter disabled -> all items returned
            List<Object[]> forAll = repo.getUpdateCountByItem("   ");
            assertTrue(forAll.size() >= 2);
            assertEquals("Item A", forAll.get(0)[0]);
            assertEquals(2L, ((Number) forAll.get(0)[1]).longValue());
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
