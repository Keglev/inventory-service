package com.smartsupplypro.inventory.validation;

import com.smartsupplypro.inventory.exception.DuplicateResourceException;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;

import org.springframework.test.context.ActiveProfiles;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ActiveProfiles("test")
public class SupplierValidatorTest {
    @Test
    void testValidateDeletable_withExistingInventory_shouldThrowException() {
        InventoryItemRepository mockRepo = mock(InventoryItemRepository.class);
        when(mockRepo.existsBySupplierId("supplier-1")).thenReturn(true);

        Exception ex = assertThrows(IllegalStateException.class, () ->
                SupplierValidator.validateDeletable("supplier-1", mockRepo));

        assertEquals("Cannot delete supplier with existing inventory items.", ex.getMessage());
    }

    @Test
    void testValidateDeletable_withNoInventory_shouldPass() {
        InventoryItemRepository mockRepo = mock(InventoryItemRepository.class);
        when(mockRepo.existsBySupplierId("supplier-1")).thenReturn(false);

        assertDoesNotThrow(() ->
                SupplierValidator.validateDeletable("supplier-1", mockRepo));
    }

    @Test
    void testValidateSupplierExists_withExistingName_shouldThrowException() {
        SupplierRepository mockRepo = mock(SupplierRepository.class);
        when(mockRepo.existsByNameIgnoreCase("duplicate-supplier")).thenReturn(true);

        Exception ex = assertThrows(DuplicateResourceException.class, () ->
                SupplierValidator.validateSupplierExists("duplicate-supplier", mockRepo));

        assertEquals("A Supplier with this name already exists.", ex.getMessage());
    }

    @Test
    void testValidateSupplierExists_withUniqueName_shouldPass() {
        SupplierRepository mockRepo = mock(SupplierRepository.class);
        when(mockRepo.existsByNameIgnoreCase("unique-supplier")).thenReturn(false);

        assertDoesNotThrow(() ->
                SupplierValidator.validateSupplierExists("unique-supplier", mockRepo));
    }

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

}
