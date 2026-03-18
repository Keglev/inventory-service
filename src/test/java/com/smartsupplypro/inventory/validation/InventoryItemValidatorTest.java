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
 * Unit tests for {@link InventoryItemValidator}.
 *
 * <p><strong>Purpose</strong></p>
 * Validates the public, reusable business-rule guards in the validator layer. These tests
 * intentionally focus on the validator contract (exception types/messages and allowed inputs)
 * rather than any service/controller flow that happens to call into the validator.
 *
 * <p><strong>Operations Tested</strong></p>
 * <ul>
 *   <li>{@link InventoryItemValidator#validateBase(InventoryItemDTO)} core DTO input rules</li>
 *   <li>{@link InventoryItemValidator#validateInventoryItemNotExists(String, String, BigDecimal, InventoryItemRepository)}
 *       duplicate name+price detection for create/update</li>
 *   <li>{@link InventoryItemValidator#validateInventoryItemNotExists(String, BigDecimal, InventoryItemRepository)}
 *       simple uniqueness check used by update scenarios</li>
 *   <li>{@link InventoryItemValidator#assertQuantityIsZeroForDeletion(InventoryItem)} deletion precondition</li>
 * </ul>
 *
 * <p><strong>Design Notes</strong></p>
 * <ul>
 *   <li>Repository interactions are mocked; this suite isolates validator logic.</li>
 *   <li>Assertions on exception messages are limited to user-facing contract strings.</li>
 * </ul>
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
        // GIVEN: a complete DTO
        // WHEN/THEN: no validation exception is expected
        assertDoesNotThrow(() -> InventoryItemValidator.validateBase(validDTO()));
    }

    /**
     * Ensures that the base validation throws an {@link IllegalArgumentException}
     * when the product name is null.
     */
    @Test
    void testValidateBase_withNullName_shouldThrow() {
        // GIVEN: DTO with null name
        InventoryItemDTO dto = validDTO();
        dto.setName(null);

        // WHEN
        Exception e = assertThrows(IllegalArgumentException.class, () ->
                InventoryItemValidator.validateBase(dto));

        // THEN
        assertEquals("Product name cannot be null or empty", e.getMessage());
    }

    /**
     * Verifies that validation fails if the quantity is negative, throwing an appropriate exception.
     */
    @Test
    void testValidateBase_withNegativeQuantity_shouldThrow() {
        // GIVEN: DTO with negative quantity
        InventoryItemDTO dto = validDTO();
        dto.setQuantity(-1);

        // WHEN
        Exception e = assertThrows(IllegalArgumentException.class, () ->
                InventoryItemValidator.validateBase(dto));

        // THEN
        assertEquals("Quantity cannot be negative", e.getMessage());
    }

    /**
     * Ensures that a negative price value fails base validation with a clear error message.
     */
    @Test
    void testValidateBase_withNegativePrice_shouldThrow() {
        // GIVEN: DTO with negative price
        InventoryItemDTO dto = validDTO();
        dto.setPrice(new BigDecimal("-5.00"));

        // WHEN
        Exception e = assertThrows(IllegalArgumentException.class, () ->
                InventoryItemValidator.validateBase(dto));

        // THEN
        assertEquals("Price must be positive or greater than zero", e.getMessage());
    }

    /**
     * Verifies that an empty or blank supplier ID triggers validation failure as expected.
     * This ensures that all inventory items are associated with a valid supplier.
     */
    @Test
    void testValidateBase_withEmptySupplier_shouldThrow() {
        // GIVEN: DTO with blank supplier id
        InventoryItemDTO dto = validDTO();
        dto.setSupplierId(" ");

        // WHEN
        Exception e = assertThrows(IllegalArgumentException.class, () ->
                InventoryItemValidator.validateBase(dto));

        // THEN
        assertEquals("Supplier ID must be provided", e.getMessage());
    }

    /**
     * Ensures that attempting to add a duplicate item name triggers a validation exception.
     * This test mocks the repository to simulate a name conflict.
     */
    @Test
    void testValidateInventoryItemNotExists_withExistingNameAndPrice_shouldThrowException() {
        // GIVEN: existing inventory item (different id) with the same name+price
        InventoryItemRepository mockRepo = mock(InventoryItemRepository.class);

        InventoryItem existingItem = new InventoryItem();
        existingItem.setId("existing-id");
        existingItem.setName("DuplicateItem");
        existingItem.setPrice(new BigDecimal("10.00"));

        when(mockRepo.findByNameIgnoreCase("DuplicateItem")).thenReturn(List.of(existingItem));

        // WHEN
        Exception ex = assertThrows(DuplicateResourceException.class, () ->
            InventoryItemValidator.validateInventoryItemNotExists("new-id", "DuplicateItem", new BigDecimal("10.00"), mockRepo)
        );

        // THEN
        assertEquals("Another inventory item with this name and price already exists.", ex.getMessage());
    }


    /**
     * Confirms that a unique item name passes duplicate check validation without error.
     */
    @Test
    void testValidateInventoryItemNotExists_withUniqueNameAndPrice_shouldPass() {
        // GIVEN: repository indicates no existing row for name+price
        InventoryItemRepository mockRepo = mock(InventoryItemRepository.class);
        when(mockRepo.existsByNameAndPrice("UniqueItem", new BigDecimal("25.00"))).thenReturn(false);

        // WHEN/THEN
        assertDoesNotThrow(() ->
            InventoryItemValidator.validateInventoryItemNotExists("UniqueItem", new BigDecimal("25.00"), mockRepo)
        );
    }

    @Test
    void testValidateBase_withNullCreatedBy_shouldThrow() {
        // GIVEN: DTO without createdBy
        InventoryItemDTO dto = validDTO();
        dto.setCreatedBy(null);

        // WHEN
        Exception ex = assertThrows(IllegalArgumentException.class, () ->
            InventoryItemValidator.validateBase(dto)
        );

        // THEN
        assertEquals("CreatedBy must be provided", ex.getMessage());
    }

    /**
     * Verifies that an item with quantity greater than zero cannot be deleted.
     * This enforces the business rule that items must be fully depleted before deletion.
     */
    @Test
    void testAssertQuantityIsZeroForDeletion_withQuantityGreaterThanZero_shouldThrow() {
        // GIVEN: item still has stock
        InventoryItem item = new InventoryItem();
        item.setId("item-1");
        item.setName("Monitor");
        item.setQuantity(5);
        item.setPrice(new BigDecimal("199.99"));

        // WHEN
        Exception ex = assertThrows(IllegalStateException.class, () ->
            InventoryItemValidator.assertQuantityIsZeroForDeletion(item)
        );

        // THEN
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
        // GIVEN: item is depleted
        InventoryItem item = new InventoryItem();
        item.setId("item-1");
        item.setName("Monitor");
        item.setQuantity(0);
        item.setPrice(new BigDecimal("199.99"));

        // WHEN/THEN
        assertDoesNotThrow(() ->
            InventoryItemValidator.assertQuantityIsZeroForDeletion(item)
        );
    }

}
