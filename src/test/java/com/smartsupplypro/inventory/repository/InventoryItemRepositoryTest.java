package com.smartsupplypro.inventory.repository;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.model.Supplier;
import com.smartsupplypro.inventory.repository.custom.util.DatabaseDialectDetector;

/**
 * Integration tests for {@link InventoryItemRepository} query correctness
 * using {@link org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest}.
 */
@DataJpaTest
@ActiveProfiles("test")
@Import(DatabaseDialectDetector.class)
class InventoryItemRepositoryTest {

    @Autowired private InventoryItemRepository inventoryItemRepository;
    @Autowired private SupplierRepository supplierRepository;

    private Supplier supplier1;
    private Supplier supplier2;

    @BeforeEach
    void setup() {
        supplier1 = supplierRepository.save(Supplier.builder()
                .id("sup-1").name("Supplier One").contactName("Alice")
                .email("alice@one.com").phone("123456").createdBy("admin").build());
        supplier2 = supplierRepository.save(Supplier.builder()
                .id("sup-2").name("Supplier Two").contactName("Bob")
                .email("bob@two.com").phone("654321").createdBy("admin").build());
    }

    /**
     * Case-insensitive name lookup and sorted paginated retrieval.
     */
    @Nested
    class NameSearch {

        @Test
        void should_find_items_by_exact_name_case_insensitive() {
            inventoryItemRepository.save(InventoryItem.builder()
                    .id("item-1").name("Wrench").sku("SKU-REP-1").price(BigDecimal.valueOf(8))
                    .quantity(20).minimumQuantity(5).supplier(supplier1).build());

            List<InventoryItem> result = inventoryItemRepository.findByNameIgnoreCase("wrench");
            assertEquals(1, result.size());
            assertEquals("Wrench", result.get(0).getName());
        }

        @Test
        void should_return_empty_when_name_does_not_match_exactly() {
            inventoryItemRepository.save(InventoryItem.builder()
                    .id("item-2").name("Wrench Pro").sku("SKU-REP-2").price(BigDecimal.valueOf(12))
                    .quantity(10).minimumQuantity(2).supplier(supplier1).build());

            // exact lookup must not match partial names
            assertTrue(inventoryItemRepository.findByNameIgnoreCase("Wrench").isEmpty());
        }

        @Test
        void should_return_items_sorted_by_price_ascending_for_name_filter() {
            inventoryItemRepository.save(InventoryItem.builder()
                    .id("item-3").name("Screw").sku("SKU-REP-3").price(BigDecimal.valueOf(1))
                    .quantity(100).minimumQuantity(10).supplier(supplier1).build());
            inventoryItemRepository.save(InventoryItem.builder()
                    .id("item-4").name("Screw-2").sku("SKU-REP-4").price(BigDecimal.valueOf(5))
                    .quantity(80).minimumQuantity(10).supplier(supplier1).build());

            Page<InventoryItem> result = inventoryItemRepository.searchActiveItems(
                    "screw", null, false, PageRequest.of(0, 10, Sort.by(Sort.Direction.ASC, "price")));
            assertEquals(2, result.getTotalElements());
            assertEquals(BigDecimal.valueOf(1), result.getContent().get(0).getPrice());
        }

        @Test
        void should_match_all_active_items_when_name_is_empty() {
            inventoryItemRepository.save(InventoryItem.builder()
                    .id("item-e1").name("Hammer").sku("SKU-REP-E1").price(BigDecimal.valueOf(9))
                    .quantity(10).minimumQuantity(5).supplier(supplier1).build());
            inventoryItemRepository.save(InventoryItem.builder()
                    .id("item-e2").name("Chisel").sku("SKU-REP-E2").price(BigDecimal.valueOf(4))
                    .quantity(10).minimumQuantity(5).supplier(supplier2).active(false).build());

            Page<InventoryItem> result = inventoryItemRepository.searchActiveItems(
                    "", null, false, PageRequest.of(0, 10));
            assertEquals(1, result.getTotalElements());
            assertEquals("Hammer", result.getContent().get(0).getName());
        }

        @Test
        void should_filter_by_supplier_when_supplierId_given() {
            inventoryItemRepository.save(InventoryItem.builder()
                    .id("item-s1").name("Plate").sku("SKU-REP-S1").price(BigDecimal.valueOf(3))
                    .quantity(10).minimumQuantity(5).supplier(supplier1).supplierId("sup-1").build());
            inventoryItemRepository.save(InventoryItem.builder()
                    .id("item-s2").name("Plate XL").sku("SKU-REP-S2").price(BigDecimal.valueOf(6))
                    .quantity(10).minimumQuantity(5).supplier(supplier2).supplierId("sup-2").build());

            Page<InventoryItem> result = inventoryItemRepository.searchActiveItems(
                    "plate", "sup-2", false, PageRequest.of(0, 10));
            assertEquals(1, result.getTotalElements());
            assertEquals("item-s2", result.getContent().get(0).getId());
        }

