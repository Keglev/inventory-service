package com.smartsupplypro.inventory.service.impl.inventoryitem;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.exception.DuplicateResourceException;
import com.smartsupplypro.inventory.mapper.InventoryItemMapper;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.service.impl.InventoryItemServiceImpl;
import com.smartsupplypro.inventory.service.impl.inventory.InventoryItemAuditHelper;
import com.smartsupplypro.inventory.service.impl.inventory.InventoryItemValidationHelper;

/**
 * Unit tests for {@link InventoryItemServiceImpl} read and targeted-mutation operations:
 * {@code getAll}, {@code getById}, {@code countItems}, {@code adjustQuantity},
 * {@code updatePrice}, and {@code renameItem}.
 */
@ExtendWith(MockitoExtension.class)
class InventoryItemServiceImplReadAndAdjustmentsTest {

    @Mock private InventoryItemRepository repository;
    @Mock private InventoryItemValidationHelper validationHelper;
    @Mock private InventoryItemAuditHelper auditHelper;
    @SuppressWarnings("FieldMayBeFinal")
    @Spy  private InventoryItemMapper inventoryItemMapper = new InventoryItemMapper();
    @InjectMocks private InventoryItemServiceImpl service;

    @BeforeEach
    void setUp() {
        InventoryItemServiceImplTestHelper.authenticateAsOAuth2("admin", "ADMIN");
    }

    /**
     * Tests for {@code getAll()}, {@code getById()}, and {@code countItems()}.
     */
    @Nested
    class ReadOperations {

        @Test
        void should_map_all_entities_to_dtos() {
            InventoryItem e1 = item("i-1", "Widget", 10, new BigDecimal("2.50"), "S1");
            InventoryItem e2 = item("i-2", "Gadget", 0,  new BigDecimal("9.99"), "S2");
            when(repository.findByActiveTrue()).thenReturn(List.of(e1, e2));

            List<InventoryItemDTO> result = service.getAll();

            assertEquals(2, result.size());
            assertEquals("i-1", result.get(0).getId());
            assertEquals(new BigDecimal("2.50"), result.get(0).getPrice());
            assertEquals("i-2", result.get(1).getId());
        }

        @Test
        void should_map_optional_entity_to_optional_dto_when_item_exists() {
            InventoryItem e = item("i-1", "Widget", 10, new BigDecimal("2.50"), "S1");
            when(repository.findById("i-1")).thenReturn(Optional.of(e));

            Optional<InventoryItemDTO> result = service.getById("i-1");

            assertTrue(result.isPresent());
            assertEquals("i-1", result.get().getId());
        }

        @Test
        void should_delegate_count_to_repository() {
            when(repository.countByActiveTrue()).thenReturn(123L);

            assertEquals(123L, service.countItems());
        }
    }

    /**
     * Tests for {@code adjustQuantity(String, int, StockChangeReason)}.
     */
    @Nested
    class AdjustQuantity {

        @Test
        void should_update_quantity_and_log_audit_entry() {
            InventoryItem existing = item("i-1", "Widget", 5, new BigDecimal("2.50"), "S1");
            when(validationHelper.validateExists("i-1")).thenReturn(existing);
            when(repository.save(any(InventoryItem.class))).thenAnswer(inv -> inv.getArgument(0, InventoryItem.class));

            InventoryItemDTO result = service.adjustQuantity("i-1", 3, StockChangeReason.MANUAL_UPDATE);

            assertEquals(8, result.getQuantity());
            verify(auditHelper).logQuantityAdjustment(any(InventoryItem.class), eq(3), eq(StockChangeReason.MANUAL_UPDATE));
        }

