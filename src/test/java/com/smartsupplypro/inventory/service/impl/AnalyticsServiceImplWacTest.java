package com.smartsupplypro.inventory.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.smartsupplypro.inventory.dto.FinancialSummaryDTO;
import com.smartsupplypro.inventory.dto.StockEventRowDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.exception.InvalidRequestException;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;
import com.smartsupplypro.inventory.repository.custom.StockHistoryCustomRepository;

/**
 * Focused unit tests for the WAC (Weighted Average Cost) financial summary in {@link AnalyticsServiceImpl}.
 *
 * <p><strong>Scope:</strong> Verifies per-event replay, bucket calculations (purchases, returns,
 * write-offs, COGS), and opening/ending inventory under the WAC method. Uses a mocked
 * {@link StockHistoryCustomRepository} to feed deterministic event streams.</p>
 *
 * <p><strong>Out of scope:</strong> controller/web layer, repository SQL/JPQL behavior,
 * and non-WAC analytics methods (covered elsewhere).</p>
 */
@ExtendWith(MockitoExtension.class)
class AnalyticsServiceImplWacTest {

    @SuppressWarnings("unused")
    @Mock private StockHistoryRepository stockHistoryRepository;

    @SuppressWarnings("unused")
    @Mock private InventoryItemRepository inventoryItemRepository;

    @Mock private StockHistoryCustomRepository stockHistoryCustomRepository;

    @InjectMocks private AnalyticsServiceImpl service;

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    private static LocalDateTime at(int y,int m,int d,int H,int M) {
        return LocalDateTime.of(y, m, d, H, M);
    }
    private static void assertMoneyEquals(String expected, BigDecimal actual) {
        assertNotNull(actual, "actual BigDecimal was null");
        BigDecimal exp = new BigDecimal(expected);
        assertEquals(0, exp.compareTo(actual), () -> "Expected " + exp + " but was " + actual);
    }

    /**
     * Basic scenario: purchase then sale.
     * <ul>
     *   <li>+10 @ 5.00 on Feb 1 =&gt; WAC 5.00, on-hand 10</li>
     *   <li>-4 on Feb 2 =&gt; COGS 20.00, on-hand 6</li>
     * </ul>
     */
    @Test
    void wac_basicPurchaseThenSale() {
        var events = List.of(
            new StockEventRowDTO("item1","sup1", at(2024,2,1,10,0), 10, new BigDecimal("5.00"), StockChangeReason.INITIAL_STOCK),
            new StockEventRowDTO("item1","sup1", at(2024,2,2, 9,0), -4, null, StockChangeReason.SOLD)  
        );
        when(stockHistoryCustomRepository.findEventsUpTo(any(), any())).thenReturn(events);

        FinancialSummaryDTO dto = service.getFinancialSummaryWAC(
                LocalDate.parse("2024-02-01"),
                LocalDate.parse("2024-02-28"),
                "sup1"
        );

        assertEquals("WAC", dto.getMethod());
        // Opening
        // Opening
        assertEquals(0, dto.getOpeningQty());
        assertMoneyEquals("0.00", dto.getOpeningValue());
        // Purchases
        assertEquals(10, dto.getPurchasesQty());
        assertMoneyEquals("50.00", dto.getPurchasesCost());
        // COGS
        assertEquals(4, dto.getCogsQty());
        assertMoneyEquals("20.00", dto.getCogsCost());
        // Returns/Write-offs
        assertEquals(0, dto.getReturnsInQty());
        assertMoneyEquals("0.00", dto.getReturnsInCost());
        assertEquals(0, dto.getWriteOffQty());
        assertMoneyEquals("0.00", dto.getWriteOffCost());
        // Ending
        assertEquals(6, dto.getEndingQty());
        assertMoneyEquals("30.00", dto.getEndingValue());
    }

