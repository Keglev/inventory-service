package com.smartsupplypro.inventory.service.impl;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartsupplypro.inventory.dto.FinancialSummaryDTO;
import com.smartsupplypro.inventory.dto.ItemUpdateFrequencyDTO;
import com.smartsupplypro.inventory.dto.LowStockItemDTO;
import com.smartsupplypro.inventory.dto.MonthlyStockMovementDTO;
import com.smartsupplypro.inventory.dto.PriceTrendDTO;
import com.smartsupplypro.inventory.dto.StockPerSupplierDTO;
import com.smartsupplypro.inventory.dto.StockUpdateFilterDTO;
import com.smartsupplypro.inventory.dto.StockUpdateResultDTO;
import com.smartsupplypro.inventory.dto.StockValueOverTimeDTO;
import com.smartsupplypro.inventory.service.AnalyticsService;
import com.smartsupplypro.inventory.service.impl.analytics.FinancialAnalyticsService;
import com.smartsupplypro.inventory.service.impl.analytics.StockAnalyticsService;

import lombok.RequiredArgsConstructor;

/**
 * Analytics service facade delegating to specialized analytics implementations.
 *
 * <p><strong>Purpose</strong>:
 * Maintains backward compatibility by providing the original {@link AnalyticsService}
 * interface while internally delegating to focused, domain-specific service implementations.
 *
 * <p><strong>Delegation Strategy</strong>:
 * <ul>
 *   <li>{@link StockAnalyticsService} - Stock metrics, trends, and low stock alerts</li>
 *   <li>{@link FinancialAnalyticsService} - WAC-based financial summaries</li>
 * </ul>
 *
 * <p><strong>Design Rationale</strong>:
 * The original 733-line service was split into specialized services (200-300 lines each)
 * for better maintainability while preserving the existing public API contract.
 *
 * @author Smart Supply Pro Development Team
 * @version 2.0.0
 * @since 1.0.0
 * @see StockAnalyticsService
 * @see FinancialAnalyticsService
 * @deprecated Consider injecting specialized analytics services directly in new code
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Deprecated(since = "2.0.0", forRemoval = false)
public class AnalyticsServiceImpl implements AnalyticsService {

    private final StockAnalyticsService stockAnalytics;
    private final FinancialAnalyticsService financialAnalytics;

    @Override
    public List<StockValueOverTimeDTO> getTotalStockValueOverTime(LocalDate startDate,
                                                                  LocalDate endDate,
                                                                  String supplierId) {
        return stockAnalytics.getTotalStockValueOverTime(startDate, endDate, supplierId);
    }

    @Override
    public List<StockPerSupplierDTO> getTotalStockPerSupplier() {
        return stockAnalytics.getTotalStockPerSupplier();
    }

    @Override
    public List<ItemUpdateFrequencyDTO> getItemUpdateFrequency(String supplierId) {
        return stockAnalytics.getItemUpdateFrequency(supplierId);
    }

    @Override
    public List<LowStockItemDTO> getItemsBelowMinimumStock(String supplierId) {
        return stockAnalytics.getItemsBelowMinimumStock(supplierId);
    }

    @Override
    public List<MonthlyStockMovementDTO> getMonthlyStockMovement(LocalDate startDate,
                                                                 LocalDate endDate,
                                                                 String supplierId) {
        return stockAnalytics.getMonthlyStockMovement(startDate, endDate, supplierId);
    }

    @Override
    @Transactional(readOnly = true)
    public long lowStockCount() {
        return stockAnalytics.lowStockCount();
    }

    @Override
    public List<StockUpdateResultDTO> getFilteredStockUpdates(StockUpdateFilterDTO filter) {
        return stockAnalytics.getFilteredStockUpdates(filter);
    }

    @Override
    public List<PriceTrendDTO> getPriceTrend(String itemId, String supplierId, LocalDate start, LocalDate end) {
        return stockAnalytics.getPriceTrend(itemId, supplierId, start, end);
    }

    @Override
    public FinancialSummaryDTO getFinancialSummaryWAC(LocalDate from, LocalDate to, String supplierId) {
        return financialAnalytics.getFinancialSummaryWAC(from, to, supplierId);
    }
}
