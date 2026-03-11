package com.smartsupplypro.inventory.service.stockhistory;

import java.math.BigDecimal;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import static org.mockito.Mockito.verifyNoInteractions;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.exception.InvalidRequestException;
import com.smartsupplypro.inventory.model.StockHistory;

/**
 * Unit tests for {@link StockHistoryService} logStockChange validation and persistence.
 *
 * <p><strong>Scope</strong>:</p>
 * <ul>
 *   <li>Positive/negative stock deltas are persisted</li>
 *   <li>Invalid inputs are rejected and never persisted</li>
 * </ul>
 */
@SuppressWarnings("unused")
@ActiveProfiles("test")
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class StockHistoryServiceLogTest extends StockHistoryServiceTestBase {

    /**
     * Tests that a valid stock change log with proper reason, quantity, and metadata
     * is persisted via the repository and all fields are mapped correctly.
     * Scenario: Positive quantity with valid reason.
     * Expected: StockHistory entity saved with all fields set correctly.
     */
    @Test
    void logStockChange_shouldPersist_whenValidReasonAndPositiveChange() {
        // GIVEN/WHEN
        service.logStockChange(ITEM_1, 10, StockChangeReason.SOLD, ADMIN);

        // THEN
        StockHistory saved = captureSavedHistory();
        assertEquals(ITEM_1, saved.getItemId());
        assertEquals(10, saved.getChange());
        assertEquals(StockChangeReason.SOLD, saved.getReason());
        assertEquals(ADMIN, saved.getCreatedBy());
        assertNotNull(saved.getTimestamp());
    }

    /**
     * Validates that an {@link IllegalArgumentException} is thrown
     * when attempting to log stock change with a null reason.
     * Scenario: Reason is null (missing enum value).
     * Expected: {@link IllegalArgumentException} exception and no save operation.
     */
    @Test
    void logStockChange_shouldThrow_whenReasonIsNull() {
        // WHEN/THEN
        Exception ex = assertThrows(IllegalArgumentException.class,
                () -> service.logStockChange(ITEM_1, 5, null, ADMIN));
        assertTrue(ex.getMessage().contains("Invalid stock change reason"));
    }

    /**
     * Ensures that negative quantity changes (e.g., stock reductions)
     * are allowed and persisted correctly.
     * Scenario: Negative quantity representing item disposal.
     * Expected: StockHistory saved with negative change value.
     */
    @Test
    void logStockChange_shouldPersist_whenNegativeChange() {
        // GIVEN/WHEN
        service.logStockChange(ITEM_1, -5, StockChangeReason.SCRAPPED, ADMIN);

        // THEN
        StockHistory saved = captureSavedHistory();
        assertEquals(ITEM_1, saved.getItemId());
        assertEquals(-5, saved.getChange());
        assertEquals(StockChangeReason.SCRAPPED, saved.getReason());
        assertEquals(ADMIN, saved.getCreatedBy());
        assertNotNull(saved.getTimestamp());
    }

    static Stream<Arguments> invalidLogStockChangeCases() {
        BigDecimal price = new BigDecimal("120.00");
        return Stream.of(
                Arguments.of("blank createdBy", ITEM_1, 5, StockChangeReason.MANUAL_UPDATE, "  ", price, "createdby"),
                Arguments.of("null createdBy", ITEM_1, 5, StockChangeReason.MANUAL_UPDATE, null, price, "createdby"),
                Arguments.of("zero change", ITEM_1, 0, StockChangeReason.MANUAL_UPDATE, ADMIN, price, "zero"),
                Arguments.of("null itemId", null, 10, StockChangeReason.MANUAL_UPDATE, ADMIN, price, "item id")
        );
    }

    @ParameterizedTest(name = "logStockChange invalid: {0}")
    @MethodSource("invalidLogStockChangeCases")
    void logStockChange_invalidInputs_shouldThrowAndNotPersist(
            String _case,
            String itemId,
            int change,
            StockChangeReason reason,
            String createdBy,
            BigDecimal priceAtChange,
            String expectedMessageContainsLower) {
        // Scenario: validation failures enforced by StockHistoryValidator.
        // Expected: InvalidRequestException + repository.save is never called.
        var ex = assertThrows(InvalidRequestException.class,
                () -> service.logStockChange(itemId, change, reason, createdBy, priceAtChange));
        assertTrue(ex.getMessage().toLowerCase().contains(expectedMessageContainsLower));
        verifyNoInteractions(repository);
    }
}
