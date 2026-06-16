package com.smartsupplypro.inventory.controller.analytics;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.smartsupplypro.inventory.dto.DashboardSummaryDTO;
import com.smartsupplypro.inventory.dto.ItemUpdateFrequencyDTO;
import com.smartsupplypro.inventory.dto.LowStockItemDTO;
import com.smartsupplypro.inventory.dto.MonthlyStockMovementDTO;
import com.smartsupplypro.inventory.dto.StockPerSupplierDTO;
import com.smartsupplypro.inventory.service.impl.analytics.StockAnalyticsService;

/**
 * Unit tests for {@link AnalyticsDashboardHelper} covering supplier-conditional aggregation,
 * top-N limiting, and skipping supplier-specific queries when supplierId is absent.
 */
class AnalyticsDashboardHelperTest {

    @Test
    void buildDashboardSummary_supplierProvided_shouldAggregateAndLimitTopN() {
        StockAnalyticsService stockAnalyticsService = mock(StockAnalyticsService.class);
        AnalyticsDashboardHelper helper = new AnalyticsDashboardHelper(stockAnalyticsService);

        String supplierId = "s1";
        LocalDateTime startDate = LocalDateTime.of(2025, 1, 1, 0, 0);
        LocalDateTime endDate = LocalDateTime.of(2025, 1, 31, 0, 0);

        List<StockPerSupplierDTO> stockPerSupplier = List.of(
                new StockPerSupplierDTO("Supplier A", 10),
                new StockPerSupplierDTO("Supplier B", 20)
        );

        List<LowStockItemDTO> lowStock = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            lowStock.add(new LowStockItemDTO("Item" + i, i, i + 10));
        }

        List<MonthlyStockMovementDTO> monthly = List.of(
                new MonthlyStockMovementDTO("2025-01", 100, 50)
        );

        List<ItemUpdateFrequencyDTO> frequencies = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            frequencies.add(new ItemUpdateFrequencyDTO("Item" + i, i));
        }

        when(stockAnalyticsService.getTotalStockPerSupplier()).thenReturn(stockPerSupplier);
        when(stockAnalyticsService.getItemsBelowMinimumStock(eq(supplierId))).thenReturn(lowStock);
        when(stockAnalyticsService.getMonthlyStockMovement(eq(startDate.toLocalDate()), eq(endDate.toLocalDate()), eq(supplierId)))
                .thenReturn(monthly);
        when(stockAnalyticsService.getItemUpdateFrequency(eq(supplierId))).thenReturn(frequencies);

        DashboardSummaryDTO summary = helper.buildDashboardSummary(supplierId, startDate, endDate);

        assertNotNull(summary);
        assertEquals(stockPerSupplier, summary.stockPerSupplier());
        assertEquals(monthly, summary.monthlyStockMovement());

        assertEquals(3, summary.lowStockItems().size());
        assertEquals("Item0", summary.lowStockItems().get(0).itemName());
        assertEquals("Item2", summary.lowStockItems().get(2).itemName());

        assertEquals(5, summary.topUpdatedItems().size());
        assertEquals("Item0", summary.topUpdatedItems().get(0).itemName());
        assertEquals("Item4", summary.topUpdatedItems().get(4).itemName());

        verify(stockAnalyticsService).getTotalStockPerSupplier();
        verify(stockAnalyticsService).getItemsBelowMinimumStock(eq(supplierId));
        verify(stockAnalyticsService).getMonthlyStockMovement(eq(startDate.toLocalDate()), eq(endDate.toLocalDate()), eq(supplierId));
        verify(stockAnalyticsService).getItemUpdateFrequency(eq(supplierId));
    }

    @ParameterizedTest
    @MethodSource("missingSupplierValues")
    void buildDashboardSummary_missingSupplier_shouldSkipSupplierSpecificLoads(String supplierId) {
        StockAnalyticsService stockAnalyticsService = mock(StockAnalyticsService.class);
        AnalyticsDashboardHelper helper = new AnalyticsDashboardHelper(stockAnalyticsService);

        LocalDateTime startDate = LocalDateTime.of(2025, 1, 1, 0, 0);
        LocalDateTime endDate = LocalDateTime.of(2025, 1, 31, 0, 0);

        List<StockPerSupplierDTO> stockPerSupplier = List.of(new StockPerSupplierDTO("Supplier A", 10));
        List<MonthlyStockMovementDTO> monthly = List.of(new MonthlyStockMovementDTO("2025-01", 100, 50));

        when(stockAnalyticsService.getTotalStockPerSupplier()).thenReturn(stockPerSupplier);
        when(stockAnalyticsService.getMonthlyStockMovement(eq(LocalDate.of(2025, 1, 1)), eq(LocalDate.of(2025, 1, 31)), eq(supplierId)))
                .thenReturn(monthly);

        DashboardSummaryDTO summary = helper.buildDashboardSummary(supplierId, startDate, endDate);

        assertNotNull(summary);
        assertEquals(stockPerSupplier, summary.stockPerSupplier());
        assertEquals(monthly, summary.monthlyStockMovement());

        assertTrue(summary.lowStockItems().isEmpty());
        assertTrue(summary.topUpdatedItems().isEmpty());

        verify(stockAnalyticsService, never()).getItemsBelowMinimumStock(org.mockito.ArgumentMatchers.anyString());
        verify(stockAnalyticsService, never()).getItemUpdateFrequency(org.mockito.ArgumentMatchers.anyString());
    }

    @SuppressWarnings("unused")
    private static Stream<String> missingSupplierValues() {
        // Referenced reflectively by JUnit 5 via @MethodSource("missingSupplierValues").
        return Stream.of(null, "", "   ");
    }
}
