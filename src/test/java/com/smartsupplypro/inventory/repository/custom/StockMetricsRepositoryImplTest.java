package com.smartsupplypro.inventory.repository.custom;

import java.lang.reflect.Field;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.repository.custom.util.DatabaseDialectDetector;

import jakarta.persistence.EntityManager;

/**
 * Integration-style tests for {@link StockMetricsRepositoryImpl}.
 *
 * <p>Goal: provide enterprise-grade regression protection while also closing JaCoCo branch gaps.
 * These tests target the high-risk decision points in the implementation:
 * <ul>
 *   <li>Dialect selection (H2 vs Oracle SQL)</li>
 *   <li>Optional supplier filter normalization (null / blank / value)</li>
 * </ul>
 *
 * <p>These tests instantiate {@link StockMetricsRepositoryImpl} directly and inject
 * the {@link EntityManager} via reflection so both dialect branches can be exercised
 * against the same H2 test database.
 */
@DataJpaTest
@ActiveProfiles("test")
@Import(DatabaseDialectDetector.class)
class StockMetricsRepositoryImplTest {

    @Autowired private EntityManager em;

    /**
     * Seeds a compact dataset that is sufficient to validate totals, update counts, and threshold queries.
     *
     * <p>Important: deletes are performed in FK-safe order.
     */
    private void seedTestData() {
        // clean in FK-safe order
        em.createNativeQuery("DELETE FROM stock_history").executeUpdate();
        em.createNativeQuery("DELETE FROM inventory_item").executeUpdate();
        em.createNativeQuery("DELETE FROM supplier").executeUpdate();

        // suppliers (include default-supplier for entity prePersist fallbacks)
        em.createNativeQuery(
            "INSERT INTO supplier (id, name, created_at, created_by) VALUES " +
            "('sup1','Supplier One', CURRENT_TIMESTAMP, 'test')," +
            "('sup2','Supplier Two', CURRENT_TIMESTAMP, 'test')," +
            "('default-supplier','Default Supplier', CURRENT_TIMESTAMP, 'test')"
        ).executeUpdate();

        // inventory items
        em.createNativeQuery(
            "INSERT INTO inventory_item (id, name, price, quantity, minimum_quantity, supplier_id, created_at, created_by) VALUES " +
            "('itemA','Item A', 2.00, 2, 10, 'sup1', CURRENT_TIMESTAMP, 'test')," +
            "('itemB','Item B', 5.00, 20, 10, 'sup2', CURRENT_TIMESTAMP, 'test')"
        ).executeUpdate();

        // stock history events (used by update-count query)
        em.createNativeQuery(
            "INSERT INTO stock_history (id, item_id, supplier_id, quantity_change, reason, created_by, created_at, price_at_change) VALUES " +
            "('sh1','itemA','sup1', 5, 'INITIAL_STOCK', 'alice', TIMESTAMP '2024-02-01 09:00:00', 2.00)," +
            "('sh2','itemA','sup1',-1, 'SOLD',          'alice', TIMESTAMP '2024-02-01 10:00:00', 2.00)," +
            "('sh3','itemB','sup2', 3, 'INITIAL_STOCK', 'bob',   TIMESTAMP '2024-02-02 10:00:00', 5.00)"
        ).executeUpdate();

        em.flush();
        em.clear();
    }

    @Test
    void getTotalStockBySupplier_h2Dialect_returnsTotalsOrdered() {
        seedTestData();
        StockMetricsRepositoryImpl repo = repoWithDialect(true);

        List<Object[]> out = repo.getTotalStockBySupplier();

        assertEquals(2, out.size());
        assertEquals("Supplier Two", out.get(0)[0]);
        assertEquals(20L, ((Number) out.get(0)[1]).longValue());

        assertEquals("Supplier One", out.get(1)[0]);
        assertEquals(2L, ((Number) out.get(1)[1]).longValue());
    }

    @Test
    void getUpdateCountByItem_oracleDialect_filtersBySupplier_andTreatsBlankAsNull() {
        seedTestData();
        StockMetricsRepositoryImpl repo = repoWithDialect(false);

        List<Object[]> forSup1 = repo.getUpdateCountByItem("sup1");
        assertEquals(1, forSup1.size());
        assertEquals("Item A", forSup1.get(0)[0]);
        assertEquals(2L, ((Number) forSup1.get(0)[1]).longValue());

        // Blank normalizes to null -> should return all items (supplier filter disabled).
        List<Object[]> forAll = repo.getUpdateCountByItem("   ");
        assertTrue(forAll.size() >= 2);

        // Item A has two history rows in seeded data -> should be ranked first.
        assertEquals("Item A", forAll.get(0)[0]);
        assertEquals(2L, ((Number) forAll.get(0)[1]).longValue());
    }

    @Test
    void findItemsBelowMinimumStock_oracleDialect_filtersBySupplier_caseInsensitive() {
        seedTestData();
        StockMetricsRepositoryImpl repo = repoWithDialect(false);

        List<Object[]> all = repo.findItemsBelowMinimumStock(null);
        assertEquals(1, all.size());
        assertEquals("Item A", all.get(0)[0]);
        assertEquals(2L, ((Number) all.get(0)[1]).longValue());
        assertEquals(10L, ((Number) all.get(0)[2]).longValue());

        List<Object[]> sup1 = repo.findItemsBelowMinimumStock("SUP1");
        assertEquals(1, sup1.size());
        assertEquals("Item A", sup1.get(0)[0]);

        List<Object[]> sup2 = repo.findItemsBelowMinimumStock("sup2");
        assertEquals(0, sup2.size());
    }

    /**
     * Creates a repository instance with an explicitly forced dialect branch.
     *
     * <p>Using a mocked {@link DatabaseDialectDetector} allows covering both SQL variants
     * against the same H2 database.
     */
    private StockMetricsRepositoryImpl repoWithDialect(boolean isH2) {
        DatabaseDialectDetector detector = org.mockito.Mockito.mock(DatabaseDialectDetector.class);
        org.mockito.Mockito.when(detector.isH2()).thenReturn(isH2);

        StockMetricsRepositoryImpl repo = new StockMetricsRepositoryImpl(detector);
        injectEntityManager(repo, em);
        return repo;
    }

    /** Injects the {@link EntityManager} into the repository under test (field injection mirror). */
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
