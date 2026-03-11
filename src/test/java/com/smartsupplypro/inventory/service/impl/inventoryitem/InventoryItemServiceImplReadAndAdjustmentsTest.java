package com.smartsupplypro.inventory.service.impl.inventoryitem;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.service.impl.InventoryItemServiceImpl;
import com.smartsupplypro.inventory.service.impl.inventory.InventoryItemAuditHelper;
import com.smartsupplypro.inventory.service.impl.inventory.InventoryItemValidationHelper;

/**
 * Focused unit tests for {@link InventoryItemServiceImpl} operations not covered by the more scenario-driven
 * service tests (save/search/update/delete).
 *
 * <p><strong>Scope</strong>:
 * <ul>
 *   <li><b>Read operations</b> ({@code getAll}, {@code getById}, {@code countItems})</li>
 *   <li><b>Targeted mutations</b> ({@code adjustQuantity}, {@code updatePrice}, {@code renameItem})</li>
 * </ul>
 *
 * <p><strong>Approach</strong>:
 * <ul>
 *   <li>Mocks {@link InventoryItemValidationHelper} and {@link InventoryItemAuditHelper} to validate integration
 *       points without re-testing their internal implementations.</li>
 *   <li>Uses Given/When/Then comments for consistent enterprise readability across the suite.</li>
 * </ul>
 *
 * <p><strong>Why this exists</strong>:
 * These endpoints have small but important branch behavior (fast-fail validation, trimming, conflict rules)
 * and are easy to miss if tests focus only on CRUD scenarios.
 */
@ExtendWith(MockitoExtension.class)
class InventoryItemServiceImplReadAndAdjustmentsTest {

    @Mock private InventoryItemRepository repository;
    @Mock private InventoryItemValidationHelper validationHelper;
    @Mock private InventoryItemAuditHelper auditHelper;

    @InjectMocks private InventoryItemServiceImpl service;

    /**
     * Executed by JUnit 5 via {@link BeforeEach}; may be flagged as "unused" by some IDE inspections.
     */
    @BeforeEach
    @SuppressWarnings("unused")
    void setUp() {
        InventoryItemServiceImplTestHelper.authenticateAsOAuth2("admin", "ADMIN");
    }

    @Test
    @DisplayName("getAll: maps entities to DTOs")
    void getAll_mapsToDtos() {
        // GIVEN - repository returns two entities with distinct fields
        InventoryItem e1 = new InventoryItem();
        e1.setId("i-1");
        e1.setName("Widget");
        e1.setQuantity(10);
        e1.setMinimumQuantity(1);
        e1.setPrice(new BigDecimal("2.50"));
        e1.setSupplierId("S1");

        InventoryItem e2 = new InventoryItem();
        e2.setId("i-2");
        e2.setName("Gadget");
        e2.setQuantity(0);
        e2.setMinimumQuantity(0);
        e2.setPrice(new BigDecimal("9.99"));
        e2.setSupplierId("S2");

        when(repository.findAll()).thenReturn(List.of(e1, e2));

    // WHEN
        List<InventoryItemDTO> result = service.getAll();

    // THEN - mapper preserves key fields (id/price)
        assertEquals(2, result.size());
        assertEquals("i-1", result.get(0).getId());
        assertEquals(new BigDecimal("2.50"), result.get(0).getPrice());
        assertEquals("i-2", result.get(1).getId());
    }

    @Test
    @DisplayName("getById: maps Optional entity to Optional DTO")
    void getById_mapsOptional() {
        // GIVEN
        InventoryItem e = new InventoryItem();
        e.setId("i-1");
        e.setName("Widget");
        e.setQuantity(10);
        e.setMinimumQuantity(1);
        e.setPrice(new BigDecimal("2.50"));
        e.setSupplierId("S1");

        when(repository.findById("i-1")).thenReturn(Optional.of(e));

        // WHEN
        Optional<InventoryItemDTO> result = service.getById("i-1");

        // THEN
        assertTrue(result.isPresent());
        assertEquals("i-1", result.get().getId());
    }

    @Test
    @DisplayName("countItems: delegates to repository.count")
    void countItems_delegatesToRepositoryCount() {
        // GIVEN
        when(repository.count()).thenReturn(123L);

        // WHEN/THEN
        assertEquals(123L, service.countItems());
    }

    @Test
    @DisplayName("adjustQuantity: updates quantity, saves, and logs adjustment")
    void adjustQuantity_happyPath_updatesAndLogs() {
        // GIVEN - a persisted item exists
        InventoryItem existing = new InventoryItem();
        existing.setId("i-1");
        existing.setName("Widget");
        existing.setQuantity(5);
        existing.setMinimumQuantity(1);
        existing.setPrice(new BigDecimal("2.50"));
        existing.setSupplierId("S1");

        when(validationHelper.validateExists("i-1")).thenReturn(existing);
        when(repository.save(any(InventoryItem.class))).thenAnswer(inv -> inv.getArgument(0, InventoryItem.class));

        // WHEN - stock-in adjustment
        InventoryItemDTO result = service.adjustQuantity("i-1", 3, StockChangeReason.MANUAL_UPDATE);

        // THEN - quantity is updated and an audit entry is written
        assertEquals(8, result.getQuantity());
        verify(auditHelper).logQuantityAdjustment(any(InventoryItem.class), eq(3), eq(StockChangeReason.MANUAL_UPDATE));
    }

