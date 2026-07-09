package com.smartsupplypro.inventory.repository.custom;

import java.lang.reflect.Field;
import java.math.BigDecimal;
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
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.dto.PriceTrendDTO;
import com.smartsupplypro.inventory.repository.custom.util.DatabaseDialectDetector;

import jakarta.persistence.EntityManager;

/**
 * Integration tests for dynamic query methods in {@link StockTrendAnalyticsRepositoryImpl}.
 *
 * <p>Verifies H2 execution path for monthly movement aggregation,
 * daily valuation, and price trend DTO mapping.</p>
 */
@DataJpaTest
@ActiveProfiles("test")
@Import(DatabaseDialectDetector.class)
class StockTrendAnalyticsRepositoryImplH2Test {

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
            "('itemA','SKU-TRD-A','Item A', 2.00, 0, 10, 'sup1', CURRENT_TIMESTAMP, 'test', 1)," +
            "('itemB','SKU-TRD-B','Item B', 5.00, 0, 10, 'sup2', CURRENT_TIMESTAMP, 'test', 1)"
        ).executeUpdate();

        // itemA spans Feb and Mar; includes a price-change event on Feb 5
        em.createNativeQuery(
            "INSERT INTO stock_history (id, item_id, supplier_id, quantity_change, reason, created_by, created_at, price_at_change) VALUES " +
            "('sh1','itemA','sup1', 5, 'INITIAL_STOCK', 'alice', TIMESTAMP '2024-02-05 09:00:00', 2.00)," +
            "('sh2','itemA','sup1', 0, 'PRICE_CHANGE',  'alice', TIMESTAMP '2024-02-05 12:00:00', 4.00)," +
            "('sh3','itemA','sup1',-2, 'SOLD',          'alice', TIMESTAMP '2024-02-06 10:00:00', 2.00)," +
            "('sh4','itemA','sup1', 3, 'MANUAL_UPDATE', 'alice', TIMESTAMP '2024-03-01 10:00:00', 2.50)"
        ).executeUpdate();

        // itemB contributes only to February movement
        em.createNativeQuery(
            "INSERT INTO stock_history (id, item_id, supplier_id, quantity_change, reason, created_by, created_at, price_at_change) VALUES " +
            "('sh5','itemB','sup2', 1, 'INITIAL_STOCK', 'bob', TIMESTAMP '2024-02-10 10:00:00', 5.00)"
        ).executeUpdate();

        em.flush();
        em.clear();
    }

    /**
     * Global monthly stock-in/stock-out aggregation.
     */
    @Nested
    class MonthlyMovement {

        @Test
        void should_aggregate_stock_in_and_out_by_month() {
            seedTestData();
            StockTrendAnalyticsRepositoryImpl repo = repoH2();

            List<Object[]> out = repo.getMonthlyStockMovement(
                    LocalDateTime.of(2024, 2, 1, 0, 0), LocalDateTime.of(2024, 3, 31, 23, 59));

            assertEquals(2, out.size());
            // Feb: itemA +5, itemB +1 = 6 in; itemA -2 = 2 out
            assertEquals("2024-02", out.get(0)[0]);
            assertEquals(6L, ((Number) out.get(0)[1]).longValue());
            assertEquals(2L, ((Number) out.get(0)[2]).longValue());
            // Mar: itemA +3 = 3 in; no out
            assertEquals("2024-03", out.get(1)[0]);
            assertEquals(3L, ((Number) out.get(1)[1]).longValue());
            assertEquals(0L, ((Number) out.get(1)[2]).longValue());
        }

        @Test
        void should_filter_monthly_movement_by_supplier_and_normalize_blank_to_null() {
            seedTestData();
            StockTrendAnalyticsRepositoryImpl repo = repoH2();

            List<Object[]> filtered = repo.getMonthlyStockMovementBySupplier(
                    LocalDateTime.of(2024, 2, 1, 0, 0), LocalDateTime.of(2024, 3, 31, 23, 59), "sup1");

            assertEquals(2, filtered.size());
            assertEquals("2024-02", filtered.get(0)[0]);
            assertEquals(5L, ((Number) filtered.get(0)[1]).longValue());

            // blank supplier normalizes to null -> no filter applied
            List<Object[]> blank = repo.getMonthlyStockMovementBySupplier(
                    LocalDateTime.of(2024, 2, 1, 0, 0), LocalDateTime.of(2024, 3, 31, 23, 59), "   ");
            assertTrue(blank.size() >= 2);
            assertEquals(6L, ((Number) blank.get(0)[1]).longValue());
        }
    }

    /**
     * Daily closing stock valuation.
     */
    @Nested
    class DailyValuation {

        @Test
        void should_return_closing_stock_value_per_day() {
            seedTestData();
            StockTrendAnalyticsRepositoryImpl repo = repoH2();

            List<Object[]> out = repo.getDailyStockValuation(
                    LocalDateTime.of(2024, 2, 1, 0, 0), LocalDateTime.of(2024, 3, 2, 0, 0), "sup1");

            assertEquals(3, out.size());
            // 2024-02-05: last price of day is 4.00; qty-after = 5; valuation = 20
            assertEquals(LocalDate.of(2024, 2, 5), toLocalDate(out.get(0)[0]));
            assertEquals(20L, ((Number) out.get(0)[1]).longValue());
            // 2024-02-06: price 2.00; qty-after = 3; valuation = 6
            assertEquals(LocalDate.of(2024, 2, 6), toLocalDate(out.get(1)[0]));
            assertEquals(6L, ((Number) out.get(1)[1]).longValue());
            // 2024-03-01: price 2.50; qty-after = 6; valuation = 15
            assertEquals(LocalDate.of(2024, 3, 1), toLocalDate(out.get(2)[0]));
            assertEquals(15L, ((Number) out.get(2)[1]).longValue());
        }
    }

    /**
     * Price trend DTO mapping and supplier filter.
     */
    @Nested
    class PriceTrend {

        @Test
        void should_map_price_trend_to_dto_and_honor_supplier_filter() {
            seedTestData();
            StockTrendAnalyticsRepositoryImpl repo = repoH2();

            List<PriceTrendDTO> out = repo.getItemPriceTrend(
                    "itemA", "sup1",
                    LocalDateTime.of(2024, 2, 1, 0, 0), LocalDateTime.of(2024, 3, 31, 23, 59));

            assertEquals(3, out.size());
            // 2024-02-05 has two events (2.00 and 4.00) -> average = 3.00
            assertEquals("2024-02-05", out.get(0).getTimestamp());
            assertEquals(0, out.get(0).getPrice().compareTo(new BigDecimal("3.00")));
            assertEquals("2024-02-06", out.get(1).getTimestamp());
            assertEquals(0, out.get(1).getPrice().compareTo(new BigDecimal("2.00")));
            assertEquals("2024-03-01", out.get(2).getTimestamp());
            assertEquals(0, out.get(2).getPrice().compareTo(new BigDecimal("2.50")));
        }
    }

    // forces the H2 dialect branch
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

    /**
     * Normalizes a native-query date cell to {@link LocalDate}. JDBC drivers may
     * return either {@link java.sql.Date} or {@link java.time.LocalDate} depending
     * on version, so this avoids a hard cast that breaks across driver upgrades.
     */
    private static LocalDate toLocalDate(Object cell) {
        if (cell instanceof java.sql.Date d) {
            return d.toLocalDate();
        }
        if (cell instanceof LocalDate ld) {
            return ld;
        }
        throw new IllegalStateException("Unexpected date type: " + (cell == null ? "null" : cell.getClass()));
    }
}
