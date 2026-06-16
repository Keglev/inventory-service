package com.smartsupplypro.inventory.controller.analytics;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Component;

import com.smartsupplypro.inventory.dto.DashboardSummaryDTO;
import com.smartsupplypro.inventory.service.impl.analytics.StockAnalyticsService;

import lombok.RequiredArgsConstructor;

/**
 * Aggregates multi-source analytics data for the dashboard summary endpoint.
 *
 * <p>Extracted from {@link com.smartsupplypro.inventory.controller.AnalyticsController}
 * to keep endpoint methods under 15 lines.</p>
 */
@Component
@RequiredArgsConstructor
public class AnalyticsDashboardHelper {

    private final StockAnalyticsService stockAnalyticsService;

    /**
     * Builds a comprehensive dashboard summary with multiple analytics.
     *
     * <p>Aggregates stock per supplier, low-stock items (top 3),
     * monthly stock movement, and top updated items (top 5).</p>
     *
     * @param supplierId optional supplier filter
     * @param startDate  start of date range
     * @param endDate    end of date range
     * @return dashboard summary with aggregated data
     */
    public DashboardSummaryDTO buildDashboardSummary(
            String supplierId, LocalDateTime startDate, LocalDateTime endDate) {
        // stockPerSupplier always loads all suppliers regardless of filter -- needed for the overview chart
        return DashboardSummaryDTO.builder()
                .stockPerSupplier(stockAnalyticsService.getTotalStockPerSupplier())
                .lowStockItems(isSupplierProvided(supplierId)
                        ? stockAnalyticsService.getItemsBelowMinimumStock(supplierId).stream().limit(3).toList()
                        : List.of())
                .monthlyStockMovement(stockAnalyticsService.getMonthlyStockMovement(
                        startDate.toLocalDate(), endDate.toLocalDate(), supplierId))
                .topUpdatedItems(isSupplierProvided(supplierId)
                        ? stockAnalyticsService.getItemUpdateFrequency(supplierId).stream().limit(5).toList()
                        : List.of())
                .build();
    }

    private boolean isSupplierProvided(String supplierId) {
        return supplierId != null && !supplierId.isBlank();
    }
}
