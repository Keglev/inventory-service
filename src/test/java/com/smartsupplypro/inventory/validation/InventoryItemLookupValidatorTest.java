package com.smartsupplypro.inventory.validation;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

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
        void should_throw_when_another_item_shares_name_and_price_and_an_exclude_id_is_given() {
            InventoryItemRepository repo = mock(InventoryItemRepository.class);
            InventoryItem existing = new InventoryItem();
            existing.setId("existing-id"); existing.setName("DuplicateItem");
            existing.setPrice(new BigDecimal("10.00"));
            when(repo.findByNameIgnoreCase("DuplicateItem")).thenReturn(List.of(existing));
            DuplicateResourceException ex = assertThrows(DuplicateResourceException.class,
                    () -> InventoryItemLookupValidator.validateInventoryItemNotExists(
                            "new-id", "DuplicateItem", new BigDecimal("10.00"), repo));
            assertEquals("Another inventory item with this name and price already exists.", ex.getMessage());
        }

        @Test
        void should_allow_when_the_match_is_the_same_id_or_a_different_price() {
            InventoryItemRepository repo = mock(InventoryItemRepository.class);
            InventoryItem sameId = new InventoryItem();
            sameId.setId("item-1"); sameId.setName("Widget"); sameId.setPrice(new BigDecimal("10.00"));
            InventoryItem diffPrice = new InventoryItem();
            diffPrice.setId("other-2"); diffPrice.setName("Widget"); diffPrice.setPrice(new BigDecimal("11.00"));
            when(repo.findByNameIgnoreCase("Widget")).thenReturn(List.of(sameId, diffPrice));
            // same ID is excluded; different price is not a conflict
            assertDoesNotThrow(() -> InventoryItemLookupValidator.validateInventoryItemNotExists(
                    "item-1", "Widget", new BigDecimal("10.00"), repo));
        }

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

    /**
     * Uniqueness checks via {@link InventoryItemLookupValidator#validateSkuNotExists}.
     */
    @Nested
    class SkuUniquenessChecks {
        @Test
        void should_throw_when_another_item_has_the_same_sku() {
            InventoryItemRepository repo = mock(InventoryItemRepository.class);
            InventoryItem other = new InventoryItem();
            other.setId("other-id");
            other.setSku("SKU-DUP-1");
            when(repo.findBySkuIgnoreCase("SKU-DUP-1")).thenReturn(List.of(other));
            DuplicateResourceException ex = assertThrows(DuplicateResourceException.class,
                () -> InventoryItemLookupValidator.validateSkuNotExists("self-id", "SKU-DUP-1", repo));
            assertEquals("sku", ex.getField());
        }

        @Test
        void should_pass_when_only_the_same_item_has_the_sku() {
            InventoryItemRepository repo = mock(InventoryItemRepository.class);
            InventoryItem self = new InventoryItem();
            self.setId("self-id");
            self.setSku("SKU-DUP-2");
            when(repo.findBySkuIgnoreCase("SKU-DUP-2")).thenReturn(List.of(self));
            assertDoesNotThrow(
                () -> InventoryItemLookupValidator.validateSkuNotExists("self-id", "SKU-DUP-2", repo));
        }
    }
}
