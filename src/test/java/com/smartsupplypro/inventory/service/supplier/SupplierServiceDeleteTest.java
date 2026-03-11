package com.smartsupplypro.inventory.service.supplier;

import java.util.NoSuchElementException;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link com.smartsupplypro.inventory.service.impl.SupplierServiceImpl} delete flows.
 *
 * <p><strong>Business Rules</strong>:</p>
 * <ul>
 *   <li>Suppliers with linked inventory (active stock) cannot be deleted</li>
 *   <li>Deleting a missing supplier yields {@link NoSuchElementException}</li>
 *   <li>Happy path delegates to repository deleteById</li>
 * </ul>
 */
@SuppressWarnings("unused")
class SupplierServiceDeleteTest extends SupplierServiceTestBase {

    /**
     * Validates that suppliers with linked inventory items cannot be deleted.
     * Scenario: Supplier has at least one inventory item with quantity > 0.
     * Expected: {@link IllegalStateException} (409) blocking the deletion.
     */
    @Test
    void delete_shouldThrow409_whenAnyLinkedItemHasQuantity_gt_0() {
        // GIVEN
        String id = "sup-1";
        when(inventoryItemRepository.existsActiveStockForSupplier(eq(id), eq(0))).thenReturn(true);

        // WHEN/THEN
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> supplierService.delete(id));
        assertTrue(ex.getMessage().toLowerCase().contains("cannot delete"),
                "Expected business conflict message");
        verify(supplierRepository, never()).deleteById(any());
    }

    /**
     * Validates that deleting a non-existent supplier fails with 404.
     * Scenario: Attempting to delete supplier ID that does not exist.
     * Precondition: No linked items exist for this supplier (passes the link check).
     * Expected: {@link NoSuchElementException} and no deletion.
     */
    @Test
    void delete_shouldThrow404_whenSupplierMissing() {
        // GIVEN
        String id = "missing";
        when(inventoryItemRepository.existsActiveStockForSupplier(eq(id), eq(0))).thenReturn(false);
        when(supplierRepository.existsById(id)).thenReturn(false);

        // WHEN/THEN
        NoSuchElementException ex = assertThrows(NoSuchElementException.class, () -> supplierService.delete(id));
        assertTrue(ex.getMessage().contains("Supplier not found"));
        verify(supplierRepository, never()).deleteById(any());
    }

    /**
     * Validates the happy path: supplier with no linked items can be deleted.
     * Scenario: Supplier exists and has no inventory items linked to it.
     * Expected: Deletion succeeds and repository deleteById is called.
     */
    @Test
    void delete_shouldSucceed_whenNoActiveLinks_andExists() {
        // GIVEN
        String id = "sup-1";
        when(inventoryItemRepository.existsActiveStockForSupplier(eq(id), eq(0))).thenReturn(false);
        when(supplierRepository.existsById(id)).thenReturn(true);

        // WHEN
        supplierService.delete(id);

        // THEN
        verify(supplierRepository).deleteById(id);
    }
}
