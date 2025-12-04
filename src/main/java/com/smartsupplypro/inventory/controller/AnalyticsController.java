package com.smartsupplypro.inventory.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.smartsupplypro.inventory.controller.analytics.AnalyticsControllerValidationHelper;
import com.smartsupplypro.inventory.controller.analytics.AnalyticsDashboardHelper;
import com.smartsupplypro.inventory.dto.DashboardSummaryDTO;
import com.smartsupplypro.inventory.dto.FinancialSummaryDTO;
import com.smartsupplypro.inventory.dto.ItemUpdateFrequencyDTO;
import com.smartsupplypro.inventory.dto.LowStockItemDTO;
import com.smartsupplypro.inventory.dto.MonthlyStockMovementDTO;
import com.smartsupplypro.inventory.dto.PriceTrendDTO;
import com.smartsupplypro.inventory.dto.StockPerSupplierDTO;
import com.smartsupplypro.inventory.dto.StockUpdateFilterDTO;
import com.smartsupplypro.inventory.dto.StockUpdateResultDTO;
import com.smartsupplypro.inventory.dto.StockValueOverTimeDTO;
import com.smartsupplypro.inventory.service.impl.analytics.FinancialAnalyticsService;
import com.smartsupplypro.inventory.service.impl.analytics.StockAnalyticsService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Analytics REST controller for inventory reporting and dashboard data.
 *
 * <p>Delegates to specialized helpers for validation and dashboard aggregation
 * while maintaining the original REST API contract.
 *
 * <p><strong>Delegation Strategy</strong>:
 * <ul>
 *   <li>{@link AnalyticsControllerValidationHelper} - Parameter validation</li>
 *   <li>{@link AnalyticsDashboardHelper} - Dashboard data aggregation</li>
 *   <li>{@link StockAnalyticsService} - Stock metrics and trends</li>
 *   <li>{@link FinancialAnalyticsService} - Financial summaries</li>
 * </ul>
 *
 * @author Smart Supply Pro Development Team
 * @version 2.0.0
 * @since 1.0.0
 * @see StockAnalyticsService
 * @see FinancialAnalyticsService
 */
