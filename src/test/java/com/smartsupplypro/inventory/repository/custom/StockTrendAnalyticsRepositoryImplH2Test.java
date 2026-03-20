package com.smartsupplypro.inventory.repository.custom;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.dto.PriceTrendDTO;
import com.smartsupplypro.inventory.repository.custom.util.DatabaseDialectDetector;

import jakarta.persistence.EntityManager;

/**
 * H2 execution-path tests for {@link StockTrendAnalyticsRepositoryImpl}.
 *
 * <p>Exercises the native SQL logic that must run on H2 (test profile):
 * monthly movement, supplier-filtered movement, daily valuation, and price trend mapping.
 *
 * <p>Coverage intent:
 * <ul>
 *   <li>Validate aggregation semantics (stock-in vs stock-out, grouping by month/day).</li>
 *   <li>Cover optional supplier filter normalization (blank → null) in supplier-filtered methods.</li>
 *   <li>Verify DTO mapping (timestamp formatting and price averaging) for price trends.</li>
 * </ul>
 */
@DataJpaTest
@ActiveProfiles("test")
@Import(DatabaseDialectDetector.class)
class StockTrendAnalyticsRepositoryImplH2Test {

    @Autowired private EntityManager em;

    /**
     * Seeds a small dataset designed to validate analytics behavior across days and months.
     *
     * <p>Notable properties:
     * <ul>
     *   <li>Item A has multiple events across Feb and Mar; includes a price change event.</li>
     *   <li>Item B contributes only to February movement.</li>
     *   <li>Quantities in the inventory table start at 0 because analytics are derived from history events.</li>
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
            "('itemA','Item A', 2.00, 0, 10, 'sup1', CURRENT_TIMESTAMP, 'test')," +
            "('itemB','Item B', 5.00, 0, 10, 'sup2', CURRENT_TIMESTAMP, 'test')"
        ).executeUpdate();

        // Item A events across days/months
        em.createNativeQuery(
            "INSERT INTO stock_history (id, item_id, supplier_id, quantity_change, reason, created_by, created_at, price_at_change) VALUES " +
            "('sh1','itemA','sup1', 5, 'INITIAL_STOCK', 'alice', TIMESTAMP '2024-02-05 09:00:00', 2.00)," +
            "('sh2','itemA','sup1', 0, 'PRICE_CHANGE',  'alice', TIMESTAMP '2024-02-05 12:00:00', 4.00)," +
            "('sh3','itemA','sup1',-2, 'SOLD',          'alice', TIMESTAMP '2024-02-06 10:00:00', 2.00)," +
            "('sh4','itemA','sup1', 3, 'MANUAL_UPDATE', 'alice', TIMESTAMP '2024-03-01 10:00:00', 2.50)"
        ).executeUpdate();

        // Item B contributes only to February movement
        em.createNativeQuery(
            "INSERT INTO stock_history (id, item_id, supplier_id, quantity_change, reason, created_by, created_at, price_at_change) VALUES " +
            "('sh5','itemB','sup2', 1, 'INITIAL_STOCK', 'bob',   TIMESTAMP '2024-02-10 10:00:00', 5.00)"
        ).executeUpdate();

        em.flush();
        em.clear();
    }

    @Test
    void getMonthlyStockMovement_aggregatesStockInAndOut() {
        seedTestData();
        StockTrendAnalyticsRepositoryImpl repo = repoH2();

        List<Object[]> out = repo.getMonthlyStockMovement(
            LocalDateTime.of(2024, 2, 1, 0, 0),
            LocalDateTime.of(2024, 3, 31, 23, 59)
        );

        assertEquals(2, out.size());

        // February: stock-in includes itemA +5 and itemB +1; stock-out includes itemA -2.
        assertEquals("2024-02", out.get(0)[0]);
        assertEquals(6L, ((Number) out.get(0)[1]).longValue());
        assertEquals(2L, ((Number) out.get(0)[2]).longValue());

        // March: only a +3 update on itemA; no stock-out events.
        assertEquals("2024-03", out.get(1)[0]);
        assertEquals(3L, ((Number) out.get(1)[1]).longValue());
        assertEquals(0L, ((Number) out.get(1)[2]).longValue());
    }

    @Test
    void getMonthlyStockMovementBySupplier_filtersWhenSupplierProvided_andIgnoresBlank() {
        seedTestData();
        StockTrendAnalyticsRepositoryImpl repo = repoH2();

        List<Object[]> filtered = repo.getMonthlyStockMovementBySupplier(
            LocalDateTime.of(2024, 2, 1, 0, 0),
            LocalDateTime.of(2024, 3, 31, 23, 59),
            "sup1"
        );

        assertEquals(2, filtered.size());
        assertEquals("2024-02", filtered.get(0)[0]);
        assertEquals(5L, ((Number) filtered.get(0)[1]).longValue());

        // Blank supplier -> normalized to null -> should behave like no supplier filter.
        List<Object[]> blank = repo.getMonthlyStockMovementBySupplier(
            LocalDateTime.of(2024, 2, 1, 0, 0),
            LocalDateTime.of(2024, 3, 31, 23, 59),
            "   "
        );
        assertTrue(blank.size() >= 2);
        assertEquals("2024-02", blank.get(0)[0]);
        assertEquals(6L, ((Number) blank.get(0)[1]).longValue());
    }

    @Test
    void getDailyStockValuation_returnsClosingValuePerDay() {
        seedTestData();
        StockTrendAnalyticsRepositoryImpl repo = repoH2();

        List<Object[]> out = repo.getDailyStockValuation(
            LocalDateTime.of(2024, 2, 1, 0, 0),
            LocalDateTime.of(2024, 3, 2, 0, 0),
            "sup1"
        );

        assertEquals(3, out.size());

        // 2024-02-05: closing price comes from the last event of the day (a price change to 4.00)
        // and quantity-after is 5 -> valuation = 5 * 4.00 = 20.
        assertEquals(LocalDate.of(2024, 2, 5), ((java.sql.Date) out.get(0)[0]).toLocalDate());
        assertEquals(20L, ((Number) out.get(0)[1]).longValue());

        // 2024-02-06: quantity-after is 3 and price at event is 2.00 -> 6.
        assertEquals(LocalDate.of(2024, 2, 6), ((java.sql.Date) out.get(1)[0]).toLocalDate());
        assertEquals(6L, ((Number) out.get(1)[1]).longValue());

        // 2024-03-01: quantity-after is 6 and price at event is 2.50 -> 15.
        assertEquals(LocalDate.of(2024, 3, 1), ((java.sql.Date) out.get(2)[0]).toLocalDate());
        assertEquals(15L, ((Number) out.get(2)[1]).longValue());
    }

    @Test
    void getItemPriceTrend_mapsToDTO_andHonorsSupplierFilter() {
        seedTestData();
        StockTrendAnalyticsRepositoryImpl repo = repoH2();

        List<PriceTrendDTO> out = repo.getItemPriceTrend(
            "itemA",
            "sup1",
            LocalDateTime.of(2024, 2, 1, 0, 0),
            LocalDateTime.of(2024, 3, 31, 23, 59)
        );

        // Price trend rows are returned per day for the selected item/supplier.
        assertEquals(3, out.size());
        assertEquals("2024-02-05", out.get(0).getTimestamp());
        // 2024-02-05 has two events with prices 2.00 and 4.00 -> average is 3.00.
        assertEquals(0, out.get(0).getPrice().compareTo(new BigDecimal("3.00")));

        assertEquals("2024-02-06", out.get(1).getTimestamp());
        assertEquals(0, out.get(1).getPrice().compareTo(new BigDecimal("2.00")));

        assertEquals("2024-03-01", out.get(2).getTimestamp());
        assertEquals(0, out.get(2).getPrice().compareTo(new BigDecimal("2.50")));
    }

    /** Creates a repository configured to take the H2 dialect path. */
    private StockTrendAnalyticsRepositoryImpl repoH2() {
        DatabaseDialectDetector detector = org.mockito.Mockito.mock(DatabaseDialectDetector.class);
        org.mockito.Mockito.when(detector.isH2()).thenReturn(true);

        StockTrendAnalyticsRepositoryImpl repo = new StockTrendAnalyticsRepositoryImpl(detector);
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
