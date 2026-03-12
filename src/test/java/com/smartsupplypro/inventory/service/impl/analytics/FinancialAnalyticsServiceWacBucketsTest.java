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
 * # FinancialAnalyticsServiceWacBucketsTest
 *
 * Targeted unit tests for {@link FinancialAnalyticsService#getFinancialSummaryWAC(LocalDate, LocalDate, String)}.
 *
 * <p><strong>Purpose</strong></p>
 * Raise instruction/branch coverage for {@link FinancialAnalyticsService} by exercising the less common
 * event-bucketing paths (returns-in, write-offs, returns-to-supplier) and the unit-cost fallback behavior
 * when {@code priceAtChange} is null.
 *
 * <p><strong>Why separate from AnalyticsServiceImplWacTest</strong></p>
 * The base WAC tests focus on readability and the “happy path” valuation outcomes. This suite focuses on
 * comprehensive branch coverage while keeping each file reasonably sized and navigable.
 */
@ExtendWith(MockitoExtension.class)
class FinancialAnalyticsServiceWacBucketsTest {

    @Mock private StockHistoryRepository stockHistoryRepository;

    @InjectMocks private FinancialAnalyticsService service;

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    private static LocalDateTime at(int y, int m, int d, int H, int M) {
        return LocalDateTime.of(y, m, d, H, M);
    }

    private static void assertMoneyEquals(String expected, BigDecimal actual) {
        assertNotNull(actual, "actual BigDecimal was null");
        BigDecimal exp = new BigDecimal(expected);
        assertEquals(0, exp.compareTo(actual), () -> "Expected " + exp + " but was " + actual);
    }

    @Test
    void wac_coversReturnsWriteOffsAndReturnToSupplier_withNullPriceFallback_andBlankSupplierId() {
        // GIVEN
        // Window: Feb 1..Feb 28 (inclusive)
        // Provide a mixed event stream that exercises:
        // - opening replay (inbound + outbound) with null-price fallbacks
        // - in-window returns-in bucket
        // - in-window write-offs bucket
        // - in-window return-to-supplier bucket (negative purchases)
        // - in-window inbound manual update with null price that should NOT count as purchase
        // - blank supplierId normalization via blankToNull(..) → repository receives null
        var events = List.of(
            // --- Pre-window opening replay (item1) ---
            new StockEventRowDTO("item1", "sup1", at(2024, 1, 31, 10, 0), +10, new BigDecimal("5.00"), StockChangeReason.INITIAL_STOCK),
            new StockEventRowDTO("item1", "sup1", at(2024, 1, 31, 12, 0),  -2, null,                   StockChangeReason.SOLD),
            // Inbound with null price should fall back to existing avg cost (5.00)
            new StockEventRowDTO("item1", "sup1", at(2024, 1, 31, 13, 0),  +2, null,                   StockChangeReason.MANUAL_UPDATE),

            // item2: pre-window inbound with null price while state is null → unit cost becomes 0
            new StockEventRowDTO("item2", "sup1", at(2024, 1, 31,  9, 0),  +3, null,                   StockChangeReason.MANUAL_UPDATE),
            // item3: pre-window outbound while state is null → issueAt(null, ..) branch
            new StockEventRowDTO("item3", "sup1", at(2024, 1, 31,  8, 0),  -1, null,                   StockChangeReason.SOLD),

            // --- In-window events (item1) ---
            new StockEventRowDTO("item1", "sup1", at(2024, 2,  2,  9, 0),  +4, new BigDecimal("5.00"), StockChangeReason.INITIAL_STOCK),
            new StockEventRowDTO("item1", "sup1", at(2024, 2,  3,  9, 0),  +1, new BigDecimal("5.00"), StockChangeReason.RETURNED_BY_CUSTOMER),
            // inbound with null price and non-return reason → should NOT count as purchase
            new StockEventRowDTO("item1", "sup1", at(2024, 2,  4,  9, 0),  +2, null,                   StockChangeReason.MANUAL_UPDATE),
            // outbound return-to-supplier → negative purchase
            new StockEventRowDTO("item1", "sup1", at(2024, 2,  5,  9, 0),  -3, null,                   StockChangeReason.RETURNED_TO_SUPPLIER),
            // write-off bucket
            new StockEventRowDTO("item1", "sup1", at(2024, 2,  6,  9, 0),  -1, null,                   StockChangeReason.DAMAGED),
            // default COGS bucket
            new StockEventRowDTO("item1", "sup1", at(2024, 2,  7,  9, 0),  -2, null,                   StockChangeReason.SOLD)
        );

        lenient().when(stockHistoryRepository.streamEventsForWAC(any(), any()))
            .thenReturn(events);

        // WHEN
        FinancialSummaryDTO dto = service.getFinancialSummaryWAC(
            LocalDate.parse("2024-02-01"),
            LocalDate.parse("2024-02-28"),
            "   "
        );

        // THEN
        // Opening inventory:
        // item1: (10 - 2 + 2) = 10 units @ 5.00 => 50.00
        // item2: 3 units @ 0.00 => 0.00
        assertEquals(13, dto.getOpeningQty());
        assertMoneyEquals("50.00", dto.getOpeningValue());

        // Purchases: +4 (20.00) then return-to-supplier -3 (15.00) => net +1 and $5.00
        assertEquals(1, dto.getPurchasesQty());
        assertMoneyEquals("5.00", dto.getPurchasesCost());

        // Returns in: +1 @ 5.00
        assertEquals(1, dto.getReturnsInQty());
        assertMoneyEquals("5.00", dto.getReturnsInCost());

        // Write-off: 1 unit @ 5.00
        assertEquals(1, dto.getWriteOffQty());
        assertMoneyEquals("5.00", dto.getWriteOffCost());

        // COGS: 2 units @ 5.00
        assertEquals(2, dto.getCogsQty());
        assertMoneyEquals("10.00", dto.getCogsCost());

        // Ending inventory:
        // item1 ending qty: 10 +4 +1 +2 -3 -1 -2 = 11 @ 5.00 => 55.00
        // item2 remains 3 @ 0 => 0.00
        assertEquals(14, dto.getEndingQty());
        assertMoneyEquals("55.00", dto.getEndingValue());

        // blankToNull("   ") should pass null into repository
        verify(stockHistoryRepository).streamEventsForWAC(any(), isNull());
    }
}
