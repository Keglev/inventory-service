package com.smartsupplypro.inventory.validation;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.exception.DuplicateResourceException;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * # InventoryItemValidatorBusinessRulesTest
 *
 * Incremental unit tests for {@link InventoryItemValidator}.
 *
 * <p><strong>Purpose</strong></p>
 * Complements {@code InventoryItemValidatorTest} by covering the remaining public validator
 * methods and edge-case branches that are often missed when the validator is exercised only
 * indirectly via service/controller tests.
 *
 * <p><strong>Operations Tested</strong></p>
 * <ul>
 *   <li>Existence checks: {@link InventoryItemValidator#validateExists(String, InventoryItemRepository)}</li>
 *   <li>Patch/update guards: {@link InventoryItemValidator#assertPriceValid(BigDecimal)}</li>
 *   <li>Quantity safety: {@link InventoryItemValidator#assertFinalQuantityNonNegative(int)}</li>
 *   <li>Duplicate rules: both overloads of {@link InventoryItemValidator#validateInventoryItemNotExists}</li>
 *   <li>Additional base validation branches (blank name, null price)</li>
 * </ul>
 */
class InventoryItemValidatorBusinessRulesTest {

    private static InventoryItemDTO baseDto() {
        return InventoryItemDTO.builder()
                .id("item-1")
                .name("Monitor")
                .quantity(10)
                .price(new BigDecimal("199.99"))
                .supplierId("supplier-1")
                .createdBy("admin")
                .build();
    }

    @Test
    @DisplayName("validateBase: rejects blank name and null price")
    void validateBase_rejectsBlankName_andNullPrice() {
        // GIVEN: blank name
        InventoryItemDTO blankName = baseDto();
        blankName.setName("   ");

        // WHEN/THEN
        IllegalArgumentException nameEx = assertThrows(IllegalArgumentException.class,
                () -> InventoryItemValidator.validateBase(blankName));
        assertEquals("Product name cannot be null or empty", nameEx.getMessage());

        // GIVEN: null price
        InventoryItemDTO nullPrice = baseDto();
        nullPrice.setPrice(null);

        // WHEN/THEN
        IllegalArgumentException priceEx = assertThrows(IllegalArgumentException.class,
                () -> InventoryItemValidator.validateBase(nullPrice));
        assertEquals("Price must be positive or greater than zero", priceEx.getMessage());
    }

    @Test
    @DisplayName("validateInventoryItemNotExists (update overload): throws when same name+price already exists")
    void validateInventoryItemNotExists_updateOverload_duplicate_throws() {
        // GIVEN
        InventoryItemRepository repo = mock(InventoryItemRepository.class);
        InventoryItem existing = new InventoryItem();
        existing.setId("existing-1");
        existing.setName("Widget");
        existing.setPrice(new BigDecimal("10.00"));

        when(repo.findByNameIgnoreCase("Widget")).thenReturn(List.of(existing));

        // WHEN/THEN
        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class,
                () -> InventoryItemValidator.validateInventoryItemNotExists("Widget", new BigDecimal("10.00"), repo));
        assertEquals("An inventory item with this name and price already exists.", ex.getMessage());
    }

    @Test
    @DisplayName("validateInventoryItemNotExists (create overload): allows same ID and ignores different price")
    void validateInventoryItemNotExists_createOverload_allowsSameId_orDifferentPrice() {
        InventoryItemRepository repo = mock(InventoryItemRepository.class);

        InventoryItem sameId = new InventoryItem();
        sameId.setId("item-1");
        sameId.setName("Widget");
        sameId.setPrice(new BigDecimal("10.00"));

        InventoryItem differentPrice = new InventoryItem();
        differentPrice.setId("other-2");
        differentPrice.setName("Widget");
        differentPrice.setPrice(new BigDecimal("11.00"));

        when(repo.findByNameIgnoreCase("Widget")).thenReturn(List.of(sameId, differentPrice));

        // THEN: same ID is excluded; different price is not a duplicate
        assertDoesNotThrow(() -> InventoryItemValidator.validateInventoryItemNotExists(
                "item-1",
                "Widget",
                new BigDecimal("10.00"),
                repo));
    }

    @Test
    @DisplayName("validateExists: returns entity when present; throws 404 when missing")
    void validateExists_present_returnsEntity_missing_throws404() {
        InventoryItemRepository repo = mock(InventoryItemRepository.class);

        InventoryItem item = new InventoryItem();
        item.setId("item-1");

        when(repo.findById("item-1")).thenReturn(Optional.of(item));
        when(repo.findById("missing")).thenReturn(Optional.empty());

        // WHEN
        InventoryItem found = InventoryItemValidator.validateExists("item-1", repo);

        // THEN
        assertNotNull(found);
        assertEquals("item-1", found.getId());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> InventoryItemValidator.validateExists("missing", repo));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    @DisplayName("assertFinalQuantityNonNegative: rejects negatives with 422")
    void assertFinalQuantityNonNegative_negative_throws422() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> InventoryItemValidator.assertFinalQuantityNonNegative(-1));
        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, ex.getStatusCode());

        assertDoesNotThrow(() -> InventoryItemValidator.assertFinalQuantityNonNegative(0));
        assertDoesNotThrow(() -> InventoryItemValidator.assertFinalQuantityNonNegative(10));
    }

    @Test
    @DisplayName("assertPriceValid: rejects null/zero/negative with 422")
    void assertPriceValid_rejectsNullAndNonPositive() {
        ResponseStatusException nullEx = assertThrows(ResponseStatusException.class,
                () -> InventoryItemValidator.assertPriceValid(null));
        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, nullEx.getStatusCode());

        ResponseStatusException zeroEx = assertThrows(ResponseStatusException.class,
                () -> InventoryItemValidator.assertPriceValid(BigDecimal.ZERO));
        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, zeroEx.getStatusCode());

        ResponseStatusException negEx = assertThrows(ResponseStatusException.class,
                () -> InventoryItemValidator.assertPriceValid(new BigDecimal("-0.01")));
        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, negEx.getStatusCode());

        assertDoesNotThrow(() -> InventoryItemValidator.assertPriceValid(new BigDecimal("0.01")));
    }
}
