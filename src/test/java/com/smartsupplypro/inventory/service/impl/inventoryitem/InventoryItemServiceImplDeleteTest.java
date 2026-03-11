package com.smartsupplypro.inventory.service.impl.inventoryitem;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

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

import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import com.smartsupplypro.inventory.service.StockHistoryService;
import com.smartsupplypro.inventory.service.impl.InventoryItemServiceImpl;

/**
 * Tests for {@link InventoryItemServiceImpl#delete(String, StockChangeReason)}.
 *
 * <p><strong>Why these tests exist</strong>: Delete is intentionally guarded and must remain auditable.
 * This suite verifies the service-level behavior for:
 * <ul>
 *   <li>invalid deletion reasons (fail fast)</li>
 *   <li>not-found handling</li>
 *   <li>rejecting deletes when stock remains</li>
 *   <li>logging full removal history before repository deletion</li>
 * </ul>
 */
@SuppressWarnings("unused")
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class InventoryItemServiceImplDeleteTest {
    @Mock private InventoryItemRepository repository;
    @Mock private SupplierRepository supplierRepository;
    @Mock private StockHistoryService stockHistoryService;
    @Mock private com.smartsupplypro.inventory.service.impl.inventory.InventoryItemValidationHelper validationHelper;
    @Mock private com.smartsupplypro.inventory.service.impl.inventory.InventoryItemAuditHelper auditHelper;
    @InjectMocks private InventoryItemServiceImpl service;

    private InventoryItem existing;

    @BeforeEach
    void setup() {
        // Set up OAuth2 authentication context (simulates logged-in ADMIN user)
        InventoryItemServiceImplTestHelper.authenticateAsOAuth2("admin", "ADMIN");

        // Build entity to return from mocks
        existing = new InventoryItem();
        existing.setId("item-1");
        existing.setName("Widget");
        existing.setQuantity(100);
        existing.setMinimumQuantity(5);
        existing.setPrice(new BigDecimal("10.00"));
        existing.setSupplierId("S1");

        // Default mocks
        lenient().when(supplierRepository.existsById(anyString())).thenReturn(true);
        lenient().when(repository.existsByNameIgnoreCase(anyString())).thenReturn(false);

        // Configure validation helper to return item if found
        lenient().when(validationHelper.validateExists(anyString())).thenAnswer(inv -> {
            String id = inv.getArgument(0);
            return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Item not found: " + id));
        });

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

    @Test
    @DisplayName("delete: invalid reason -> IllegalArgumentException (fails fast before any validation)")
    void delete_invalidReason_throwsIllegalArgumentException() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.delete("any-id", StockChangeReason.INITIAL_STOCK));

        assertTrue(ex.getMessage() != null && ex.getMessage().toLowerCase().contains("invalid reason"));
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
}
