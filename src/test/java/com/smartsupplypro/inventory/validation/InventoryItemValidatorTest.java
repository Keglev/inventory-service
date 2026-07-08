package com.smartsupplypro.inventory.validation;

import java.math.BigDecimal;
import java.util.function.Consumer;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.model.InventoryItem;

/**
 * Unit tests for {@link InventoryItemValidator}.
 *
 * <p>Covers pure format and business-rule guards: required-field rejection,
 * deletion preconditions, and standalone price/quantity guards.
 * Persistence-backed tests live in {@link InventoryItemLookupValidatorTest}.</p>
 */
class InventoryItemValidatorTest {

    record InvalidBaseCase(Consumer<InventoryItemDTO> apply, String expected) {}

    static Stream<InvalidBaseCase> invalidBaseInputs() {
        return Stream.of(
            new InvalidBaseCase(d -> d.setName(null),  "Product name cannot be null or empty"),
            new InvalidBaseCase(d -> d.setName("   "), "Product name cannot be null or empty"),
            new InvalidBaseCase(d -> d.setQuantity(-1), "Quantity cannot be negative"),
            new InvalidBaseCase(d -> d.setPrice(null), "Price must be positive or greater than zero"),
            new InvalidBaseCase(d -> d.setPrice(new BigDecimal("-5.00")), "Price must be positive or greater than zero"),
            new InvalidBaseCase(d -> d.setSupplierId(" "), "Supplier ID must be provided"),
            new InvalidBaseCase(d -> d.setCreatedBy(null), "CreatedBy must be provided")
        );
    }

    private static InventoryItemDTO validDTO() {
        return InventoryItemDTO.builder()
                .id("item-1").name("Monitor").quantity(10)
                .price(new BigDecimal("199.99")).supplierId("supplier-1")
                .createdBy("admin").build();
    }

    /**
     * Required-field validation via {@link InventoryItemValidator#validateBase(InventoryItemDTO)}.
     */
    @Nested
    class ValidateBase {
        @Test
        void should_pass_when_all_fields_are_valid() {
            assertDoesNotThrow(() -> InventoryItemValidator.validateBase(validDTO()));
        }

        @ParameterizedTest
        @MethodSource("com.smartsupplypro.inventory.validation.InventoryItemValidatorTest#invalidBaseInputs")
        void should_fail_when_input_is_invalid(InvalidBaseCase c) {
            InventoryItemDTO dto = validDTO();
            c.apply().accept(dto);
            assertEquals(c.expected(), assertThrows(IllegalArgumentException.class,
                    () -> InventoryItemValidator.validateBase(dto)).getMessage());
        }
    }

    /**
     * Deletion preconditions via {@link InventoryItemValidator#assertQuantityIsZeroForDeletion(InventoryItem)}.
     */
    @Nested
    class DeletionGuards {
        @Test
        void should_fail_when_item_has_stock() {
            InventoryItem item = new InventoryItem();
            item.setId("item-1"); item.setQuantity(5);
            assertEquals(
                "You still have merchandise in stock. " +
                "You need to first remove items from stock by changing quantity.",
                assertThrows(IllegalStateException.class,
                        () -> InventoryItemValidator.assertQuantityIsZeroForDeletion(item)).getMessage());
        }

        @Test
        void should_pass_when_quantity_is_zero() {
            InventoryItem item = new InventoryItem();
            item.setId("item-1"); item.setQuantity(0);
            assertDoesNotThrow(() -> InventoryItemValidator.assertQuantityIsZeroForDeletion(item));
        }
    }

    /**
     * Standalone price and quantity guards.
     */
    @Nested
    @TestInstance(TestInstance.Lifecycle.PER_CLASS)
    class PriceAndQuantityGuards {
        Stream<BigDecimal> invalidPrices() {
            return Stream.of(null, BigDecimal.ZERO, new BigDecimal("-0.01"));
        }

        @ParameterizedTest
        @MethodSource("invalidPrices")
        void should_reject_invalid_price(BigDecimal price) {
            assertEquals(HttpStatus.UNPROCESSABLE_CONTENT,
                    assertThrows(ResponseStatusException.class,
                            () -> InventoryItemValidator.assertPriceValid(price)).getStatusCode());
        }

        @Test
        void should_accept_positive_price() {
            assertDoesNotThrow(() -> InventoryItemValidator.assertPriceValid(new BigDecimal("0.01")));
        }

        @ParameterizedTest
        @ValueSource(ints = {-1, -100})
        void should_reject_negative_resulting_quantity(int qty) {
            assertEquals(HttpStatus.UNPROCESSABLE_CONTENT,
                    assertThrows(ResponseStatusException.class,
                            () -> InventoryItemValidator.assertFinalQuantityNonNegative(qty)).getStatusCode());
        }

        @ParameterizedTest
        @ValueSource(ints = {0, 10})
        void should_accept_non_negative_resulting_quantity(int qty) {
            assertDoesNotThrow(() -> InventoryItemValidator.assertFinalQuantityNonNegative(qty));
        }
    }
}