@RestController
@RequestMapping(value = "/api/analytics", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
@Validated
public class AnalyticsController {

    private final StockAnalyticsService stockAnalyticsService;
    private final FinancialAnalyticsService financialAnalyticsService;
    private final AnalyticsControllerValidationHelper validationHelper;
    private final AnalyticsDashboardHelper dashboardHelper;

    /**
     * Gets time series of total stock value between dates.
     *
     * @param start inclusive start date (ISO yyyy-MM-dd)
     * @param end inclusive end date (ISO yyyy-MM-dd)
     * @param supplierId optional supplier filter
     * @return list of stock value points over time
     */
    @PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
    @GetMapping("/stock-value")
    public ResponseEntity<List<StockValueOverTimeDTO>> getStockValueOverTime(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            @RequestParam(required = false) String supplierId) {

        validationHelper.validateDateRange(start, end, "start", "end");
        return ResponseEntity.ok(stockAnalyticsService.getTotalStockValueOverTime(start, end, supplierId));
    }

    /**
     * Gets current total stock per supplier for charts.
     *
     * @return list of stock quantities per supplier
     */
    @PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
    @GetMapping("/stock-per-supplier")
    public ResponseEntity<List<StockPerSupplierDTO>> getStockPerSupplier() {
        return ResponseEntity.ok(stockAnalyticsService.getTotalStockPerSupplier());
    }

    /**
     * Gets count of items below minimum stock threshold.
     *
     * @return number of low-stock items
     */
    @PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
    @GetMapping("/low-stock/count")
    public long getLowStockCount() {
        return stockAnalyticsService.lowStockCount();
    }

    /**
     * Gets item update frequency for a supplier.
     *
     * @param supplierId required supplier identifier
     * @return list of item update frequencies
     */
    @PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
    @GetMapping("/item-update-frequency")
    public ResponseEntity<List<ItemUpdateFrequencyDTO>> getItemUpdateFrequency(
            @RequestParam(name = "supplierId") String supplierId) {

        validationHelper.requireNonBlank(supplierId, "supplierId");
        return ResponseEntity.ok(stockAnalyticsService.getItemUpdateFrequency(supplierId));
    }

    /**
     * Gets items below minimum stock threshold for a supplier.
     *
     * @param supplierId required supplier identifier
     * @return list of low-stock items with details
     */
    @PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
    @GetMapping("/low-stock-items")
    public ResponseEntity<List<LowStockItemDTO>> getLowStockItems(
            @RequestParam(name = "supplierId") String supplierId) {

        validationHelper.requireNonBlank(supplierId, "supplierId");
        return ResponseEntity.ok(stockAnalyticsService.getItemsBelowMinimumStock(supplierId));
    }

    /**
     * Gets monthly stock movement within date range.
     * @param start inclusive start date (ISO yyyy-MM-dd)
     * @param end inclusive end date (ISO yyyy-MM-dd)
     * @param supplierId optional supplier filter
     */
    @PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
    @GetMapping("/monthly-stock-movement")
    public ResponseEntity<List<MonthlyStockMovementDTO>> getMonthlyStockMovement(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            @RequestParam(required = false) String supplierId) {

        validationHelper.validateDateRange(start, end, "start", "end");
        return ResponseEntity.ok(stockAnalyticsService.getMonthlyStockMovement(start, end, supplierId));
    }

    /**
     * Gets filtered stock updates via query parameters (defaults to last 30 days).
     *
     * @param startDate optional inclusive start date-time (ISO yyyy-MM-dd'T'HH:mm:ss)
     * @param endDate optional inclusive end date-time (ISO yyyy-MM-dd'T'HH:mm:ss)
     * @param itemName optional item name filter
     * @param supplierId optional supplier identifier filter
     * @param createdBy optional creator username filter
     * @param minChange optional minimum quantity change filter
     * @param maxChange optional maximum quantity change filter
     */
    @PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
    @GetMapping("/stock-updates")
    public ResponseEntity<List<StockUpdateResultDTO>> getFilteredStockUpdatesFromParams(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) String itemName,
            @RequestParam(required = false) String supplierId,
            @RequestParam(required = false) String createdBy,
            @RequestParam(required = false) Integer minChange,
            @RequestParam(required = false) Integer maxChange) {

        // Apply default date window (last 30 days)
        LocalDateTime[] dateWindow = validationHelper.applyDefaultDateWindow(startDate, endDate);
        startDate = dateWindow[0];
        endDate = dateWindow[1];
        
        // Validate date & numeric params
        validationHelper.validateDateTimeRange(startDate, endDate, "startDate", "endDate");
        validationHelper.validateNumericRange(minChange, maxChange, "minChange", "maxChange");

        StockUpdateFilterDTO filter = new StockUpdateFilterDTO();
        filter.setStartDate(startDate);
        filter.setEndDate(endDate);
        filter.setItemName(itemName);
        filter.setSupplierId(supplierId);
        filter.setCreatedBy(createdBy);
        filter.setMinChange(minChange);
        filter.setMaxChange(maxChange);

        return ResponseEntity.ok(stockAnalyticsService.getFilteredStockUpdates(filter));
    }

    /**
     * Gets filtered stock updates via JSON payload.
     *
     * @param filter stock update filter criteria
     * @return list of filtered stock updates
     * @throws IllegalArgumentException if validation fails
     */
    @PreAuthorize("isAuthenticated()")
    @PostMapping(value = "/stock-updates/query", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<StockUpdateResultDTO>> getFilteredStockUpdatesPost(
            @RequestBody @Valid StockUpdateFilterDTO filter) {

        validationHelper.validateStockUpdateFilter(filter);
        return ResponseEntity.ok(stockAnalyticsService.getFilteredStockUpdates(filter));
    }

    /**
     * Gets dashboard summary with multiple analytics (defaults to last 30 days).
     * @param supplierId optional supplier filter
     * @param startDate optional inclusive start date-time (ISO yyyy-MM-dd'T'HH:mm:ss)
     * @param endDate optional inclusive end date-time (ISO yyyy-MM-dd'T'HH:mm:ss)
     * @return dashboard summary DTO
     */
    @PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryDTO> getDashboardSummary(
            @RequestParam(required = false) String supplierId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        // Apply default date window
        LocalDateTime[] dateWindow = validationHelper.applyDefaultDateWindow(startDate, endDate);
        startDate = dateWindow[0];
        endDate = dateWindow[1];
        
        validationHelper.validateDateTimeRange(startDate, endDate, "startDate", "endDate");

        return ResponseEntity.ok(dashboardHelper.buildDashboardSummary(supplierId, startDate, endDate));
    }

    /**
     * Gets historical price changes for an item.
     * @param itemId required item identifier
     * @param supplierId optional supplier filter
     * @param start inclusive start date (ISO yyyy-MM-dd)
     * @param end inclusive end date (ISO yyyy-MM-dd)
     * @return list of price trend DTOs
     */
    @PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
    @GetMapping("/price-trend")
    public ResponseEntity<List<PriceTrendDTO>> getPriceTrend(
            @RequestParam String itemId,
            @RequestParam(required = false) String supplierId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {

        validationHelper.requireNonBlank(itemId, "itemId");
        validationHelper.validateDateRange(start, end, "start", "end");
        return ResponseEntity.ok(stockAnalyticsService.getPriceTrend(itemId, supplierId, start, end));
    }

    /**
     * Gets financial summary with WAC calculations.
     * @param from inclusive start date (ISO yyyy-MM-dd)
     * @param to inclusive end date (ISO yyyy-MM-dd)
     * @param supplierId optional supplier filter
     * @return financial summary DTO
     */
    @PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
    @GetMapping("/financial/summary")
    public ResponseEntity<FinancialSummaryDTO> getFinancialSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String supplierId) {

        validationHelper.validateDateRange(from, to, "from", "to");
        return ResponseEntity.ok(financialAnalyticsService.getFinancialSummaryWAC(from, to, supplierId));
    }
}