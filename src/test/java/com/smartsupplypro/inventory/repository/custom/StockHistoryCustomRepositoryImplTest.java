package com.smartsupplypro.inventory.repository.custom;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.dto.StockEventRowDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.model.StockHistory;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;
import com.smartsupplypro.inventory.repository.custom.util.DatabaseDialectDetector;

import jakarta.persistence.EntityManager;

/**
 * Integration tests for the WAC event streaming query in {@link StockDetailQueryRepositoryImpl}.
 *
 * <p>Verifies supplier filtering and result ordering (itemId ASC, timestamp ASC)
 * for the JPQL projection method {@code streamEventsForWAC}.</p>
 */
@DataJpaTest
@ActiveProfiles("test")
@Import(DatabaseDialectDetector.class)
class StockHistoryCustomRepositoryImplTest {

    @Autowired private EntityManager em;
    @Autowired private StockHistoryRepository repository;

    @BeforeEach
    void setUp() {
        em.createNativeQuery("DELETE FROM stock_history").executeUpdate();
        em.createNativeQuery("DELETE FROM inventory_item").executeUpdate();
        em.createNativeQuery("DELETE FROM supplier").executeUpdate();

        em.createNativeQuery(
            "INSERT INTO supplier (id, name, created_at, created_by) VALUES ('sup1','Supplier One', CURRENT_TIMESTAMP, 'test')"
        ).executeUpdate();
        em.createNativeQuery(
            "INSERT INTO supplier (id, name, created_at, created_by) VALUES ('sup2','Supplier Two', CURRENT_TIMESTAMP, 'test')"
        ).executeUpdate();
        em.createNativeQuery(
            "INSERT INTO supplier (id, name, created_at, created_by) VALUES ('default-supplier','Default Supplier', CURRENT_TIMESTAMP, 'test')"
        ).executeUpdate();

        em.createNativeQuery(
            "INSERT INTO inventory_item (id, sku, name, price, quantity, minimum_quantity, supplier_id, created_at, created_by) " +
            "VALUES ('itemA','SKU-HIS-A','Item A', 1.00, 0, 0, 'sup1', CURRENT_TIMESTAMP, 'test')"
        ).executeUpdate();
        em.createNativeQuery(
            "INSERT INTO inventory_item (id, sku, name, price, quantity, minimum_quantity, supplier_id, created_at, created_by) " +
            "VALUES ('itemB','SKU-HIS-B','Item B', 1.00, 0, 0, 'sup2', CURRENT_TIMESTAMP, 'test')"
        ).executeUpdate();
    }

    /**
     * Supplier filter and ordering guarantees for streamEventsForWAC.
     */
    @Nested
    class WacEventStreaming {

        @Test
        void should_order_events_by_item_then_time_and_filter_by_supplier() {
            em.persist(sh("itemA", "sup1", at(2024,2,1, 9,0), +5, bd("4.00"), StockChangeReason.INITIAL_STOCK));
            em.persist(sh("itemA", "sup1", at(2024,2,1,10,0), -2, null, StockChangeReason.SOLD));
            em.persist(sh("itemB", "sup1", at(2024,2,2,10,0), +3, bd("5.50"), StockChangeReason.INITIAL_STOCK));
            // different supplier Ã¢â‚¬â€ must be excluded
            em.persist(sh("itemA", "sup2", at(2024,2,1,11,0), +1, bd("6.00"), StockChangeReason.INITIAL_STOCK));
            em.flush();
            em.clear();

            List<StockEventRowDTO> out = repository.streamEventsForWAC(at(2024,2,28,23,59), "sup1");

            assertEquals(3, out.size());
            out.forEach(e -> assertEquals("sup1", e.supplierId()));

            assertEquals("itemA", out.get(0).itemId());
            assertEquals(at(2024,2,1,9,0), out.get(0).createdAt());
            assertEquals(+5, out.get(0).quantityChange());

            assertEquals("itemA", out.get(1).itemId());
            assertEquals(at(2024,2,1,10,0), out.get(1).createdAt());
            assertEquals(-2, out.get(1).quantityChange());

            assertEquals("itemB", out.get(2).itemId());
            assertEquals(at(2024,2,2,10,0), out.get(2).createdAt());
            assertEquals(+3, out.get(2).quantityChange());
        }
    }

    // ---- helpers ----------------------------------------------------------

    private static LocalDateTime at(int y, int m, int d, int H, int M) {
        return LocalDateTime.of(y, m, d, H, M);
    }

    private static BigDecimal bd(String v) { return new BigDecimal(v); }

    private void persist(StockHistory sh) { em.persist(sh); }

    private static StockHistory sh(String itemId, String supplierId,
                                   LocalDateTime createdAt, int quantityChange,
                                   BigDecimal priceAtChange, StockChangeReason reason) {
        StockHistory e = new StockHistory();
        e.setId(UUID.randomUUID().toString());
        e.setItemId(itemId);
        e.setSupplierId(supplierId);
        e.setTimestamp(createdAt);
        e.setChange(quantityChange);
        e.setPriceAtChange(priceAtChange);
        e.setReason(reason);
        e.setCreatedBy("test");
        return e;
    }
}
