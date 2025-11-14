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
 * <p>Focus:
 * <ul>
 *   <li>Happy paths for create/update/delete</li>
 *   <li>Uniqueness guard → {@link DuplicateResourceException}</li>
 *   <li>Delete guard on linked items (quantity &gt; 0) → {@link IllegalStateException}</li>
 *   <li>Not-found semantics → {@link NoSuchElementException}</li>
 * </ul>
 *
 * <p>Notes:
 * <ul>
 *   <li>Mapper is static (no bean); we just verify repository interactions and outcomes.</li>
 *   <li>Validator rules: name is required/non-blank; uniqueness enforced via repository.</li>
 * </ul>
 */
@SuppressWarnings("unused")
class SupplierServiceTest {

    private SupplierRepository supplierRepository;
    private InventoryItemRepository inventoryItemRepository;
    private SupplierService supplierService;

    @BeforeEach
    void setUp() {
        supplierRepository = mock(SupplierRepository.class);
        inventoryItemRepository = mock(InventoryItemRepository.class);
        supplierService = new SupplierServiceImpl(supplierRepository, inventoryItemRepository);
    }

    // ---------- CREATE ----------

    @Test
    void create_shouldPersist_whenNameUnique() {
        SupplierDTO input = SupplierDTO.builder()
                .name("Acme GmbH")
                .contactName("Alice")
                .phone("+49-123")
                .email("alice@acme.test")
                .build();

        // uniqueness: no existing
        when(supplierRepository.findByNameIgnoreCase("Acme GmbH")).thenReturn(Optional.empty());

        // save echoes entity with id + createdAt
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(inv -> {
            Supplier s = inv.getArgument(0, Supplier.class);
            s.setId(UUID.randomUUID().toString());
            s.setCreatedAt(LocalDateTime.now());
            return s;
        });

        SupplierDTO created = supplierService.create(input);

        assertNotNull(created.getId(), "id should be generated");
        assertEquals("Acme GmbH", created.getName());
        verify(supplierRepository).save(any(Supplier.class));
    }

    @Test
    void create_shouldThrow409_whenNameDuplicate() {
        SupplierDTO input = SupplierDTO.builder().name("DupName").build();

        when(supplierRepository.findByNameIgnoreCase("DupName"))
                .thenReturn(Optional.of(Supplier.builder().id("sup-1").name("DupName").build()));

        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class,
                () -> supplierService.create(input));
        assertEquals("Supplier already exists", ex.getMessage());
        verify(supplierRepository, never()).save(any());
    }

    // ---------- UPDATE ----------

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

        when(supplierRepository.findById(id)).thenReturn(Optional.of(existing));
        when(supplierRepository.findByNameIgnoreCase("New")).thenReturn(Optional.empty());
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(inv -> inv.getArgument(0));

        SupplierDTO updated = supplierService.update(id, patch);

        assertEquals("New", updated.getName());
        assertEquals("New C", updated.getContactName());
        assertEquals("222", updated.getPhone());
        assertEquals("new@test", updated.getEmail());
        verify(supplierRepository).save(any(Supplier.class));
    }

    @Test
    void update_shouldThrow404_whenNotFound() {
        when(supplierRepository.findById("missing")).thenReturn(Optional.empty());

        NoSuchElementException ex = assertThrows(NoSuchElementException.class,
                () -> supplierService.update("missing", SupplierDTO.builder().name("X").build()));
        assertTrue(ex.getMessage().contains("Supplier not found"));
        verify(supplierRepository, never()).save(any());
    }

    @Test
    void update_shouldThrow409_whenRenamingToExistingName() {
        String id = "sup-1";
        Supplier existing = Supplier.builder().id(id).name("Old").build();

        when(supplierRepository.findById(id)).thenReturn(Optional.of(existing));
        // simulate another supplier already owning target name
        when(supplierRepository.findByNameIgnoreCase("Taken"))
                .thenReturn(Optional.of(Supplier.builder().id("other-id").name("Taken").build()));

        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class,
                () -> supplierService.update(id, SupplierDTO.builder().name("Taken").build()));
        assertEquals("Supplier already exists", ex.getMessage());
        verify(supplierRepository, never()).save(any());
    }

    // ---------- DELETE ----------

/**
 * When any inventory item linked to the supplier has positive on-hand quantity,
 * deletion must be blocked with 409 (IllegalStateException from validator).
 */
@Test
void delete_shouldThrow409_whenAnyLinkedItemHasQuantity_gt_0() {
    String id = "sup-1";

    when(inventoryItemRepository.existsActiveStockForSupplier(eq(id), eq(0)))
            .thenReturn(true);

    IllegalStateException ex =
            assertThrows(IllegalStateException.class, () -> supplierService.delete(id));
    assertTrue(ex.getMessage().toLowerCase().contains("cannot delete"), "Expected business conflict message");

    verify(supplierRepository, never()).deleteById(any());
}

/**
 * When the supplier does not exist, we should get 404 (NoSuchElementException).
 * Precondition: no active links for the supplier.
 */
@Test
void delete_shouldThrow404_whenSupplierMissing() {
    String id = "missing";

    when(inventoryItemRepository.existsActiveStockForSupplier(eq(id), eq(0)))
            .thenReturn(false);
    when(supplierRepository.existsById(id)).thenReturn(false);

    NoSuchElementException ex =
            assertThrows(NoSuchElementException.class, () -> supplierService.delete(id));
    assertTrue(ex.getMessage().contains("Supplier not found"));

    verify(supplierRepository, never()).deleteById(any());
}

/**
 * Happy path: no active links and supplier exists -> deletion proceeds.
 */
@Test
void delete_shouldSucceed_whenNoActiveLinks_andExists() {
    String id = "sup-1";

    when(inventoryItemRepository.existsActiveStockForSupplier(eq(id), eq(0)))
            .thenReturn(false);
    when(supplierRepository.existsById(id)).thenReturn(true);

    supplierService.delete(id);

    verify(supplierRepository).deleteById(id);
}


}
