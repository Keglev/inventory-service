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
 * Unit tests for {@link com.smartsupplypro.inventory.service.impl.SupplierServiceImpl} update flows.
 *
 * <p><strong>Coverage</strong>:</p>
 * <ul>
 *   <li>Update happy path (existing supplier, unique name)</li>
 *   <li>Update not-found ({@link NoSuchElementException})</li>
 *   <li>Update rename to existing name ({@link DuplicateResourceException})</li>
 * </ul>
 */
@SuppressWarnings("unused")
class SupplierServiceUpdateTest extends SupplierServiceTestBase {

    /**
     * Validates that supplier fields are successfully updated when record exists and name is unique.
     * Scenario: Modifying an existing supplier with a new, non-conflicting name.
     * Expected: All fields updated and persisted via repository.
     */
    @Test
    void update_shouldModifyFields_whenExistsAndUnique() {
        // GIVEN
        String id = "sup-1";
        Supplier existing = Supplier.builder()
                .id(id)
                .name("Old")
                .contactName("Old C")
                .phone("111")
                .email("old@test")
                .createdAt(LocalDateTime.now().minusDays(1))
                .build();

        SupplierDTO patch = SupplierDTO.builder()
                .name("New")
                .contactName("New C")
                .phone("222")
                .email("new@test")
                .build();

        when(supplierRepository.findById(id)).thenReturn(Optional.of(existing));
        when(supplierRepository.findByNameIgnoreCase("New")).thenReturn(Optional.empty());
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(inv -> inv.getArgument(0));

        // WHEN
        SupplierDTO updated = supplierService.update(id, patch);

        // THEN
        assertEquals("New", updated.getName());
        assertEquals("New C", updated.getContactName());
        assertEquals("222", updated.getPhone());
        assertEquals("new@test", updated.getEmail());
        verify(supplierRepository).save(any(Supplier.class));
    }

    /**
     * Validates that updating a non-existent supplier fails with 404.
     * Scenario: Attempting update on supplier ID that does not exist.
     * Expected: {@link NoSuchElementException} and no save operation.
     */
    @Test
    void update_shouldThrow404_whenNotFound() {
        // GIVEN
        when(supplierRepository.findById("missing")).thenReturn(Optional.empty());

        // WHEN/THEN
        NoSuchElementException ex = assertThrows(NoSuchElementException.class,
                () -> supplierService.update("missing", SupplierDTO.builder().name("X").build()));
        assertTrue(ex.getMessage().contains("Supplier not found"));
        verify(supplierRepository, never()).save(any());
    }

    /**
     * Validates that renaming a supplier to an existing name is rejected.
     * Scenario: Supplier "sup-1" attempts to rename to "Taken", which is owned by "other-id".
     * Expected: {@link DuplicateResourceException} (409) and no save operation.
     */
    @Test
    void update_shouldThrow409_whenRenamingToExistingName() {
        // GIVEN
        String id = "sup-1";
        Supplier existing = Supplier.builder().id(id).name("Old").build();

        when(supplierRepository.findById(id)).thenReturn(Optional.of(existing));
        when(supplierRepository.findByNameIgnoreCase("Taken"))
                .thenReturn(Optional.of(Supplier.builder().id("other-id").name("Taken").build()));

        // WHEN/THEN
        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class,
                () -> supplierService.update(id, SupplierDTO.builder().name("Taken").build()));
        assertEquals("Supplier already exists", ex.getMessage());
        verify(supplierRepository, never()).save(any());
    }
}
