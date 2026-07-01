package com.smartsupplypro.inventory.validation;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.exception.InvalidRequestException;

/**
 * Unit tests for {@link StockHistoryValidator}.
 *
 * <p>Covers required-field rejection, the zero-delta cross-field rule,
 * PRICE_CHANGE-specific branches, and {@code validateEnum} (accepts every
 * reason constant, rejects only null). All tests are pure unit tests with
 * no Spring context.</p>
 */
class StockHistoryValidatorTest {

    private static StockHistoryDTO validDTO() {
        return StockHistoryDTO.builder()
                .id("sh-1").itemId("item-1").change(5)
                .reason("SOLD").createdBy("admin").build();
    }

    /**
     * Required-field and enum-parsing validation via {@link StockHistoryValidator#validate(StockHistoryDTO)}.
     */
    @Nested
    class CoreValidation {
        @Test
        void should_pass_when_dto_is_valid() {
            assertDoesNotThrow(() -> StockHistoryValidator.validate(validDTO()));
        }

        @Test
        void should_fail_when_itemId_is_null() {
            StockHistoryDTO dto = StockHistoryDTO.builder().id("sh-1").itemId(null)
                    .change(5).reason("SOLD").createdBy("admin").build();
            assertEquals("Item ID cannot be null or empty",
                    assertThrows(InvalidRequestException.class,
                            () -> StockHistoryValidator.validate(dto)).getMessage());
        }

        @Test
        void should_fail_when_itemId_is_blank() {
            // boundary: blank string must be rejected the same as null
            StockHistoryDTO dto = StockHistoryDTO.builder().id("sh-1").itemId("   ")
                    .change(5).reason("SOLD").createdBy("admin").build();
            assertEquals("Item ID cannot be null or empty",
                    assertThrows(InvalidRequestException.class,
                            () -> StockHistoryValidator.validate(dto)).getMessage());
        }

        @Test
        void should_fail_when_reason_is_null() {
            StockHistoryDTO dto = StockHistoryDTO.builder().id("sh-1").itemId("item-1")
                    .change(5).reason(null).createdBy("admin").build();
            assertEquals("Stock change reason is required",
                    assertThrows(InvalidRequestException.class,
                            () -> StockHistoryValidator.validate(dto)).getMessage());
        }

        @Test
        void should_fail_when_reason_is_invalid_string() {
            StockHistoryDTO dto = StockHistoryDTO.builder().id("sh-1").itemId("item-1")
                    .change(5).reason("DONATED").createdBy("admin").build();
            assertEquals("Invalid stock change reason: DONATED",
                    assertThrows(InvalidRequestException.class,
                            () -> StockHistoryValidator.validate(dto)).getMessage());
        }

        @Test
        void should_fail_when_reason_is_lowercase() {
            // boundary: enum parsing is case-sensitive
            StockHistoryDTO dto = StockHistoryDTO.builder().id("sh-1").itemId("item-1")
                    .change(5).reason("sold").createdBy("admin").build();
            assertEquals("Invalid stock change reason: sold",
                    assertThrows(InvalidRequestException.class,
                            () -> StockHistoryValidator.validate(dto)).getMessage());
        }
    }

    /**
     * Delta and createdBy rules validated in {@link StockHistoryValidator#validate(StockHistoryDTO)}.
     */
    @Nested
    class DeltaAndCreatedByRules {
        @Test
        void should_fail_when_zero_change_for_non_price_change() {
            StockHistoryDTO dto = StockHistoryDTO.builder().id("sh-1").itemId("item-1")
                    .change(0).reason("SOLD").createdBy("admin").build();
            assertEquals("Zero quantity change is only allowed for PRICE_CHANGE",
                    assertThrows(InvalidRequestException.class,
                            () -> StockHistoryValidator.validate(dto)).getMessage());
        }

        @Test
        void should_fail_when_createdBy_is_null() {
            StockHistoryDTO dto = StockHistoryDTO.builder().id("sh-1").itemId("item-1")
                    .change(5).reason("SOLD").createdBy(null).build();
            assertEquals("CreatedBy must be provided",
                    assertThrows(InvalidRequestException.class,
                            () -> StockHistoryValidator.validate(dto)).getMessage());
        }

        @Test
        void should_fail_when_createdBy_is_blank() {
            StockHistoryDTO dto = StockHistoryDTO.builder().id("sh-1").itemId("item-1")
                    .change(5).reason("SOLD").createdBy(" ").build();
            assertEquals("CreatedBy must be provided",
                    assertThrows(InvalidRequestException.class,
                            () -> StockHistoryValidator.validate(dto)).getMessage());
        }

        @Test
        void should_pass_for_all_valid_reasons() {
            for (StockChangeReason reason : StockChangeReason.values()) {
                StockHistoryDTO dto = StockHistoryDTO.builder().id("sh-1").itemId("item-1")
                        .change(5).reason(reason.name()).createdBy("admin").build();
                assertDoesNotThrow(() -> StockHistoryValidator.validate(dto));
            }
        }
    }

    /**
     * PRICE_CHANGE-specific rules and {@link StockHistoryValidator#validateEnum(StockChangeReason)}.
     */
    @Nested
    class PriceChangeAndEnumRules {
        @Test
        void should_pass_when_price_change_allows_zero_delta() {
            StockHistoryDTO dto = StockHistoryDTO.builder().id("sh-1").itemId("item-1")
                    .change(0).reason(StockChangeReason.PRICE_CHANGE.name())
                    .createdBy("admin").build();
            assertDoesNotThrow(() -> StockHistoryValidator.validate(dto));
        }

        @Test
        void should_fail_when_price_change_has_negative_priceAtChange() {
            StockHistoryDTO dto = StockHistoryDTO.builder().id("sh-1").itemId("item-1")
                    .change(0).reason(StockChangeReason.PRICE_CHANGE.name())
                    .createdBy("admin").priceAtChange(new BigDecimal("-0.01")).build();
            assertEquals("priceAtChange must be >= 0 for PRICE_CHANGE",
                    assertThrows(InvalidRequestException.class,
                            () -> StockHistoryValidator.validate(dto)).getMessage());
        }

        @Test
        void should_ignore_priceAtChange_for_non_price_change() {
            StockHistoryDTO dto = StockHistoryDTO.builder().id("sh-1").itemId("item-1")
                    .change(1).reason(StockChangeReason.SOLD.name())
                    .createdBy("admin").priceAtChange(new BigDecimal("-0.01")).build();
            assertDoesNotThrow(() -> StockHistoryValidator.validate(dto));
        }

        @Test
        void should_accept_every_reason_and_reject_only_null() {
            // validateEnum is an explicit allow-list covering all current
            // reasons; disposal reasons (DESTROYED/DAMAGED/EXPIRED/LOST) are
            // accepted so they can back stock reductions and deletions. Only
            // null is rejected.
            for (StockChangeReason reason : StockChangeReason.values()) {
                assertDoesNotThrow(() -> StockHistoryValidator.validateEnum(reason));
            }
            IllegalArgumentException nullEx = assertThrows(IllegalArgumentException.class,
                    () -> StockHistoryValidator.validateEnum(null));
            assertNotNull(nullEx.getMessage());
            assertTrue(nullEx.getMessage().contains("Invalid stock change reason"));
        }
    }
}