        @Test
        void should_throw_422_when_adjustment_would_result_in_negative_quantity() {
            InventoryItem existing = item("i-1", "Widget", 1, new BigDecimal("2.50"), "S1");
            when(validationHelper.validateExists("i-1")).thenReturn(existing);

            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> service.adjustQuantity("i-1", -5, StockChangeReason.MANUAL_UPDATE));
            assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, ex.getStatusCode());
            verify(repository, never()).save(any());
        }
    }

    /**
     * Tests for {@code updatePrice(String, BigDecimal)}.
     */
    @Nested
    class UpdatePrice {

        @Test
        void should_save_new_price_and_log_price_change() {
            InventoryItem existing = item("i-1", "Widget", 5, new BigDecimal("2.50"), "S1");
            when(validationHelper.validateExists("i-1")).thenReturn(existing);
            when(repository.save(any(InventoryItem.class))).thenAnswer(inv -> inv.getArgument(0, InventoryItem.class));

            InventoryItemDTO result = service.updatePrice("i-1", new BigDecimal("3.00"));

            assertEquals(new BigDecimal("3.00"), result.getPrice());
            verify(auditHelper).logPriceChange("i-1", new BigDecimal("3.00"));
        }

        @Test
        void should_throw_422_when_price_is_zero_or_negative() {
            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> service.updatePrice("i-1", BigDecimal.ZERO));
            assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, ex.getStatusCode());
        }
    }

    /**
     * Tests for {@code renameItem(String, String)}.
     */
    @Nested
    class RenameItem {

        @Test
        void should_throw_when_new_name_is_blank() {
            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> service.renameItem("i-1", "  "));
            assertTrue(ex.getMessage().toLowerCase().contains("cannot be empty"));
        }

        @Test
        void should_throw_when_same_supplier_already_has_an_item_with_that_name() {
            InventoryItem existing = item("i-1", "Old", 0, BigDecimal.ONE, "S1");
            InventoryItem dup      = item("i-2", "Widget", 0, BigDecimal.ONE, "S1");

            when(validationHelper.validateExists("i-1")).thenReturn(existing);
            when(repository.findByNameIgnoreCase("Widget")).thenReturn(List.of(dup));

            DuplicateResourceException ex = assertThrows(DuplicateResourceException.class,
                    () -> service.renameItem("i-1", "Widget"));
            assertTrue(ex.getMessage().toLowerCase().contains("already exists"));
            verify(repository, never()).save(any());
        }

        @Test
        void should_allow_rename_when_duplicate_belongs_to_different_supplier() {
            InventoryItem existing    = item("i-1", "Old", 0, BigDecimal.ONE, "S1");
            InventoryItem otherSupplier = item("i-2", "Widget", 0, BigDecimal.ONE, "S2");

            when(validationHelper.validateExists("i-1")).thenReturn(existing);
            when(repository.findByNameIgnoreCase("Widget")).thenReturn(List.of(otherSupplier));
            when(repository.save(any(InventoryItem.class))).thenAnswer(inv -> inv.getArgument(0, InventoryItem.class));

            // Whitespace-padded name must be trimmed before saving
            InventoryItemDTO result = service.renameItem("i-1", " Widget ");

            assertEquals("Widget", result.getName());
            verify(repository).save(any(InventoryItem.class));
        }

        @Test
        void should_allow_rename_when_only_duplicate_found_is_the_same_item() {
            InventoryItem existing = item("i-1", "Old", 0, BigDecimal.ONE, "S1");
            InventoryItem self     = item("i-1", "Widget", 0, BigDecimal.ONE, "S1");

            when(validationHelper.validateExists("i-1")).thenReturn(existing);
            when(repository.findByNameIgnoreCase("Widget")).thenReturn(List.of(self));
            when(repository.save(any(InventoryItem.class))).thenAnswer(inv -> inv.getArgument(0, InventoryItem.class));

            InventoryItemDTO result = service.renameItem("i-1", "Widget");

            assertEquals("Widget", result.getName());
            verify(repository).save(any(InventoryItem.class));
        }
    }

    private static InventoryItem item(String id, String name, int qty, BigDecimal price, String supplierId) {
        InventoryItem i = new InventoryItem();
        i.setId(id); i.setName(name); i.setQuantity(qty);
        i.setMinimumQuantity(1); i.setPrice(price); i.setSupplierId(supplierId);
        i.setSku("SKU-SVC-" + id);
        return i;
    }
}
