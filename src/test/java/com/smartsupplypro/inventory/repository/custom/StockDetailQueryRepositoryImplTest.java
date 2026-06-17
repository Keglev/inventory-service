package com.smartsupplypro.inventory.repository.custom;

import java.lang.reflect.Field;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.dto.StockEventRowDTO;
import com.smartsupplypro.inventory.repository.custom.util.DatabaseDialectDetector;

import jakarta.persistence.EntityManager;

/**
 * Integration tests for dynamic query methods in {@link StockDetailQueryRepositoryImpl}.
 *
 * <p>Verifies predicate composition and result correctness
 * for runtime-constructed queries.</p>
 */
@SuppressWarnings("unused")
@DataJpaTest
@ActiveProfiles("test")
@Import(DatabaseDialectDetector.class)
class StockDetailQueryRepositoryImplTest {

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
     * Optional filter normalization and dialect-specific SQL selection for searchStockUpdates.
     */
    @Nested
    @SuppressWarnings("unused")
    class StockUpdateSearch {

        @Test
        void should_normalize_optional_filters_and_return_all_rows_in_h2_dialect() {
            seedTestData();
            StockDetailQueryRepositoryImpl repo = repoWithDialect(true);

            // null/blank inputs normalize to SQL NULL → no predicates applied
            assertEquals(3, repo.searchStockUpdates(null, null, null, "   ", null, null, null).size());
            assertEquals(3, repo.searchStockUpdates(null, null, "   ", null, "   ", null, null).size());

            List<Object[]> filtered = repo.searchStockUpdates(null, null, "Item A", "sup1", "ALICE", -1, -1);
            assertEquals(1, filtered.size());
            assertEquals("Item A", filtered.get(0)[0]);
            assertEquals("Supplier One", filtered.get(0)[1]);
            assertEquals(-1, ((Number) filtered.get(0)[2]).intValue());
            assertEquals("SOLD", String.valueOf(filtered.get(0)[3]));
            assertEquals("alice", String.valueOf(filtered.get(0)[4]));
        }

        @Test
        void should_select_oracle_dialect_sql_and_narrow_results_by_supplier() {
            seedTestData();
            StockDetailQueryRepositoryImpl repo = repoWithDialect(false);

            List<Object[]> out = repo.searchStockUpdates(null, null, "item", "sup1", "alice", null, null);

            // Oracle SQL variant is selected; supplierId predicate narrows to itemA's events
            assertEquals(2, out.size());
            assertEquals("Item A", out.get(0)[0]);
        }
    }

    /**
     * Supplier filter and ordering guarantees for streamEventsForWAC.
     */
    @Nested
    @SuppressWarnings("unused")
    class WacEventStreaming {

        @Test
        void should_stream_events_ordered_by_item_then_time_with_supplier_filter() {
            seedTestData();
            StockDetailQueryRepositoryImpl repo = repoWithDialect(true);

            LocalDateTime end = LocalDateTime.of(2024, 12, 31, 23, 59);

            // blank supplier normalizes to null → supplier filter disabled → all events
            List<StockEventRowDTO> all = repo.streamEventsForWAC(end, "   ");
            assertEquals(3, all.size());
            assertEquals("itemA", all.get(0).itemId());
            assertEquals(LocalDate.of(2024, 2, 1), all.get(0).createdAt().toLocalDate());

            List<StockEventRowDTO> allNull = repo.streamEventsForWAC(end, null);
            assertEquals(3, allNull.size());

            List<StockEventRowDTO> sup1 = repo.streamEventsForWAC(end, "sup1");
            assertEquals(2, sup1.size());
            sup1.forEach(e -> assertEquals("sup1", e.supplierId()));
            assertEquals("itemA", sup1.get(0).itemId());
        }
    }

    // forces the dialect branch without needing an Oracle database in CI
    private StockDetailQueryRepositoryImpl repoWithDialect(boolean isH2) {
        DatabaseDialectDetector detector = org.mockito.Mockito.mock(DatabaseDialectDetector.class);
        org.mockito.Mockito.when(detector.isH2()).thenReturn(isH2);
        StockDetailQueryRepositoryImpl repo = new StockDetailQueryRepositoryImpl(detector);
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