        @Test
        void should_filter_below_minimum_when_flag_set() {
            inventoryItemRepository.save(InventoryItem.builder()
                    .id("item-b1").name("Rod low").sku("SKU-REP-B1").price(BigDecimal.valueOf(2))
                    .quantity(3).minimumQuantity(10).supplier(supplier1).build());
            inventoryItemRepository.save(InventoryItem.builder()
                    .id("item-b2").name("Rod ok").sku("SKU-REP-B2").price(BigDecimal.valueOf(2))
                    .quantity(50).minimumQuantity(10).supplier(supplier1).build());

            Page<InventoryItem> result = inventoryItemRepository.searchActiveItems(
                    "rod", null, true, PageRequest.of(0, 10));
            assertEquals(1, result.getTotalElements());
            assertEquals("item-b1", result.getContent().get(0).getId());
        }

        @Test
        void should_honor_pageable_sort_over_any_default() {
            inventoryItemRepository.save(InventoryItem.builder()
                    .id("item-o1").name("Alpha").sku("SKU-REP-O1").price(BigDecimal.valueOf(50))
                    .quantity(10).minimumQuantity(5).supplier(supplier1).build());
            inventoryItemRepository.save(InventoryItem.builder()
                    .id("item-o2").name("Beta").sku("SKU-REP-O2").price(BigDecimal.valueOf(1))
                    .quantity(10).minimumQuantity(5).supplier(supplier1).build());

            Page<InventoryItem> result = inventoryItemRepository.searchActiveItems(
                    "", null, false, PageRequest.of(0, 10, Sort.by(Sort.Direction.ASC, "name")));
            assertEquals("Alpha", result.getContent().get(0).getName());
        }
    }

    /**
     * Supplier active-stock existence checks.
     */
    @Nested
    class SupplierAssociation {

        @Test
        void should_confirm_active_stock_exists_for_supplier_above_threshold() {
            inventoryItemRepository.save(InventoryItem.builder()
                    .id("item-5").name("Bolt").sku("SKU-REP-5").price(BigDecimal.valueOf(2))
                    .quantity(30).minimumQuantity(5).supplier(supplier1).build());

            assertTrue(inventoryItemRepository.existsActiveStockForSupplier(supplier1.getId(), 0));
        }

        @Test
        void should_return_false_when_supplier_has_no_stock_above_threshold() {
            inventoryItemRepository.save(InventoryItem.builder()
                    .id("item-6").name("Nut").sku("SKU-REP-6").price(BigDecimal.valueOf(1))
                    .quantity(0).minimumQuantity(5).supplier(supplier1).build());

            assertFalse(inventoryItemRepository.existsActiveStockForSupplier(supplier1.getId(), 0));
        }
    }

    /**
     * Low-stock threshold queries with optional supplier filter.
     */
    @Nested
    class StockThreshold {

        @Test
        void should_return_items_below_minimum_stock_filtered_by_supplier() {
            InventoryItem low1 = InventoryItem.builder()
                    .id("item-low-1").name("Pen Blue").sku("SKU-REP-7").quantity(2)
                    .minimumQuantity(5).price(BigDecimal.TEN).supplier(supplier1).build();
            low1.setSupplierId(supplier1.getId());
            InventoryItem low2 = InventoryItem.builder()
                    .id("item-low-2").name("Pen Red").sku("SKU-REP-8").quantity(1)
                    .minimumQuantity(5).price(BigDecimal.ONE).supplier(supplier2).build();
            low2.setSupplierId(supplier2.getId());
            inventoryItemRepository.saveAllAndFlush(List.of(low1, low2));

            // null supplierId returns all below-minimum rows
            assertEquals(2, inventoryItemRepository.findItemsBelowMinimumStockFiltered(null).size());
            assertEquals(1, inventoryItemRepository.findItemsBelowMinimumStockFiltered(supplier2.getId()).size());
        }

        @Test
        void should_count_items_with_quantity_strictly_below_threshold() {
            inventoryItemRepository.save(InventoryItem.builder()
                    .id("item-cnt-1").name("Pin").sku("SKU-REP-9").quantity(3)
                    .minimumQuantity(5).price(BigDecimal.ONE).supplier(supplier1).build());
            inventoryItemRepository.save(InventoryItem.builder()
                    .id("item-cnt-2").name("Clip").sku("SKU-REP-10").quantity(10)
                    .minimumQuantity(5).price(BigDecimal.ONE).supplier(supplier1).build());

            assertEquals(1, inventoryItemRepository.countWithQuantityBelow(5));
            assertEquals(0, inventoryItemRepository.countWithQuantityBelow(3));
        }
    }
}
