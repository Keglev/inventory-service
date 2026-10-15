package com.smartsupplypro.inventory.validation;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.data.domain.Sort;

import com.smartsupplypro.inventory.exception.InvalidRequestException;
import com.smartsupplypro.inventory.model.InventoryItem;

/**
 * Unit tests for {@link SortValidator} against the {@link InventoryItem} entity.
 */
class SortValidatorTest {

    @ParameterizedTest
    @ValueSource(strings = {"name", "sku", "quantity", "minimumQuantity", "price", "createdAt", "supplier.name"})
    void should_accept_when_the_sort_property_resolves_on_the_entity(String property) {
        assertDoesNotThrow(() -> SortValidator.requireKnownProperties(Sort.by(property), InventoryItem.class));
    }

    @Test
    void should_accept_when_the_request_is_unsorted() {
        assertDoesNotThrow(() -> SortValidator.requireKnownProperties(Sort.unsorted(), InventoryItem.class));
    }

    @ParameterizedTest
    @ValueSource(strings = {"doesNotExist", "supplier.nope", "LOWER(name)", "price;drop"})
    void should_reject_when_the_sort_property_does_not_resolve(String property) {
        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> SortValidator.requireKnownProperties(Sort.by(property), InventoryItem.class));
        assertEquals("Unsupported sort property: " + property, ex.getMessage());
    }

    @Test
    void should_reject_when_any_order_of_a_multi_property_sort_is_unknown() {
        Sort sort = Sort.by("name").and(Sort.by("doesNotExist"));
        assertThrows(InvalidRequestException.class,
                () -> SortValidator.requireKnownProperties(sort, InventoryItem.class));
    }
}
