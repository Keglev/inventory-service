package com.smartsupplypro.inventory.service.impl.analytics;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Nested;
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
import com.smartsupplypro.inventory.repository.StockHistoryRepository;

/**
 * Unit tests for {@link FinancialAnalyticsService#getFinancialSummaryWAC(LocalDate, LocalDate, String)}
 * calculation correctness and date range boundary behavior.
 */
@ExtendWith(MockitoExtension.class)
class AnalyticsServiceImplWacTest {

    @Mock private StockHistoryRepository stockHistoryRepository;
    @InjectMocks private FinancialAnalyticsService service;

    private static LocalDateTime at(int y, int m, int d, int H, int M) {
        return LocalDateTime.of(y, m, d, H, M);
    }

    private static void assertMoneyEquals(String expected, BigDecimal actual) {
        assertNotNull(actual, "actual BigDecimal was null");
        assertEquals(0, new BigDecimal(expected).compareTo(actual),
                () -> "Expected " + expected + " but was " + actual);
    }

    /**
     * WAC calculation correctness scenarios.
     */
    @Nested
    class WacCalculation {

        @Test
        void should_calculate_correct_cogs_and_ending_inventory_for_basic_purchase_then_sale() {
            var events = List.of(
                    new StockEventRowDTO("item1", "sup1", at(2024, 2, 1, 10, 0), 10, new BigDecimal("5.00"), StockChangeReason.INITIAL_STOCK),
                    new StockEventRowDTO("item1", "sup1", at(2024, 2, 2,  9, 0), -4, null,                   StockChangeReason.SOLD)
            );
            when(stockHistoryRepository.streamEventsForWAC(any(), any())).thenReturn(events);

            FinancialSummaryDTO dto = service.getFinancialSummaryWAC(
                    LocalDate.parse("2024-02-01"), LocalDate.parse("2024-02-28"), "sup1");

            assertEquals("WAC", dto.method());
            // COGS: 4 units @ WAC $5.00
            assertEquals(4, dto.cogsQty());
            assertMoneyEquals("20.00", dto.cogsCost());
            // Ending: 10 - 4 = 6 @ $5.00
            assertEquals(6, dto.endingQty());
            assertMoneyEquals("30.00", dto.endingValue());
        }

        @Test
        void should_replay_pre_window_opening_inventory_and_blend_with_in_window_purchases() {
            var events = List.of(
                    // Pre-window: 5 units @ $4.00
                    new StockEventRowDTO("item1", "sup1", at(2024, 1, 31, 23, 0),  5, new BigDecimal("4.00"), StockChangeReason.INITIAL_STOCK),
                    // In-window: +5 units @ $6.00 Ã¢â€ â€™ blended WAC = (20+30)/10 = $5.00
                    new StockEventRowDTO("item1", "sup1", at(2024, 2,  1, 10, 0),  5, new BigDecimal("6.00"), StockChangeReason.INITIAL_STOCK),
                    new StockEventRowDTO("item1", "sup1", at(2024, 2,  2, 10, 0), -4, null,                   StockChangeReason.SOLD)
            );
            when(stockHistoryRepository.streamEventsForWAC(any(), any())).thenReturn(events);

            FinancialSummaryDTO dto = service.getFinancialSummaryWAC(
                    LocalDate.parse("2024-02-01"), LocalDate.parse("2024-02-28"), "sup1");

            assertEquals(5, dto.openingQty());
            assertMoneyEquals("20.00", dto.openingValue());
            // COGS: 4 @ WAC $5.00
            assertEquals(4, dto.cogsQty());
            assertMoneyEquals("20.00", dto.cogsCost());
            // Ending: 5 + 5 - 4 = 6 @ $5.00
            assertEquals(6, dto.endingQty());
            assertMoneyEquals("30.00", dto.endingValue());
        }

        @Test
        void should_zero_out_ending_inventory_when_all_units_are_issued() {
            var events = List.of(
                    // WAC = (5 * 2.00) / 5 = $2.00
                    new StockEventRowDTO("i", "s", at(2024, 2, 1, 9, 0), +5, new BigDecimal("2.00"), StockChangeReason.INITIAL_STOCK),
                    new StockEventRowDTO("i", "s", at(2024, 2, 2, 9, 0), -5, null,                   StockChangeReason.SOLD)
            );
            when(stockHistoryRepository.streamEventsForWAC(any(), any())).thenReturn(events);

            var dto = service.getFinancialSummaryWAC(
                    LocalDate.parse("2024-02-01"), LocalDate.parse("2024-02-28"), "s");

            assertEquals(0, dto.endingQty());
            assertEquals(0, BigDecimal.ZERO.compareTo(dto.endingValue()));
        }

        @Test
        void should_clamp_ending_inventory_to_zero_when_issued_quantity_exceeds_available() {
            var events = List.of(
                    new StockEventRowDTO("i", "s", at(2024, 2, 1, 9, 0), +3, new BigDecimal("2.00"), StockChangeReason.INITIAL_STOCK),
                    new StockEventRowDTO("i", "s", at(2024, 2, 2, 9, 0), -4, null,                   StockChangeReason.SOLD)
            );
            when(stockHistoryRepository.streamEventsForWAC(any(), any())).thenReturn(events);

            var dto = service.getFinancialSummaryWAC(
                    LocalDate.parse("2024-02-01"), LocalDate.parse("2024-02-28"), "s");

            assertEquals(0, dto.endingQty());
            assertEquals(0, BigDecimal.ZERO.compareTo(dto.endingValue()));
        }
    }

    /**
     * Date range validation for {@code getFinancialSummaryWAC}.
     */
    @Nested
    class WacValidation {

        @Test
        void should_throw_when_start_date_is_after_end_date() {
            InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                    () -> service.getFinancialSummaryWAC(
                            LocalDate.parse("2024-03-01"), LocalDate.parse("2024-02-01"), "sup1"));
            assertNotNull(ex.getMessage());
        }
    }
}
