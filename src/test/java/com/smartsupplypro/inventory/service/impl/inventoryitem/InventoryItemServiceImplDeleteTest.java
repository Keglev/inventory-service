package com.smartsupplypro.inventory.service.impl.inventoryitem;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.anyString;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import com.smartsupplypro.inventory.service.StockHistoryService;
import com.smartsupplypro.inventory.service.impl.InventoryItemServiceImpl;
import com.smartsupplypro.inventory.service.impl.inventory.InventoryItemAuditHelper;
import com.smartsupplypro.inventory.service.impl.inventory.InventoryItemValidationHelper;

/**
 * Unit tests for {@link InventoryItemServiceImpl#delete(String)} covering the
 * not-found guard, the quantity-must-be-zero guard, and the soft-delete
 * invariants: the row is marked inactive rather than removed, and no
 * stock-history row is written (the preceding quantity adjustment is the
 * audited stock movement).
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class InventoryItemServiceImplDeleteTest {

    @Mock private InventoryItemRepository repository;
    @Mock private SupplierRepository supplierRepository;
    @Mock private StockHistoryService stockHistoryService;
    @Mock private InventoryItemValidationHelper validationHelper;
    @Mock private InventoryItemAuditHelper auditHelper;
    @InjectMocks private InventoryItemServiceImpl service;

    private InventoryItem existing;

    @BeforeEach
    void setup() {
        InventoryItemServiceImplTestHelper.authenticateAsOAuth2("admin", "ADMIN");

        existing = new InventoryItem();
        existing.setId("item-1");
        existing.setName("Widget");
        existing.setQuantity(100);
        existing.setMinimumQuantity(5);
        existing.setPrice(new BigDecimal("10.00"));
        existing.setSupplierId("S1");
        existing.setSku("SKU-SVC-1");

        lenient().when(supplierRepository.existsById(anyString())).thenReturn(true);

        lenient().when(validationHelper.validateExists(anyString())).thenAnswer(inv -> {
            String id = inv.getArgument(0);
            return repository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Item not found: " + id));
        });

        lenient().doAnswer(inv -> {
            String id = inv.getArgument(0);
            InventoryItem item = repository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Item not found: " + id));
            if (item.getQuantity() > 0) {
                throw new IllegalStateException(
                        "You still have merchandise in stock. " +
                        "You need to first remove items from stock by changing quantity.");
            }
            return null;
        }).when(validationHelper).validateForDeletion(anyString());
    }

    @Test
    void should_throw_illegal_argument_when_item_not_found() {
        when(repository.findById("missing-id")).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.delete("missing-id"));
        assertTrue(ex.getMessage().toLowerCase().contains("not found"));
    }

    @Test
    void should_throw_illegal_state_when_item_still_has_stock() {
        InventoryItem found = copyOf(existing);
        found.setQuantity(10);
        when(repository.findById("item-1")).thenReturn(Optional.of(found));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> service.delete("item-1"));
        assertTrue(ex.getMessage().toLowerCase().contains("still have"));
    }

    @Test
    void should_soft_delete_without_writing_stock_history_when_quantity_is_zero() {
        InventoryItem found = copyOf(existing);
        found.setQuantity(0);
        when(repository.findById("item-1")).thenReturn(Optional.of(found));

        service.delete("item-1");

        assertFalse(found.isActive());
        verify(repository).save(found);
        verify(repository, never()).deleteById(anyString());
        verifyNoInteractions(auditHelper);
        verifyNoInteractions(stockHistoryService);
    }

    private static InventoryItem copyOf(InventoryItem src) {
        InventoryItem i = new InventoryItem();
        i.setId(src.getId() != null ? src.getId() : UUID.randomUUID().toString());
        i.setName(src.getName());
        i.setQuantity(src.getQuantity());
        i.setMinimumQuantity(src.getMinimumQuantity());
        i.setPrice(src.getPrice());
        i.setSupplierId(src.getSupplierId());
        i.setSku(src.getSku());
        return i;
    }
}
