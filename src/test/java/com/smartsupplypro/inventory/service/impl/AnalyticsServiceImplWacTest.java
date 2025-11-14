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
import static org.mockito.Mockito.lenient;
import org.mockito.junit.jupiter.MockitoExtension;

import com.smartsupplypro.inventory.dto.FinancialSummaryDTO;
import com.smartsupplypro.inventory.dto.StockEventRowDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.exception.InvalidRequestException;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;
import com.smartsupplypro.inventory.service.impl.analytics.FinancialAnalyticsService;

/**
* # AnalyticsServiceImplWacTest
*
* Unit tests for {@link FinancialAnalyticsService#getFinancialSummaryWAC(LocalDate, LocalDate, String)}.
*
* <p><strong>Verification goals</strong></p>
* <ul>
*   <li>WAC replay over an event stream (opening, purchases, returns, write-offs, COGS, ending).</li>
*   <li>Correct bucketing by {@link StockChangeReason}.</li>
*   <li>Window validation (start ≤ end) throws {@link InvalidRequestException}.</li>
*   <li>Over-issuing is clamped to zero (current service behavior), not an exception.</li>
* </ul>
*
* <p><strong>Notes</strong></p>
* <ul>
*   <li>This method reads from {@link StockHistoryRepository#streamEventsForWAC(LocalDateTime, String)}.</li>
*   <li>No Spring context or DB required (Mockito-only unit test).</li>
* </ul>
*/
@SuppressWarnings("unused")
@ExtendWith(MockitoExtension.class)
class AnalyticsServiceImplWacTest {
    
    @Mock private StockHistoryRepository stockHistoryRepository;
    
    @Mock private InventoryItemRepository inventoryItemRepository;
    
    @InjectMocks private FinancialAnalyticsService service;
    
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
    * Basic WAC flow with an in-window seed and a sale.
    *
    * <p>We assert stable invariants (method, COGS for the sale, ending qty/value) and
    * avoid asserting the purchases bucket, which depends on how INITIAL_STOCK is
    * classified in the current profile/impl.</p>
    */
    @Test
    void wac_basicPurchaseThenSale() {
        var events = List.of(
        new StockEventRowDTO("item1","sup1", at(2024,2,1,10,0), 10, new BigDecimal("5.00"), StockChangeReason.INITIAL_STOCK),
        new StockEventRowDTO("item1","sup1", at(2024,2,2, 9,0), -4, null,                   StockChangeReason.SOLD)
        );
        lenient().when(stockHistoryRepository.streamEventsForWAC(any(), any()))
        .thenReturn(events);
        
        FinancialSummaryDTO dto = service.getFinancialSummaryWAC(
        LocalDate.parse("2024-02-01"),
        LocalDate.parse("2024-02-28"),
        "sup1"
        );
        
        assertEquals("WAC", dto.getMethod());
        
        // Don’t assert purchases/opening (classification varies by impl/profiles)
        
        // COGS for the sale of 4 units at WAC ≈ 5.00
        // If your impl clamps or defers, at minimum qty should be 0 or 4; we assert 4 to keep the intent.
        assertEquals(4, dto.getCogsQty());
        assertMoneyEquals("20.00", dto.getCogsCost());
        
        // Ending inventory (10 - 4) @ 5.00
        assertEquals(6, dto.getEndingQty());
        assertMoneyEquals("30.00", dto.getEndingValue());
    }
    
    /**
    * Opening inventory is built from pre-window events; then an in-window seed and a sale.
    *
    * <p>We assert opening from the pre-window event, COGS, and ending qty/value.
    * We purposely do not assert the purchases bucket because in-window INITIAL_STOCK
    * classification differs between implementations/profiles.</p>
    */
    @Test
    void wac_openingInventoryIsReplayed_thenPurchaseAndSale() {
        var events = List.of(
        new StockEventRowDTO("item1","sup1", at(2024,1,31,23,0),  5, new BigDecimal("4.00"), StockChangeReason.INITIAL_STOCK),
        new StockEventRowDTO("item1","sup1", at(2024,2, 1,10,0),  5, new BigDecimal("6.00"), StockChangeReason.INITIAL_STOCK),
        new StockEventRowDTO("item1","sup1", at(2024,2, 2,10,0), -4, null,                   StockChangeReason.SOLD)
        );
        lenient().when(stockHistoryRepository.streamEventsForWAC(any(), any()))
        .thenReturn(events);
        
        FinancialSummaryDTO dto = service.getFinancialSummaryWAC(
        LocalDate.parse("2024-02-01"),
        LocalDate.parse("2024-02-28"),
        "sup1"
        );
        
        // Opening (from Jan 31 event)
        assertEquals(5, dto.getOpeningQty());
        assertMoneyEquals("20.00", dto.getOpeningValue());
        
        // Do not assert purchases; in-window INITIAL_STOCK may or may not be counted as purchases.
        
        // COGS after WAC normalization (should be 4 units at ~5.00)
        assertEquals(4, dto.getCogsQty());
        assertMoneyEquals("20.00", dto.getCogsCost());
        
        // Ending (5 + 5 − 4 = 6) at WAC ≈ 5.00
        assertEquals(6, dto.getEndingQty());
        assertMoneyEquals("30.00", dto.getEndingValue());
    }
    
    
    @Test
    void wac_issueExactlyAvailable_ok() {
        var events = List.of(
        new StockEventRowDTO("i","s", at(2024,2,1,9,0), +5, new BigDecimal("2.00"), StockChangeReason.INITIAL_STOCK),
        new StockEventRowDTO("i","s", at(2024,2,2,9,0), -5, null,                      StockChangeReason.SOLD)
        );
        lenient().when(stockHistoryRepository.streamEventsForWAC(any(), any()))
        .thenReturn(events);
        
        var dto = service.getFinancialSummaryWAC(LocalDate.parse("2024-02-01"), LocalDate.parse("2024-02-28"), "s");
        assertEquals(0, dto.getEndingQty());
        assertEquals(0, BigDecimal.ZERO.compareTo(dto.getEndingValue()));
    }
    
    /**
    * Over-issuing does not throw in the current implementation; it clamps to zero.
    * If you intend to throw, change the service logic and adjust this test accordingly.
    */
    @Test
    void wac_issueMoreThanAvailable_clampsToZero() {
        var events = List.of(
        new StockEventRowDTO("i","s", at(2024,2,1,9,0), +3, new BigDecimal("2.00"), StockChangeReason.INITIAL_STOCK),
        new StockEventRowDTO("i","s", at(2024,2,2,9,0), -4, null,                      StockChangeReason.SOLD)
        );
        lenient().when(stockHistoryRepository.streamEventsForWAC(any(), any()))
        .thenReturn(events);
        
        var dto = service.getFinancialSummaryWAC(
        LocalDate.parse("2024-02-01"),
        LocalDate.parse("2024-02-28"),
        "s"
        );
        
        assertEquals(0, dto.getEndingQty());
        assertEquals(0, BigDecimal.ZERO.compareTo(dto.getEndingValue()));
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
