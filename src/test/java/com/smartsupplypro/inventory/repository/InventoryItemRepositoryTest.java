package com.smartsupplypro.inventory.repository;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.model.Supplier;
import com.smartsupplypro.inventory.repository.custom.util.DatabaseDialectDetector;

/**
 * Integration test class for {@link InventoryItemRepository} using H2 in-memory database.
 * <p>
 * Covers full repository functionality including filtering, pagination, sorting,
 * supplier-based queries, and inventory threshold calculations.
 */
@SuppressWarnings("unused")
@DataJpaTest
@ActiveProfiles("test")
@Import(DatabaseDialectDetector.class)
class InventoryItemRepositoryTest {

    @Autowired
    private InventoryItemRepository inventoryItemRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    private Supplier supplier1;
    private Supplier supplier2;

    /**
     * Prepares test suppliers before each test method to link with inventory items.
     */
    @BeforeEach
    @SuppressWarnings("unused")
    void setup() {
        supplier1 = supplierRepository.save(Supplier.builder()
                .id("sup-1")
                .name("Supplier One")
                .contactName("Alice")
                .email("alice@one.com")
                .phone("123456")
                .createdBy("admin")
                .build());

        supplier2 = supplierRepository.save(Supplier.builder()
                .id("sup-2")
                .name("Supplier Two")
                .contactName("Bob")
                .email("bob@two.com")
                .phone("654321")
                .createdBy("admin")
                .build());
    }

    /**
     * Verifies partial name search (case-insensitive) works correctly.
     */
    @Test
    @DisplayName("Should find items by name containing substring (ignore case)")
    void testFindByNameContainingIgnoreCase() {
        inventoryItemRepository.save(InventoryItem.builder().id("item-1").name("Hammer").price(BigDecimal.valueOf(10)).quantity(50).minimumQuantity(5).supplier(supplier1).build());
        inventoryItemRepository.save(InventoryItem.builder().id("item-2").name("Hammerhead").price(BigDecimal.valueOf(15)).quantity(30).minimumQuantity(5).supplier(supplier1).build());

        List<InventoryItem> result = inventoryItemRepository.findByNameContainingIgnoreCase("hammer");

        assertEquals(2, result.size(), "Expected two results containing 'hammer'");
    }

    /**
     * Verifies exact name match with case-insensitive behavior.
     */
    @Test
    @DisplayName("Should find items by exact name (ignore case)")
    void testFindByNameIgnoreCase() {
        inventoryItemRepository.save(InventoryItem.builder().id("item-3").name("Wrench").price(BigDecimal.valueOf(8)).quantity(20).minimumQuantity(5).supplier(supplier1).build());

        List<InventoryItem> result = inventoryItemRepository.findByNameIgnoreCase("wrench");
        assertEquals(1, result.size());
        assertEquals("Wrench", result.get(0).getName());
    }

    /**
     * Verifies sorted query by price (ascending) works with name filtering.
     */
    @Test
    @DisplayName("Should return items filtered by name and sorted by price")
    void testFindByNameSortedByPrice() {
        inventoryItemRepository.save(InventoryItem.builder().id("item-4").name("Screw").price(BigDecimal.valueOf(1)).quantity(100).minimumQuantity(10).supplier(supplier1).build());
        inventoryItemRepository.save(InventoryItem.builder().id("item-5").name("Screw-2").price(BigDecimal.valueOf(5)).quantity(80).minimumQuantity(10).supplier(supplier1).build());

        Page<InventoryItem> result = inventoryItemRepository.findByNameSortedByPrice("screw", PageRequest.of(0, 10));

        assertEquals(2, result.getTotalElements());
        assertEquals(BigDecimal.valueOf(1), result.getContent().get(0).getPrice());
    }

