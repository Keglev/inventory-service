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
 * Unit tests for {@link AnalyticsDashboardHelper}.
 *
 * <p><strong>Why unit tests (in addition to controller tests)?</strong>
 * Controller MVC tests typically mock this helper to keep endpoint tests focused on request/response
 * wiring. That leaves the aggregation rules (supplier conditional loads, top-N limiting, and
 * delegations to {@link StockAnalyticsService}) uncovered in JaCoCo.
 *
 * <p><strong>Coverage intent</strong>
 * These tests exercise both branches of the supplier filter check:
 * <ul>
 *   <li>Supplier provided: low-stock and update-frequency queries are executed and limited.</li>
 *   <li>Supplier missing/blank: supplier-specific queries are skipped and empty lists returned.</li>
 * </ul>
 */
class AnalyticsDashboardHelperTest {

    @Test
    void buildDashboardSummary_supplierProvided_shouldAggregateAndLimitTopN() {
        // Given: a helper backed by a mocked analytics service
        StockAnalyticsService stockAnalyticsService = mock(StockAnalyticsService.class);
        AnalyticsDashboardHelper helper = new AnalyticsDashboardHelper(stockAnalyticsService);

        // Given: a supplier filter and an explicit date window
        String supplierId = "s1";
        LocalDateTime startDate = LocalDateTime.of(2025, 1, 1, 0, 0);
        LocalDateTime endDate = LocalDateTime.of(2025, 1, 31, 0, 0);

        // Given: upstream data (some lists are intentionally longer than top-N limits)
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

        // When: building the dashboard summary
        DashboardSummaryDTO summary = helper.buildDashboardSummary(supplierId, startDate, endDate);

        // Then: overview metrics are always populated
        assertNotNull(summary);
        assertEquals(stockPerSupplier, summary.getStockPerSupplier());
        assertEquals(monthly, summary.getMonthlyStockMovement());

        // Then: supplier-specific lists are limited (top 3 low-stock, top 5 updated)
        assertEquals(3, summary.getLowStockItems().size());
        assertEquals("Item0", summary.getLowStockItems().get(0).getItemName());
        assertEquals("Item2", summary.getLowStockItems().get(2).getItemName());

        assertEquals(5, summary.getTopUpdatedItems().size());
        assertEquals("Item0", summary.getTopUpdatedItems().get(0).getItemName());
        assertEquals("Item4", summary.getTopUpdatedItems().get(4).getItemName());

        // And: expected supplier-specific service calls are executed
        verify(stockAnalyticsService).getTotalStockPerSupplier();
        verify(stockAnalyticsService).getItemsBelowMinimumStock(eq(supplierId));
        verify(stockAnalyticsService).getMonthlyStockMovement(eq(startDate.toLocalDate()), eq(endDate.toLocalDate()), eq(supplierId));
        verify(stockAnalyticsService).getItemUpdateFrequency(eq(supplierId));
    }

    @ParameterizedTest
    @MethodSource("missingSupplierValues")
    void buildDashboardSummary_missingSupplier_shouldSkipSupplierSpecificLoads(String supplierId) {
        // Given: supplierId is missing/blank and the helper is backed by a mocked analytics service
        StockAnalyticsService stockAnalyticsService = mock(StockAnalyticsService.class);
        AnalyticsDashboardHelper helper = new AnalyticsDashboardHelper(stockAnalyticsService);

        // Given: an explicit date window (still required for movement aggregation)
        LocalDateTime startDate = LocalDateTime.of(2025, 1, 1, 0, 0);
        LocalDateTime endDate = LocalDateTime.of(2025, 1, 31, 0, 0);

        List<StockPerSupplierDTO> stockPerSupplier = List.of(new StockPerSupplierDTO("Supplier A", 10));
        List<MonthlyStockMovementDTO> monthly = List.of(new MonthlyStockMovementDTO("2025-01", 100, 50));

        when(stockAnalyticsService.getTotalStockPerSupplier()).thenReturn(stockPerSupplier);
        when(stockAnalyticsService.getMonthlyStockMovement(eq(LocalDate.of(2025, 1, 1)), eq(LocalDate.of(2025, 1, 31)), eq(supplierId)))
                .thenReturn(monthly);

        // When
        DashboardSummaryDTO summary = helper.buildDashboardSummary(supplierId, startDate, endDate);

        // Then: overview metrics are still populated
        assertNotNull(summary);
        assertEquals(stockPerSupplier, summary.getStockPerSupplier());
        assertEquals(monthly, summary.getMonthlyStockMovement());

        // Then: supplier-specific sections are omitted for missing/blank supplier filters
        assertTrue(summary.getLowStockItems().isEmpty());
        assertTrue(summary.getTopUpdatedItems().isEmpty());

        // And: supplier-specific queries are not invoked
        verify(stockAnalyticsService, never()).getItemsBelowMinimumStock(org.mockito.ArgumentMatchers.anyString());
        verify(stockAnalyticsService, never()).getItemUpdateFrequency(org.mockito.ArgumentMatchers.anyString());
    }

    @SuppressWarnings("unused")
    private static Stream<String> missingSupplierValues() {
        // Referenced reflectively by JUnit 5 via @MethodSource("missingSupplierValues").
        return Stream.of(null, "", "   ");
    }
}
