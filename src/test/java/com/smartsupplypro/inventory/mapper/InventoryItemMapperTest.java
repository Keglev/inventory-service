package com.smartsupplypro.inventory.mapper;

import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.model.Supplier;

/**
 * Unit tests for {@link InventoryItemMapper}.
 *
 * <p><strong>Purpose</strong>: Validate mapping rules for inventory item DTO ↔ entity conversions,
 * including computed fields used by analytics and UI projections.</p>
 *
 * <p><strong>Operations Tested</strong>:</p>
 * <ul>
 *   <li>Null-safety boundaries (null in → null out)</li>
 *   <li>Total value computation (price × quantity) using BigDecimal precision</li>
 *   <li>Supplier relationship projection (supplierName)</li>
 *   <li>DTO → entity mapping excludes computed-only fields (totalValue, supplierName)</li>
 *   <li>Utility-class constructor guard (no instances)</li>
 * </ul>
 */
class InventoryItemMapperTest {

    @Test
    @DisplayName("toDTO: null input returns null")
    void toDTO_nullInput_returnsNull() {
        // GIVEN
        InventoryItem entity = null;

        // WHEN
        InventoryItemDTO dto = InventoryItemMapper.toDTO(entity);

        // THEN
        assertNull(dto);
    }

    @Test
    @DisplayName("toDTO: computes totalValue = price × quantity with BigDecimal precision")
    void toDTO_computesTotalValue() {
        // GIVEN
        InventoryItem entity = InventoryItem.builder()
                .id("item-1")
                .name("SSD")
                .quantity(3)
                .price(new BigDecimal("12.34"))
                .supplierId("sup-1")
                .minimumQuantity(1)
                .createdBy("admin")
                .createdAt(LocalDateTime.of(2026, 3, 1, 12, 0, 0))
                .build();

        // WHEN
        InventoryItemDTO dto = InventoryItemMapper.toDTO(entity);

        // THEN
        assertNotNull(dto);
        assertEquals(new BigDecimal("37.02"), dto.getTotalValue());
    }

    @Test
    @DisplayName("toDTO: null price yields BigDecimal.ZERO totalValue")
    void toDTO_nullPrice_yieldsZeroTotalValue() {
        // GIVEN
        InventoryItem entity = InventoryItem.builder()
                .id("item-2")
                .name("Cable")
                .quantity(10)
                .price(null)
                .supplierId("sup-1")
                .minimumQuantity(1)
                .createdBy("admin")
                .createdAt(LocalDateTime.of(2026, 3, 1, 12, 0, 0))
                .build();

        // WHEN
        InventoryItemDTO dto = InventoryItemMapper.toDTO(entity);

        // THEN
        assertNotNull(dto);
        assertEquals(BigDecimal.ZERO, dto.getTotalValue());
    }

    @Test
    @DisplayName("toDTO: supplier relationship populates supplierName")
    void toDTO_supplierPresent_populatesSupplierName() {
        // GIVEN
        Supplier supplier = Supplier.builder()
                .id("sup-9")
                .name("Acme")
                .contactName(null)
                .phone(null)
                .email(null)
                .createdBy("system")
                .createdAt(LocalDateTime.of(2026, 1, 1, 0, 0, 0))
                .build();

        InventoryItem entity = InventoryItem.builder()
                .id("item-3")
                .name("Widget")
                .quantity(1)
                .price(new BigDecimal("1.00"))
                .supplierId("sup-9")
                .supplier(supplier)
                .minimumQuantity(1)
                .createdBy("admin")
                .createdAt(LocalDateTime.of(2026, 3, 1, 12, 0, 0))
                .build();

        // WHEN
        InventoryItemDTO dto = InventoryItemMapper.toDTO(entity);

        // THEN
        assertNotNull(dto);
        assertEquals("Acme", dto.getSupplierName());
    }

    @Test
    @DisplayName("toEntity: null input returns null")
    void toEntity_nullInput_returnsNull() {
        // GIVEN
        InventoryItemDTO dto = null;

        // WHEN
        InventoryItem entity = InventoryItemMapper.toEntity(dto);

        // THEN
        assertNull(entity);
    }

    @Test
    @DisplayName("toEntity: maps persistence fields and ignores computed-only DTO fields")
    void toEntity_mapsFields_andIgnoresComputedFields() {
        // GIVEN
        InventoryItemDTO dto = InventoryItemDTO.builder()
                .id("item-9")
                .name("SSD")
                .quantity(7)
                .price(new BigDecimal("10.00"))
                .totalValue(new BigDecimal("999.99"))
                .supplierId("sup-1")
                .supplierName("Acme")
                .minimumQuantity(2)
                .createdBy("admin")
                .createdAt(LocalDateTime.of(2026, 3, 1, 12, 0, 0))
                .build();

        // WHEN
        InventoryItem entity = InventoryItemMapper.toEntity(dto);

        // THEN
        assertNotNull(entity);
        assertEquals("item-9", entity.getId());
        assertEquals("SSD", entity.getName());
        assertEquals(7, entity.getQuantity());
        assertEquals(new BigDecimal("10.00"), entity.getPrice());
        assertEquals("sup-1", entity.getSupplierId());
        assertEquals(2, entity.getMinimumQuantity());
        assertEquals("admin", entity.getCreatedBy());
        assertEquals(LocalDateTime.of(2026, 3, 1, 12, 0, 0), entity.getCreatedAt());

        // Entity has no totalValue/supplierName; they must not influence persistence mapping.
        assertNull(entity.getSupplier());
    }

    @Test
    @DisplayName("private calculateTotalValue: quantity null branch returns BigDecimal.ZERO")
    void calculateTotalValue_quantityNull_returnsZero() throws Exception {
        // GIVEN
        // This test intentionally uses reflection to exercise a private, branchy helper.
        // Rationale: the null-quantity branch is easy to miss via service/controller flows,
        // but we still want explicit coverage of the mapper's financial safety behavior.
        Method method = InventoryItemMapper.class.getDeclaredMethod("calculateTotalValue", BigDecimal.class, Integer.class);
        method.setAccessible(true);

        // WHEN
        BigDecimal result = (BigDecimal) method.invoke(null, new BigDecimal("10.00"), null);

        // THEN
        assertEquals(BigDecimal.ZERO, result);
    }

    @Test
    @DisplayName("constructor: utility class cannot be instantiated")
    void constructor_throwsUnsupportedOperationException() throws Exception {
        // GIVEN
        Constructor<InventoryItemMapper> ctor = InventoryItemMapper.class.getDeclaredConstructor();
        ctor.setAccessible(true);

        // WHEN
        InvocationTargetException ex = assertThrows(InvocationTargetException.class, ctor::newInstance);

        // THEN
        assertTrue(ex.getCause() instanceof UnsupportedOperationException);
        assertEquals("Utility class - no instances allowed", ex.getCause().getMessage());
    }
}
