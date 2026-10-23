package com.smartsupplypro.inventory.service.impl.inventoryitem;

import java.math.BigDecimal;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.Mock;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static com.smartsupplypro.inventory.service.impl.inventoryitem.InventoryItemServiceImplFixtures.copyOf;
import static com.smartsupplypro.inventory.service.impl.inventoryitem.InventoryItemServiceImplFixtures.newBaseDto;
import static com.smartsupplypro.inventory.service.impl.inventoryitem.InventoryItemServiceImplFixtures.newExistingItem;
import static com.smartsupplypro.inventory.service.impl.inventoryitem.InventoryItemServiceImplFixtures.newServiceWithRealValidation;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.orm.ObjectOptimisticLockingFailureException;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.exception.DuplicateResourceException;
import com.smartsupplypro.inventory.exception.InvalidRequestException;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import com.smartsupplypro.inventory.service.impl.InventoryItemServiceImpl;
import com.smartsupplypro.inventory.service.impl.inventory.InventoryItemAuditHelper;
import com.smartsupplypro.inventory.service.impl.inventory.InventoryItemValidationHelper;

/**
 * Unit tests for {@link InventoryItemServiceImpl#update(String, InventoryItemDTO)}
 * covering not-found, duplicate-name conflict, optimistic locking, and field-update
 * behavior, run through the real {@link InventoryItemValidationHelper}.
 */
@ExtendWith(MockitoExtension.class)
class InventoryItemServiceImplUpdateTest {

    @Mock private InventoryItemRepository repository;
    @Mock private SupplierRepository supplierRepository;
    @Mock private InventoryItemAuditHelper auditHelper;
    private InventoryItemServiceImpl service;

    private InventoryItemDTO baseDto;
    private InventoryItem existing;

    @BeforeEach
    void setup() {
        InventoryItemServiceImplTestHelper.authenticateAsOAuth2("admin", "ADMIN");

        // The real helper runs over the mocked repositories, so every assertion below
        // sees the exception types and messages production throws (NF-21).
        service = newServiceWithRealValidation(repository, supplierRepository, auditHelper);

        baseDto = newBaseDto();

        existing = newExistingItem();

        // lenient: the two price-validation tests are rejected before the supplier check.
        lenient().when(supplierRepository.existsById(anyString())).thenReturn(true);
    }

    @Test
    void should_throw_404_when_item_not_found() {
        when(repository.findById("missing-id")).thenReturn(Optional.empty());

        NoSuchElementException ex = assertThrows(NoSuchElementException.class,
                () -> service.update("missing-id", copyOf(baseDto)));
        assertEquals("Item not found", ex.getMessage());
        verify(repository, never()).save(any());
    }