    @Test
    @DisplayName("adjustQuantity: negative resulting stock -> ResponseStatusException 422")
    void adjustQuantity_negativeResult_throws422() {
        // GIVEN - item has too little stock for requested stock-out delta
        InventoryItem existing = new InventoryItem();
        existing.setId("i-1");
        existing.setQuantity(1);

        when(validationHelper.validateExists("i-1")).thenReturn(existing);

        // WHEN/THEN - service enforces non-negative final quantity
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
            () -> service.adjustQuantity("i-1", -5, StockChangeReason.MANUAL_UPDATE));

        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, ex.getStatusCode());
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("updatePrice: validates price, saves item, and logs price change")
    void updatePrice_happyPath_savesAndLogs() {
        // GIVEN
        InventoryItem existing = new InventoryItem();
        existing.setId("i-1");
        existing.setQuantity(5);
        existing.setPrice(new BigDecimal("2.50"));

        when(validationHelper.validateExists("i-1")).thenReturn(existing);
        when(repository.save(any(InventoryItem.class))).thenAnswer(inv -> inv.getArgument(0, InventoryItem.class));

        // WHEN
        InventoryItemDTO result = service.updatePrice("i-1", new BigDecimal("3.00"));

        // THEN
        assertEquals(new BigDecimal("3.00"), result.getPrice());
        verify(auditHelper).logPriceChange("i-1", new BigDecimal("3.00"));
    }

    @Test
    @DisplayName("updatePrice: invalid price -> ResponseStatusException 422 (fails fast)")
    void updatePrice_invalid_throws422() {
        // WHEN/THEN - price validation happens before any repository lookup
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.updatePrice("i-1", BigDecimal.ZERO));

        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, ex.getStatusCode());
    }

    @Test
    @DisplayName("renameItem: blank name -> IllegalArgumentException")
    void renameItem_blankName_throwsIllegalArgumentException() {
        // WHEN/THEN - blank names are rejected with a descriptive message
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.renameItem("i-1", "  "));

        assertTrue(ex.getMessage() != null && ex.getMessage().toLowerCase().contains("cannot be empty"));
    }

    @Test
    @DisplayName("renameItem: same supplier name conflict -> IllegalArgumentException")
    void renameItem_conflictSameSupplier_throwsIllegalArgumentException() {
        // GIVEN - existing item is owned by supplier S1
        InventoryItem existing = new InventoryItem();
        existing.setId("i-1");
        existing.setSupplierId("S1");

        InventoryItem dup = new InventoryItem();
        dup.setId("i-2");
        dup.setSupplierId("S1");

        when(validationHelper.validateExists("i-1")).thenReturn(existing);
        when(repository.findByNameIgnoreCase("Widget"))
                .thenReturn(List.of(dup));

        // WHEN/THEN - rename is rejected because the conflict is within the same supplier scope
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.renameItem("i-1", "Widget"));

        assertTrue(ex.getMessage() != null && ex.getMessage().toLowerCase().contains("already exists"));
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("renameItem: different supplier duplicate name -> allowed")
    void renameItem_duplicateDifferentSupplier_allowsRename() {
        // GIVEN - a duplicate name exists, but owned by another supplier, so this is allowed
        InventoryItem existing = new InventoryItem();
        existing.setId("i-1");
        existing.setSupplierId("S1");

        InventoryItem dupOtherSupplier = new InventoryItem();
        dupOtherSupplier.setId("i-2");
        dupOtherSupplier.setSupplierId("S2");

        when(validationHelper.validateExists("i-1")).thenReturn(existing);
        when(repository.findByNameIgnoreCase("Widget"))
                .thenReturn(List.of(dupOtherSupplier));
        when(repository.save(any(InventoryItem.class))).thenAnswer(inv -> inv.getArgument(0, InventoryItem.class));

        // WHEN - user provides whitespace-padded name; service trims it
        InventoryItemDTO result = service.renameItem("i-1", " Widget ");

        // THEN
        assertEquals("Widget", result.getName());
        verify(repository).save(any(InventoryItem.class));
    }

    @Test
    @DisplayName("renameItem: same item id in duplicates list -> allowed")
    void renameItem_sameIdInDuplicates_allowsRename() {
        // GIVEN - repository returns a "duplicate" that is actually the same entity (same id)
        InventoryItem existing = new InventoryItem();
        existing.setId("i-1");
        existing.setSupplierId("S1");

        InventoryItem dupSelf = new InventoryItem();
        dupSelf.setId("i-1");
        dupSelf.setSupplierId("S1");

        when(validationHelper.validateExists("i-1")).thenReturn(existing);
        when(repository.findByNameIgnoreCase("Widget"))
                .thenReturn(List.of(dupSelf));
        when(repository.save(any(InventoryItem.class))).thenAnswer(inv -> inv.getArgument(0, InventoryItem.class));

        // WHEN
        InventoryItemDTO result = service.renameItem("i-1", "Widget");

        // THEN
        assertEquals("Widget", result.getName());
        verify(repository).save(any(InventoryItem.class));
    }
}
