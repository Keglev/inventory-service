package com.smartsupplypro.inventory.repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.custom.util.DatabaseDialectDetector;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

/**
 * Integration tests for {@link InventoryItemRepository} analytics query correctness
 * using {@link org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest}.
 *
 * <p>Verifies {@code findItemsBelowMinimumStockFiltered} against seeded H2 data.
 * Suppliers are inserted via native SQL to guarantee known IDs; items are persisted via
 * JPA then supplier_id is patched with a native UPDATE to avoid entity-mapping ambiguity.</p>
 */
@DataJpaTest
@ActiveProfiles("test")
@Import(DatabaseDialectDetector.class)
class InventoryItemRepositoryAnalyticsTest {

    @Autowired private InventoryItemRepository repository;
    @PersistenceContext private EntityManager em;

    @BeforeEach
    void setUp() {
        em.createNativeQuery("DELETE FROM stock_history").executeUpdate();
        em.createNativeQuery("DELETE FROM inventory_item").executeUpdate();
        em.createNativeQuery("DELETE FROM supplier").executeUpdate();

        em.createNativeQuery("INSERT INTO supplier (id, name, created_at, created_by) VALUES ('S1', 'Supplier One', CURRENT_TIMESTAMP, 'test')").executeUpdate();
        em.createNativeQuery("INSERT INTO supplier (id, name, created_at, created_by) VALUES ('S2', 'Supplier Two', CURRENT_TIMESTAMP, 'test')").executeUpdate();
        em.createNativeQuery("INSERT INTO supplier (id, name, created_at, created_by) VALUES ('default-supplier', 'Default Supplier', CURRENT_TIMESTAMP, 'test')").executeUpdate();

        em.persist(item(null, "S1-low",   3,  5, "1.00")); // below Ã¢â€ â€™ included for S1
        em.persist(item(null, "S1-eq",    5,  5, "2.00")); // equal Ã¢â€ â€™ NOT included
        em.persist(item(null, "S1-high", 10,  5, "3.00")); // above Ã¢â€ â€™ NOT included
        em.persist(item(null, "S2-low",   1,  2, "4.00")); // below Ã¢â€ â€™ included for S2
        em.flush();

        // set supplier_id via native UPDATE to avoid entity-mapping ambiguity
        em.createNativeQuery("UPDATE inventory_item SET supplier_id = 'S1' WHERE name LIKE 'S1-%'").executeUpdate();
        em.createNativeQuery("UPDATE inventory_item SET supplier_id = 'S2' WHERE name LIKE 'S2-%'").executeUpdate();
        em.flush();
        em.clear();
    }

    /**
     * Below-minimum-stock native query with optional supplier filter.
     */
    @Nested
    class BelowMinimumStock {

        @Test
        void should_return_only_items_strictly_below_minimum_for_supplier() {
            List<Object[]> result = repository.findItemsBelowMinimumStockFiltered("S1");

            // S1-eq (qty==min) and S1-high (qty>min) must be excluded
            assertEquals(1, result.size());
        }

        @Test
        void should_isolate_results_to_the_requested_supplier() {
            List<Object[]> s1 = repository.findItemsBelowMinimumStockFiltered("S1");
            List<Object[]> s2 = repository.findItemsBelowMinimumStockFiltered("S2");

            assertEquals(1, s1.size());
            assertEquals(1, s2.size());
        }

        @Test
        void should_return_all_below_minimum_rows_when_supplier_id_is_null() {
            List<Object[]> all = repository.findItemsBelowMinimumStockFiltered(null);

            // S1-low and S2-low = 2 rows
            assertEquals(2, all.size());
        }
    }

    private static InventoryItem item(String id, String name, int qty, int minQty, String price) {
        InventoryItem i = new InventoryItem();
        i.setId(id != null ? id : UUID.randomUUID().toString());
        i.setName(name);
        i.setSku("SKU-ANA-" + name);
        i.setQuantity(qty);
        i.setMinimumQuantity(minQty);
        i.setPrice(new BigDecimal(price));
        i.setCreatedBy("test");
        return i;
    }
}
