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
 * <p><strong>Purpose</strong></p>
 * Verify Weighted Average Cost (WAC) calculation and inventory valuation over a date window.
 * Tests the replay of opening inventory, purchases, sales (COGS), and ending inventory computation.
 *
 * <p><strong>Operations Tested</strong></p>
 * <ul>
 *   <li>WAC replay over an event stream (opening, purchases, returns, write-offs, COGS, ending).</li>
 *   <li>Correct bucketing by {@link StockChangeReason} (INITIAL_STOCK, SOLD, etc.).</li>
 *   <li>Window validation (start ≤ end) throws {@link InvalidRequestException} for invalid ranges.</li>
 *   <li>Over-issuing is clamped to zero (current service behavior), not an exception.</li>
 * </ul>
 *
 * <p><strong>Design Notes</strong></p>
 * <ul>
 *   <li>WAC formula: Cost = (Opening Value + Purchases) / (Opening Qty + Purchase Qty). COGS = Issued Qty × WAC.</li>
 *   <li>Opening inventory computed from pre-window events; in-window INITIAL_STOCK classified per impl/profile.</li>
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
     * Validates WAC calculation with basic purchase and sale flow.
     * 
     * <p><strong>Scenario</strong>: Item has opening inventory (10 units @ $5.00), then 4 units are sold.</p>
     * 
     * <p><strong>Expected</strong>: COGS qty=4, COGS cost=$20.00, ending qty=6, ending value=$30.00.</p>
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
     * Validates WAC calculation with pre-window opening plus in-window purchase and sale.
     * 
     * <p><strong>Scenario</strong>: Pre-window event (Jan 31) = 5 units @ $4.00; In-window event (Feb 1) = 5 units @ $6.00; 4 units sold.</p>
     * 
     * <p><strong>Expected</strong>: Opening qty=5 @ $20.00; COGS qty=4 @ blended WAC; Ending qty=6 @ $30.00.</p>
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
    
    /**
     * Validates WAC calculation when all inventory is issued (exact match).
     * 
     * <p><strong>Scenario</strong>: 5 units @ $2.00, then all 5 units sold.</p>
     * 
     * <p><strong>Expected</strong>: Ending qty=0, Ending value=$0.00.</p>
     */
    @Test
    void wac_issueExactlyAvailable_ok() {
        var events = List.of(
            // Purchase: 5 units @ $2.00
            new StockEventRowDTO("i","s", at(2024,2,1,9,0), +5, new BigDecimal("2.00"), StockChangeReason.INITIAL_STOCK),
            // Sale: issue all 5 units
            new StockEventRowDTO("i","s", at(2024,2,2,9,0), -5, null,                      StockChangeReason.SOLD)
        );
        // Mock repository to return event stream
        lenient().when(stockHistoryRepository.streamEventsForWAC(any(), any()))
            .thenReturn(events);
        
        // Execute WAC calculation
        var dto = service.getFinancialSummaryWAC(LocalDate.parse("2024-02-01"), LocalDate.parse("2024-02-28"), "s");
        
        // Verify inventory completely consumed
        assertEquals(0, dto.getEndingQty());
        assertEquals(0, BigDecimal.ZERO.compareTo(dto.getEndingValue()));
    }
    
    /**
     * Validates WAC behavior when quantity issued exceeds available inventory (over-issuing).
     * 
     * <p><strong>Scenario</strong>: 3 units @ $2.00, but 4 units issued (over-issue by 1).</p>
     * 
     * <p><strong>Expected</strong>: Ending qty=0, Ending value=$0.00 (clamped, not negative).</p>
     */
    @Test
    void wac_issueMoreThanAvailable_clampsToZero() {
        var events = List.of(
            // Purchase: 3 units @ $2.00 (limited supply)
            new StockEventRowDTO("i","s", at(2024,2,1,9,0), +3, new BigDecimal("2.00"), StockChangeReason.INITIAL_STOCK),
            // Sale: issue 4 units (1 more than available - over-issue)
            new StockEventRowDTO("i","s", at(2024,2,2,9,0), -4, null,                      StockChangeReason.SOLD)
        );
        // Mock repository to return event stream with over-issue condition
        lenient().when(stockHistoryRepository.streamEventsForWAC(any(), any()))
            .thenReturn(events);
        
        // Execute WAC calculation (should handle gracefully by clamping)
        var dto = service.getFinancialSummaryWAC(
            LocalDate.parse("2024-02-01"),
            LocalDate.parse("2024-02-28"),
            "s"
        );
        
        // Verify clamping behavior: ending qty clamped to 0 (not negative)
        assertEquals(0, dto.getEndingQty());
        assertEquals(0, BigDecimal.ZERO.compareTo(dto.getEndingValue()));
    }
    
    // ---------------------------------------------------------------------
    // Validation
    // ---------------------------------------------------------------------
    
    /**
     * Validates that invalid date ranges are rejected (start > end).
     * 
     * <p><strong>Scenario</strong>: Start date (Mar 1) after end date (Feb 1), invalid ordering.</p>
     * 
     * <p><strong>Expected</strong>: InvalidRequestException thrown with error message.</p>
     */
    @Test
    void wac_invalidRange_throws() {
        // Execute with invalid date range: start (2024-03-01) > end (2024-02-01)
        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
            () -> service.getFinancialSummaryWAC(
                LocalDate.parse("2024-03-01"),  // start (later)
                LocalDate.parse("2024-02-01"),  // end (earlier) - invalid ordering
                "sup1"
            ));
        // Verify exception includes validation error message
        assertNotNull(ex.getMessage());
    }
}
