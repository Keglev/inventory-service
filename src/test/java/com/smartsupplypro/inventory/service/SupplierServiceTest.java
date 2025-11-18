package com.smartsupplypro.inventory.service;

import java.time.LocalDateTime;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.exception.DuplicateResourceException;
import com.smartsupplypro.inventory.model.Supplier;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import com.smartsupplypro.inventory.service.impl.SupplierServiceImpl;

/**
 * Unit tests for {@link SupplierServiceImpl}.
 *
 * <p><strong>Operation Coverage:</strong></p>
 * <ul>
 *   <li><b>Create:</b> Persist new suppliers with uniqueness validation</li>
 *   <li><b>Update:</b> Modify existing suppliers with rename guards</li>
 *   <li><b>Delete:</b> Remove suppliers only if no linked inventory items</li>
 * </ul>
 *
 * <p><strong>Exception Mapping:</strong></p>
 * <ul>
 *   <li>Duplicate names → {@link DuplicateResourceException} (409)</li>
 *   <li>Suppliers with linked items → {@link IllegalStateException} (409)</li>
 *   <li>Not found → {@link NoSuchElementException} (404)</li>
 * </ul>
 *
 * <p><strong>Design Notes:</strong></p>
 * <ul>
 *   <li>Mapper is static utility (no bean dependency); tests verify repository calls only.</li>
 *   <li>Delete check uses {@code existsActiveStockForSupplier()} to detect linked items.</li>
 * </ul>
 */
@SuppressWarnings("unused")
class SupplierServiceTest {

    private SupplierRepository supplierRepository;
    private InventoryItemRepository inventoryItemRepository;
    private SupplierService supplierService;

    @BeforeEach
    void setUp() {
        // Initialize mocks for repository interactions
        supplierRepository = mock(SupplierRepository.class);
        inventoryItemRepository = mock(InventoryItemRepository.class);
        // Inject mocks into service under test
        supplierService = new SupplierServiceImpl(supplierRepository, inventoryItemRepository);
    }

    // ==================== CREATE Tests ====================
    // Tests supplier creation with uniqueness validation

    /**
     * Validates that a supplier with a unique name is successfully persisted.
     * Scenario: Creating new supplier when no existing supplier has the same name.
     * Expected: Supplier saved with generated ID and creation timestamp.
     */
    @Test
    void create_shouldPersist_whenNameUnique() {
        SupplierDTO input = SupplierDTO.builder()
                .name("Acme GmbH")
                .contactName("Alice")
                .phone("+49-123")
                .email("alice@acme.test")
                .build();

        // Mock: no existing supplier with this name (uniqueness check passes)
        when(supplierRepository.findByNameIgnoreCase("Acme GmbH")).thenReturn(Optional.empty());

        // Mock: save operation generates ID and timestamps
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(inv -> {
            Supplier s = inv.getArgument(0, Supplier.class);
            s.setId(UUID.randomUUID().toString()); // Simulate database ID generation
            s.setCreatedAt(LocalDateTime.now());    // Simulate database timestamp
            return s;
        });

        SupplierDTO created = supplierService.create(input);

        // Verify ID was generated and name persisted
        assertNotNull(created.getId(), "id should be generated");
        assertEquals("Acme GmbH", created.getName());
        // Verify repository save was called exactly once
        verify(supplierRepository).save(any(Supplier.class));
    }