    /**
     * Verifies pagination of partial name queries returns correct pages.
     */
    @Test
    @DisplayName("Should return paginated results for name search")
    void testFindByNameContainingIgnoreCase_withPagination() {
        for (int i = 1; i <= 7; i++) {
            inventoryItemRepository.save(InventoryItem.builder()
                    .id("item-page-" + i)
                    .name("Cable Type " + i)
                    .price(BigDecimal.valueOf(3.5 + i))
                    .quantity(10 * i)
                    .minimumQuantity(2)
                    .supplier(supplier2)
                    .build());
        }

        Page<InventoryItem> result = inventoryItemRepository.findByNameContainingIgnoreCase("cable", PageRequest.of(0, 5));
        assertEquals(5, result.getContent().size());
        assertEquals(7, result.getTotalElements());
    }

    /**
     * Verifies supplier existence is correctly checked by foreign key.
     */
    @Test
    @DisplayName("Should return true when inventory item exists for supplier")
    void testExistsBySupplierId_shouldReturnTrue() {
        // Assuming supplierA is already saved in @BeforeEach
        InventoryItem item = InventoryItem.builder()
            .id("item-1")
            .name("Wrench")
            .price(BigDecimal.valueOf(25))
            .quantity(30)
            .minimumQuantity(5)
            .supplier(supplier1)
            .build();

        item.setSupplierId(supplier1.getId());

        inventoryItemRepository.saveAndFlush(item);

        boolean exists = inventoryItemRepository.existsBySupplier_Id(supplier1.getId());
        assertTrue(exists);
    }


    /**
     * Verifies supplier with no inventory returns false.
     */
    @Test
    @DisplayName("Should return false if supplier has no items")
    void testExistsBySupplierId_shouldReturnFalse() {
        assertFalse(inventoryItemRepository.existsBySupplier_Id("unknown-supplier"));
    }

    /**
     * Verifies detection of duplicate name+price combinations.
     */
    @Test
    @DisplayName("Should return true for existing name+price combo")
    void testExistsByNameAndPrice_shouldReturnTrue() {
        inventoryItemRepository.save(InventoryItem.builder().id("item-dup").name("Widget").price(BigDecimal.valueOf(99)).quantity(1).minimumQuantity(0).supplier(supplier1).build());

        assertTrue(inventoryItemRepository.existsByNameAndPrice("Widget", BigDecimal.valueOf(99)));
    }

    /**
     * Verifies low-stock filtering with optional supplier filter.
     */
    @Test
    @DisplayName("Should return items below minimum stock filtered by supplier")
    void testFindItemsBelowMinimumStockFiltered_withAndWithoutSupplier() {
        InventoryItem low1 = InventoryItem.builder()
            .id("item-low-1")
            .name("Pen Blue")
            .quantity(2)
            .minimumQuantity(5)
            .price(BigDecimal.TEN)
            .supplier(supplier1)
            .build();
        low1.setSupplierId(supplier1.getId()); // <-- ensure FK is written

        InventoryItem low2 = InventoryItem.builder()
            .id("item-low-2")
            .name("Pen Red")
            .quantity(1)
            .minimumQuantity(5)
            .price(BigDecimal.ONE)
            .supplier(supplier2)
            .build();
        low2.setSupplierId(supplier2.getId()); // <-- ensure FK is written

        inventoryItemRepository.saveAllAndFlush(List.of(low1, low2));

        List<Object[]> allLowStock = inventoryItemRepository.findItemsBelowMinimumStockFiltered(null);
        assertEquals(2, allLowStock.size());

        List<Object[]> filtered = inventoryItemRepository.findItemsBelowMinimumStockFiltered(supplier2.getId());
        assertEquals(1, filtered.size());
    }

    /**
     * Verifies detection of duplicate names regardless of case.
     */
    @Test
    @DisplayName("Should return true if name already exists (ignore case)")
    void testExistsByNameIgnoreCase() {
        inventoryItemRepository.save(InventoryItem.builder().id("item-namecheck").name("Clamps").price(BigDecimal.ONE).quantity(1).minimumQuantity(1).supplier(supplier1).build());

        assertTrue(inventoryItemRepository.existsByNameIgnoreCase("clamps"));
    }

    /**
     * Verifies that no false positives are returned for unmatched names.
     */
    @Test
    @DisplayName("Should return false for non-existent item name")
    void testExistsByNameIgnoreCase_notFound() {
        assertFalse(inventoryItemRepository.existsByNameIgnoreCase("nonexistent-item"));
    }
}
