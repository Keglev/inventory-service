package com.smartsupplypro.inventory.repository.custom;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.repository.custom.util.DatabaseDialectDetector;

import jakarta.persistence.EntityManager;

/**
 * H2 integration test for the per-employee daily change-count aggregation.
 */
@DataJpaTest
@ActiveProfiles("test")
@Import(DatabaseDialectDetector.class)
class StockTrendAnalyticsRepositoryImplEmployeeH2Test {

    @Autowired private EntityManager em;

    private void seedTestData() {
        em.createNativeQuery("DELETE FROM stock_history").executeUpdate();
        em.createNativeQuery("DELETE FROM inventory_item").executeUpdate();
        em.createNativeQuery("DELETE FROM supplier").executeUpdate();

        em.createNativeQuery(
            "INSERT INTO supplier (id, name, created_at, created_by) VALUES " +
            "('sup1','Supplier One', CURRENT_TIMESTAMP, 'test')"
        ).executeUpdate();

        em.createNativeQuery(
            "INSERT INTO inventory_item (id, sku, name, price, quantity, minimum_quantity, supplier_id, created_at, created_by) VALUES " +
            "('itemA','SKU-EMP-A','Item A', 2.00, 0, 10, 'sup1', CURRENT_TIMESTAMP, 'test')"
        ).executeUpdate();

        em.createNativeQuery(
            "INSERT INTO stock_history (id, item_id, supplier_id, quantity_change, reason, created_by, created_at, price_at_change) VALUES " +
            "('em1','itemA','sup1', 5, 'INITIAL_STOCK', 'alice@example.com', TIMESTAMP '2026-02-05 09:00:00', 2.00)," +
            "('em2','itemA','sup1',-1, 'SOLD',          'alice@example.com', TIMESTAMP '2026-02-05 12:00:00', 2.00)," +
            "('em3','itemA','sup1',-2, 'SOLD',          'bob@example.com',   TIMESTAMP '2026-02-06 10:00:00', 2.00)," +
            "('em4','itemA','sup1', 3, 'MANUAL_UPDATE', 'alice@example.com', TIMESTAMP '2026-02-06 11:00:00', 2.00)"
        ).executeUpdate();

        em.flush();
        em.clear();
    }

    @Test
    void aggregates_changeCounts_perEmployee_perDay() {
        seedTestData();
        StockTrendAnalyticsRepositoryImpl repo = repoH2();

        List<Object[]> out = repo.getDailyEmployeeActivity(
                LocalDateTime.of(2026, 2, 1, 0, 0), LocalDateTime.of(2026, 2, 28, 23, 59), null);

        assertEquals(3, out.size());
        // ordered by day then creator
        assertEquals("alice@example.com", out.get(0)[0]);
        assertEquals("2026-02-05", out.get(0)[1]);
        assertEquals(2L, ((Number) out.get(0)[2]).longValue());
        assertEquals("alice@example.com", out.get(1)[0]);
        assertEquals("2026-02-06", out.get(1)[1]);
        assertEquals(1L, ((Number) out.get(1)[2]).longValue());
        assertEquals("bob@example.com", out.get(2)[0]);
        assertEquals("2026-02-06", out.get(2)[1]);
        assertEquals(1L, ((Number) out.get(2)[2]).longValue());
    }

    @Test
    void filtersBySupplier_whenSupplierIdGiven() {
        seedTestData();
        StockTrendAnalyticsRepositoryImpl repo = repoH2();

        List<Object[]> matching = repo.getDailyEmployeeActivity(
                LocalDateTime.of(2026, 2, 1, 0, 0), LocalDateTime.of(2026, 2, 28, 23, 59), "sup1");
        List<Object[]> nonMatching = repo.getDailyEmployeeActivity(
                LocalDateTime.of(2026, 2, 1, 0, 0), LocalDateTime.of(2026, 2, 28, 23, 59), "supX");

        assertEquals(3, matching.size());
        assertEquals(0, nonMatching.size());
    }

    private StockTrendAnalyticsRepositoryImpl repoH2() {
        DatabaseDialectDetector detector = org.mockito.Mockito.mock(DatabaseDialectDetector.class);
        org.mockito.Mockito.when(detector.isH2()).thenReturn(true);
        StockTrendAnalyticsRepositoryImpl repo = new StockTrendAnalyticsRepositoryImpl(detector);
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
