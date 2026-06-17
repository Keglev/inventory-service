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
 * Unit tests for {@link com.smartsupplypro.inventory.service.impl.SupplierServiceImpl}
 * supplier creation including uniqueness validation.
 */
class SupplierServiceCreateTest extends SupplierServiceTestBase {

    @Test
    void should_persist_supplier_when_name_is_unique() {
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

        SupplierDTO created = supplierService.create(input);

        assertNotNull(created.getId());
        assertEquals("Acme GmbH", created.getName());
        verify(supplierRepository).save(any(Supplier.class));
    }

    @Test
    void should_throw_duplicate_exception_when_name_already_exists() {
        SupplierDTO input = SupplierDTO.builder().name("DupName").build();
        when(supplierRepository.findByNameIgnoreCase("DupName"))
                .thenReturn(Optional.of(Supplier.builder().id("sup-1").name("DupName").build()));

        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class,
                () -> supplierService.create(input));
        assertEquals("Supplier already exists", ex.getMessage());
        verify(supplierRepository, never()).save(any());
    }
}
