package com.smartsupplypro.inventory.service.impl.analytics;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Limit;

import com.smartsupplypro.inventory.dto.PriceTrendDTO;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;

/**
 * Unit test for the opening price that starts a price-trend window (PT-1).
 */
@ExtendWith(MockitoExtension.class)
class StockAnalyticsServicePriceTrendTest {

    private static final LocalDate START = LocalDate.of(2026, 4, 19);
    private static final LocalDate END = LocalDate.of(2026, 10, 16);
    private static final LocalDateTime START_OF_DAY = START.atStartOfDay();

    @Mock private StockHistoryRepository stockHistoryRepository;
    @Mock private InventoryItemRepository inventoryItemRepository;
    @InjectMocks private StockAnalyticsService service;

    private void window(List<PriceTrendDTO> rows) {
        when(stockHistoryRepository.getItemPriceTrend(eq("I1"), any(), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(rows);
    }

    @Test
    void should_open_the_series_at_start_when_the_window_has_no_rows() {
        window(List.of());
        when(stockHistoryRepository.findPricesBefore("I1", "S1", START_OF_DAY, Limit.of(1)))
                .thenReturn(List.of(new BigDecimal("7.60")));

        List<PriceTrendDTO> out = service.getPriceTrend("I1", "S1", START, END);

        assertEquals(List.of(new PriceTrendDTO("2026-04-19", new BigDecimal("7.60"))), out);
    }

    @Test
    void should_prepend_the_opening_price_when_the_first_row_is_after_start() {
        PriceTrendDTO change = new PriceTrendDTO("2026-05-06", new BigDecimal("4.10"));
        window(List.of(change));
        when(stockHistoryRepository.findPricesBefore("I1", "S1", START_OF_DAY, Limit.of(1)))
                .thenReturn(List.of(new BigDecimal("3.85")));

        List<PriceTrendDTO> out = service.getPriceTrend("I1", "S1", START, END);

        assertEquals(List.of(new PriceTrendDTO("2026-04-19", new BigDecimal("3.85")), change), out);
    }

    @Test
    void should_keep_the_window_when_it_has_a_row_on_its_first_day() {
        List<PriceTrendDTO> rows = List.of(new PriceTrendDTO("2026-04-19", new BigDecimal("4.10")));
        window(rows);

        List<PriceTrendDTO> out = service.getPriceTrend("I1", "S1", START, END);

        assertEquals(rows, out);
        verify(stockHistoryRepository, never()).findPricesBefore(anyString(), any(), any(), any());
    }

    @Test
    void should_keep_the_window_empty_when_the_item_has_no_earlier_price() {
        window(List.of());
        when(stockHistoryRepository.findPricesBefore("I1", "S1", START_OF_DAY, Limit.of(1))).thenReturn(List.of());

        List<PriceTrendDTO> out = service.getPriceTrend("I1", "S1", START, END);

        assertEquals(List.of(), out);
    }

    @Test
    void should_look_up_any_supplier_when_the_supplier_is_blank() {
        window(List.of());
        when(stockHistoryRepository.findPricesBefore(eq("I1"), isNull(), eq(START_OF_DAY), eq(Limit.of(1))))
                .thenReturn(List.of(new BigDecimal("2.00")));

        List<PriceTrendDTO> out = service.getPriceTrend("I1", "  ", START, END);

        assertEquals(1, out.size());
    }
}
