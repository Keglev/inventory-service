package com.smartsupplypro.inventory.repository;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.repository.custom.util.DatabaseDialectDetector;

import jakarta.persistence.EntityManager;

/**
 * H2 integration test for the paginated per-employee change list, including the
 * case-insensitive creator filter and the newest-first ordering.
 */
@DataJpaTest
@ActiveProfiles("test")
@Import(DatabaseDialectDetector.class)
class StockHistoryRepositoryEmployeeChangesTest {

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
            "('sup1','Supplier One', CURRENT_TIMESTAMP, 'test')"
        ).executeUpdate();

        em.createNativeQuery(
            "INSERT INTO inventory_item (id, sku, name, price, quantity, minimum_quantity, supplier_id, created_at, created_by, active) VALUES " +
            "('itemA','SKU-EC-A','Item A', 2.00, 0, 10, 'sup1', CURRENT_TIMESTAMP, 'test', 1)"
        ).executeUpdate();

        em.createNativeQuery(
            "INSERT INTO stock_history (id, item_id, supplier_id, quantity_change, reason, created_by, created_at, price_at_change) VALUES " +
            "('ec1','itemA','sup1', 5, 'INITIAL_STOCK', 'alice@example.com', TIMESTAMP '2026-02-01 09:00:00', 2.00)," +
            "('ec2','itemA','sup1',-1, 'SOLD',          'alice@example.com', TIMESTAMP '2026-02-02 09:00:00', 2.00)," +
            "('ec3','itemA','sup1',-2, 'SOLD',          'alice@example.com', TIMESTAMP '2026-02-03 09:00:00', 2.00)," +
            "('ec4','itemA','sup1', 3, 'MANUAL_UPDATE', 'bob@example.com',   TIMESTAMP '2026-02-04 09:00:00', 2.00)"
        ).executeUpdate();

        em.flush();
        em.clear();
    }

    @Test
    void paginates_andFiltersByCreator_caseInsensitive() {
        Page<Object[]> page = stockHistoryRepository.findEmployeeChanges(
                from, to, "ALICE@EXAMPLE.COM", null, PageRequest.of(0, 2));

        assertEquals(3L, page.getTotalElements());
        assertEquals(2, page.getContent().size());
        // newest first: ec3 (Feb 3) before ec2 (Feb 2)
        Object[] first = page.getContent().get(0);
        assertEquals("Item A", first[0]);
        assertEquals("Supplier One", first[1]);
        assertEquals(-2L, ((Number) first[2]).longValue());
        assertEquals("SOLD", first[3]);
        assertEquals("alice@example.com", first[4]);
    }

    @Test
    void nullCreator_returnsAllEmployees() {
        Page<Object[]> page = stockHistoryRepository.findEmployeeChanges(
                from, to, null, null, PageRequest.of(0, 10));

        assertEquals(4L, page.getTotalElements());
    }

    @Test
    void filtersBySupplier_whenSupplierIdGiven() {
        Page<Object[]> matching = stockHistoryRepository.findEmployeeChanges(
                from, to, null, "sup1", PageRequest.of(0, 10));
        Page<Object[]> nonMatching = stockHistoryRepository.findEmployeeChanges(
                from, to, null, "supX", PageRequest.of(0, 10));

        assertEquals(4L, matching.getTotalElements());
        assertEquals(0L, nonMatching.getTotalElements());
    }
}
