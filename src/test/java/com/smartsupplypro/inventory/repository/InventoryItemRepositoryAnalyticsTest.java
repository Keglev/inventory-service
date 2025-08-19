package com.smartsupplypro.inventory.repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.model.InventoryItem;

import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

/**
 * Analytics-focused slice tests for {@link InventoryItemRepository}.
 *
 * <p><strong>Scope:</strong> validates behavior of
 * {@code findItemsBelowMinimumStockFiltered(String supplierId)}:
 * <ul>
 *   <li>filters by supplier when provided,</li>
 *   <li>returns only items with {@code quantity < minimum_quantity},</li>
 *   <li>orders by {@code quantity ASC} as declared in the native query.</li>
 * </ul>
 * </p>
 *
 * <p><strong>Assumptions:</strong> {@link InventoryItem} has at least:
 * <code>id</code> (String), <code>name</code> (String), <code>supplierId</code> (String),
 * <code>quantity</code> (int), <code>minimumQuantity</code> (int), <code>price</code> (BigDecimal).
 * Adjust seeding if your entity differs.</p>
 */
@DataJpaTest
@ActiveProfiles("test")
class InventoryItemRepositoryAnalyticsTest {

    @Autowired private InventoryItemRepository repository;
    @Autowired private EntityManager em;

    @BeforeEach
    @Transactional
    void seed() {
        em.createQuery("delete from InventoryItem").executeUpdate();

        em.persist(item("i1", "Item A", "S1", 2, 5, "1.00"));  // low (2 < 5)
        em.persist(item("i2", "Item B", "S1", 10, 5, "2.00")); // ok
        em.persist(item("i3", "Item C", "S2", 1, 2, "3.00"));  // low (1 < 2)
        em.persist(item("i4", "Item D", "S2", 0, 1, "4.00"));  // low (0 < 1)

        em.flush();
        em.clear();
    }

    @Test
    void filtersBySupplier_andReturnsOnlyLowStock_sortedByQuantityAsc() {
        List<Object[]> rows = repository.findItemsBelowMinimumStockFiltered("S2");

        assertEquals(2, rows.size(), "Only S2's low-stock items should be returned");
        // order by quantity asc: Item D (0), Item C (1)
        assertEquals("Item D", rows.get(0)[0]);
        assertEquals(0, ((Number) rows.get(0)[1]).intValue());
        assertEquals(1, ((Number) rows.get(0)[2]).intValue()); // min qty

        assertEquals("Item C", rows.get(1)[0]);
        assertEquals(1, ((Number) rows.get(1)[1]).intValue());
        assertEquals(2, ((Number) rows.get(1)[2]).intValue());
    }

    @Test
    void supplierFilterNullOrBlank_returnsAllLowStock() {
        // If your repository normalizes blanks to null upstream (service),
        // this test passes in null to fetch all low-stock items.
        List<Object[]> rows = repository.findItemsBelowMinimumStockFiltered(null);

        // low: i1 (2<5), i3 (1<2), i4 (0<1). Expect ordered by quantity asc: i4, i3, i1
        assertEquals(3, rows.size());
        assertEquals("Item D", rows.get(0)[0]); // qty 0
        assertEquals("Item C", rows.get(1)[0]); // qty 1
        assertEquals("Item A", rows.get(2)[0]); // qty 2
    }

    // ---------- helpers ----------

    private static InventoryItem item(String id, String name, String supplierId,
                                      int qty, int minQty, String price) {
        InventoryItem i = new InventoryItem();
        i.setId(id != null ? id : UUID.randomUUID().toString());
        i.setName(name);
        i.setSupplierId(supplierId);
        i.setQuantity(qty);
        i.setMinimumQuantity(minQty);
        i.setPrice(new BigDecimal(price));
        return i;
    }
}