    /**
     * Returns, write-offs, and return-to-supplier in one stream.
     * <ul>
     *   <li>+10 @ 5.00 purchase =&gt; purchases 10 / 50.00</li>
     *   <li>+2 return from customer (no price) =&gt; returnsIn 2 / 10.00 (valued at WAC 5.00)</li>
     *   <li>-3 write-off =&gt; writeOff 3 / 15.00 (WAC 5.00)</li>
     *   <li>-2 return to supplier =&gt; purchases reduced to 8 / 40.00</li>
     *   <li>Ending qty: 7 @ WAC 5.00 =&gt; 35.00</li>
     * </ul>
     */
    @Test
    void wac_returns_writeOffs_returnToSupplier() {
        var events = List.of(
            new StockEventRowDTO("item1","sup1", at(2024,2,1,10,0), 10, new BigDecimal("5.00"), StockChangeReason.INITIAL_STOCK),
            new StockEventRowDTO("item1","sup1", at(2024,2,3,12,0),  2, null,                  StockChangeReason.RETURNED_BY_CUSTOMER),
            new StockEventRowDTO("item1","sup1", at(2024,2,5,12,0), -3, null,                     StockChangeReason.DAMAGED),
            new StockEventRowDTO("item1","sup1", at(2024,2,7,12,0), -2, null,                     StockChangeReason.RETURNED_TO_SUPPLIER)
        );
        when(stockHistoryCustomRepository.findEventsUpTo(any(), any())).thenReturn(events);

        FinancialSummaryDTO dto = service.getFinancialSummaryWAC(
                LocalDate.parse("2024-02-01"),
                LocalDate.parse("2024-02-28"),
                "sup1"
        );

        // Purchases net of return-to-supplier
        assertEquals(8, dto.getPurchasesQty());
        assertMoneyEquals("40.00", dto.getPurchasesCost());

        // Returns from customer
        assertEquals(2, dto.getReturnsInQty());
        assertMoneyEquals("10.00", dto.getReturnsInCost());

        // Write-offs
        assertEquals(3, dto.getWriteOffQty());
        assertMoneyEquals("15.00", dto.getWriteOffCost());

        // COGS none here
        assertEquals(0, dto.getCogsQty());
        assertMoneyEquals("0.00", dto.getCogsCost());

        // Ending
        assertEquals(7, dto.getEndingQty());
        assertMoneyEquals("35.00", dto.getEndingValue());
    }

    /**
     * Opening inventory is built from events strictly before the window.
     * Jan 31: +5 @ 4.00 => opening 5 / 20.00
     * Feb  1: +5 @ 6.00 => WAC = (5*4 + 5*6)/10 = 5.00
     * Feb  2: -4 => COGS 20.00, ending 6 / 30.00
     */
    @Test
    void wac_openingInventoryIsReplayed_thenPurchaseAndSale() {
        var events = List.of(
            new StockEventRowDTO("item1","sup1", at(2024,1,31,23,0),  5, new BigDecimal("4.00"), StockChangeReason.INITIAL_STOCK),
            new StockEventRowDTO("item1","sup1", at(2024,2, 1,10,0),  5, new BigDecimal("6.00"), StockChangeReason.INITIAL_STOCK),
            new StockEventRowDTO("item1","sup1", at(2024,2, 2,10,0), -4, null, StockChangeReason.SOLD)
        );
        when(stockHistoryCustomRepository.findEventsUpTo(any(), any())).thenReturn(events);

        FinancialSummaryDTO dto = service.getFinancialSummaryWAC(
                LocalDate.parse("2024-02-01"),
                LocalDate.parse("2024-02-28"),
                "sup1"
        );

        // Opening
        assertEquals(5, dto.getOpeningQty());
        assertMoneyEquals("20.00", dto.getOpeningValue());

        // In-window purchases
        assertEquals(5, dto.getPurchasesQty());
        assertMoneyEquals("30.00", dto.getPurchasesCost());

        // COGS after WAC becomes 5.00
        assertEquals(4, dto.getCogsQty());
        assertMoneyEquals("20.00", dto.getCogsCost());

        // Ending
        assertEquals(6, dto.getEndingQty());
        assertMoneyEquals("30.00", dto.getEndingValue());
    }

    // ---------------------------------------------------------------------
    // Validation
    // ---------------------------------------------------------------------

    @Test
    void wac_invalidRange_throws() {
        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
            () -> service.getFinancialSummaryWAC(
                    LocalDate.parse("2024-03-01"),
                    LocalDate.parse("2024-02-01"),
                    "sup1"));
        assertNotNull(ex.getMessage());
    }
}
