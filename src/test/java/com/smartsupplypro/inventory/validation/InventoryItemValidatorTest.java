package com.smartsupplypro.inventory.validation;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.exception.DuplicateResourceException;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;

/**
 * Unit tests for {@link InventoryItemValidator}, verifying validation logic for
 * inventory item creation and duplicate name checks. Includes both positive and
 * negative scenarios to ensure robust validation.
 */
@SuppressWarnings("unused")
@ActiveProfiles("test")
public class InventoryItemValidatorTest {

    /**
     * Helper method to generate a valid {@link InventoryItemDTO} instance for testing.
     *
     * @return a DTO with all required fields properly set.
     */
    private InventoryItemDTO validDTO() {
        return InventoryItemDTO.builder()
                .id("item-1")
                .name("Monitor")
                .quantity(10)
                .price(new BigDecimal("199.99"))
                .supplierId("supplier-1")
                .createdBy("admin")
                .build();
    }

    /**
     * Verifies that a fully valid inventory item passes base validation without exception.
     */
    @Test
    void testValidateBase_withValidInput_shouldPass() {
        assertDoesNotThrow(() -> InventoryItemValidator.validateBase(validDTO()));
    }

    /**
     * Ensures that the base validation throws an {@link IllegalArgumentException}
     * when the product name is null.
     */
    @Test
    void testValidateBase_withNullName_shouldThrow() {
        InventoryItemDTO dto = validDTO();
        dto.setName(null);

        Exception e = assertThrows(IllegalArgumentException.class, () ->
                InventoryItemValidator.validateBase(dto));

        assertEquals("Product name cannot be null or empty", e.getMessage());
    }

    /**
     * Verifies that validation fails if the quantity is negative, throwing an appropriate exception.
     */
    @Test
    void testValidateBase_withNegativeQuantity_shouldThrow() {
        InventoryItemDTO dto = validDTO();
        dto.setQuantity(-1);

        Exception e = assertThrows(IllegalArgumentException.class, () ->
                InventoryItemValidator.validateBase(dto));

        assertEquals("Quantity cannot be negative", e.getMessage());
    }

    /**
     * Ensures that a negative price value fails base validation with a clear error message.
     */
    @Test
    void testValidateBase_withNegativePrice_shouldThrow() {
        InventoryItemDTO dto = validDTO();
        dto.setPrice(new BigDecimal("-5.00"));

        Exception e = assertThrows(IllegalArgumentException.class, () ->
                InventoryItemValidator.validateBase(dto));

        assertEquals("Price must be positive or greater than zero", e.getMessage());
    }

    /**
     * Verifies that an empty or blank supplier ID triggers validation failure as expected.
     */
    @Test
    void testValidateBase_withEmptySupplier_shouldThrow() {
        InventoryItemDTO dto = validDTO();
        dto.setSupplierId(" ");

        Exception e = assertThrows(IllegalArgumentException.class, () ->
                InventoryItemValidator.validateBase(dto));

        assertEquals("Supplier ID must be provided", e.getMessage());
    }

    /**
     * Ensures that attempting to add a duplicate item name triggers a validation exception.
     * This test mocks the repository to simulate a name conflict.
     */
    @Test
    void testValidateInventoryItemNotExists_withExistingNameAndPrice_shouldThrowException() {
        InventoryItemRepository mockRepo = mock(InventoryItemRepository.class);

        // Simulate existing item with same name and price, but different ID
        InventoryItem existingItem = new InventoryItem();
        existingItem.setId("existing-id");
        existingItem.setName("DuplicateItem");
        existingItem.setPrice(new BigDecimal("10.00"));

        when(mockRepo.findByNameIgnoreCase("DuplicateItem")).thenReturn(List.of(existingItem));

        Exception ex = assertThrows(DuplicateResourceException.class, () ->
            InventoryItemValidator.validateInventoryItemNotExists("new-id", "DuplicateItem", new BigDecimal("10.00"), mockRepo)
        );

        assertEquals("Another inventory item with this name and price already exists.", ex.getMessage());
    }


    /**
     * Confirms that a unique item name passes duplicate check validation without error.
     */
    @Test
    void testValidateInventoryItemNotExists_withUniqueNameAndPrice_shouldPass() {
        InventoryItemRepository mockRepo = mock(InventoryItemRepository.class);
        when(mockRepo.existsByNameAndPrice("UniqueItem", new BigDecimal("25.00"))).thenReturn(false);

        assertDoesNotThrow(() ->
            InventoryItemValidator.validateInventoryItemNotExists("UniqueItem", new BigDecimal("25.00"), mockRepo)
        );
    }

    @Test
    void testValidateBase_withNullCreatedBy_shouldThrow() {
        InventoryItemDTO dto = validDTO();
        dto.setCreatedBy(null);

        Exception ex = assertThrows(IllegalArgumentException.class, () ->
            InventoryItemValidator.validateBase(dto)
        );

        assertEquals("CreatedBy must be provided", ex.getMessage());
    }

    /**
     * Verifies that an item with quantity greater than zero cannot be deleted.
     * This enforces the business rule that items must be fully depleted before deletion.
     */
    @Test
    void testAssertQuantityIsZeroForDeletion_withQuantityGreaterThanZero_shouldThrow() {
        InventoryItem item = new InventoryItem();
        item.setId("item-1");
        item.setName("Monitor");
        item.setQuantity(5);  // Non-zero quantity
        item.setPrice(new BigDecimal("199.99"));

        Exception ex = assertThrows(IllegalStateException.class, () ->
            InventoryItemValidator.assertQuantityIsZeroForDeletion(item)
        );

        assertEquals(
            "You still have merchandise in stock. " +
            "You need to first remove items from stock by changing quantity.",
            ex.getMessage()
        );
    }

    /**
     * Confirms that an item with zero quantity passes deletion validation without error.
     */
    @Test
    void testAssertQuantityIsZeroForDeletion_withQuantityZero_shouldPass() {
        InventoryItem item = new InventoryItem();
        item.setId("item-1");
        item.setName("Monitor");
        item.setQuantity(0);  // Zero quantity - allowed for deletion
        item.setPrice(new BigDecimal("199.99"));

        assertDoesNotThrow(() ->
            InventoryItemValidator.assertQuantityIsZeroForDeletion(item)
        );
    }

}
