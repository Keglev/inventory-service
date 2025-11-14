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
 * Unit test class for {@link StockHistoryValidator}, verifying business rules and input validation
 * for stock history changes in the inventory system. Covers edge cases including invalid input,
 * blank fields, unsupported change reasons, and correct handling of enum values.
 */
@SuppressWarnings("unused")
@ActiveProfiles("test")
public class StockHistoryValidationTest {

    /**
     * Creates a valid {@link StockHistoryDTO} object that can be reused across multiple tests.
     *
     * @return a fully populated and valid DTO instance.
     */
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
        StockHistoryDTO dto = validDTO();
        dto.setItemId(null);

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
        StockHistoryDTO dto = validDTO();
        dto.setChange(0);

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
        StockHistoryDTO dto = validDTO();
        dto.setReason("DONATED");

        var e = assertThrows(InvalidRequestException.class, () ->
                StockHistoryValidator.validate(dto));
        assertEquals("Invalid stock change reason: DONATED", e.getMessage());
    }

    /**
     * Ensures that a null value in the createdBy field causes a validation failure.
     */
    @Test
    void testNullCreatedBy_shouldThrow() {
        StockHistoryDTO dto = validDTO();
        dto.setCreatedBy(null);

        var e = assertThrows(InvalidRequestException.class, () ->
                StockHistoryValidator.validate(dto));
        assertEquals("CreatedBy must be provided", e.getMessage());
    }

    /**
     * Validates that a blank string in the createdBy field is not allowed.
     */
    @Test
    void testBlankCreatedBy_shouldThrow() {
        StockHistoryDTO dto = validDTO();
        dto.setCreatedBy(" ");

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
            StockHistoryDTO dto = validDTO();
            dto.setReason(reason.name()); // change remains 5, so even PRICE_CHANGE is fine
            assertDoesNotThrow(() -> StockHistoryValidator.validate(dto));
        }
    }

    /**
     * Validates that providing a lowercase version of a valid reason (e.g., "sold")
     * results in rejection due to strict case-sensitive enum parsing.
     */
    @Test
    void testLowercaseReason_shouldThrow() {
        StockHistoryDTO dto = validDTO();
        dto.setReason("sold"); // not uppercase

        var e = assertThrows(InvalidRequestException.class, () ->
                StockHistoryValidator.validate(dto));
        assertEquals("Invalid stock change reason: sold", e.getMessage());
    }
}
