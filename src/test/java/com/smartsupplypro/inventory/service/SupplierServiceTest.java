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

/**
 * Unit test suite for {@link SupplierService}, ensuring proper CRUD functionality,
 * validation behavior, and repository interaction. Tests include edge cases,
 * input validation, and duplicate prevention.
 */
class SupplierServiceTest {

    private SupplierService supplierService;
    private SupplierRepository supplierRepository;
    private InventoryItemRepository inventoryItemRepository;

    /**
     * Initializes mock dependencies and injects them into the {@link SupplierService} before each test.
     */
    @BeforeEach
    void setUp() {
        supplierRepository = mock(SupplierRepository.class);
        inventoryItemRepository = mock(InventoryItemRepository.class);
        supplierService = new SupplierService(supplierRepository, inventoryItemRepository);
    }

    /**
     * Verifies that a new supplier is saved correctly when no existing supplier
     * with the same name is found.
     */
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

    /**
     * Ensures that saving a supplier with an existing name throws a {@link DuplicateResourceException}
     * and does not persist the duplicate entity.
     */
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

    /**
     * Verifies that updating an existing supplier modifies the fields properly
     * and returns the updated DTO.
     */
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

    /**
     * Ensures that updating a supplier to a name that already exists throws
     * a {@link DuplicateResourceException} and prevents saving.
     */
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

    /**
     * Validates that the service rejects deletion of a supplier if related inventory items exist.
     */
    @Test
    void testDelete_shouldThrowException_whenInventoryItemsExist() {
        String supplierId = "supplier-123";
        when(inventoryItemRepository.existsBySupplierId(supplierId)).thenReturn(true);

        assertThrows(IllegalStateException.class, () -> supplierService.delete(supplierId));
        verify(supplierRepository, never()).deleteById(any());
    }

    /**
     * Confirms that deleting a supplier succeeds when no inventory items
     * are associated with the supplier.
     */
    @Test
    void testDelete_shouldSucceed_whenNoInventoryItemsExist() {
        String supplierId = "supplier-123";
        when(inventoryItemRepository.existsBySupplierId(supplierId)).thenReturn(false);

        supplierService.delete(supplierId);

        verify(supplierRepository).deleteById(supplierId);
    }

    /**
     * Ensures that a supplier with a null `createdBy` field cannot be saved and throws
     * an {@link IllegalArgumentException}.
     */
    @Test
    void testCreate_withMissingCreatedBy_shouldThrowException() {
        SupplierDTO dto = SupplierDTO.builder()
            .name("XYZ Supplier")
            .createdBy(null)
            .build();

        Exception ex = assertThrows(IllegalArgumentException.class, () -> supplierService.save(dto));
        assertEquals("CreatedBy must be provided.", ex.getMessage());
    }

    /**
     * Verifies that attempting to update a non-existent supplier ID returns an empty result
     * and avoids any save operation.
     */
    @Test
    void shouldReturnEmptyWhenUpdatingNonExistingSupplier() {
        String supplierId = "nonexistent";
        SupplierDTO updateDto = SupplierDTO.builder()
                .name("Some Name")
                .createdBy("admin")
                .build();

        when(supplierRepository.findById(supplierId)).thenReturn(Optional.empty());

        Optional<SupplierDTO> result = supplierService.update(supplierId, updateDto);

        assertTrue(result.isEmpty());
        verify(supplierRepository, never()).save(any());
    }

    /**
     * Ensures that saving a supplier without a name results in an exception due to
     * required field validation.
     */
    @Test
    void shouldThrowExceptionWhenNameIsMissingOnSave() {
        SupplierDTO dto = SupplierDTO.builder()
                .name(null)
                .createdBy("admin")
                .build();

        Exception ex = assertThrows(IllegalArgumentException.class, () -> supplierService.save(dto));
        assertEquals("Supplier name must be provided.", ex.getMessage());
    }
}