    @Test
    void should_throw_duplicate_resource_when_name_already_taken_by_another_item() {
        when(repository.findById("id-1")).thenReturn(Optional.of(copyOf(existing)));

        InventoryItemDTO updateDto = copyOf(baseDto);
        updateDto.setName("Widget-2");

        InventoryItem conflict = new InventoryItem();
        conflict.setId("other-id"); conflict.setName("Widget-2");
        conflict.setPrice(new BigDecimal("10.00"));
        conflict.setQuantity(1); conflict.setMinimumQuantity(1); conflict.setSupplierId("S1");
        conflict.setSku("SKU-SVC-2");
        when(repository.findByNameIgnoreCase("Widget-2")).thenReturn(List.of(conflict));

        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class,
                () -> service.update("id-1", updateDto));
        assertEquals("Another inventory item with this name and price already exists.", ex.getMessage());
        assertEquals("name", ex.getField());
        verify(repository, never()).save(any());
    }

    @Test
    void should_propagate_the_optimistic_lock_exception_when_modified_concurrently() {
        when(repository.findById("id-1")).thenReturn(Optional.of(copyOf(existing)));
        when(repository.save(any())).thenThrow(
                new ObjectOptimisticLockingFailureException(InventoryItem.class, "id-1"));

        ObjectOptimisticLockingFailureException ex = assertThrows(
                ObjectOptimisticLockingFailureException.class,
                () -> service.update("id-1", copyOf(baseDto)));
        assertTrue(ex.getMessage() != null && !ex.getMessage().isBlank());
    }

    @Test
    void should_preserve_existing_minimum_quantity_when_update_provides_non_positive_value() {
        InventoryItem current = copyOf(existing);
        current.setMinimumQuantity(5);

        when(repository.findById("id-1")).thenReturn(Optional.of(current));
        when(repository.save(any(InventoryItem.class))).thenAnswer(inv -> inv.getArgument(0, InventoryItem.class));

        InventoryItemDTO updateDto = copyOf(baseDto);
        updateDto.setMinimumQuantity(0); // non-positive value must be ignored
        updateDto.setQuantity(101);

        var result = service.update("id-1", updateDto);

        assertTrue(result.isPresent());
        assertEquals(5, result.get().getMinimumQuantity());
        assertEquals(101, result.get().getQuantity());
        verify(auditHelper).logQuantityChange(any(InventoryItem.class), eq(1));
    }

    @Test
    void should_update_price_and_log_a_price_change_when_price_is_valid() {
        InventoryItem current = copyOf(existing);
        current.setPrice(new BigDecimal("10.00"));

        when(repository.findById("id-1")).thenReturn(Optional.of(current));
        when(repository.save(any(InventoryItem.class))).thenAnswer(inv -> inv.getArgument(0, InventoryItem.class));

        InventoryItemDTO updateDto = copyOf(baseDto);
        updateDto.setPrice(new BigDecimal("12.50"));

        var result = service.update("id-1", updateDto);

        assertTrue(result.isPresent());
        assertEquals(new BigDecimal("12.50"), result.get().getPrice());
        verify(auditHelper).logPriceChange("item-1", new BigDecimal("12.50"));
        verify(auditHelper).logQuantityChange(any(InventoryItem.class), eq(0));
    }

    @Test
    void should_log_no_price_change_when_the_price_differs_only_in_scale() {
        InventoryItem current = copyOf(existing);
        current.setPrice(new BigDecimal("10.00"));

        when(repository.findById("id-1")).thenReturn(Optional.of(current));
        when(repository.save(any(InventoryItem.class))).thenAnswer(inv -> inv.getArgument(0, InventoryItem.class));

        InventoryItemDTO updateDto = copyOf(baseDto);
        updateDto.setPrice(new BigDecimal("10.0"));

        var result = service.update("id-1", updateDto);

        assertEquals(new BigDecimal("10.00"), result.get().getPrice());
        verify(auditHelper, never()).logPriceChange(anyString(), any());
    }

    @Test
    void should_log_only_the_quantity_change_when_the_price_is_unchanged() {
        InventoryItem current = copyOf(existing);

        when(repository.findById("id-1")).thenReturn(Optional.of(current));
        when(repository.save(any(InventoryItem.class))).thenAnswer(inv -> inv.getArgument(0, InventoryItem.class));

        InventoryItemDTO updateDto = copyOf(baseDto);
        updateDto.setQuantity(90);

        service.update("id-1", updateDto);

        verify(auditHelper, never()).logPriceChange(anyString(), any());
        verify(auditHelper).logQuantityChange(any(InventoryItem.class), eq(-10));
    }

    @Test
    void should_throw_invalid_request_when_updated_price_is_zero() {
        InventoryItemDTO updateDto = copyOf(baseDto);
        updateDto.setPrice(BigDecimal.ZERO);

        // validateBase rejects the price before the service compares it, so the
        // answer is 400 (InvalidRequestException); update has no second price check.
        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> service.update("id-1", updateDto));
        assertEquals("Price must be positive or greater than zero", ex.getMessage());
        verify(repository, never()).save(any());
    }

    @Test
    void should_throw_invalid_request_and_log_nothing_when_the_updated_price_is_missing() {
        InventoryItemDTO updateDto = copyOf(baseDto);
        updateDto.setPrice(null);

        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> service.update("id-1", updateDto));
        assertEquals("Price must be positive or greater than zero", ex.getMessage());
        verify(repository, never()).save(any());
        verify(auditHelper, never()).logPriceChange(anyString(), any());
    }

}
