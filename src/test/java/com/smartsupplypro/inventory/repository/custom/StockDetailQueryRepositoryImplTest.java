package com.smartsupplypro.inventory.repository.custom;

import java.lang.reflect.Field;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.dto.StockEventRowDTO;
import com.smartsupplypro.inventory.repository.custom.util.DatabaseDialectDetector;

import jakarta.persistence.EntityManager;

/**
 * Tests for {@link StockDetailQueryRepositoryImpl} focused on correctness and JaCoCo branch coverage.
 *
 * <p>These tests intentionally exercise the repository's highest-risk decision points:
 * <ul>
 *   <li><strong>Dialect selection</strong>: ensures both H2 and Oracle SQL variants are selected.</li>
 *   <li><strong>Optional filter normalization</strong>: covers {@code null}/{@code blank}/{@code value} branches.</li>
 *   <li><strong>JPQL supplier filter</strong>: validates the {@code :supplierIdNorm IS NULL OR ...} branch behavior.</li>
 * </ul>
 *
 * <p>Implementation note: the repository is instantiated directly and the {@link EntityManager}
 * is injected via reflection so we can force dialect branches without needing multiple DBs.
 */
@DataJpaTest
@ActiveProfiles("test")
@Import(DatabaseDialectDetector.class)
class StockDetailQueryRepositoryImplTest {

    @Autowired private EntityManager em;

    /**
     * Seeds a minimal but representative dataset used across test cases.
     *
     * <p>Data shape:
     * <ul>
     *   <li>Two suppliers ({@code sup1}, {@code sup2}) plus {@code default-supplier} to satisfy entity defaults.</li>
     *   <li>Two items mapped to different suppliers.</li>
     *   <li>Three stock history rows spanning two items and two creators.</li>
     * </ul>
     */
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

    @Test
    void searchStockUpdates_h2Dialect_normalizesOptionalFilters() {
        seedTestData();
        StockDetailQueryRepositoryImpl repo = repoWithDialect(true);

        // Null/blank inputs normalize to SQL NULL parameters -> no filters apply -> all rows.
        List<Object[]> all = repo.searchStockUpdates(
            null,
            null,
            null,
            "   ",
            null,
            null,
            null
        );
        assertEquals(3, all.size());

        // Cover remaining normalization branches:
        // - itemName blank but non-null
        // - supplierId null
        // - createdBy blank but non-null
        List<Object[]> all2 = repo.searchStockUpdates(
            null,
            null,
            "   ",
            null,
            "   ",
            null,
            null
        );
        assertEquals(3, all2.size());

        // Apply several filters at once to validate predicate wiring and parameter normalization:
        // - itemName partial match (case-insensitive)
        // - supplier exact match
        // - createdBy exact match (case-insensitive)
        // - quantity_change range
        List<Object[]> filtered = repo.searchStockUpdates(
            null,
            null,
            "Item A",
            "sup1",
            "ALICE",
            -1,
            -1
        );

        assertEquals(1, filtered.size());
        assertEquals("Item A", filtered.get(0)[0]);
        assertEquals("Supplier One", filtered.get(0)[1]);
        assertEquals(-1, ((Number) filtered.get(0)[2]).intValue());
        assertEquals("SOLD", String.valueOf(filtered.get(0)[3]));
        assertEquals("alice", String.valueOf(filtered.get(0)[4]));
    }

    @Test
    void searchStockUpdates_oracleDialect_executesOnH2_andCoversDialectBranch() {
        seedTestData();
        StockDetailQueryRepositoryImpl repo = repoWithDialect(false);

        List<Object[]> out = repo.searchStockUpdates(
            null,
            null,
            "item",
            "sup1",
            "alice",
            null,
            null
        );

        // Even though the Oracle SQL variant is selected, this query remains H2-compatible.
        // The supplierId predicate should narrow results to itemA's supplier.
        assertEquals(2, out.size());
        assertEquals("Item A", out.get(0)[0]);
    }

    @Test
    void streamEventsForWAC_ordersByItemThenTime_andFiltersSupplier() {
        seedTestData();
        StockDetailQueryRepositoryImpl repo = repoWithDialect(true);

        LocalDateTime endInclusive = LocalDateTime.of(2024, 12, 31, 23, 59);

        // Blank supplier -> treated as null -> supplier filter disabled -> all events.
        List<StockEventRowDTO> all = repo.streamEventsForWAC(endInclusive, "   ");
        assertEquals(3, all.size());
        assertEquals("itemA", all.get(0).itemId());
        assertEquals(LocalDate.of(2024, 2, 1), all.get(0).createdAt().toLocalDate());

        // Null supplier -> same disabled-filter branch as blank.
        List<StockEventRowDTO> allNull = repo.streamEventsForWAC(endInclusive, null);
        assertEquals(3, allNull.size());

        // Supplier filter enabled -> only sup1 events.
        List<StockEventRowDTO> sup1 = repo.streamEventsForWAC(endInclusive, "sup1");
        assertEquals(2, sup1.size());
        assertEquals("sup1", sup1.get(0).supplierId());
        assertEquals("sup1", sup1.get(1).supplierId());
        assertEquals("itemA", sup1.get(0).itemId());
    }

    /**
     * Creates a repository instance with a forced dialect branch.
     *
     * <p>We use a mocked {@link DatabaseDialectDetector} so we can cover dialect selection without
     * needing an Oracle database in CI.
     */
    private StockDetailQueryRepositoryImpl repoWithDialect(boolean isH2) {
        DatabaseDialectDetector detector = org.mockito.Mockito.mock(DatabaseDialectDetector.class);
        org.mockito.Mockito.when(detector.isH2()).thenReturn(isH2);

        StockDetailQueryRepositoryImpl repo = new StockDetailQueryRepositoryImpl(detector);
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
