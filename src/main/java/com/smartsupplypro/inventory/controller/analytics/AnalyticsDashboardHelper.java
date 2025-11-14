package com.smartsupplypro.inventory.controller.analytics;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Component;

import com.smartsupplypro.inventory.dto.DashboardSummaryDTO;
import com.smartsupplypro.inventory.service.impl.analytics.StockAnalyticsService;

import lombok.RequiredArgsConstructor;

/**
 * Dashboard aggregation helper for analytics controller.
 *
 * <p>Centralizes complex dashboard data aggregation logic:
 * <ul>
 *   <li>Multi-source data aggregation (stock, low-stock items, movements, frequencies)</li>
 *   <li>Conditional data loading based on supplier filter</li>
 *   <li>Result limiting for top-N queries</li>
 *   <li>Date window defaulting</li>
 * </ul>
 *
 * @author Smart Supply Pro Development Team
 * @version 1.0.0
 * @since 2.0.0
 */
@Component
@RequiredArgsConstructor
public class AnalyticsDashboardHelper {

    private final StockAnalyticsService stockAnalyticsService;

    /**
     * Builds comprehensive dashboard summary with multiple analytics.
     *
     * <p>Aggregates:
     * <ul>
     *   <li>Stock per supplier (all suppliers)</li>
     *   <li>Low stock items (top 3, supplier-specific)</li>
     *   <li>Monthly stock movement (supplier-filtered)</li>
     *   <li>Top updated items (top 5, supplier-specific)</li>
     * </ul>
     *
     * @param supplierId optional supplier filter
     * @param startDate start of date range
     * @param endDate end of date range
     * @return dashboard summary with aggregated data
     */
    public DashboardSummaryDTO buildDashboardSummary(String supplierId, LocalDateTime startDate, LocalDateTime endDate) {
        DashboardSummaryDTO summary = new DashboardSummaryDTO();

        // Stock per supplier (always load all suppliers for overview)
        summary.setStockPerSupplier(stockAnalyticsService.getTotalStockPerSupplier());

        // Low stock items (supplier-specific, top 3)
        summary.setLowStockItems(isSupplierProvided(supplierId)
                ? stockAnalyticsService.getItemsBelowMinimumStock(supplierId).stream().limit(3).toList()
                : List.of());

        // Monthly stock movement (supplier-filtered)
        summary.setMonthlyStockMovement(stockAnalyticsService.getMonthlyStockMovement(
                startDate.toLocalDate(), endDate.toLocalDate(), supplierId));

        // Top updated items (supplier-specific, top 5)
        summary.setTopUpdatedItems(isSupplierProvided(supplierId)
                ? stockAnalyticsService.getItemUpdateFrequency(supplierId).stream().limit(5).toList()
                : List.of());

        return summary;
    }

    /**
     * Checks if supplier filter is provided and non-blank.
     *
     * @param supplierId the supplier identifier to check
     * @return true if supplier filter is valid, false otherwise
     */
    private boolean isSupplierProvided(String supplierId) {
        return supplierId != null && !supplierId.isBlank();
    }
}
