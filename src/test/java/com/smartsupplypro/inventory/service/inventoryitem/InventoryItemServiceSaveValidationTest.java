package com.smartsupplypro.inventory.service.inventoryitem;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import static org.mockito.Mockito.when;

import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.mapper.InventoryItemMapper;

/**
 * Validation-focused save tests for {@link com.smartsupplypro.inventory.service.impl.InventoryItemServiceImpl}.
 *
 * <p><strong>Coverage</strong>:</p>
 * <ul>
 *   <li>Null/blank name rejected</li>
 *   <li>Negative quantity rejected</li>
 *   <li>Non-positive price rejected</li>
 *   <li>Missing/invalid supplier rejected</li>
 *   <li>createdBy derived from OAuth2 context when missing</li>
 * </ul>
 */
@SuppressWarnings("unused")
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class InventoryItemServiceSaveValidationTest extends InventoryItemServiceSaveTestBase {

    /**
     * Validates that null product name is rejected.
     * Scenario: Item name is null.
     * Expected: {@link IllegalArgumentException} with descriptive message.
     */
    @Test
    void save_withNullName_shouldThrowException() {
        // GIVEN
        authenticateAs("admin", "ROLE_ADMIN");
        dto.setName(null);

        // WHEN/THEN
        Exception ex = assertThrows(IllegalArgumentException.class, () -> inventoryItemService.save(dto));
        assertEquals("Product name cannot be null or empty", ex.getMessage());
    }

    /**
     * Validates that negative quantities are rejected.
     * Scenario: Item quantity is negative (invalid state).
     * Expected: {@link IllegalArgumentException}.
     */
    @Test
    void save_withNegativeQuantity_shouldThrowException() {
        // GIVEN
        authenticateAs("admin", "ROLE_ADMIN");
        dto.setQuantity(-5);

        // WHEN/THEN
        Exception ex = assertThrows(IllegalArgumentException.class, () -> inventoryItemService.save(dto));
        assertEquals("Quantity cannot be negative", ex.getMessage());
    }

    /**
     * Validates that non-positive prices are rejected.
     * Scenario: Item price is negative (invalid cost).
     * Expected: {@link IllegalArgumentException}.
     */
    @Test
    void save_withNegativePrice_shouldThrowException() {
        // GIVEN
        authenticateAs("admin", "ROLE_ADMIN");
        dto.setPrice(new BigDecimal("-10.00"));

        // WHEN/THEN
        Exception ex = assertThrows(IllegalArgumentException.class, () -> inventoryItemService.save(dto));
        assertEquals("Price must be positive or greater than zero", ex.getMessage());
    }

    /**
     * Validates that missing supplier ID is rejected.
     * Scenario: Supplier ID is null (no supplier linked).
     * Expected: {@link IllegalArgumentException}.
     */
    @Test
    void save_withNullSupplierId_shouldThrowException() {
        // GIVEN
        authenticateAs("admin", "ROLE_ADMIN");
        dto.setSupplierId(null);

        // WHEN/THEN
        Exception ex = assertThrows(IllegalArgumentException.class, () -> inventoryItemService.save(dto));
        assertEquals("Supplier ID must be provided", ex.getMessage());
    }

    /**
     * Validates that non-existent supplier is rejected.
     * Scenario: Supplier ID exists in request but supplier does not exist in repository.
     * Expected: {@link IllegalArgumentException}.
     */
    @Test
    void save_withNonExistingSupplier_shouldThrow() {
        // GIVEN
        authenticateAs("admin", "ROLE_ADMIN");
        when(supplierRepository.existsById("invalid-supplier")).thenReturn(false);

        InventoryItemDTO invalidDto = InventoryItemMapper.toDTO(entity);
        invalidDto.setSupplierId("invalid-supplier");

        // WHEN/THEN
        Exception e = assertThrows(IllegalArgumentException.class, () -> inventoryItemService.save(invalidDto));
        assertEquals("Supplier does not exist", e.getMessage());
    }

    /**
     * Validates that missing createdBy is derived from OAuth2 context.
     * Scenario: createdBy not provided in DTO; should be populated from authentication.
     * Expected: Item saved with email from OAuth2 principal as createdBy.
     */
    @Test
    void save_withEmptyCreatedBy_shouldSucceed() {
        // GIVEN
        authenticateAs("admin", "ROLE_ADMIN");
        dto.setCreatedBy(null);

        // WHEN
        InventoryItemDTO result = inventoryItemService.save(dto);

        // THEN
        assertNotNull(result);
        assertEquals("admin", result.getCreatedBy());
    }
}
