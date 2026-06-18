package com.smartsupplypro.inventory.service.supplier;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.model.Supplier;

/**
 * Unit tests for {@link com.smartsupplypro.inventory.service.impl.SupplierServiceImpl}
 * read and count operations.
 */
class SupplierServiceReadCountTest extends SupplierServiceTestBase {

    /**
     * Tests for {@code findAll()}.
     */
    @Nested
    class FindAll {

        @Test
        void should_return_mapped_dto_list_for_all_suppliers() {
            Supplier s1 = Supplier.builder()
                    .id("sup-1").name("Acme GmbH").contactName("Alice")
                    .phone("111").email("alice@acme.test")
                    .createdBy("admin").createdAt(LocalDateTime.now().minusDays(1))
                    .build();
            Supplier s2 = Supplier.builder()
                    .id("sup-2").name("Globex").contactName("Bob")
                    .phone("222").email("bob@globex.test")
                    .createdBy("admin").createdAt(LocalDateTime.now().minusHours(2))
                    .build();

            when(supplierRepository.findAll()).thenReturn(List.of(s1, s2));

            List<SupplierDTO> result = supplierService.findAll();

            assertEquals(2, result.size());
            assertEquals("sup-1", result.get(0).getId());
            assertEquals("Acme GmbH", result.get(0).getName());
            assertEquals("sup-2", result.get(1).getId());
            assertEquals("Globex", result.get(1).getName());
            verify(supplierRepository).findAll();
        }
    }

    /**
     * Tests for {@code findById(String)}.
     */
    @Nested
    class FindById {

        @Test
        void should_return_mapped_optional_when_supplier_exists() {
            Supplier entity = Supplier.builder()
                    .id("sup-1").name("Acme GmbH").contactName("Alice")
                    .phone("111").email("alice@acme.test")
                    .createdBy("admin").createdAt(LocalDateTime.now().minusDays(1))
                    .build();
            when(supplierRepository.findById("sup-1")).thenReturn(Optional.of(entity));

            Optional<SupplierDTO> result = supplierService.findById("sup-1");

            assertTrue(result.isPresent());
            assertEquals("sup-1", result.get().getId());
            assertEquals("Acme GmbH", result.get().getName());
            verify(supplierRepository).findById("sup-1");
        }

        @Test
        void should_return_empty_optional_when_supplier_not_found() {
            when(supplierRepository.findById("missing")).thenReturn(Optional.empty());

            assertTrue(supplierService.findById("missing").isEmpty());
            verify(supplierRepository).findById("missing");
        }
    }

    /**
     * Tests for {@code findByName(String)}.
     */
    @Nested
    class FindByName {

        @Test
        void should_return_matching_suppliers_mapped_to_dtos() {
            Supplier s1 = Supplier.builder()
                    .id("sup-1").name("Acme GmbH")
                    .createdBy("admin").createdAt(LocalDateTime.now().minusDays(1))
                    .build();
            when(supplierRepository.findByNameContainingIgnoreCase("ac")).thenReturn(List.of(s1));

            List<SupplierDTO> result = supplierService.findByName("ac");

            assertEquals(1, result.size());
            assertEquals("sup-1", result.get(0).getId());
            assertEquals("Acme GmbH", result.get(0).getName());
            verify(supplierRepository).findByNameContainingIgnoreCase("ac");
        }
    }

    /**
     * Tests for {@code countSuppliers()}.
     */
    @Nested
    class CountSuppliers {

        @Test
        void should_return_repository_count() {
            when(supplierRepository.count()).thenReturn(42L);

            assertEquals(42L, supplierService.countSuppliers());
            verify(supplierRepository).count();
        }
    }
}
