package com.smartsupplypro.inventory.validation;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.smartsupplypro.inventory.exception.DuplicateResourceException;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;

/**
 * Unit tests for {@link InventoryItemLookupValidator}.
 *
 * <p>Covers the persistence-backed uniqueness guards.
 * Repository interactions are mocked to isolate validator logic.
 * Pure format guards with no DB dependency are tested in
 * {@link InventoryItemValidatorTest}.</p>
 */
class InventoryItemLookupValidatorTest {

    /**
     * Uniqueness checks via {@link InventoryItemLookupValidator#validateInventoryItemNotExists}.
     */
    @Nested
    class UniquenessChecks {
        @Test
        void should_throw_when_another_item_shares_name_and_price_and_no_exclude_id_is_given() {
            InventoryItemRepository repo = mock(InventoryItemRepository.class);
            InventoryItem existing = new InventoryItem();
            existing.setId("existing-1"); existing.setName("Widget");
            existing.setPrice(new BigDecimal("10.00"));
            when(repo.findByNameIgnoreCase("Widget")).thenReturn(List.of(existing));
            DuplicateResourceException ex = assertThrows(DuplicateResourceException.class,
                    () -> InventoryItemLookupValidator.validateInventoryItemNotExists(
                            "Widget", new BigDecimal("10.00"), repo));
            assertEquals("An inventory item with this name and price already exists.", ex.getMessage());
        }

        @Test
        void should_pass_when_name_and_price_are_unique() {
            InventoryItemRepository repo = mock(InventoryItemRepository.class);
            when(repo.findByNameIgnoreCase("UniqueItem")).thenReturn(List.of());
            assertDoesNotThrow(() -> InventoryItemLookupValidator.validateInventoryItemNotExists(
                    "UniqueItem", new BigDecimal("25.00"), repo));
        }
    }

}
