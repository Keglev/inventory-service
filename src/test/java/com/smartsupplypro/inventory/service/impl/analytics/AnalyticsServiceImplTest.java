package com.smartsupplypro.inventory.service.impl.analytics;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertSame;
import org.junit.jupiter.api.DisplayName;
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
 * Unit tests for {@link AnalyticsServiceImpl}.
 *
 * <p><strong>Context</strong>: {@link AnalyticsServiceImpl} is a thin facade that preserves the public
 * {@code AnalyticsService} contract while delegating implementation details to specialized analytics services.
 * The heavy lifting (query logic, window validation, DTO conversion rules) lives in those delegated services.
 *
 * <p><strong>What these tests validate</strong>:
 * <ul>
 *   <li>Each facade method delegates to the correct underlying service.</li>
 *   <li>Facade methods return the exact value produced by the delegate (no transformation).</li>
 * </ul>
 *
 * <p><strong>What these tests avoid</strong>:
 * <ul>
 *   <li>They intentionally do not re-test query logic or date-window defaults (covered in
 *       {@code StockAnalyticsService}/{@code FinancialAnalyticsService} unit tests).</li>
 *   <li>They do not boot Spring; these are pure unit tests for delegation correctness.</li>
 * </ul>
 *
 * <p><strong>Why this still matters</strong>:
 * A facade is easy to break during refactors (wrong delegate, wrong parameter ordering, missing call).
 * These tests provide a cheap safety net for such regressions.
 */
@ExtendWith(MockitoExtension.class)
class AnalyticsServiceImplTest {

    @Mock private StockAnalyticsService stockAnalytics;
    @Mock private FinancialAnalyticsService financialAnalytics;

    @InjectMocks private AnalyticsServiceImpl service;

    @Test
    @DisplayName("Delegates stock analytics methods to StockAnalyticsService")
    void delegatesStockAnalyticsMethods() {
        // GIVEN - a representative set of inputs used across multiple facade methods
        LocalDate start = LocalDate.of(2025, 1, 1);
        LocalDate end = LocalDate.of(2025, 12, 31);
        String supplierId = "sup-1";
        String itemId = "item-1";

        List<StockValueOverTimeDTO> stockValueOverTime = List.of(mock(StockValueOverTimeDTO.class));
        when(stockAnalytics.getTotalStockValueOverTime(start, end, supplierId)).thenReturn(stockValueOverTime);

        List<StockPerSupplierDTO> stockPerSupplier = List.of(mock(StockPerSupplierDTO.class));
        when(stockAnalytics.getTotalStockPerSupplier()).thenReturn(stockPerSupplier);

        List<ItemUpdateFrequencyDTO> updateFrequency = List.of(mock(ItemUpdateFrequencyDTO.class));
        when(stockAnalytics.getItemUpdateFrequency(supplierId)).thenReturn(updateFrequency);

        List<LowStockItemDTO> lowStockItems = List.of(mock(LowStockItemDTO.class));
        when(stockAnalytics.getItemsBelowMinimumStock(supplierId)).thenReturn(lowStockItems);

        List<MonthlyStockMovementDTO> movement = List.of(mock(MonthlyStockMovementDTO.class));
        when(stockAnalytics.getMonthlyStockMovement(start, end, supplierId)).thenReturn(movement);

        long lowStockCount = 42L;
        when(stockAnalytics.lowStockCount()).thenReturn(lowStockCount);

        StockUpdateFilterDTO filter = mock(StockUpdateFilterDTO.class);
        List<StockUpdateResultDTO> updates = List.of(mock(StockUpdateResultDTO.class));
        when(stockAnalytics.getFilteredStockUpdates(filter)).thenReturn(updates);

        List<PriceTrendDTO> trends = List.of(mock(PriceTrendDTO.class));
        when(stockAnalytics.getPriceTrend(itemId, supplierId, start, end)).thenReturn(trends);

        // WHEN/THEN - assert the facade returns exactly the delegate output (identity),
        // and verify each underlying method is invoked with the same parameters.
        assertSame(stockValueOverTime, service.getTotalStockValueOverTime(start, end, supplierId));
        assertSame(stockPerSupplier, service.getTotalStockPerSupplier());
        assertSame(updateFrequency, service.getItemUpdateFrequency(supplierId));
        assertSame(lowStockItems, service.getItemsBelowMinimumStock(supplierId));
        assertSame(movement, service.getMonthlyStockMovement(start, end, supplierId));
        org.junit.jupiter.api.Assertions.assertEquals(lowStockCount, service.lowStockCount());
        assertSame(updates, service.getFilteredStockUpdates(filter));
        assertSame(trends, service.getPriceTrend(itemId, supplierId, start, end));

        verify(stockAnalytics).getTotalStockValueOverTime(start, end, supplierId);
        verify(stockAnalytics).getTotalStockPerSupplier();
        verify(stockAnalytics).getItemUpdateFrequency(supplierId);
        verify(stockAnalytics).getItemsBelowMinimumStock(supplierId);
        verify(stockAnalytics).getMonthlyStockMovement(start, end, supplierId);
        verify(stockAnalytics).lowStockCount();
        verify(stockAnalytics).getFilteredStockUpdates(filter);
        verify(stockAnalytics).getPriceTrend(itemId, supplierId, start, end);
    }

    @Test
    @DisplayName("Delegates financial summary to FinancialAnalyticsService")
    void delegatesFinancialSummaryToFinancialAnalyticsService() {
        // GIVEN
        LocalDate from = LocalDate.of(2025, 2, 1);
        LocalDate to = LocalDate.of(2025, 2, 28);
        String supplierId = "sup-99";

        FinancialSummaryDTO summary = mock(FinancialSummaryDTO.class);
        when(financialAnalytics.getFinancialSummaryWAC(from, to, supplierId)).thenReturn(summary);

        // WHEN/THEN
        assertSame(summary, service.getFinancialSummaryWAC(from, to, supplierId));

        verify(financialAnalytics).getFinancialSummaryWAC(from, to, supplierId);
    }
}
