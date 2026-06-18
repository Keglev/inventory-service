package com.smartsupplypro.inventory.validation;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.smartsupplypro.inventory.exception.DuplicateResourceException;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;

/**
 * Unit tests for {@link InventoryItemLookupValidator}.
 *
 * <p>Covers the persistence-backed existence and uniqueness guards.
 * Repository interactions are mocked to isolate validator logic.
 * Pure format guards with no DB dependency are tested in
 * {@link InventoryItemValidatorTest}.</p>
 */
@SuppressWarnings("unused")
class InventoryItemLookupValidatorTest {

    /**
     * Existence checks via {@link InventoryItemLookupValidator#validateExists(String, InventoryItemRepository)}.
     */
    @Nested
    class ExistenceChecks {
        @Test
        void should_return_entity_when_present() {
            InventoryItemRepository repo = mock(InventoryItemRepository.class);
            InventoryItem item = new InventoryItem(); item.setId("item-1");
            when(repo.findById("item-1")).thenReturn(Optional.of(item));
            InventoryItem found = InventoryItemLookupValidator.validateExists("item-1", repo);
            assertNotNull(found);
            assertEquals("item-1", found.getId());
        }

        @Test
        void should_throw_404_when_absent() {
            InventoryItemRepository repo = mock(InventoryItemRepository.class);
            when(repo.findById("missing")).thenReturn(Optional.empty());
            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> InventoryItemLookupValidator.validateExists("missing", repo));
            assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        }
    }

    /**
     * Uniqueness checks via {@link InventoryItemLookupValidator#validateInventoryItemNotExists}.
     */
    @Nested
    class UniquenessChecks {
        @Test
        void should_throw_on_duplicate_name_and_price_with_excludeId() {
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
        void should_allow_same_id_or_different_price_with_excludeId() {
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
        void should_throw_on_duplicate_name_and_price_without_excludeId() {
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
