package com.smartsupplypro.inventory.service.impl;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.server.ResponseStatusException;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import com.smartsupplypro.inventory.service.StockHistoryService;

/**
 * Tests for {@link InventoryItemServiceImpl} update and delete operations.
 *
 * <p><strong>Operation Coverage:</strong></p>
 * <ul>
 *   <li><b>update:</b> Modify existing items with uniqueness and existence checks</li>
 *   <li><b>delete:</b> Remove items with valid deletion reasons and history logging</li>
 * </ul>
 *
 * <p><strong>Validation Layers (Update):</strong></p>
 * <ul>
 *   <li>Item must exist (not-found check)</li>
 *   <li>Name/price combination must be unique (conflict check)</li>
 *   <li>Optimistic locking errors propagated</li>
 * </ul>
 *
 * <p><strong>Exception Mapping:</strong></p>
 * <ul>
 *   <li>Item not found → {@link IllegalArgumentException} (404)</li>
 *   <li>Duplicate name/price → {@link DuplicateResourceException} or ResponseStatusException (409)</li>
 *   <li>Optimistic lock → {@link ObjectOptimisticLockingFailureException}</li>
 * </ul>
 *
 * <p><strong>Design Notes:</strong></p>
 * <ul>
 *   <li>validationHelper mocks test the integration points; actual validation is not tested here.</li>
 *   <li>auditHelper.logFullRemoval integrates deletion history logging.</li>
 *   <li>OAuth2 context mocked to simulate authenticated user context.</li>
 * </ul>
 */
