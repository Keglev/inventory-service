package com.smartsupplypro.inventory.service.impl.analytics;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.smartsupplypro.inventory.dto.StockUpdateFilterDTO;
import com.smartsupplypro.inventory.dto.StockUpdateResultDTO;
import com.smartsupplypro.inventory.exception.InvalidRequestException;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;

/**
 * Unit tests for {@link StockAnalyticsService}'s paged stock-update search, the
 * one-sided date windows both stock-update searches accept, and the low-stock count.
 */
@ExtendWith(MockitoExtension.class)
class StockAnalyticsServiceStockUpdatesPageTest {

    @Mock private StockHistoryRepository stockHistoryRepository;
    @Mock private InventoryItemRepository inventoryItemRepository;
    @InjectMocks private StockAnalyticsService service;

    private static StockUpdateFilterDTO window(LocalDateTime start, LocalDateTime end) {
        StockUpdateFilterDTO f = new StockUpdateFilterDTO();
        f.setStartDate(start);
        f.setEndDate(end);
        return f;
    }

    private void stubPage(Page<Object[]> page) {
        when(stockHistoryRepository.searchStockUpdatesPage(
                any(), any(), any(), any(), any(), any(), any(), any())).thenReturn(page);
    }

    /**
     * The paged search: row mapping, page metadata, normalisation and validation.
     */
    @Nested
    class FilteredStockUpdatesPage {

        @Test
        void should_map_every_row_and_keep_the_page_metadata_when_the_repository_returns_a_page() {
            Timestamp ts = Timestamp.valueOf(LocalDateTime.of(2026, 9, 1, 8, 30));
            Pageable pageable = PageRequest.of(1, 5);
            stubPage(new PageImpl<>(List.<Object[]>of(
                    new Object[]{"ItemA", "SuppA", -4, "SOLD", "alice", ts}), pageable, 6));
            StockUpdateFilterDTO f = window(LocalDateTime.of(2026, 9, 1, 0, 0), LocalDateTime.of(2026, 9, 30, 0, 0));
            f.setItemName("Item");
            f.setSupplierId("S1");
            f.setCreatedBy("alice");
            f.setMinChange(-10);
            f.setMaxChange(10);

            Page<StockUpdateResultDTO> out = service.getFilteredStockUpdatesPage(f, pageable);

            assertEquals(6, out.getTotalElements());
            assertEquals(1, out.getNumber());
            assertEquals(5, out.getSize());
            assertEquals(new StockUpdateResultDTO("ItemA", "SuppA", -4, "SOLD", "alice", ts.toLocalDateTime()),
                    out.getContent().get(0));
            verify(stockHistoryRepository).searchStockUpdatesPage(
                    eq(f.getStartDate()), eq(f.getEndDate()), eq("Item"), eq("S1"), eq("alice"),
                    eq(-10), eq(10), eq(pageable));
        }

        @Test
        void should_pass_null_to_the_repository_when_a_filter_string_is_blank() {
            stubPage(Page.empty());
            StockUpdateFilterDTO f = window(null, null);
            f.setItemName("   ");
            f.setSupplierId(" ");
            f.setCreatedBy("");

            service.getFilteredStockUpdatesPage(f, PageRequest.of(0, 5));

            verify(stockHistoryRepository).searchStockUpdatesPage(
                    any(), any(), isNull(), isNull(), isNull(), isNull(), isNull(), any());
        }

        @Test
        void should_default_to_the_last_thirty_days_when_both_dates_are_null() {
            stubPage(Page.empty());

            service.getFilteredStockUpdatesPage(window(null, null), PageRequest.of(0, 5));

            ArgumentCaptor<LocalDateTime> start = ArgumentCaptor.forClass(LocalDateTime.class);
            ArgumentCaptor<LocalDateTime> end = ArgumentCaptor.forClass(LocalDateTime.class);
            verify(stockHistoryRepository).searchStockUpdatesPage(
                    start.capture(), end.capture(), any(), any(), any(), any(), any(), any());
            assertEquals(Duration.ofDays(30), Duration.between(start.getValue(), end.getValue()));
        }

        @Test
        void should_pass_only_the_minimum_when_max_change_is_null() {
            stubPage(Page.empty());
            StockUpdateFilterDTO f = window(null, null);
            f.setMinChange(3);

            service.getFilteredStockUpdatesPage(f, PageRequest.of(0, 5));

            verify(stockHistoryRepository).searchStockUpdatesPage(
                    any(), any(), any(), any(), any(), eq(3), isNull(), any());
        }

        @Test
        void should_throw_and_skip_the_query_when_min_change_exceeds_max_change() {
            StockUpdateFilterDTO f = window(null, null);
            f.setMinChange(10);
            f.setMaxChange(5);

            assertThrows(InvalidRequestException.class,
                    () -> service.getFilteredStockUpdatesPage(f, PageRequest.of(0, 5)));
            verifyNoInteractions(stockHistoryRepository);
        }

        @Test
        void should_throw_when_filter_is_null() {
            assertThrows(InvalidRequestException.class,
                    () -> service.getFilteredStockUpdatesPage(null, PageRequest.of(0, 5)));
        }
    }

    /**
     * A single supplied date bound is passed through; only two absent bounds are defaulted.
     */
    @Nested
    class OneSidedDateWindow {

        @Test
        void should_keep_only_the_end_date_when_the_start_date_is_null() {
            stubPage(Page.empty());
            LocalDateTime end = LocalDateTime.of(2026, 9, 25, 0, 0);

            service.getFilteredStockUpdatesPage(window(null, end), PageRequest.of(0, 5));

            verify(stockHistoryRepository).searchStockUpdatesPage(
                    isNull(), eq(end), any(), any(), any(), any(), any(), any());
        }

        @Test
        void should_keep_only_the_start_date_when_the_end_date_is_null() {
            stubPage(Page.empty());
            LocalDateTime start = LocalDateTime.of(2026, 9, 1, 0, 0);

            service.getFilteredStockUpdatesPage(window(start, null), PageRequest.of(0, 5));

            verify(stockHistoryRepository).searchStockUpdatesPage(
                    eq(start), isNull(), any(), any(), any(), any(), any(), any());
        }
    }

    /**
     * The unpaged search passes a lone minimum through, as the paged one does.
     */
    @Nested
    class FilteredStockUpdates {

        @Test
        void should_pass_only_the_minimum_when_max_change_is_null() {
            when(stockHistoryRepository.searchStockUpdates(any(), any(), any(), any(), any(), any(), any()))
                    .thenReturn(List.of());
            StockUpdateFilterDTO f = window(null, null);
            f.setMinChange(3);

            List<StockUpdateResultDTO> out = service.getFilteredStockUpdates(f);

            assertEquals(0, out.size());
            verify(stockHistoryRepository).searchStockUpdates(
                    any(), any(), any(), any(), any(), eq(3), isNull());
        }
    }

    /**
     * The global low-stock KPI.
     */
    @Nested
    class LowStockCount {

        @Test
        void should_return_the_repository_count_when_low_stock_items_are_counted() {
            when(inventoryItemRepository.countItemsBelowMinimumStock()).thenReturn(6L);

            assertEquals(6L, service.lowStockCount());
        }
    }
}
