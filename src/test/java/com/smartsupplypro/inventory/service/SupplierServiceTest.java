package com.smartsupplypro.inventory.service;

import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.exception.DuplicateResourceException;
import com.smartsupplypro.inventory.model.Supplier;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class SupplierServiceTest {
    private SupplierService supplierService;
    private SupplierRepository supplierRepository;
    private InventoryItemRepository inventoryItemRepository;

    @BeforeEach
    void setUp() {
        supplierRepository = mock(SupplierRepository.class);
        inventoryItemRepository = mock(InventoryItemRepository.class);
        supplierService = new SupplierService(supplierRepository, inventoryItemRepository);
    }

    @Test
    void shouldSaveNewSupplierWhenNotExists() {
        SupplierDTO dto = new SupplierDTO();
        dto.setName("New Supplier");
        dto.setContactName("John Doe");
        dto.setPhone("1234567890");
        dto.setEmail("john@example.com");
        dto.setCreatedBy("admin");

        when(supplierRepository.existsByNameIgnoreCase("New Supplier")).thenReturn(false);
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(invocation -> {
            Supplier supplier = invocation.getArgument(0);
            supplier.setId("generated-id");
            supplier.setCreatedAt(LocalDateTime.now());
            return supplier;
        });

        SupplierDTO result = supplierService.save(dto);

        assertNotNull(result);
        assertEquals("New Supplier", result.getName());
        verify(supplierRepository, times(1)).save(any(Supplier.class));
    }

    @Test
    void shouldThrowExceptionWhenSupplierAlreadyExists() {
        SupplierDTO dto = new SupplierDTO();
        dto.setName("Existing Supplier");
        dto.setCreatedBy("admin");

        when(supplierRepository.existsByNameIgnoreCase("Existing Supplier")).thenReturn(true);

        Exception ex = assertThrows(DuplicateResourceException.class, () -> supplierService.save(dto));
        assertEquals("A Supplier with this name already exists.", ex.getMessage());
        verify(supplierRepository, never()).save(any());
    }

    @Test
    void shouldUpdateExistingSupplier() {
        String supplierId = "123";
        Supplier existing = new Supplier();
        existing.setId(supplierId);
        existing.setName("Old Name");

        SupplierDTO updateDto = new SupplierDTO();
        updateDto.setName("Updated Name");
        updateDto.setContactName("Jane Smith");
        updateDto.setPhone("9876543210");
        updateDto.setEmail("jane@example.com");
        updateDto.setCreatedBy("admin");

        when(supplierRepository.findById(supplierId)).thenReturn(Optional.of(existing));
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Optional<SupplierDTO> updated = supplierService.update(supplierId, updateDto);

        assertTrue(updated.isPresent());
        assertEquals("Updated Name", updated.get().getName());
        verify(supplierRepository).save(any(Supplier.class));
    }
    @Test
    void shouldThrowExceptionWhenUpdatingToExistingName() {
        String supplierId = "123";
        Supplier existing = new Supplier();
        existing.setId(supplierId);
        existing.setName("Original Name");

        SupplierDTO updateDto = new SupplierDTO();
        updateDto.setName("Duplicate Name");
        updateDto.setCreatedBy("admin");

        when(supplierRepository.findById(supplierId)).thenReturn(Optional.of(existing));
        when(supplierRepository.existsByNameIgnoreCase("Duplicate Name")).thenReturn(true);

        Exception ex = assertThrows(DuplicateResourceException.class, () ->
                supplierService.update(supplierId, updateDto));

        assertEquals("A Supplier with this name already exists.", ex.getMessage());
        verify(supplierRepository, never()).save(any());
    }

    @Test
    void testDelete_shouldThrowException_whenInventoryItemsExist() {
        // Given
        String supplierId = "supplier-123";
        when(inventoryItemRepository.existsBySupplierId(supplierId)).thenReturn(true);

        // Then
        assertThrows(IllegalStateException.class, () -> supplierService.delete(supplierId));
        verify(supplierRepository, never()).deleteById(any());
    }

    @Test
    void testDelete_shouldSucceed_whenNoInventoryItemsExist() {
        // Given
        String supplierId = "supplier-123";
        when(inventoryItemRepository.existsBySupplierId(supplierId)).thenReturn(false);

        // When
        supplierService.delete(supplierId);

        // Then
        verify(supplierRepository).deleteById(supplierId);
    }

    @Test
    void testCreate_withMissingCreatedBy_shouldThrowException() {
        SupplierDTO dto = SupplierDTO.builder()
            .name("XYZ Supplier")
            .createdBy(null)
            .build();

        Exception ex = assertThrows(IllegalArgumentException.class, () -> supplierService.save(dto));
        assertEquals("CreatedBy must be provided.", ex.getMessage());
    }

}
