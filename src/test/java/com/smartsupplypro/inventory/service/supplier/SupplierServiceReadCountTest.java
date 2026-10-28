package com.smartsupplypro.inventory.service.supplier;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
        void should_return_mapped_dtos_when_all_suppliers_are_requested() {
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
     * Tests for {@code countSuppliers()}.
     */
    @Nested
    class CountSuppliers {

        @Test
        void should_return_the_repository_count_when_counting_suppliers() {
            when(supplierRepository.count()).thenReturn(42L);

            assertEquals(42L, supplierService.countSuppliers());
            verify(supplierRepository).count();
        }
    }
}
