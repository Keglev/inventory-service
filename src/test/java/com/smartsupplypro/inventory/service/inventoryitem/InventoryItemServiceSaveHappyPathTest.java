package com.smartsupplypro.inventory.service.inventoryitem;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.model.InventoryItem;

/**
 * Happy-path save tests for {@link com.smartsupplypro.inventory.service.impl.InventoryItemServiceImpl}.
 *
 * <p><strong>Coverage</strong>:</p>
 * <ul>
 *   <li>Valid saves persist and trigger initial stock audit logging</li>
 *   <li>Zero-quantity items are allowed</li>
 *   <li>Unique item name path completes successfully</li>
 * </ul>
 */
@SuppressWarnings("unused")
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class InventoryItemServiceSaveHappyPathTest extends InventoryItemServiceSaveTestBase {

    /**
     * Validates that valid inventory items are persisted and initial stock is logged.
     * Scenario: New item with all valid fields and OAuth2 authenticated user.
     * Expected: Item saved and auditHelper.logInitialStock called for audit trail.
     */
    @Test
    void save_shouldPersist_andLogInitialStock() {
        // GIVEN
        authenticateAs("admin", "ROLE_ADMIN");

        // WHEN
        InventoryItemDTO result = inventoryItemService.save(dto);

        // THEN
        assertNotNull(result);
        verify(inventoryItemRepository).save(any(InventoryItem.class));
        verify(auditHelper).logInitialStock(any(InventoryItem.class));
    }

    /**
     * Validates that items with zero quantity (no stock on hand) can be created.
     * Scenario: New item with quantity = 0.
     * Expected: Item saved with 0 quantity and audit log still created.
     */
    @Test
    void save_withZeroQuantity_shouldSucceed() {
        // GIVEN
        authenticateAs("admin", "ROLE_ADMIN");
        dto.setQuantity(0);

        // WHEN
        InventoryItemDTO result = inventoryItemService.save(dto);

        // THEN
        assertNotNull(result);
        verify(auditHelper).logInitialStock(any(InventoryItem.class));
    }

    /**
     * Validates the happy path: new item with no duplicates is saved successfully.
     * Scenario: New unique item created with supplier that exists.
     * Expected: Item persisted and audit helper called.
     */
    @Test
    void save_shouldSucceed_whenNoDuplicateExists() {
        // GIVEN
        authenticateAs("tester", "ROLE_ADMIN");

        when(inventoryItemRepository.findByNameIgnoreCase("Widget")).thenReturn(java.util.List.of());
        when(supplierRepository.existsById("some-supplier")).thenReturn(true);

        InventoryItem savedEntity = InventoryItem.builder()
                .id("new-id")
                .name("Widget")
                .price(BigDecimal.valueOf(10.0))
                .quantity(5)
                .minimumQuantity(1)
                .supplierId("some-supplier")
                .createdBy("tester")
                .build();

        when(inventoryItemRepository.save(any())).thenReturn(savedEntity);

        dto.setName("Widget");
        dto.setPrice(BigDecimal.valueOf(10.0));
        dto.setQuantity(5);
        dto.setSupplierId("some-supplier");
        dto.setCreatedBy("tester");

        // WHEN
        InventoryItemDTO result = inventoryItemService.save(dto);

        // THEN
        assertNotNull(result);
        assertEquals("Widget", result.getName());
        verify(auditHelper).logInitialStock(any(InventoryItem.class));
    }
}
