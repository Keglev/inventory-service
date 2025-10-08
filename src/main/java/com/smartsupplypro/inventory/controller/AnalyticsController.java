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
import com.smartsupplypro.inventory.exception.InvalidRequestException;
import com.smartsupplypro.inventory.service.AnalyticsService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Analytics REST controller for inventory reporting and dashboard data.
 *
 * <p>Provides time-series analytics, KPIs, and filtered reports.
 * Supports demo mode for read-only endpoints, authenticated access for mutations.</p>
 *
 * @see AnalyticsService
 * @see <a href="file:../../../../../../docs/architecture/patterns/controller-patterns.md">Controller Patterns</a>
 */
@RestController
@RequestMapping(value = "/api/analytics", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
@Validated
public class AnalyticsController{

    // Enterprise Comment: Demo Mode Security Pattern
    // Read-only endpoints use: @PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
    // This allows public access in demo mode while maintaining authentication for production.
    // Mutating operations (POST/PUT/PATCH/DELETE) always require authentication.
    private final AnalyticsService analyticsService;

    /**
     * Gets time series of total stock value between dates.
     *
     * @param start      inclusive start date (ISO yyyy-MM-dd)
     * @param end        inclusive end date (ISO yyyy-MM-dd)
     * @param supplierId optional supplier filter
     * @return list of stock value points over time
     * @throws InvalidRequestException if date range is invalid
     */
    @PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
    @GetMapping("/stock-value")
    public ResponseEntity<List<StockValueOverTimeDTO>> getStockValueOverTime(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            @RequestParam(required = false) String supplierId) {

        validateDateRange(start, end, "start", "end");
        return ResponseEntity.ok(analyticsService.getTotalStockValueOverTime(start, end, supplierId));
    }

    /**
     * Gets current total stock per supplier for charts.
     *
     * @return list of stock quantities per supplier
     */
    @PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
    @GetMapping("/stock-per-supplier")
    public ResponseEntity<List<StockPerSupplierDTO>> getStockPerSupplier() {
        return ResponseEntity.ok(analyticsService.getTotalStockPerSupplier());
    }

    /**
     * Gets count of items below minimum stock threshold.
     *
     * @return number of low-stock items
     */
    @PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
    @GetMapping("/low-stock/count")
    public long getLowStockCount() {
        return analyticsService.lowStockCount();
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

        requireNonBlank(supplierId, "supplierId");
        return ResponseEntity.ok(analyticsService.getItemUpdateFrequency(supplierId));
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

        requireNonBlank(supplierId, "supplierId");
        return ResponseEntity.ok(analyticsService.getItemsBelowMinimumStock(supplierId));
    }

    /**
     * Gets monthly stock movement within date range.
     *
     * @param start      inclusive start date (ISO yyyy-MM-dd)
     * @param end        inclusive end date (ISO yyyy-MM-dd)
     * @param supplierId optional supplier filter
     * @return list of monthly stock movement data
     */
    @PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
    @GetMapping("/monthly-stock-movement")
    public ResponseEntity<List<MonthlyStockMovementDTO>> getMonthlyStockMovement(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            @RequestParam(required = false) String supplierId) {

        validateDateRange(start, end, "start", "end");
        return ResponseEntity.ok(analyticsService.getMonthlyStockMovement(start, end, supplierId));
    }

    /**
     * Gets filtered stock updates via query parameters.
     *
     * <p>Defaults to last 30 days if no dates provided.</p>
     *
     * @param startDate  optional start timestamp
     * @param endDate    optional end timestamp
     * @param itemName   optional item name filter
     * @param supplierId optional supplier filter
     * @param createdBy  optional creator filter
     * @param minChange  optional minimum quantity change
     * @param maxChange  optional maximum quantity change
     * @return list of filtered stock updates
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

        // Enterprise Comment: Default Date Window Strategy
        // When no dates provided, default to last 30 days to prevent unbounded queries
        // that could impact performance on large datasets
        if (startDate == null && endDate == null) {
            endDate = LocalDateTime.now();
            startDate = endDate.minusDays(30);
        }
        // Validate date & numeric params
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new InvalidRequestException("startDate must be on or before endDate");
        }
        if (minChange != null && maxChange != null && minChange > maxChange) {
            throw new InvalidRequestException("minChange must be <= maxChange");
        }

        StockUpdateFilterDTO filter = new StockUpdateFilterDTO();
        filter.setStartDate(startDate);
        filter.setEndDate(endDate);
        filter.setItemName(itemName);
        filter.setSupplierId(supplierId);
        filter.setCreatedBy(createdBy);
        filter.setMinChange(minChange);
        filter.setMaxChange(maxChange);

        return ResponseEntity.ok(analyticsService.getFilteredStockUpdates(filter));
    }

    /**
     * Gets filtered stock updates via JSON payload.
     *
     * @param filter stock update filter criteria
     * @return list of filtered stock updates
     */
    @PreAuthorize("isAuthenticated()")
    @PostMapping(value = "/stock-updates/query", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<StockUpdateResultDTO>> getFilteredStockUpdatesPost(
            @RequestBody @Valid StockUpdateFilterDTO filter) {

        if (filter.getStartDate() != null && filter.getEndDate() != null
                && filter.getStartDate().isAfter(filter.getEndDate())) {
            throw new InvalidRequestException("startDate must be on or before endDate");
        }
        if (filter.getMinChange() != null && filter.getMaxChange() != null
                && filter.getMinChange() > filter.getMaxChange()) {
            throw new InvalidRequestException("minChange must be <= maxChange");
        }

        return ResponseEntity.ok(analyticsService.getFilteredStockUpdates(filter));
    }

    /**
     * Gets dashboard summary with multiple analytics.
     *
     * <p>Defaults to last 30 days if no dates provided.</p>
     *
     * @param supplierId optional supplier filter
     * @param startDate  optional start timestamp
     * @param endDate    optional end timestamp
     * @return dashboard summary with multiple data sets
     */
    @PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryDTO> getDashboardSummary(
            @RequestParam(required = false) String supplierId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        if (startDate == null) startDate = LocalDateTime.now().minusDays(30);
        if (endDate == null) endDate = LocalDateTime.now();
        if (startDate.isAfter(endDate)) {
            throw new InvalidRequestException("startDate must be on or before endDate");
        }

        DashboardSummaryDTO summary = new DashboardSummaryDTO();
        summary.setStockPerSupplier(analyticsService.getTotalStockPerSupplier());

        summary.setLowStockItems(supplierId != null && !supplierId.isBlank()
                ? analyticsService.getItemsBelowMinimumStock(supplierId).stream().limit(3).toList()
                : List.of());

        summary.setMonthlyStockMovement(analyticsService.getMonthlyStockMovement(
                startDate.toLocalDate(), endDate.toLocalDate(), supplierId));

        summary.setTopUpdatedItems(supplierId != null && !supplierId.isBlank()
                ? analyticsService.getItemUpdateFrequency(supplierId).stream().limit(5).toList()
                : List.of());

        return ResponseEntity.ok(summary);
    }

    /**
     * Gets historical price changes for an item.
     *
     * @param itemId     required inventory item ID
     * @param supplierId optional supplier filter
     * @param start      inclusive start date (ISO yyyy-MM-dd)
     * @param end        inclusive end date (ISO yyyy-MM-dd)
     * @return list of price trend data points
     */
    @PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
    @GetMapping("/price-trend")
    public ResponseEntity<List<PriceTrendDTO>> getPriceTrend(
            @RequestParam String itemId,
            @RequestParam(required = false) String supplierId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {

        requireNonBlank(itemId, "itemId");
        validateDateRange(start, end, "start", "end");
        return ResponseEntity.ok(analyticsService.getPriceTrend(itemId, supplierId, start, end));
    }

    /**
     * Gets financial summary with WAC calculations.
     *
     * @param from       inclusive start date (ISO yyyy-MM-dd)
     * @param to         inclusive end date (ISO yyyy-MM-dd)
     * @param supplierId optional supplier filter
     * @return financial summary with purchases, COGS, write-offs
     */
    @PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
    @GetMapping("/financial/summary")
    public ResponseEntity<FinancialSummaryDTO> getFinancialSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String supplierId) {

        // reuse helper for date validation
        validateDateRange(from, to, "from", "to");
        return ResponseEntity.ok(analyticsService.getFinancialSummaryWAC(from, to, supplierId));
    }

    // ------------------------------------------------------------------------
    // Validation Helpers
    // ------------------------------------------------------------------------

    /**
     * Validates date range parameters.
     *
     * @param start     start date (must not be null)
     * @param end       end date (must not be null and >= start)
     * @param startName parameter name for error messages
     * @param endName   parameter name for error messages
     * @throws InvalidRequestException if validation fails
     */
    private static void validateDateRange(LocalDate start, LocalDate end,
                                          String startName, String endName) {
        if (start == null || end == null) {
            throw new InvalidRequestException(startName + " and " + endName + " are required");
        }
        if (start.isAfter(end)) {
            throw new InvalidRequestException(startName + " must be on or before " + endName);
        }
    }

    /**
     * Validates string parameter is not blank.
     *
     * @param value parameter value to check
     * @param name  parameter name for error messages
     * @throws InvalidRequestException if value is blank
     */
    private static void requireNonBlank(String value, String name) {
        if (value == null || value.trim().isEmpty()) {
            throw new InvalidRequestException(name + " must not be blank");
        }
    }
}