package com.smartsupplypro.inventory.service.impl.analytics;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import org.mockito.junit.jupiter.MockitoExtension;

import com.smartsupplypro.inventory.dto.FinancialSummaryDTO;
import com.smartsupplypro.inventory.dto.StockEventRowDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;

/**
 * Unit tests for {@link FinancialAnalyticsService} WAC bucket edge cases and null-price fallback behavior.
 */
@ExtendWith(MockitoExtension.class)
class FinancialAnalyticsServiceWacBucketsTest {

    @Mock private StockHistoryRepository stockHistoryRepository;
    @InjectMocks private FinancialAnalyticsService service;

    private static LocalDateTime at(int y, int m, int d, int H, int M) {
        return LocalDateTime.of(y, m, d, H, M);
    }

    private static void assertMoneyEquals(String expected, BigDecimal actual) {
        assertNotNull(actual, "actual BigDecimal was null");
        BigDecimal exp = new BigDecimal(expected);
        assertEquals(0, exp.compareTo(actual), () -> "Expected " + exp + " but was " + actual);
    }

    @Test
    void should_cover_returns_write_offs_return_to_supplier_and_null_price_fallback() {
        var events = List.of(
            // Pre-window opening replay (item1)
            new StockEventRowDTO("item1", "sup1", at(2024, 1, 31, 10, 0), +10, new BigDecimal("5.00"), StockChangeReason.INITIAL_STOCK),
            new StockEventRowDTO("item1", "sup1", at(2024, 1, 31, 12, 0),  -2, null,                   StockChangeReason.SOLD),
            // null price -> falls back to existing WAC ($5.00)
            new StockEventRowDTO("item1", "sup1", at(2024, 1, 31, 13, 0),  +2, null,                   StockChangeReason.MANUAL_UPDATE),
            // item2: pre-window inbound with null price while state is null -> unit cost = 0
            new StockEventRowDTO("item2", "sup1", at(2024, 1, 31,  9, 0),  +3, null,                   StockChangeReason.MANUAL_UPDATE),
            // item3: pre-window outbound while state is null -> issueAt(null) branch
            new StockEventRowDTO("item3", "sup1", at(2024, 1, 31,  8, 0),  -1, null,                   StockChangeReason.SOLD),
            // In-window events (item1)
            new StockEventRowDTO("item1", "sup1", at(2024, 2,  2,  9, 0),  +4, new BigDecimal("5.00"), StockChangeReason.INITIAL_STOCK),
            new StockEventRowDTO("item1", "sup1", at(2024, 2,  3,  9, 0),  +1, new BigDecimal("5.00"), StockChangeReason.RETURNED_BY_CUSTOMER),
            // null price + non-return reason -> NOT counted as purchase
            new StockEventRowDTO("item1", "sup1", at(2024, 2,  4,  9, 0),  +2, null,                   StockChangeReason.MANUAL_UPDATE),
            // return-to-supplier -> negative purchase
            new StockEventRowDTO("item1", "sup1", at(2024, 2,  5,  9, 0),  -3, null,                   StockChangeReason.RETURNED_TO_SUPPLIER),
            new StockEventRowDTO("item1", "sup1", at(2024, 2,  6,  9, 0),  -1, null,                   StockChangeReason.DAMAGED),
            new StockEventRowDTO("item1", "sup1", at(2024, 2,  7,  9, 0),  -2, null,                   StockChangeReason.SOLD)
        );

        lenient().when(stockHistoryRepository.streamEventsForWAC(any(), any())).thenReturn(events);

        // blank supplierId -> blankToNull("   ") -> null passed to repository
        FinancialSummaryDTO dto = service.getFinancialSummaryWAC(
                LocalDate.parse("2024-02-01"), LocalDate.parse("2024-02-28"), "   ");

        // Opening: item1=(10-2+2)=10@5.00=50.00, item2=3@0.00=0.00 -> 13 units, $50.00
        assertEquals(13, dto.openingQty());
        assertMoneyEquals("50.00", dto.openingValue());
        // Purchases: +4@5.00 then -3@5.00 return-to-supplier -> net +1, $5.00
        assertEquals(1, dto.purchasesQty());
        assertMoneyEquals("5.00", dto.purchasesCost());
        // Returns-in: +1@5.00
        assertEquals(1, dto.returnsInQty());
        assertMoneyEquals("5.00", dto.returnsInCost());
        // Write-off: 1 unit DAMAGED @5.00
        assertEquals(1, dto.writeOffQty());
        assertMoneyEquals("5.00", dto.writeOffCost());
        // COGS: 2 SOLD @5.00
        assertEquals(2, dto.cogsQty());
        assertMoneyEquals("10.00", dto.cogsCost());
        // Ending: item1=(10+4+1+2-3-1-2)=11@5.00=55.00, item2=3@0=0 -> 14 units, $55.00
        assertEquals(14, dto.endingQty());
        assertMoneyEquals("55.00", dto.endingValue());

        verify(stockHistoryRepository).streamEventsForWAC(any(), isNull());
    }
}
