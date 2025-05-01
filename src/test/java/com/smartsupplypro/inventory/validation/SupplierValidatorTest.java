package com.smartsupplypro.inventory.validation;

import com.smartsupplypro.inventory.repository.InventoryItemRepository;
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
}