@SuppressWarnings("unused")
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class InventoryItemServiceImplUpdateDeleteTest {
    @Mock private InventoryItemRepository repository;
    @Mock private SupplierRepository supplierRepository;
    @Mock private StockHistoryService stockHistoryService;
    @Mock private com.smartsupplypro.inventory.service.impl.inventory.InventoryItemValidationHelper validationHelper;
    @Mock private com.smartsupplypro.inventory.service.impl.inventory.InventoryItemAuditHelper auditHelper;
    @InjectMocks private InventoryItemServiceImpl service;

    private InventoryItemDTO baseDto;
    private InventoryItem existing;

    @BeforeEach
    void setup() {
        // Set up OAuth2 authentication context (simulates logged-in ADMIN user)
        InventoryItemServiceImplTestHelper.authenticateAsOAuth2("admin", "ADMIN");

        // Build test DTO with valid sample data
        baseDto = new InventoryItemDTO();
        baseDto.setName("Widget");
        baseDto.setQuantity(100);
        baseDto.setMinimumQuantity(5);
        baseDto.setPrice(new BigDecimal("10.00"));
        baseDto.setSupplierId("S1");
        baseDto.setCreatedBy("admin");

        // Build entity to return from mocks
        existing = new InventoryItem();
        existing.setId("item-1");
        existing.setName("Widget");
        existing.setQuantity(100);
        existing.setMinimumQuantity(5);
        existing.setPrice(new BigDecimal("10.00"));
        existing.setSupplierId("S1");

        // Default mocks: supplier exists, name is unique, save succeeds
        lenient().when(supplierRepository.existsById(anyString())).thenReturn(true);
        lenient().when(repository.existsByNameIgnoreCase(anyString())).thenReturn(false);
        
        // Configure validation helper to return item if found
        lenient().when(validationHelper.validateExists(anyString())).thenAnswer(inv -> {
            String id = inv.getArgument(0);
            return repository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Item not found: " + id));
        });
        lenient().when(validationHelper.validateForUpdate(anyString(), any())).thenAnswer(inv -> {
            String id = inv.getArgument(0);
            return repository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Item not found for update"));
        });
        
        // Configure uniqueness validation to throw DuplicateResourceException on conflict
        lenient().doAnswer(inv -> {
            String id = inv.getArgument(0);
            InventoryItem existingItem = inv.getArgument(1);
            InventoryItemDTO dto = inv.getArgument(2);
            
            // Check if name or price changed
            boolean nameChanged = !existingItem.getName().equalsIgnoreCase(dto.getName());
            boolean priceChanged = !existingItem.getPrice().equals(dto.getPrice());
            
            if (nameChanged || priceChanged) {
                // Look for conflicting items with same name and price
                java.util.List<InventoryItem> conflicts = repository.findByNameIgnoreCase(dto.getName());
                for (InventoryItem item : conflicts) {
                    if (!item.getId().equals(id) && item.getPrice().equals(dto.getPrice())) {
                        throw new com.smartsupplypro.inventory.exception.DuplicateResourceException(
                            "Item with name '" + dto.getName() + "' and price " + dto.getPrice() + " already exists"
                        );
                    }
                }
            }
            return null;
        }).when(validationHelper).validateUniquenessOnUpdate(anyString(), any(), any());
        
        // Configure deletion validation to validate quantity is zero
        lenient().doAnswer(inv -> {
            String id = inv.getArgument(0);
            InventoryItem item = repository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Item not found: " + id));
            if (item.getQuantity() > 0) {
                throw new IllegalStateException(
                    "You still have merchandise in stock. " +
                    "You need to first remove items from stock by changing quantity."
                );
            }
            return null;
        }).when(validationHelper).validateForDeletion(anyString());
    }

    @Test
    @DisplayName("update: not found -> IllegalArgumentException")
    void update_shouldThrow_whenNotFound() {
        // Mock: item with ID "missing-id" does not exist
        when(repository.findById("missing-id")).thenReturn(Optional.empty());

        InventoryItemDTO updateDto = copyOf(baseDto);
        // Attempt to update non-existent item
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.update("missing-id", updateDto));

        // Verify error message indicates not found
        assertTrue(ex.getMessage().contains("not found"));
    }

    @Test
    @DisplayName("update: duplicate name -> 409 CONFLICT")
    void update_duplicateName_throwsConflict() {
        // Mock: item with ID "id-1" exists
        when(repository.findById("id-1")).thenReturn(Optional.of(copyOf(existing)));

        // Build update DTO with new name
        InventoryItemDTO updateDto = copyOf(baseDto);
        updateDto.setName("Widget-2");

        // Mock: another item with name "Widget-2" already exists
        InventoryItem conflict = new InventoryItem();
        conflict.setId("other-id");
        conflict.setName("Widget-2");
        conflict.setPrice(new BigDecimal("10.00"));
        conflict.setQuantity(1);
        conflict.setMinimumQuantity(1);
        conflict.setSupplierId("S1");
        when(repository.findByNameIgnoreCase("Widget-2")).thenReturn(java.util.List.of(conflict));

        lenient().when(repository.save(any(InventoryItem.class))).thenAnswer(inv -> {
            InventoryItem src = inv.getArgument(0, InventoryItem.class);
            if (src.getId() == null) src.setId("generated-id");
            return src;
        });

        try {
            // Attempt to update to conflicting name
            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> service.update("id-1", updateDto));
            assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
            assertTrue(safeReason(ex).contains("already"));
        } catch (org.opentest4j.AssertionFailedError ignored) {
            // Alternative path: DuplicateResourceException thrown directly
            com.smartsupplypro.inventory.exception.DuplicateResourceException ex2 =
                    assertThrows(com.smartsupplypro.inventory.exception.DuplicateResourceException.class,
                            () -> service.update("id-1", updateDto));
            assertTrue(ex2.getMessage() != null && !ex2.getMessage().isBlank());
        }
    }

    @Test
    @DisplayName("update: optimistic lock -> propagated exception")
    void update_optimisticLock_isSurfacedAsConflict() {
        // Mock: item exists and is found
        when(repository.findById("id-1")).thenReturn(Optional.of(copyOf(existing)));
        // Mock: save throws optimistic lock exception (version mismatch)
        when(repository.save(any())).thenThrow(
                new ObjectOptimisticLockingFailureException(InventoryItem.class, "id-1")
        );

        InventoryItemDTO updateDto = copyOf(baseDto);

        // Attempt to update when another thread modified item
        ObjectOptimisticLockingFailureException ex = assertThrows(
                ObjectOptimisticLockingFailureException.class,
                () -> service.update("id-1", updateDto)
        );
        assertTrue(ex.getMessage() != null && !ex.getMessage().isBlank());
    }

    @Test
    @DisplayName("delete: not found -> IllegalArgumentException")
    void delete_shouldThrow_whenItemNotFound() {
        // Mock: item with ID "missing-id" does not exist
        when(repository.findById("missing-id")).thenReturn(Optional.empty());

        // Attempt to delete non-existent item
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.delete("missing-id", StockChangeReason.SCRAPPED));
        assertTrue(ex.getMessage() != null && ex.getMessage().toLowerCase().contains("not found"));
    }

    @Test
    @DisplayName("delete: quantity > 0 -> IllegalStateException")
    void delete_shouldThrow_whenQuantityGreaterThanZero() {
        // Mock: item exists but has quantity > 0
        InventoryItem found = copyOf(existing);
        found.setQuantity(10); // Item has stock
        when(repository.findById("item-1")).thenReturn(Optional.of(found));

        // Attempt to delete item with stock
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> service.delete("item-1", StockChangeReason.SCRAPPED));
        assertTrue(ex.getMessage() != null && ex.getMessage().toLowerCase().contains("still have"));
    }

    @Test
    @DisplayName("delete: logs removal once with priceAtChange then deletes (quantity = 0)")
    void delete_shouldRemoveItemAndRecordHistory() {
        // Mock: item exists with quantity = 0 (safe to delete)
        InventoryItem found = copyOf(existing);
        found.setQuantity(0); // Item has no stock
        when(repository.findById("item-1")).thenReturn(Optional.of(found));

        // Execute delete operation
        service.delete("item-1", StockChangeReason.SCRAPPED);

        // Verify audit helper recorded the removal with reason
        verify(auditHelper).logFullRemoval(any(InventoryItem.class), eq(StockChangeReason.SCRAPPED));
        // Verify repository deleteById was called
        verify(repository).deleteById("item-1");
    }

    @Test
    @DisplayName("delete: supports null price at change (graceful log)")
    void delete_logsHistoryThenDeletes() {
        // Build item with null price (edge case) but quantity = 0
        InventoryItem found = copyOf(existing);
        found.setId("i-1");
        found.setQuantity(0); // Must be 0 to delete
        found.setPrice(null); // Edge case: null price
        when(repository.findById("i-1")).thenReturn(Optional.of(found));

        // Execute delete - should handle null price gracefully
        service.delete("i-1", StockChangeReason.SCRAPPED);

        // Verify deletion was logged and executed
        verify(auditHelper).logFullRemoval(any(InventoryItem.class), eq(StockChangeReason.SCRAPPED));
        verify(repository).deleteById("i-1");
    }

    private static InventoryItemDTO copyOf(InventoryItemDTO src) {
        InventoryItemDTO d = new InventoryItemDTO();
        d.setName(src.getName());
        d.setQuantity(src.getQuantity());
        d.setMinimumQuantity(src.getMinimumQuantity());
        d.setPrice(src.getPrice());
        d.setSupplierId(src.getSupplierId());
        d.setCreatedBy(src.getCreatedBy());
        return d;
    }

    private static InventoryItem copyOf(InventoryItem src) {
        InventoryItem i = new InventoryItem();
        i.setId(src.getId() != null ? src.getId() : UUID.randomUUID().toString());
        i.setName(src.getName());
        i.setQuantity(src.getQuantity());
        i.setMinimumQuantity(src.getMinimumQuantity());
        i.setPrice(src.getPrice());
        i.setSupplierId(src.getSupplierId());
        return i;
    }

    private static String safeReason(ResponseStatusException ex) {
        return String.valueOf(ex.getReason()).toLowerCase();
    }
}
