package com.smartsupplypro.inventory.validation;

import com.smartsupplypro.inventory.exception.DuplicateResourceException;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import com.smartsupplypro.inventory.dto.SupplierDTO;

import org.springframework.test.context.ActiveProfiles;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link SupplierValidator}, verifying business rule enforcement and
 * input validation for supplier-related operations, such as creation, update, and deletion.
 * Covers all relevant edge cases including missing input, duplicate names, and deletion constraints.
 */
@ActiveProfiles("test")
public class SupplierValidatorTest {

    /**
     * Ensures that deletion is blocked when inventory items are associated with the supplier.
     */
    @Test
    void testValidateDeletable_withExistingInventory_shouldThrowException() {
        InventoryItemRepository mockRepo = mock(InventoryItemRepository.class);
        when(mockRepo.existsBySupplierId("supplier-1")).thenReturn(true);

        Exception ex = assertThrows(IllegalStateException.class, () ->
                SupplierValidator.validateDeletable("supplier-1", mockRepo));

        assertEquals("Cannot delete supplier with existing inventory items.", ex.getMessage());
    }

    /**
     * Verifies that deletion is allowed when no inventory items are linked to the supplier.
     */
    @Test
    void testValidateDeletable_withNoInventory_shouldPass() {
        InventoryItemRepository mockRepo = mock(InventoryItemRepository.class);
        when(mockRepo.existsBySupplierId("supplier-1")).thenReturn(false);

        assertDoesNotThrow(() ->
                SupplierValidator.validateDeletable("supplier-1", mockRepo));
    }

    /**
     * Confirms that trying to create a supplier with an existing name triggers a {@link DuplicateResourceException}.
     */
    @Test
    void testValidateSupplierExists_withExistingName_shouldThrowException() {
        SupplierRepository mockRepo = mock(SupplierRepository.class);
        when(mockRepo.existsByNameIgnoreCase("duplicate-supplier")).thenReturn(true);

        Exception ex = assertThrows(DuplicateResourceException.class, () ->
                SupplierValidator.validateSupplierExists("duplicate-supplier", mockRepo));

        assertEquals("A Supplier with this name already exists.", ex.getMessage());
    }

    /**
     * Ensures that validation passes when the supplier name is unique.
     */
    @Test
    void testValidateSupplierExists_withUniqueName_shouldPass() {
        SupplierRepository mockRepo = mock(SupplierRepository.class);
        when(mockRepo.existsByNameIgnoreCase("unique-supplier")).thenReturn(false);

        assertDoesNotThrow(() ->
                SupplierValidator.validateSupplierExists("unique-supplier", mockRepo));
    }

    /**
     * Verifies that null or blank supplier names are rejected during duplicate name validation.
     */
    @Test
    void testValidateSupplierExists_withNullOrBlankName_shouldThrow() {
        SupplierRepository mockRepo = mock(SupplierRepository.class);

        Exception ex1 = assertThrows(IllegalArgumentException.class, () ->
                SupplierValidator.validateSupplierExists(null, mockRepo));
        assertEquals("Supplier name cannot be null or empty", ex1.getMessage());

        Exception ex2 = assertThrows(IllegalArgumentException.class, () ->
                SupplierValidator.validateSupplierExists(" ", mockRepo));
        assertEquals("Supplier name cannot be null or empty", ex2.getMessage());
    }

    /**
     * Ensures that supplier creation fails when the `name` field is null or blank.
     */
    @Test
    void testValidateBase_withMissingName_shouldThrow() {
        SupplierDTO dto = SupplierDTO.builder()
                .name("  ")
                .createdBy("admin")
                .build();

        Exception ex = assertThrows(IllegalArgumentException.class, () ->
                SupplierValidator.validateBase(dto));

        assertEquals("Supplier name must be provided.", ex.getMessage());
    }

    /**
     * Ensures that supplier creation fails when the `createdBy` field is missing.
     */
    @Test
    void testValidateBase_withMissingCreatedBy_shouldThrow() {
        SupplierDTO dto = SupplierDTO.builder()
                .name("Test Supplier")
                .createdBy(null)
                .build();

        Exception ex = assertThrows(IllegalArgumentException.class, () ->
                SupplierValidator.validateBase(dto));

        assertEquals("CreatedBy must be provided.", ex.getMessage());
    }

    /**
     * Validates that a complete and valid SupplierDTO passes base validation successfully.
     */
    @Test
    void testValidateBase_withValidDTO_shouldPass() {
        SupplierDTO dto = SupplierDTO.builder()
                .name("Valid Supplier")
                .createdBy("admin")
                .build();

        assertDoesNotThrow(() -> SupplierValidator.validateBase(dto));
    }
}
