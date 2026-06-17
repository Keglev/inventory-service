package com.smartsupplypro.inventory.service.supplier;

import java.time.LocalDateTime;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.exception.DuplicateResourceException;
import com.smartsupplypro.inventory.model.Supplier;

/**
 * Unit tests for {@link com.smartsupplypro.inventory.service.impl.SupplierServiceImpl}
 * supplier update including not-found and duplicate-name guards.
 */
class SupplierServiceUpdateTest extends SupplierServiceTestBase {

    @Test
    void should_update_supplier_fields_when_supplier_exists_and_name_is_unique() {
        String id = "sup-1";
        Supplier existing = Supplier.builder()
                .id(id).name("Old").contactName("Old C")
                .phone("111").email("old@test")
                .createdAt(LocalDateTime.now().minusDays(1))
                .build();
        SupplierDTO patch = SupplierDTO.builder()
                .name("New").contactName("New C").phone("222").email("new@test")
                .build();

        when(supplierRepository.findById(id)).thenReturn(Optional.of(existing));
        when(supplierRepository.findByNameIgnoreCase("New")).thenReturn(Optional.empty());
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(inv -> inv.getArgument(0));

        SupplierDTO updated = supplierService.update(id, patch);

        assertEquals("New", updated.getName());
        assertEquals("New C", updated.getContactName());
        assertEquals("222", updated.getPhone());
        assertEquals("new@test", updated.getEmail());
        verify(supplierRepository).save(any(Supplier.class));
    }

    @Test
    void should_throw_not_found_when_supplier_does_not_exist() {
        when(supplierRepository.findById("missing")).thenReturn(Optional.empty());

        NoSuchElementException ex = assertThrows(NoSuchElementException.class,
                () -> supplierService.update("missing", SupplierDTO.builder().name("X").build()));
        assertTrue(ex.getMessage().contains("Supplier not found"));
        verify(supplierRepository, never()).save(any());
    }

    @Test
    void should_throw_duplicate_exception_when_renaming_to_existing_name() {
        String id = "sup-1";
        Supplier existing = Supplier.builder().id(id).name("Old").build();

        when(supplierRepository.findById(id)).thenReturn(Optional.of(existing));
        when(supplierRepository.findByNameIgnoreCase("Taken"))
                .thenReturn(Optional.of(Supplier.builder().id("other-id").name("Taken").build()));

        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class,
                () -> supplierService.update(id, SupplierDTO.builder().name("Taken").build()));
        assertEquals("Supplier already exists", ex.getMessage());
        verify(supplierRepository, never()).save(any());
    }
}
