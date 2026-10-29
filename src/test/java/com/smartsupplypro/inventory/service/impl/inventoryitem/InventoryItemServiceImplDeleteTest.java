package com.smartsupplypro.inventory.service.impl.inventoryitem;

import java.math.BigDecimal;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static com.smartsupplypro.inventory.service.impl.inventoryitem.InventoryItemServiceImplFixtures.copyOf;
import org.mockito.junit.jupiter.MockitoExtension;

import com.smartsupplypro.inventory.exception.BusinessRuleViolationException;
import com.smartsupplypro.inventory.mapper.InventoryItemMapper;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
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
class InventoryItemServiceImplDeleteTest {

    @Mock private InventoryItemRepository repository;
    @Mock private SupplierRepository supplierRepository;
    @Mock private InventoryItemAuditHelper auditHelper;
    private InventoryItemServiceImpl service;

    private InventoryItem existing;

    @BeforeEach
    void setup() {
        InventoryItemServiceImplTestHelper.authenticateAsOAuth2("admin", "ADMIN");

        // The real helper runs over the mocked repositories, so every assertion below
        // sees the exception types and messages production throws (NF-21).
        service = newServiceWithRealValidation(repository, supplierRepository, auditHelper);

        existing = newExistingItem();
    }

    @Test
    void should_throw_404_when_item_not_found() {
        when(repository.findById("missing-id")).thenReturn(Optional.empty());

        NoSuchElementException ex = assertThrows(NoSuchElementException.class,
                () -> service.delete("missing-id"));
        assertEquals("Item not found", ex.getMessage());
        verify(repository, never()).save(any());
    }

    @Test
    void should_throw_business_rule_violation_when_item_still_has_stock() {
        InventoryItem found = copyOf(existing);
        found.setQuantity(10);
        when(repository.findById("item-1")).thenReturn(Optional.of(found));

        BusinessRuleViolationException ex = assertThrows(BusinessRuleViolationException.class,
                () -> service.delete("item-1"));
        assertEquals("You still have merchandise in stock. "
                + "You need to first remove items from stock by changing quantity.", ex.getMessage());
        verify(repository, never()).save(any());
    }

    @Test
    void should_soft_delete_without_writing_stock_history_when_quantity_is_zero() {
        InventoryItem found = copyOf(existing);
        found.setQuantity(0);
        when(repository.findById("item-1")).thenReturn(Optional.of(found));

        service.delete("item-1");

        assertFalse(found.isActive());
        // one lookup: the item validated for deletion is the one marked inactive
        verify(repository, times(1)).findById("item-1");
        verify(repository).save(found);
        verify(repository, never()).deleteById(anyString());
        // The audit helper is the only writer of stock history in the service.
        verifyNoInteractions(auditHelper);
    }

    /**
     * The service with the real validation helper over the given mocked repositories,
     * so a test sees the exception types and messages production throws (NF-21).
     */
    private static InventoryItemServiceImpl newServiceWithRealValidation(InventoryItemRepository repository,
            SupplierRepository supplierRepository, InventoryItemAuditHelper auditHelper) {
        InventoryItemValidationHelper validationHelper =
                new InventoryItemValidationHelper(repository, supplierRepository);
        return new InventoryItemServiceImpl(repository, validationHelper, auditHelper, new InventoryItemMapper());
    }

    /** The stored item item-1 that the delete tests look up. */
    private static InventoryItem newExistingItem() {
        InventoryItem existing = new InventoryItem();
        existing.setId("item-1");
        existing.setName("Widget");
        existing.setQuantity(100);
        existing.setMinimumQuantity(5);
        existing.setPrice(new BigDecimal("10.00"));
        existing.setSupplierId("S1");
        existing.setSku("SKU-SVC-1");
        return existing;
    }
}
