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
 * Default implementation of {@link AnalyticsService} delegating to focused
 * domain-specific services for stock and financial analytics.
 *
 * <p>{@link StockAnalyticsService} handles stock metrics, trends, and low-stock alerts.
 * {@link FinancialAnalyticsService} handles WAC-based financial summaries.</p>
 *
 * @see StockAnalyticsService
 * @see FinancialAnalyticsService
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsServiceImpl implements AnalyticsService {

    private final StockAnalyticsService stockAnalytics;
    private final FinancialAnalyticsService financialAnalytics;

    /** {@inheritDoc} */
    @Override
    public List<StockValueOverTimeDTO> getTotalStockValueOverTime(LocalDate startDate,
                                                                  LocalDate endDate,
                                                                  String supplierId) {
        return stockAnalytics.getTotalStockValueOverTime(startDate, endDate, supplierId);
    }

    /** {@inheritDoc} */
    @Override
    public List<StockPerSupplierDTO> getTotalStockPerSupplier() {
        return stockAnalytics.getTotalStockPerSupplier();
    }

    /** {@inheritDoc} */
    @Override
    public List<ItemUpdateFrequencyDTO> getItemUpdateFrequency(String supplierId) {
        return stockAnalytics.getItemUpdateFrequency(supplierId);
    }

    /** {@inheritDoc} */
    @Override
    public List<LowStockItemDTO> getItemsBelowMinimumStock(String supplierId) {
        return stockAnalytics.getItemsBelowMinimumStock(supplierId);
    }

    /** {@inheritDoc} */
    @Override
    public List<MonthlyStockMovementDTO> getMonthlyStockMovement(LocalDate startDate,
                                                                 LocalDate endDate,
                                                                 String supplierId) {
        return stockAnalytics.getMonthlyStockMovement(startDate, endDate, supplierId);
    }

    /** {@inheritDoc} */
    @Override
    @Transactional(readOnly = true)
    public long lowStockCount() {
        return stockAnalytics.lowStockCount();
    }

    /** {@inheritDoc} */
    @Override
    public List<StockUpdateResultDTO> getFilteredStockUpdates(StockUpdateFilterDTO filter) {
        return stockAnalytics.getFilteredStockUpdates(filter);
    }

    /** {@inheritDoc} */
    @Override
    public List<PriceTrendDTO> getPriceTrend(String itemId, String supplierId, LocalDate start, LocalDate end) {
        return stockAnalytics.getPriceTrend(itemId, supplierId, start, end);
    }

    /** {@inheritDoc} */
    @Override
    public FinancialSummaryDTO getFinancialSummaryWAC(LocalDate from, LocalDate to, String supplierId) {
        return financialAnalytics.getFinancialSummaryWAC(from, to, supplierId);
    }
}
