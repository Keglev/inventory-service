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
 * Unit tests for {@link com.smartsupplypro.inventory.service.impl.SupplierServiceImpl}
 * supplier deletion including linked-item and not-found guards.
 */
class SupplierServiceDeleteTest extends SupplierServiceTestBase {

    @Test
    void should_throw_illegal_state_when_supplier_has_active_stock() {
        String id = "sup-1";
        when(inventoryItemRepository.existsActiveStockForSupplier(eq(id), eq(0))).thenReturn(true);

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> supplierService.delete(id));
        assertTrue(ex.getMessage().toLowerCase().contains("cannot delete"));
        verify(supplierRepository, never()).deleteById(any());
    }

    @Test
    void should_throw_not_found_when_supplier_does_not_exist() {
        String id = "missing";
        when(inventoryItemRepository.existsActiveStockForSupplier(eq(id), eq(0))).thenReturn(false);
        when(supplierRepository.existsById(id)).thenReturn(false);

        NoSuchElementException ex = assertThrows(NoSuchElementException.class,
                () -> supplierService.delete(id));
        assertTrue(ex.getMessage().contains("Supplier not found"));
        verify(supplierRepository, never()).deleteById(any());
    }

    @Test
    void should_delete_supplier_when_no_active_links_and_exists() {
        String id = "sup-1";
        when(inventoryItemRepository.existsActiveStockForSupplier(eq(id), eq(0))).thenReturn(false);
        when(supplierRepository.existsById(id)).thenReturn(true);

        supplierService.delete(id);

        verify(supplierRepository).deleteById(id);
    }
}
