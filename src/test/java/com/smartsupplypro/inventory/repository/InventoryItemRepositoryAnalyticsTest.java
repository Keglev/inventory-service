package com.smartsupplypro.inventory.repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.custom.util.DatabaseDialectDetector;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

/**
 * Integration tests for {@link InventoryItemRepository} focused on analytics-related queries.
 *
 * <p>Verifies {@code findItemsBelowMinimumStockFiltered(String)} against an in-memory H2 database
 * with explicit seeding. We use a hybrid approach for seeding:
 * <ul>
 *   <li>Suppliers are inserted via native SQL to guarantee rows exist with known IDs.</li>
 *   <li>Items are persisted via JPA; afterwards we set {@code supplier_id} via a native UPDATE
 *       to avoid any ambiguity in entity mapping (association vs FK string field).</li>
 * </ul>
 * This ensures the repository's native query filters by {@code supplier_id} exactly as expected.
 */
@SuppressWarnings("unused")
@DataJpaTest
@ActiveProfiles("test")
@Import(DatabaseDialectDetector.class)
class InventoryItemRepositoryAnalyticsTest {

    @Autowired
    private InventoryItemRepository repository;

    @PersistenceContext
    private EntityManager em;

    @BeforeEach
    @SuppressWarnings("unused") // used by JUnit via reflection
    void setUp() {
        // Clean tables in FK-safe order
        em.createNativeQuery("DELETE FROM stock_history").executeUpdate();
        em.createNativeQuery("DELETE FROM inventory_item").executeUpdate();
        em.createNativeQuery("DELETE FROM supplier").executeUpdate();

        // Seed suppliers (guarantee IDs 'S1' and 'S2' exist)
        em.createNativeQuery("INSERT INTO supplier (id, name, created_at, created_by) VALUES ('S1', 'Supplier One', CURRENT_TIMESTAMP, 'test')")
            .executeUpdate();
        em.createNativeQuery("INSERT INTO supplier (id, name, created_at, created_by) VALUES ('S2', 'Supplier Two', CURRENT_TIMESTAMP, 'test')")
            .executeUpdate();
        // Create the default supplier that @PrePersist method expects
        em.createNativeQuery("INSERT INTO supplier (id, name, created_at, created_by) VALUES ('default-supplier', 'Default Supplier', CURRENT_TIMESTAMP, 'test')")
            .executeUpdate();


        // Persist items via JPA (leave supplier_id null for now)
        InventoryItem s1low  = item(null, "S1-low",  3,  5, "1.00"); // below -> expect included for S1
        InventoryItem s1eq   = item(null, "S1-eq",   5,  5, "2.00"); // equal -> expect NOT included
        InventoryItem s1high = item(null, "S1-high",10,  5, "3.00"); // above -> expect NOT included
        InventoryItem s2low  = item(null, "S2-low",  1,  2, "4.00"); // below -> expect included for S2

        persist(s1low);
        persist(s1eq);
        persist(s1high);
        persist(s2low);
        em.flush();

        // Force supplier_id using native UPDATE (maps cleanly to the FK column regardless of entity mapping)
        em.createNativeQuery("UPDATE inventory_item SET supplier_id = 'S1' WHERE name LIKE 'S1-%'").executeUpdate();
        em.createNativeQuery("UPDATE inventory_item SET supplier_id = 'S2' WHERE name LIKE 'S2-%'").executeUpdate();

        em.flush();
        em.clear();
    }
    /**
     * Tests the native query that finds items below their minimum stock level,
     * optionally filtered by supplier.
     * 
     * <p>Verifies that the query correctly returns items with quantity below minimum,
     * and that it filters by supplier when provided.</p>
     * 
     * <p>Uses the native SQL query defined in
     * * {@link InventoryItemRepository#findItemsBelowMinimumStockFiltered(String)}.</p>
     **/
    @Test
    @DisplayName("S1: returns only items strictly below minimum (excludes == and above)")
    void s1_onlyBelowMinimum() {
        List<Object[]> result = repository.findItemsBelowMinimumStockFiltered("S1");
        assertEquals(1, result.size(), "S1 should return exactly one row below minimum");
    }
    /**
     * Tests the native query that finds items below their minimum stock level,
     * optionally filtered by supplier.
     * <p>Verifies that the query correctly returns items with quantity below minimum,
     * and that it filters by supplier when provided.</p>
     * <p>Uses the native SQL query defined in
        * {@link InventoryItemRepository#findItemsBelowMinimumStockFiltered(String)}.</p>
    **/
    @Test
    @DisplayName("S2: returns only items for the requested supplier")
    void s2_isolatedBySupplier() {
        List<Object[]> s1 = repository.findItemsBelowMinimumStockFiltered("S1");
        List<Object[]> s2 = repository.findItemsBelowMinimumStockFiltered("S2");

        assertEquals(1, s1.size(), "S1 should have one below-minimum row");
        assertEquals(1, s2.size(), "S2 should have one below-minimum row");
        assertTrue(s1 != s2, "Different suppliers should not share the same list instance");
    }
    /**
     * Tests the native query that finds items below their minimum stock level,
     * optionally filtered by supplier.
     * <p>Verifies that the query correctly returns items with quantity below minimum,
     * and that it filters by supplier when provided.</p>
     * <p>Uses the native SQL query defined in
        * {@link InventoryItemRepository#findItemsBelowMinimumStockFiltered(String)}.</p>
    **/
    @Test
    @DisplayName("Sanity: NULL supplierId returns all below-minimum rows across suppliers")
    void sanity_allSuppliers_whenNull() {
        List<Object[]> all = repository.findItemsBelowMinimumStockFiltered(null);
        // Expect S1-low and S2-low = 2 rows
        assertEquals(2, all.size(), "With null supplierId we should see both S1-low and S2-low");
    }

    // ---------- helpers ----------

    private void persist(InventoryItem i) { em.persist(i); }
    /**
     * Creates a new InventoryItem with the given parameters.
     * @param id Optional ID; if null, a random UUID will be generated
     * @param name Name of the item
     * @param qty Current quantity of the item
     * @param minQty Minimum quantity threshold for the item
     * @param price Price of the item as a string
     * @param createdBy User who created the item (for audit purposes)
     * @return A new InventoryItem instance with the specified properties
     **/
    private static InventoryItem item(String id, String name,
                                  int qty, int minQty, String price) {
        InventoryItem i = new InventoryItem();
        i.setId(id != null ? id : UUID.randomUUID().toString());
        i.setName(name);
        i.setQuantity(qty);
        i.setMinimumQuantity(minQty);
        i.setPrice(new BigDecimal(price));
        i.setCreatedBy("test");  // ensure NOT NULL column is satisfied
        // It did not set supplier/supplierId here; we set supplier_id via native UPDATE to avoid mapping issues
        return i;
    }

}
