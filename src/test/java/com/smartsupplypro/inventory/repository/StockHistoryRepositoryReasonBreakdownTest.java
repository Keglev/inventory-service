package com.smartsupplypro.inventory.repository;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.repository.custom.util.DatabaseDialectDetector;

import jakarta.persistence.EntityManager;

/**
 * H2 integration test for the per-reason sign-split aggregation, including the
 * optional supplier and item-name filters.
 */
@DataJpaTest
@ActiveProfiles("test")
@Import(DatabaseDialectDetector.class)
class StockHistoryRepositoryReasonBreakdownTest {

    @Autowired private StockHistoryRepository stockHistoryRepository;
    @Autowired private EntityManager em;

    private final LocalDateTime from = LocalDateTime.of(2026, 2, 1, 0, 0);
    private final LocalDateTime to   = LocalDateTime.of(2026, 2, 28, 23, 59);

    @BeforeEach
    void seed() {
        em.createNativeQuery("DELETE FROM stock_history").executeUpdate();
        em.createNativeQuery("DELETE FROM inventory_item").executeUpdate();
        em.createNativeQuery("DELETE FROM supplier").executeUpdate();

        em.createNativeQuery(
            "INSERT INTO supplier (id, name, created_at, created_by) VALUES " +
            "('sup1','Supplier One', CURRENT_TIMESTAMP, 'test')," +
            "('sup2','Supplier Two', CURRENT_TIMESTAMP, 'test')"
        ).executeUpdate();

        em.createNativeQuery(
            "INSERT INTO inventory_item (id, sku, name, price, quantity, minimum_quantity, supplier_id, created_at, created_by, active) VALUES " +
            "('itemA','SKU-RB-A','Item A', 2.00, 0, 10, 'sup1', CURRENT_TIMESTAMP, 'test', 1)," +
            "('itemB','SKU-RB-B','Item B', 5.00, 0, 10, 'sup2', CURRENT_TIMESTAMP, 'test', 1)"
        ).executeUpdate();

        em.createNativeQuery(
            "INSERT INTO stock_history (id, item_id, supplier_id, quantity_change, reason, created_by, created_at, price_at_change) VALUES " +
            "('rb1','itemA','sup1', 10, 'INITIAL_STOCK', 'alice', TIMESTAMP '2026-02-01 09:00:00', 2.00)," +
            "('rb2','itemA','sup1',  5, 'MANUAL_UPDATE', 'alice', TIMESTAMP '2026-02-02 09:00:00', 2.00)," +
            "('rb3','itemA','sup1', -3, 'MANUAL_UPDATE', 'alice', TIMESTAMP '2026-02-03 09:00:00', 2.00)," +
            "('rb4','itemA','sup1', -7, 'SOLD',          'alice', TIMESTAMP '2026-02-04 09:00:00', 2.00)," +
            "('rb5','itemB','sup2',  4, 'INITIAL_STOCK', 'bob',   TIMESTAMP '2026-02-05 09:00:00', 5.00)," +
            "('rb6','itemA','sup1',  0, 'PRICE_CHANGE',  'alice', TIMESTAMP '2026-02-06 09:00:00', 2.50)"
        ).executeUpdate();

        em.flush();
        em.clear();
    }

    @Test
    void aggregates_signSplit_perReason_orderedByReason() {
        List<Object[]> out = stockHistoryRepository.getReasonBreakdown(from, to, null, null);

        assertEquals(4, out.size());
        // alphabetical: INITIAL_STOCK, MANUAL_UPDATE, PRICE_CHANGE, SOLD
        assertEquals("INITIAL_STOCK", out.get(0)[0]);
        assertEquals(14L, ((Number) out.get(0)[1]).longValue());
        assertEquals(0L,  ((Number) out.get(0)[2]).longValue());
        // MANUAL_UPDATE contributes to BOTH sides (sign split)
        assertEquals("MANUAL_UPDATE", out.get(1)[0]);
        assertEquals(5L, ((Number) out.get(1)[1]).longValue());
        assertEquals(3L, ((Number) out.get(1)[2]).longValue());
        assertEquals("PRICE_CHANGE", out.get(2)[0]);
        assertEquals(0L, ((Number) out.get(2)[1]).longValue());
        assertEquals(0L, ((Number) out.get(2)[2]).longValue());
        assertEquals("SOLD", out.get(3)[0]);
        assertEquals(0L, ((Number) out.get(3)[1]).longValue());
        assertEquals(7L, ((Number) out.get(3)[2]).longValue());
    }

    @Test
    void filters_bySupplier() {
        List<Object[]> out = stockHistoryRepository.getReasonBreakdown(from, to, "sup2", null);

        assertEquals(1, out.size());
        assertEquals("INITIAL_STOCK", out.get(0)[0]);
        assertEquals(4L, ((Number) out.get(0)[1]).longValue());
    }

    @Test
    void filters_byPartialItemName_caseInsensitive() {
        List<Object[]> out = stockHistoryRepository.getReasonBreakdown(from, to, null, "item b");

        assertEquals(1, out.size());
        assertEquals("INITIAL_STOCK", out.get(0)[0]);
        assertEquals(4L, ((Number) out.get(0)[1]).longValue());
    }

    @Test
    void emptyWindow_returnsNoRows() {
        List<Object[]> out = stockHistoryRepository.getReasonBreakdown(
                LocalDateTime.of(2025, 1, 1, 0, 0), LocalDateTime.of(2025, 1, 31, 23, 59), null, null);

        assertEquals(0, out.size());
    }
}
