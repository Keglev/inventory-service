package com.smartsupplypro.inventory.validation;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.exception.InvalidRequestException;

/**
 * Unit tests for {@link StockHistoryValidator}.
 *
 * <p><strong>Purpose</strong></p>
 * Verifies the validator contract for stock-history input: required fields, reason parsing, and
 * the rule that zero-delta changes are only permitted for {@link StockChangeReason#PRICE_CHANGE}.
 * This suite intentionally exercises the validator directly (unit-level), not via service or
 * controller entrypoints.
 *
 * <p><strong>Operations Tested</strong></p>
 * <ul>
 *   <li>{@link StockHistoryValidator#validate(StockHistoryDTO)} required-field and business-rule checks</li>
 *   <li>Reason parsing against {@link StockChangeReason} (case sensitivity and invalid values)</li>
 * </ul>
 *
 * <p><strong>Design Notes</strong></p>
 * <ul>
 *   <li>Assertions on exception messages are limited to user-facing contract strings.</li>
 *   <li>Enum iteration test ensures all supported reasons remain accepted for non-zero deltas.</li>
 * </ul>
 */
@SuppressWarnings("unused")
@ActiveProfiles("test")
public class StockHistoryValidationTest {

    private StockHistoryDTO validDTO() {
        return StockHistoryDTO.builder()
                .id("sh-1")
                .itemId("item-1")
                .change(5)
                .reason("SOLD")
                .createdBy("admin")
                .build();
    }

    /**
     * Verifies that a fully valid StockHistoryDTO passes validation without throwing any exceptions.
     */
    @Test
    void testValidDTO_shouldPass() {
        assertDoesNotThrow(() -> StockHistoryValidator.validate(validDTO()));
    }

    /**
     * Validates that a null/blank itemId triggers an InvalidRequestException
     * with a clear error message.
     */
    @Test
    void testEmptyItemId_shouldThrow() {
        StockHistoryDTO dto = StockHistoryDTO.builder()
                .id("sh-1")
                .itemId(null)
                .change(5)
                .reason("SOLD")
                .createdBy("admin")
                .build();

        var e = assertThrows(InvalidRequestException.class, () ->
                StockHistoryValidator.validate(dto));

        assertEquals("Item ID cannot be null or empty", e.getMessage());
    }

    /**
     * Verifies that a zero-value change (no stock delta) is rejected
     * (unless reason is PRICE_CHANGE, which we don't set here).
     */
    @Test
    void testZeroChange_shouldThrow() {
        StockHistoryDTO dto = StockHistoryDTO.builder()
                .id("sh-1")
                .itemId("item-1")
                .change(0)
                .reason("SOLD")
                .createdBy("admin")
                .build();

        var e = assertThrows(InvalidRequestException.class, () ->
                StockHistoryValidator.validate(dto));

        assertEquals("Zero quantity change is only allowed for PRICE_CHANGE", e.getMessage());
    }

    /**
     * Confirms that an unsupported reason string (not defined in {@link StockChangeReason})
     * results in a validation error.
     */
    @Test
    void testInvalidReason_shouldThrow() {
        StockHistoryDTO dto = StockHistoryDTO.builder()
                .id("sh-1")
                .itemId("item-1")
                .change(5)
                .reason("DONATED")
                .createdBy("admin")
                .build();

        var e = assertThrows(InvalidRequestException.class, () ->
                StockHistoryValidator.validate(dto));

        assertEquals("Invalid stock change reason: DONATED", e.getMessage());
    }

    /**
     * Ensures that a null value in the createdBy field causes a validation failure.
     */
    @Test
    void testNullCreatedBy_shouldThrow() {
        StockHistoryDTO dto = StockHistoryDTO.builder()
                .id("sh-1")
                .itemId("item-1")
                .change(5)
                .reason("SOLD")
                .createdBy(null)
                .build();

        var e = assertThrows(InvalidRequestException.class, () ->
                StockHistoryValidator.validate(dto));

        assertEquals("CreatedBy must be provided", e.getMessage());
    }

    /**
     * Validates that a blank string in the createdBy field is not allowed.
     */
    @Test
    void testBlankCreatedBy_shouldThrow() {
        StockHistoryDTO dto = StockHistoryDTO.builder()
                .id("sh-1")
                .itemId("item-1")
                .change(5)
                .reason("SOLD")
                .createdBy(" ")
                .build();

        var e = assertThrows(InvalidRequestException.class, () ->
                StockHistoryValidator.validate(dto));

        assertEquals("CreatedBy must be provided", e.getMessage());
    }

    /**
     * Iterates over all valid {@link StockChangeReason} enum values to verify that they
     * are accepted without throwing an exception (with change != 0).
     */
    @Test
    void testValidReason_shouldNotThrow() {
        for (StockChangeReason reason : StockChangeReason.values()) {
            StockHistoryDTO dto = StockHistoryDTO.builder()
                    .id("sh-1")
                    .itemId("item-1")
                    .change(5)
                    .reason(reason.name())
                    .createdBy("admin")
                    .build();
            assertDoesNotThrow(() -> StockHistoryValidator.validate(dto));
        }
    }

    /**
     * Validates that providing a lowercase version of a valid reason (e.g., "sold")
     * results in rejection due to strict case-sensitive enum parsing.
     */
    @Test
    void testLowercaseReason_shouldThrow() {
        StockHistoryDTO dto = StockHistoryDTO.builder()
                .id("sh-1")
                .itemId("item-1")
                .change(5)
                .reason("sold")
                .createdBy("admin")
                .build();

        var e = assertThrows(InvalidRequestException.class, () ->
                StockHistoryValidator.validate(dto));

        assertEquals("Invalid stock change reason: sold", e.getMessage());
    }
}
