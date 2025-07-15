package com.smartsupplypro.inventory.validation;

import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import org.springframework.test.context.ActiveProfiles;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit test class for {@link StockHistoryValidator}, verifying business rules and input validation
 * for stock history changes in the inventory system. Covers all edge cases including invalid input,
 * blank fields, unsupported change reasons, and correct handling of enum values.
 */
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
     * Validates that a null `itemId` triggers an {@link IllegalArgumentException}
     * with a clear error message.
     */
    @Test
    void testEmptyItemId_shouldThrow() {
        StockHistoryDTO dto = validDTO();
        dto.setItemId(null);

        Exception e = assertThrows(IllegalArgumentException.class, () ->
                StockHistoryValidator.validate(dto));

        assertEquals("Item ID cannot be null or empty", e.getMessage());
    }

    /**
     * Verifies that a zero-value change (no stock delta) is rejected with a proper validation message.
     */
    @Test
    void testZeroChange_shouldThrow() {
        StockHistoryDTO dto = validDTO();
        dto.setChange(0);

        Exception e = assertThrows(IllegalArgumentException.class, () ->
                StockHistoryValidator.validate(dto));

        assertEquals("Change amount must be non-zero", e.getMessage());
    }

    /**
     * Confirms that an unsupported `reason` string (not defined in {@link StockChangeReason})
     * results in a validation error.
     */
    @Test
    void testInvalidReason_shouldThrow() {
        StockHistoryDTO dto = validDTO();
        dto.setReason("DONATED");

        Exception e = assertThrows(IllegalArgumentException.class, () ->
                StockHistoryValidator.validate(dto));

        assertEquals("Unsupported change reason: DONATED", e.getMessage());
    }

    /**
     * Ensures that a null value in the `createdBy` field causes a validation failure.
     */
    @Test
    void testNullCreatedBy_shouldThrow() {
        StockHistoryDTO dto = validDTO();
        dto.setCreatedBy(null);

        Exception e = assertThrows(IllegalArgumentException.class, () ->
                StockHistoryValidator.validate(dto));

        assertEquals("CreatedBy is required", e.getMessage());
    }

    /**
     * Validates that a blank string in the `createdBy` field is not allowed.
     */
    @Test
    void testBlankCreatedBy_shouldThrow() {
        StockHistoryDTO dto = validDTO();
        dto.setCreatedBy(" ");

        Exception e = assertThrows(IllegalArgumentException.class, () ->
                StockHistoryValidator.validate(dto));

        assertEquals("CreatedBy is required", e.getMessage());
    }

    /**
     * Iterates over all valid {@link StockChangeReason} enum values to verify that they
     * are accepted without throwing an exception.
     */
    @Test
    void testValidReason_shouldNotThrow() {
        for (StockChangeReason reason : StockChangeReason.values()) {
            StockHistoryDTO dto = validDTO();
            dto.setReason(reason.name());

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

        Exception e = assertThrows(IllegalArgumentException.class, () ->
                StockHistoryValidator.validate(dto));

        assertEquals("Unsupported change reason: sold", e.getMessage());
    }
}
