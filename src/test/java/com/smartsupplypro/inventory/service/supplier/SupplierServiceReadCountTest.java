package com.smartsupplypro.inventory.service.supplier;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.model.Supplier;

/**
 * Unit tests for {@link com.smartsupplypro.inventory.service.impl.SupplierServiceImpl} read/query flows.
 *
 * <p><strong>Coverage</strong>:</p>
 * <ul>
 *   <li>{@link SupplierService#findAll()}</li>
 *   <li>{@link SupplierService#findById(String)}</li>
 *   <li>{@link SupplierService#findByName(String)}</li>
 *   <li>{@link SupplierService#countSuppliers()}</li>
 * </ul>
 */
@SuppressWarnings("unused")
class SupplierServiceReadCountTest extends SupplierServiceTestBase {

    @Test
    void findAll_shouldMapEntitiesToDtos() {
        // GIVEN
        Supplier s1 = Supplier.builder()
                .id("sup-1")
                .name("Acme GmbH")
                .contactName("Alice")
                .phone("111")
                .email("alice@acme.test")
                .createdBy("admin")
                .createdAt(LocalDateTime.now().minusDays(1))
                .build();

        Supplier s2 = Supplier.builder()
                .id("sup-2")
                .name("Globex")
                .contactName("Bob")
                .phone("222")
                .email("bob@globex.test")
                .createdBy("admin")
                .createdAt(LocalDateTime.now().minusHours(2))
                .build();

        when(supplierRepository.findAll()).thenReturn(List.of(s1, s2));

        // WHEN
        List<SupplierDTO> result = supplierService.findAll();

        // THEN
        assertEquals(2, result.size());
        assertEquals("sup-1", result.get(0).getId());
        assertEquals("Acme GmbH", result.get(0).getName());
        assertEquals("sup-2", result.get(1).getId());
        assertEquals("Globex", result.get(1).getName());
        verify(supplierRepository).findAll();
    }

    @Test
    void findById_shouldReturnMappedOptional_whenFound() {
        // GIVEN
        Supplier entity = Supplier.builder()
                .id("sup-1")
                .name("Acme GmbH")
                .contactName("Alice")
                .phone("111")
                .email("alice@acme.test")
                .createdBy("admin")
                .createdAt(LocalDateTime.now().minusDays(1))
                .build();
        when(supplierRepository.findById("sup-1")).thenReturn(Optional.of(entity));

        // WHEN
        Optional<SupplierDTO> result = supplierService.findById("sup-1");

        // THEN
        assertTrue(result.isPresent());
        assertEquals("sup-1", result.get().getId());
        assertEquals("Acme GmbH", result.get().getName());
        verify(supplierRepository).findById("sup-1");
    }

    @Test
    void findById_shouldReturnEmpty_whenNotFound() {
        // GIVEN
        when(supplierRepository.findById("missing")).thenReturn(Optional.empty());

        // WHEN/THEN
        assertTrue(supplierService.findById("missing").isEmpty());
        verify(supplierRepository).findById("missing");
    }

    @Test
    void findByName_shouldDelegateToRepository_andMapDtos() {
        // GIVEN
        Supplier s1 = Supplier.builder()
                .id("sup-1")
                .name("Acme GmbH")
                .createdBy("admin")
                .createdAt(LocalDateTime.now().minusDays(1))
                .build();
        when(supplierRepository.findByNameContainingIgnoreCase("ac")).thenReturn(List.of(s1));

        // WHEN
        List<SupplierDTO> result = supplierService.findByName("ac");

        // THEN
        assertEquals(1, result.size());
        assertEquals("sup-1", result.get(0).getId());
        assertEquals("Acme GmbH", result.get(0).getName());
        verify(supplierRepository).findByNameContainingIgnoreCase("ac");
    }

    @Test
    void countSuppliers_shouldDelegateToRepositoryCount() {
        // GIVEN
        when(supplierRepository.count()).thenReturn(42L);

        // WHEN/THEN
        assertEquals(42L, supplierService.countSuppliers());
        verify(supplierRepository).count();
    }
}
