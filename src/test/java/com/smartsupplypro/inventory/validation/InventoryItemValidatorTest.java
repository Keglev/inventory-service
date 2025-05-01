package com.smartsupplypro.inventory.validation;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import org.springframework.test.context.ActiveProfiles;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@ActiveProfiles("test")
public class InventoryItemValidatorTest {
    private InventoryItemDTO validDTO() {
        return InventoryItemDTO.builder()
                .id("item-1")
                .name("Monitor")
                .quantity(10)
                .price(new BigDecimal("199.99"))
                .supplierId("supplier-1")
                .build();
    }

    @Test
    void testValidateBase_withValidInput_shouldPass() {
        assertDoesNotThrow(() -> InventoryItemValidator.validateBase(validDTO()));
    }

    @Test
    void testValidateBase_withNullName_shouldThrow() {
        InventoryItemDTO dto = validDTO();
        dto.setName(null);
        Exception e = assertThrows(IllegalArgumentException.class, () ->
                InventoryItemValidator.validateBase(dto));
        assertEquals("Product name cannot be null or empty", e.getMessage());
    }

    @Test
    void testValidateBase_withNegativeQuantity_shouldThrow() {
        InventoryItemDTO dto = validDTO();
        dto.setQuantity(-1);
        Exception e = assertThrows(IllegalArgumentException.class, () ->
                InventoryItemValidator.validateBase(dto));
        assertEquals("Quantity cannot be negative", e.getMessage());
    }

    @Test
    void testValidateBase_withNegativePrice_shouldThrow() {
        InventoryItemDTO dto = validDTO();
        dto.setPrice(new BigDecimal("-5.00"));
        Exception e = assertThrows(IllegalArgumentException.class, () ->
                InventoryItemValidator.validateBase(dto));
        assertEquals("Price must be positive", e.getMessage());
    }

    @Test
    void testValidateBase_withEmptySupplier_shouldThrow() {
        InventoryItemDTO dto = validDTO();
        dto.setSupplierId(" ");
        Exception e = assertThrows(IllegalArgumentException.class, () ->
                InventoryItemValidator.validateBase(dto));
        assertEquals("Supplier ID must be provided", e.getMessage());
    }
}
