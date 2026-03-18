package com.smartsupplypro.inventory.validation;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.exception.InvalidRequestException;

/**
 * # StockHistoryValidatorPriceChangeAndEnumValidationTest
 *
 * Incremental unit tests for {@link StockHistoryValidator}.
 *
 * <p><strong>Purpose</strong></p>
 * Complements {@code StockHistoryValidationTest} by covering PRICE_CHANGE-specific rules and
 * the {@link StockHistoryValidator#validateEnum(StockChangeReason)} whitelist behavior.
 *
 * <p><strong>Operations Tested</strong></p>
 * <ul>
 *   <li>DTO validation branches for blank itemId and null reason</li>
 *   <li>PRICE_CHANGE rules: zero delta allowed, negative priceAtChange rejected</li>
 *   <li>{@link StockHistoryValidator#validateEnum(StockChangeReason)} accept/reject behavior</li>
 * </ul>
 */
class StockHistoryValidatorPriceChangeAndEnumValidationTest {

    private static StockHistoryDTO baseDto() {
        return StockHistoryDTO.builder()
                .id("sh-1")
                .itemId("item-1")
                .change(5)
                .reason("SOLD")
                .createdBy("admin")
                .build();
    }

    @Test
    @DisplayName("validate: blank itemId is rejected")
    void validate_blankItemId_throws() {
        StockHistoryDTO dto = baseDto();
        dto.setItemId("   ");

        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> StockHistoryValidator.validate(dto));
        assertEquals("Item ID cannot be null or empty", ex.getMessage());
    }

    @Test
    @DisplayName("validate: null reason is rejected")
    void validate_nullReason_throws() {
        StockHistoryDTO dto = baseDto();
        dto.setReason(null);

        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> StockHistoryValidator.validate(dto));
        assertEquals("Stock change reason is required", ex.getMessage());
    }

    @Test
    @DisplayName("validate: PRICE_CHANGE allows zero delta")
    void validate_priceChange_allowsZeroChange() {
        StockHistoryDTO dto = baseDto();
        dto.setReason(StockChangeReason.PRICE_CHANGE.name());
        dto.setChange(0);

        assertDoesNotThrow(() -> StockHistoryValidator.validate(dto));
    }

    @Test
    @DisplayName("validate: PRICE_CHANGE rejects negative priceAtChange")
    void validate_priceChange_negativePriceAtChange_throws() {
        StockHistoryDTO dto = baseDto();
        dto.setReason(StockChangeReason.PRICE_CHANGE.name());
        dto.setChange(0);
        dto.setPriceAtChange(new BigDecimal("-0.01"));

        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> StockHistoryValidator.validate(dto));
        assertEquals("priceAtChange must be >= 0 for PRICE_CHANGE", ex.getMessage());
    }

    @Test
    @DisplayName("validate: negative priceAtChange is ignored for non-PRICE_CHANGE")
    void validate_nonPriceChange_negativePriceAtChange_isIgnored() {
        StockHistoryDTO dto = baseDto();
        dto.setReason(StockChangeReason.SOLD.name());
        dto.setChange(1);
        dto.setPriceAtChange(new BigDecimal("-0.01"));

        // Branch condition includes reason == PRICE_CHANGE; for other reasons it should not fail.
        assertDoesNotThrow(() -> StockHistoryValidator.validate(dto));
    }

    @Test
    @DisplayName("validateEnum: allows whitelisted reasons; rejects null and non-whitelisted")
    void validateEnum_allowsWhitelisted_rejectsInvalid() {
        assertDoesNotThrow(() -> StockHistoryValidator.validateEnum(StockChangeReason.SOLD));

        IllegalArgumentException nullEx = assertThrows(IllegalArgumentException.class,
                () -> StockHistoryValidator.validateEnum(null));
        assertNotNull(nullEx.getMessage());
        assertTrue(nullEx.getMessage().contains("Invalid stock change reason"));

        IllegalArgumentException invalidEx = assertThrows(IllegalArgumentException.class,
                () -> StockHistoryValidator.validateEnum(StockChangeReason.DESTROYED));
        assertNotNull(invalidEx.getMessage());
        assertTrue(invalidEx.getMessage().contains("Invalid stock change reason"));
    }
}