    /**
     * Validates that duplicate supplier names are rejected.
     * Scenario: Attempting to create a supplier when name already exists.
     * Expected: {@link DuplicateResourceException} (409) and no save operation.
     */
    @Test
    void create_shouldThrow409_whenNameDuplicate() {
        SupplierDTO input = SupplierDTO.builder().name("DupName").build();

        // Mock: a supplier with this name already exists
        when(supplierRepository.findByNameIgnoreCase("DupName"))
                .thenReturn(Optional.of(Supplier.builder().id("sup-1").name("DupName").build()));

        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class,
                () -> supplierService.create(input));
        assertEquals("Supplier already exists", ex.getMessage());
        // Verify save was never called (uniqueness check rejected the creation)
        verify(supplierRepository, never()).save(any());
    }

    // ==================== UPDATE Tests ====================
    // Tests supplier modification with existence and uniqueness checks

    /**
     * Validates that supplier fields are successfully updated when record exists and name is unique.
     * Scenario: Modifying an existing supplier with a new, non-conflicting name.
     * Expected: All fields updated and persisted via repository.
     */
    @Test
    void update_shouldModifyFields_whenExistsAndUnique() {
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

        // Mock: supplier with id "sup-1" exists
        when(supplierRepository.findById(id)).thenReturn(Optional.of(existing));
        // Mock: new name "New" is not taken by any other supplier
        when(supplierRepository.findByNameIgnoreCase("New")).thenReturn(Optional.empty());
        // Mock: save simply returns the argument (no additional transformation)
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(inv -> inv.getArgument(0));

        SupplierDTO updated = supplierService.update(id, patch);

        // Verify all fields were updated
        assertEquals("New", updated.getName());
        assertEquals("New C", updated.getContactName());
        assertEquals("222", updated.getPhone());
        assertEquals("new@test", updated.getEmail());
        // Verify repository save was called
        verify(supplierRepository).save(any(Supplier.class));
    }

    /**
     * Validates that updating a non-existent supplier fails with 404.
     * Scenario: Attempting update on supplier ID that does not exist.
     * Expected: {@link NoSuchElementException} and no save operation.
     */
    @Test
    void update_shouldThrow404_whenNotFound() {
        when(supplierRepository.findById("missing")).thenReturn(Optional.empty());

        NoSuchElementException ex = assertThrows(NoSuchElementException.class,
                () -> supplierService.update("missing", SupplierDTO.builder().name("X").build()));
        assertTrue(ex.getMessage().contains("Supplier not found"));
        // Verify save was never called (early exit on not-found check)
        verify(supplierRepository, never()).save(any());
    }

    /**
     * Validates that renaming a supplier to an existing name is rejected.
     * Scenario: Supplier "sup-1" attempts to rename to "Taken", which is owned by "other-id".
     * Expected: {@link DuplicateResourceException} (409) and no save operation.
     */
    @Test
    void update_shouldThrow409_whenRenamingToExistingName() {
        String id = "sup-1";
        Supplier existing = Supplier.builder().id(id).name("Old").build();

        // Mock: supplier exists and is found
        when(supplierRepository.findById(id)).thenReturn(Optional.of(existing));
        // Mock: target name "Taken" is owned by a different supplier (id: other-id)
        when(supplierRepository.findByNameIgnoreCase("Taken"))
                .thenReturn(Optional.of(Supplier.builder().id("other-id").name("Taken").build()));

        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class,
                () -> supplierService.update(id, SupplierDTO.builder().name("Taken").build()));
        assertEquals("Supplier already exists", ex.getMessage());
        // Verify save was never called (uniqueness check rejected the update)
        verify(supplierRepository, never()).save(any());
    }

    // ==================== DELETE Tests ====================
    // Tests supplier deletion with linked inventory checks

    /**
     * Validates that suppliers with linked inventory items cannot be deleted.
     * Scenario: Supplier has at least one inventory item with quantity > 0.
     * Expected: {@link IllegalStateException} (409) blocking the deletion.
     */
    @Test
    void delete_shouldThrow409_whenAnyLinkedItemHasQuantity_gt_0() {
        String id = "sup-1";

        // Mock: supplier has at least one linked item with quantity > 0 (quantity threshold = 0)
        when(inventoryItemRepository.existsActiveStockForSupplier(eq(id), eq(0)))
                .thenReturn(true);

        IllegalStateException ex =
                assertThrows(IllegalStateException.class, () -> supplierService.delete(id));
        assertTrue(ex.getMessage().toLowerCase().contains("cannot delete"), "Expected business conflict message");

        // Verify delete was never called (precondition check blocked it)
        verify(supplierRepository, never()).deleteById(any());
    }

    /**
     * Validates that deleting a non-existent supplier fails with 404.
     * Scenario: Attempting to delete supplier ID that does not exist.
     * Precondition: No linked items exist for this supplier (passes the link check).
     * Expected: {@link NoSuchElementException} and no deletion.
     */
    @Test
    void delete_shouldThrow404_whenSupplierMissing() {
        String id = "missing";

        // Mock: no linked items exist for this supplier (link check passes)
        when(inventoryItemRepository.existsActiveStockForSupplier(eq(id), eq(0)))
                .thenReturn(false);
        // Mock: supplier with this ID does not exist
        when(supplierRepository.existsById(id)).thenReturn(false);

        NoSuchElementException ex =
                assertThrows(NoSuchElementException.class, () -> supplierService.delete(id));
        assertTrue(ex.getMessage().contains("Supplier not found"));

        // Verify delete was never called (supplier not found check prevented it)
        verify(supplierRepository, never()).deleteById(any());
    }

    /**
     * Validates the happy path: supplier with no linked items can be deleted.
     * Scenario: Supplier exists and has no inventory items linked to it.
     * Expected: Deletion succeeds and repository deleteById is called.
     */
    @Test
    void delete_shouldSucceed_whenNoActiveLinks_andExists() {
        String id = "sup-1";

        // Mock: no linked items with quantity > 0 (link check passes)
        when(inventoryItemRepository.existsActiveStockForSupplier(eq(id), eq(0)))
                .thenReturn(false);
        // Mock: supplier exists and is found
        when(supplierRepository.existsById(id)).thenReturn(true);

        // Execute delete - should succeed
        supplierService.delete(id);

        // Verify deletion was executed
        verify(supplierRepository).deleteById(id);
    }


}
