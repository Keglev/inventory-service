package com.smartsupplypro.inventory.repository.custom;

import java.lang.reflect.Field;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.dto.StockEventRowDTO;
import com.smartsupplypro.inventory.repository.custom.util.DatabaseDialectDetector;
import com.smartsupplypro.inventory.repository.custom.util.StockDetailSqlBuilder;

import jakarta.persistence.EntityManager;

/**
 * Integration tests for dynamic query methods in {@link StockDetailQueryRepositoryImpl}.
 *
 * <p>Verifies predicate composition and result correctness
 * for runtime-constructed queries.</p>
 */
@DataJpaTest(showSql = false)
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
            "INSERT INTO inventory_item (id, sku, name, price, quantity, minimum_quantity, supplier_id, created_at, created_by, active) VALUES " +
            "('itemA','SKU-DET-A','Item A', 2.00, 2, 10, 'sup1', CURRENT_TIMESTAMP, 'test', 1)," +
            "('itemB','SKU-DET-B','Item B', 5.00, 20, 10, 'sup2', CURRENT_TIMESTAMP, 'test', 1)"
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
    class StockUpdateSearch {

        @Test
        void should_normalize_optional_filters_and_return_all_rows_when_the_dialect_is_h2() {
            seedTestData();
            StockDetailQueryRepositoryImpl repo = repoWithDialect(true);

            // null/blank inputs normalize to SQL NULL -> no predicates applied
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
        void should_narrow_the_results_by_supplier_when_the_dialect_is_oracle() {
            seedTestData();
            StockDetailQueryRepositoryImpl repo = repoWithDialect(false);

            List<Object[]> out = repo.searchStockUpdates(null, null, "item", "sup1", "alice", null, null);

            // Oracle SQL variant is selected; supplierId predicate narrows to itemA's events
            assertEquals(2, out.size());
            assertEquals("Item A", out.get(0)[0]);
        }
    }

    /**
     * Paging over the same search: page contents, total, and a stable order across pages.
     */
    @Nested
    class StockUpdatePaging {

        @Test
        void should_split_the_search_into_pages_with_the_total_count_when_the_dialect_is_h2() {
            seedTestData();
            StockDetailQueryRepositoryImpl repo = repoWithDialect(true);

            Page<Object[]> first = repo.searchStockUpdatesPage(null, null, null, null, null, null, null, PageRequest.of(0, 2));
            Page<Object[]> second = repo.searchStockUpdatesPage(null, null, null, null, null, null, null, PageRequest.of(1, 2));

            assertEquals(3, first.getTotalElements());
            assertEquals(2, first.getTotalPages());
            assertEquals(2, first.getContent().size());
            assertEquals("Item B", first.getContent().get(0)[0]);
            assertEquals(1, second.getContent().size());
            assertEquals(5, ((Number) second.getContent().get(0)[2]).intValue());
        }

        @Test
        void should_count_only_the_filtered_rows_when_the_dialect_is_oracle() {
            seedTestData();
            StockDetailQueryRepositoryImpl repo = repoWithDialect(false);

            Page<Object[]> page = repo.searchStockUpdatesPage(null, null, "item", "sup1", null, null, null, PageRequest.of(0, 10));

            assertEquals(2, page.getTotalElements());
            assertEquals(2, page.getContent().size());
        }

        @Test
        void should_not_repeat_or_skip_rows_across_pages_when_timestamps_are_equal() {
            seedTestData();
            em.createNativeQuery(
                "INSERT INTO stock_history (id, item_id, supplier_id, quantity_change, reason, created_by, created_at, price_at_change) VALUES " +
                "('sh4','itemB','sup2', 1, 'SOLD', 'bob', TIMESTAMP '2024-02-02 10:00:00', 5.00)," +
                "('sh5','itemB','sup2', 2, 'SOLD', 'bob', TIMESTAMP '2024-02-02 10:00:00', 5.00)"
            ).executeUpdate();
            StockDetailQueryRepositoryImpl repo = repoWithDialect(true);

            List<Integer> seen = new java.util.ArrayList<>();
            for (int p = 0; p < 5; p++) {
                repo.searchStockUpdatesPage(null, null, null, null, null, null, null, PageRequest.of(p, 1))
                    .getContent().forEach(r -> seen.add(((Number) r[2]).intValue()));
            }

            // three rows share one timestamp; the id tie-breaker orders them sh5, sh4, sh3
            assertEquals(List.of(2, 1, 3, -1, 5), seen);
        }

        @Test
        void should_break_timestamp_ties_by_id_in_both_dialects() {
            // H2 happens to return equal timestamps in a stable order even without a
            // tie-breaker, so the walk above cannot prove it on its own; Oracle does not.
            String order = "ORDER BY sh.created_at DESC, sh.id DESC";
            assertTrue(StockDetailSqlBuilder.buildH2FilteredSearchSql().contains(order));
            assertTrue(StockDetailSqlBuilder.buildOracleFilteredSearchSql().contains(order));
        }
    }

    /**
     * Supplier filter and ordering guarantees for streamEventsForWAC.
     */
    @Nested
    class WacEventStreaming {

        @Test
        void should_stream_events_ordered_by_item_and_time_when_a_supplier_filter_is_given() {
            seedTestData();
            StockDetailQueryRepositoryImpl repo = repoWithDialect(true);

            LocalDateTime end = LocalDateTime.of(2024, 12, 31, 23, 59);

            // blank supplier normalizes to null -> supplier filter disabled -> all events
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
