package com.smartsupplypro.inventory.service.supplier;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.mockito.ArgumentCaptor;
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

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateAs(String username) {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new TestingAuthenticationToken(username, null));
        SecurityContextHolder.setContext(context);
    }

    @Test
    void should_persist_supplier_when_name_is_unique() {
        authenticateAs("carlos@example.com");

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

    /**
     * The client sends no createdBy — the UI never has — so the service must supply it
     * or the insert fails against a NOT NULL column.
     */
    @Test
    void should_attribute_creation_to_the_authenticated_user() {
        authenticateAs("carlos@example.com");

        SupplierDTO input = SupplierDTO.builder().name("Acme GmbH").build();

        when(supplierRepository.findByNameIgnoreCase("Acme GmbH")).thenReturn(Optional.empty());
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(inv -> inv.getArgument(0, Supplier.class));

        ArgumentCaptor<Supplier> captor = ArgumentCaptor.forClass(Supplier.class);
        supplierService.create(input);
        verify(supplierRepository).save(captor.capture());

        assertEquals("carlos@example.com", captor.getValue().getCreatedBy());
    }

    /**
     * A client-supplied value must not be trusted: attribution comes from the security
     * context, so a forged createdBy in the request body is discarded.
     */
    @Test
    void should_ignore_client_supplied_created_by() {
        authenticateAs("carlos@example.com");

        SupplierDTO input = SupplierDTO.builder()
                .name("Acme GmbH")
                .createdBy("someone.else@example.com")
                .build();

        when(supplierRepository.findByNameIgnoreCase("Acme GmbH")).thenReturn(Optional.empty());
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(inv -> inv.getArgument(0, Supplier.class));

        ArgumentCaptor<Supplier> captor = ArgumentCaptor.forClass(Supplier.class);
        supplierService.create(input);
        verify(supplierRepository).save(captor.capture());

        assertEquals("carlos@example.com", captor.getValue().getCreatedBy());
    }

    @Test
    void should_fall_back_to_system_when_unauthenticated() {
        SecurityContextHolder.clearContext();

        SupplierDTO input = SupplierDTO.builder().name("Acme GmbH").build();

        when(supplierRepository.findByNameIgnoreCase("Acme GmbH")).thenReturn(Optional.empty());
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(inv -> inv.getArgument(0, Supplier.class));

        ArgumentCaptor<Supplier> captor = ArgumentCaptor.forClass(Supplier.class);
        supplierService.create(input);
        verify(supplierRepository).save(captor.capture());

        assertEquals("system", captor.getValue().getCreatedBy());
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
