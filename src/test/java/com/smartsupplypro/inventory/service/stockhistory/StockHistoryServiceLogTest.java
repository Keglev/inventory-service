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
 * Unit tests for {@link com.smartsupplypro.inventory.service.StockHistoryService}
 * logStockChange validation, persistence, and rejection behavior.
 */
@ActiveProfiles("test")
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@SuppressWarnings("unused")
class StockHistoryServiceLogTest extends StockHistoryServiceTestBase {

    @Test
    void should_persist_stock_change_when_reason_and_positive_delta_are_valid() {
        service.logStockChange(ITEM_1, 10, StockChangeReason.SOLD, ADMIN);

        StockHistory saved = captureSavedHistory();
        assertEquals(ITEM_1, saved.getItemId());
        assertEquals(10, saved.getChange());
        assertEquals(StockChangeReason.SOLD, saved.getReason());
        assertEquals(ADMIN, saved.getCreatedBy());
        assertNotNull(saved.getTimestamp());
    }

    @Test
    void should_throw_when_reason_is_null() {
        Exception ex = assertThrows(IllegalArgumentException.class,
                () -> service.logStockChange(ITEM_1, 5, null, ADMIN));
        assertTrue(ex.getMessage().contains("Invalid stock change reason"));
    }

    @Test
    void should_persist_negative_change_when_delta_is_negative() {
        service.logStockChange(ITEM_1, -5, StockChangeReason.SCRAPPED, ADMIN);

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
                Arguments.of("blank createdBy",  ITEM_1, 5,  StockChangeReason.MANUAL_UPDATE, "  ",  price, "createdby"),
                Arguments.of("null createdBy",   ITEM_1, 5,  StockChangeReason.MANUAL_UPDATE, null,  price, "createdby"),
                Arguments.of("zero change",       ITEM_1, 0,  StockChangeReason.MANUAL_UPDATE, ADMIN, price, "zero"),
                Arguments.of("null itemId",       null,   10, StockChangeReason.MANUAL_UPDATE, ADMIN, price, "item id")
        );
    }

    @ParameterizedTest(name = "logStockChange invalid: {0}")
    @MethodSource("invalidLogStockChangeCases")
    void should_throw_and_not_persist_when_inputs_are_invalid(
            String _case, String itemId, int change, StockChangeReason reason,
            String createdBy, BigDecimal priceAtChange, String expectedMessageContainsLower) {
        var ex = assertThrows(InvalidRequestException.class,
                () -> service.logStockChange(itemId, change, reason, createdBy, priceAtChange));
        assertTrue(ex.getMessage().toLowerCase().contains(expectedMessageContainsLower));
        verifyNoInteractions(repository);
    }
}
