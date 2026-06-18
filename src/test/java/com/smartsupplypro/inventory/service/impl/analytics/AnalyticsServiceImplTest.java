package com.smartsupplypro.inventory.service.impl.analytics;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.smartsupplypro.inventory.dto.FinancialSummaryDTO;
import com.smartsupplypro.inventory.dto.ItemUpdateFrequencyDTO;
import com.smartsupplypro.inventory.dto.LowStockItemDTO;
import com.smartsupplypro.inventory.dto.MonthlyStockMovementDTO;
import com.smartsupplypro.inventory.dto.PriceTrendDTO;
import com.smartsupplypro.inventory.dto.StockPerSupplierDTO;
import com.smartsupplypro.inventory.dto.StockUpdateFilterDTO;
import com.smartsupplypro.inventory.dto.StockUpdateResultDTO;
import com.smartsupplypro.inventory.dto.StockValueOverTimeDTO;
import com.smartsupplypro.inventory.service.impl.AnalyticsServiceImpl;

/**
 * Unit tests for {@link AnalyticsServiceImpl} facade delegation correctness.
 * Verifies that each facade method routes to the right delegate and returns
 * the delegate's result unchanged.
 */
@ExtendWith(MockitoExtension.class)
class AnalyticsServiceImplTest {

    @Mock private StockAnalyticsService stockAnalytics;
    @Mock private FinancialAnalyticsService financialAnalytics;
    @InjectMocks private AnalyticsServiceImpl service;

    /**
     * Delegation to {@link StockAnalyticsService}.
     */
    @Nested
    class StockAnalyticsDelegation {

        @Test
        void should_delegate_all_stock_analytics_methods_and_return_delegate_results() {
            LocalDate start = LocalDate.of(2025, 1, 1);
            LocalDate end   = LocalDate.of(2025, 12, 31);
            String supplierId = "sup-1";
            String itemId     = "item-1";

            List<StockValueOverTimeDTO> stockValue    = List.of(mock(StockValueOverTimeDTO.class));
            List<StockPerSupplierDTO>   stockPerSupp  = List.of(mock(StockPerSupplierDTO.class));
            List<ItemUpdateFrequencyDTO> updateFreq   = List.of(mock(ItemUpdateFrequencyDTO.class));
            List<LowStockItemDTO>        lowStock     = List.of(mock(LowStockItemDTO.class));
            List<MonthlyStockMovementDTO> movement    = List.of(mock(MonthlyStockMovementDTO.class));
            StockUpdateFilterDTO filter               = mock(StockUpdateFilterDTO.class);
            List<StockUpdateResultDTO>  updates       = List.of(mock(StockUpdateResultDTO.class));
            List<PriceTrendDTO>          trends       = List.of(mock(PriceTrendDTO.class));

            when(stockAnalytics.getTotalStockValueOverTime(start, end, supplierId)).thenReturn(stockValue);
            when(stockAnalytics.getTotalStockPerSupplier()).thenReturn(stockPerSupp);
            when(stockAnalytics.getItemUpdateFrequency(supplierId)).thenReturn(updateFreq);
            when(stockAnalytics.getItemsBelowMinimumStock(supplierId)).thenReturn(lowStock);
            when(stockAnalytics.getMonthlyStockMovement(start, end, supplierId)).thenReturn(movement);
            when(stockAnalytics.lowStockCount()).thenReturn(42L);
            when(stockAnalytics.getFilteredStockUpdates(filter)).thenReturn(updates);
            when(stockAnalytics.getPriceTrend(itemId, supplierId, start, end)).thenReturn(trends);

            assertSame(stockValue,   service.getTotalStockValueOverTime(start, end, supplierId));
            assertSame(stockPerSupp, service.getTotalStockPerSupplier());
            assertSame(updateFreq,   service.getItemUpdateFrequency(supplierId));
            assertSame(lowStock,     service.getItemsBelowMinimumStock(supplierId));
            assertSame(movement,     service.getMonthlyStockMovement(start, end, supplierId));
            assertEquals(42L,        service.lowStockCount());
            assertSame(updates,      service.getFilteredStockUpdates(filter));
            assertSame(trends,       service.getPriceTrend(itemId, supplierId, start, end));

            verify(stockAnalytics).getTotalStockValueOverTime(start, end, supplierId);
            verify(stockAnalytics).getTotalStockPerSupplier();
            verify(stockAnalytics).getItemUpdateFrequency(supplierId);
            verify(stockAnalytics).getItemsBelowMinimumStock(supplierId);
            verify(stockAnalytics).getMonthlyStockMovement(start, end, supplierId);
            verify(stockAnalytics).lowStockCount();
            verify(stockAnalytics).getFilteredStockUpdates(filter);
            verify(stockAnalytics).getPriceTrend(itemId, supplierId, start, end);
        }
    }

    /**
     * Delegation to {@link FinancialAnalyticsService}.
     */
    @Nested
    class FinancialAnalyticsDelegation {

        @Test
        void should_delegate_financial_summary_and_return_delegate_result() {
            LocalDate from = LocalDate.of(2025, 2, 1);
            LocalDate to   = LocalDate.of(2025, 2, 28);
            String supplierId = "sup-99";

            FinancialSummaryDTO summary = mock(FinancialSummaryDTO.class);
            when(financialAnalytics.getFinancialSummaryWAC(from, to, supplierId)).thenReturn(summary);

            assertSame(summary, service.getFinancialSummaryWAC(from, to, supplierId));
            verify(financialAnalytics).getFinancialSummaryWAC(from, to, supplierId);
        }
    }
}
