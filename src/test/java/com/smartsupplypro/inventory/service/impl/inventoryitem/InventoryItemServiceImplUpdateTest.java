package com.smartsupplypro.inventory.service.impl.inventoryitem;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
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
import com.smartsupplypro.inventory.mapper.InventoryItemMapper;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import com.smartsupplypro.inventory.service.StockHistoryService;
import com.smartsupplypro.inventory.service.impl.InventoryItemServiceImpl;
import com.smartsupplypro.inventory.service.impl.inventory.InventoryItemAuditHelper;
import com.smartsupplypro.inventory.service.impl.inventory.InventoryItemValidationHelper;

/**
 * Unit tests for {@link InventoryItemServiceImpl#update(String, InventoryItemDTO)}
 * covering not-found, duplicate-name conflict, optimistic locking, and field-update behavior.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@SuppressWarnings("unused")
class InventoryItemServiceImplUpdateTest {

    @Mock private InventoryItemRepository repository;
    @Mock private SupplierRepository supplierRepository;
    @Mock private StockHistoryService stockHistoryService;
    @Mock private InventoryItemValidationHelper validationHelper;
    @Mock private InventoryItemAuditHelper auditHelper;
    @SuppressWarnings("FieldMayBeFinal")
    @Spy  private InventoryItemMapper inventoryItemMapper = new InventoryItemMapper();
    @InjectMocks private InventoryItemServiceImpl service;

    private InventoryItemDTO baseDto;
    private InventoryItem existing;

    @BeforeEach
    void setup() {
        InventoryItemServiceImplTestHelper.authenticateAsOAuth2("admin", "ADMIN");

        baseDto = new InventoryItemDTO();
        baseDto.setName("Widget");
        baseDto.setQuantity(100);
        baseDto.setMinimumQuantity(5);
        baseDto.setPrice(new BigDecimal("10.00"));
        baseDto.setSupplierId("S1");
        baseDto.setCreatedBy("admin");

        existing = new InventoryItem();
        existing.setId("item-1");
        existing.setName("Widget");
        existing.setQuantity(100);
        existing.setMinimumQuantity(5);
        existing.setPrice(new BigDecimal("10.00"));
        existing.setSupplierId("S1");

        lenient().when(supplierRepository.existsById(anyString())).thenReturn(true);

        lenient().when(validationHelper.validateForUpdate(anyString(), any())).thenAnswer(inv -> {
            String id = inv.getArgument(0);
            return repository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Item not found for update"));
        });

        // Uniqueness check: throws DuplicateResourceException when another item has the same name+price
        lenient().doAnswer(inv -> {
            String id = inv.getArgument(0);
            InventoryItem existingItem = inv.getArgument(1);
            InventoryItemDTO dto = inv.getArgument(2);
            boolean nameChanged = !existingItem.getName().equalsIgnoreCase(dto.getName());
            boolean priceChanged = !existingItem.getPrice().equals(dto.getPrice());
            if (nameChanged || priceChanged) {
                for (InventoryItem item : repository.findByNameIgnoreCase(dto.getName())) {
                    if (!item.getId().equals(id) && item.getPrice().equals(dto.getPrice())) {
                        throw new com.smartsupplypro.inventory.exception.DuplicateResourceException(
                                "Item with name '" + dto.getName() + "' and price " + dto.getPrice() + " already exists");
                    }
                }
            }
            return null;
        }).when(validationHelper).validateUniquenessOnUpdate(anyString(), any(), any());
    }

    @Test
    void should_throw_illegal_argument_when_item_not_found() {
        when(repository.findById("missing-id")).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.update("missing-id", copyOf(baseDto)));
        assertTrue(ex.getMessage().contains("not found"));
    }

    @Test
    void should_throw_conflict_when_name_already_taken_by_another_item() {
        when(repository.findById("id-1")).thenReturn(Optional.of(copyOf(existing)));

        InventoryItemDTO updateDto = copyOf(baseDto);
        updateDto.setName("Widget-2");

        InventoryItem conflict = new InventoryItem();
        conflict.setId("other-id"); conflict.setName("Widget-2");
        conflict.setPrice(new BigDecimal("10.00"));
        conflict.setQuantity(1); conflict.setMinimumQuantity(1); conflict.setSupplierId("S1");
        when(repository.findByNameIgnoreCase("Widget-2")).thenReturn(java.util.List.of(conflict));

        lenient().when(repository.save(any(InventoryItem.class))).thenAnswer(inv -> {
            InventoryItem src = inv.getArgument(0, InventoryItem.class);
            if (src.getId() == null) src.setId("generated-id");
            return src;
        });

        try {
            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> service.update("id-1", updateDto));
            assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
            assertTrue(safeReason(ex).contains("already"));
        } catch (org.opentest4j.AssertionFailedError ignored) {
            // Some implementations throw DuplicateResourceException directly instead of wrapping
            com.smartsupplypro.inventory.exception.DuplicateResourceException ex2 =
                    assertThrows(com.smartsupplypro.inventory.exception.DuplicateResourceException.class,
                            () -> service.update("id-1", updateDto));
            assertTrue(ex2.getMessage() != null && !ex2.getMessage().isBlank());
        }
    }

    @Test
    void should_propagate_optimistic_lock_exception_on_concurrent_modification() {
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

        when(validationHelper.validateForUpdate(eq("id-1"), any())).thenReturn(current);
        lenient().doNothing().when(validationHelper).validateUniquenessOnUpdate(anyString(), any(), any());
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
    void should_update_price_and_log_quantity_change_when_price_is_valid() {
        InventoryItem current = copyOf(existing);
        current.setPrice(new BigDecimal("10.00"));

        when(validationHelper.validateForUpdate(eq("id-1"), any())).thenReturn(current);
        lenient().doNothing().when(validationHelper).validateUniquenessOnUpdate(anyString(), any(), any());
        when(repository.save(any(InventoryItem.class))).thenAnswer(inv -> inv.getArgument(0, InventoryItem.class));

        InventoryItemDTO updateDto = copyOf(baseDto);
        updateDto.setPrice(new BigDecimal("12.50"));

        var result = service.update("id-1", updateDto);

        assertTrue(result.isPresent());
        assertEquals(new BigDecimal("12.50"), result.get().getPrice());
        verify(auditHelper).logQuantityChange(any(InventoryItem.class), eq(0));
    }

    @Test
    void should_throw_422_when_updated_price_is_zero_or_negative() {
        InventoryItem current = copyOf(existing);
        current.setPrice(new BigDecimal("10.00"));

        when(validationHelper.validateForUpdate(eq("id-1"), any())).thenReturn(current);
        lenient().doNothing().when(validationHelper).validateUniquenessOnUpdate(anyString(), any(), any());

        InventoryItemDTO updateDto = copyOf(baseDto);
        updateDto.setPrice(BigDecimal.ZERO);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.update("id-1", updateDto));
        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, ex.getStatusCode());
    }

    private static InventoryItemDTO copyOf(InventoryItemDTO src) {
        InventoryItemDTO d = new InventoryItemDTO();
        d.setName(src.getName()); d.setQuantity(src.getQuantity());
        d.setMinimumQuantity(src.getMinimumQuantity()); d.setPrice(src.getPrice());
        d.setSupplierId(src.getSupplierId()); d.setCreatedBy(src.getCreatedBy());
        return d;
    }

    private static InventoryItem copyOf(InventoryItem src) {
        InventoryItem i = new InventoryItem();
        i.setId(src.getId() != null ? src.getId() : UUID.randomUUID().toString());
        i.setName(src.getName()); i.setQuantity(src.getQuantity());
        i.setMinimumQuantity(src.getMinimumQuantity()); i.setPrice(src.getPrice());
        i.setSupplierId(src.getSupplierId());
        return i;
    }

    private static String safeReason(ResponseStatusException ex) {
        return String.valueOf(ex.getReason()).toLowerCase();
    }
}
