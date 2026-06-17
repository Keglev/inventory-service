package com.smartsupplypro.inventory.mapper;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.model.Supplier;

/**
 * Unit tests for {@link InventoryItemMapper} bidirectional mapping correctness.
 */
@SuppressWarnings("unused")
class InventoryItemMapperTest {

    private final InventoryItemMapper mapper = new InventoryItemMapper();

    /**
     * Mapping from {@link InventoryItem} entity to {@link InventoryItemDTO}.
     */
    @Nested
    @SuppressWarnings("unused")
    class ToDTO {

        @Test
        void should_return_null_for_null_input() {
            assertNull(mapper.toDTO(null));
        }

        @Test
        void should_compute_total_value_as_price_times_quantity() {
            InventoryItem entity = InventoryItem.builder()
                    .id("i-1").name("SSD").quantity(3).price(new BigDecimal("12.34"))
                    .supplierId("s-1").minimumQuantity(1).createdBy("admin")
                    .createdAt(LocalDateTime.of(2026, 3, 1, 12, 0)).build();
            InventoryItemDTO dto = mapper.toDTO(entity);
            assertNotNull(dto);
            assertEquals(new BigDecimal("37.02"), dto.getTotalValue());
        }

        @Test
        void should_return_zero_total_value_when_price_is_null() {
            InventoryItem entity = InventoryItem.builder()
                    .id("i-2").name("Cable").quantity(5).price(null)
                    .supplierId("s-1").minimumQuantity(1).createdBy("admin")
                    .createdAt(LocalDateTime.of(2026, 1, 1, 0, 0)).build();
            InventoryItemDTO dto = mapper.toDTO(entity);
            assertEquals(BigDecimal.ZERO, dto.getTotalValue());
        }

        @Test
        void should_resolve_supplier_name_from_loaded_relationship() {
            Supplier supplier = Supplier.builder().id("s-1").name("Acme").createdBy("sys").build();
            InventoryItem entity = InventoryItem.builder()
                    .id("i-3").name("Widget").quantity(1).price(new BigDecimal("1.00"))
                    .supplierId("s-1").supplier(supplier).minimumQuantity(1)
                    .createdBy("admin").createdAt(LocalDateTime.of(2026, 1, 1, 0, 0)).build();
            InventoryItemDTO dto = mapper.toDTO(entity);
            assertEquals("Acme", dto.getSupplierName());
        }

        @Test
        void should_return_null_supplier_name_when_supplier_is_null() {
            InventoryItem entity = InventoryItem.builder()
                    .id("i-4").name("Bolt").quantity(10).price(new BigDecimal("0.50"))
                    .supplierId("s-1").minimumQuantity(1).createdBy("admin")
                    .createdAt(LocalDateTime.of(2026, 1, 1, 0, 0)).build();
            InventoryItemDTO dto = mapper.toDTO(entity);
            assertNull(dto.getSupplierName());
        }
    }

    /**
     * Mapping from {@link InventoryItemDTO} to {@link InventoryItem} entity.
     */
    @Nested
    @SuppressWarnings("unused")
    class ToEntity {

        @Test
        void should_return_null_for_null_input() {
            assertNull(mapper.toEntity(null));
        }

        @Test
        void should_map_all_persistence_fields() {
            InventoryItemDTO dto = InventoryItemDTO.builder()
                    .id("i-9").name("SSD").quantity(7).price(new BigDecimal("10.00"))
                    .supplierId("s-1").minimumQuantity(2).createdBy("admin")
                    .createdAt(LocalDateTime.of(2026, 3, 1, 12, 0)).build();
            InventoryItem entity = mapper.toEntity(dto);
            assertNotNull(entity);
            assertEquals("i-9", entity.getId());
            assertEquals("SSD", entity.getName());
            assertEquals(7, entity.getQuantity());
            assertEquals(new BigDecimal("10.00"), entity.getPrice());
            assertEquals("s-1", entity.getSupplierId());
            assertEquals(2, entity.getMinimumQuantity());
        }

        @Test
        void should_not_include_computed_dto_fields_in_entity() {
            // totalValue and supplierName are DTO-only; passing them in must not affect the entity
            InventoryItemDTO dto = InventoryItemDTO.builder()
                    .id("i-10").name("Bolt").quantity(1).price(new BigDecimal("1.00"))
                    .totalValue(new BigDecimal("999.99")).supplierName("Acme")
                    .supplierId("s-1").minimumQuantity(1).createdBy("admin")
                    .createdAt(LocalDateTime.of(2026, 1, 1, 0, 0)).build();
            InventoryItem entity = mapper.toEntity(dto);
            assertNull(entity.getSupplier());
        }
    }
}
