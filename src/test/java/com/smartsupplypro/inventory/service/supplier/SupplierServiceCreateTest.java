package com.smartsupplypro.inventory.service.supplier;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.exception.DuplicateResourceException;
import com.smartsupplypro.inventory.model.Supplier;

/**
 * Unit tests for {@link com.smartsupplypro.inventory.service.impl.SupplierServiceImpl} create flows.
 *
 * <p><strong>Coverage</strong>:</p>
 * <ul>
 *   <li>Unique-name persistence (happy path)</li>
 *   <li>Duplicate-name rejection ({@link DuplicateResourceException})</li>
 * </ul>
 */
@SuppressWarnings("unused")
class SupplierServiceCreateTest extends SupplierServiceTestBase {

    /**
     * Validates that a supplier with a unique name is successfully persisted.
     * Scenario: Creating new supplier when no existing supplier has the same name.
     * Expected: Supplier saved with generated ID and creation timestamp.
     */
    @Test
    void create_shouldPersist_whenNameUnique() {
        // GIVEN
        SupplierDTO input = SupplierDTO.builder()
                .name("Acme GmbH")
                .contactName("Alice")
                .phone("+49-123")
                .email("alice@acme.test")
                .build();

        when(supplierRepository.findByNameIgnoreCase("Acme GmbH")).thenReturn(Optional.empty());

        when(supplierRepository.save(any(Supplier.class))).thenAnswer(inv -> {
            Supplier s = inv.getArgument(0, Supplier.class);
            s.setId(UUID.randomUUID().toString());
            s.setCreatedAt(LocalDateTime.now());
            return s;
        });

        // WHEN
        SupplierDTO created = supplierService.create(input);

        // THEN
        assertNotNull(created.getId(), "id should be generated");
        assertEquals("Acme GmbH", created.getName());
        verify(supplierRepository).save(any(Supplier.class));
    }

    /**
     * Validates that duplicate supplier names are rejected.
     * Scenario: Attempting to create a supplier when name already exists.
     * Expected: {@link DuplicateResourceException} (409) and no save operation.
     */
    @Test
    void create_shouldThrow409_whenNameDuplicate() {
        // GIVEN
        SupplierDTO input = SupplierDTO.builder().name("DupName").build();
        when(supplierRepository.findByNameIgnoreCase("DupName"))
                .thenReturn(Optional.of(Supplier.builder().id("sup-1").name("DupName").build()));

        // WHEN/THEN
        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class,
                () -> supplierService.create(input));
        assertEquals("Supplier already exists", ex.getMessage());
        verify(supplierRepository, never()).save(any());
    }
}
