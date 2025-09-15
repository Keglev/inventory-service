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
 * REST endpoints for analytics and reporting over inventory data.
 *
 * <p>Provides time-series, summaries, and filtered stock movement to power dashboards and charts.
 * All endpoints are DB-agnostic (H2/Oracle differences are handled in the service/repository layers).</p>
 */
@RestController
@RequestMapping(value = "/api/analytics", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
@Validated
public class AnalyticsController{

    private final AnalyticsService analyticsService;

    /**
     * Time series of total stock value between two dates (inclusive).
     *
     * @param start      inclusive start date (ISO yyyy-MM-dd)
     * @param end        inclusive end date (ISO yyyy-MM-dd)
     * @param supplierId optional supplier filter
     * @return list of {@link StockValueOverTimeDTO} points
     * @throws InvalidRequestException if start/end are missing or invalid (start > end)
     */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/stock-value")
    public ResponseEntity<List<StockValueOverTimeDTO>> getStockValueOverTime(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            @RequestParam(required = false) String supplierId) {

        validateDateRange(start, end, "start", "end");
        return ResponseEntity.ok(analyticsService.getTotalStockValueOverTime(start, end, supplierId));
    }

    /**
     * Current total stock per supplier (e.g., for pie/bar charts).
     */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/stock-per-supplier")
    public ResponseEntity<List<StockPerSupplierDTO>> getStockPerSupplier() {
        return ResponseEntity.ok(analyticsService.getTotalStockPerSupplier());
    }

    /**
     * Low-stock KPI (count only).
     *
     * @return JSON number (e.g., 5) of items where quantity < minimum_quantity
     */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/low-stock/count")
    public long getLowStockCount() {
        return analyticsService.lowStockCount();
    }

    /**
     * Update frequency for items of a given supplier.
     *
     * @param supplierId required supplier identifier
     */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/item-update-frequency")
    public ResponseEntity<List<ItemUpdateFrequencyDTO>> getItemUpdateFrequency(
            @RequestParam(name = "supplierId") String supplierId) {

        requireNonBlank(supplierId, "supplierId");
        return ResponseEntity.ok(analyticsService.getItemUpdateFrequency(supplierId));
    }

    /**
     * Items below their configured minimum stock threshold for a supplier.
     *
     * @param supplierId required supplier identifier
     */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/low-stock-items")
    public ResponseEntity<List<LowStockItemDTO>> getLowStockItems(
            @RequestParam(name = "supplierId") String supplierId) {

        requireNonBlank(supplierId, "supplierId");
        return ResponseEntity.ok(analyticsService.getItemsBelowMinimumStock(supplierId));
    }

    /**
     * Monthly net stock movement (additions/removals) in a date window (inclusive).
     *
     * @param start      inclusive start date (ISO yyyy-MM-dd)
     * @param end        inclusive end date (ISO yyyy-MM-dd)
     * @param supplierId optional supplier filter
     */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/monthly-stock-movement")
    public ResponseEntity<List<MonthlyStockMovementDTO>> getMonthlyStockMovement(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            @RequestParam(required = false) String supplierId) {

        validateDateRange(start, end, "start", "end");
        return ResponseEntity.ok(analyticsService.getMonthlyStockMovement(start, end, supplierId));
    }

    /**
     * GET variant of filtered stock updates.
     *
     * <p>If both {@code startDate} and {@code endDate} are null, defaults to the last 30 days
     * ending at "now" to keep responses bounded and performant.</p>
     */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/stock-updates")
    public ResponseEntity<List<StockUpdateResultDTO>> getFilteredStockUpdatesFromParams(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) String itemName,
            @RequestParam(required = false) String supplierId,
            @RequestParam(required = false) String createdBy,
            @RequestParam(required = false) Integer minChange,
            @RequestParam(required = false) Integer maxChange) {

        // Default window if both are absent
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
     * POST variant of filtered stock updates, accepts full JSON filter.
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
     * Dashboard-ready summary for a period and/or supplier.
     *
     * <p>Defaults to the last 30 days if no dates are provided.</p>
     */
    @PreAuthorize("isAuthenticated()")
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
     * Historical price changes for an item, optionally filtered by supplier.
     *
     * @param itemId     required inventory item id
     * @param supplierId optional supplier id
     * @param start      inclusive start date (ISO yyyy-MM-dd)
     * @param end        inclusive end date (ISO yyyy-MM-dd)
     */
    @PreAuthorize("isAuthenticated()")
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
    * Financial summary (WAC): purchases, COGS, write-offs, returns, opening/ending.
    *
    * <p>Dates are inclusive. Validates that {@code from <= to}.</p>
    */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/financial/summary")
    public ResponseEntity<FinancialSummaryDTO> getFinancialSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String supplierId) {

        // reuse helper from earlier controller suggestion
        validateDateRange(from, to, "from", "to");
        return ResponseEntity.ok(analyticsService.getFinancialSummaryWAC(from, to, supplierId));
    }

    // ------------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------------

    /**
     * Validates that start and end dates are not null and that start is before or equal to end.
     *
     * @param start      the start date
     * @param end        the end date
     * @param startName  name of the start parameter for error messages
     * @param endName    name of the end parameter for error messages
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
     * Validates that a string is not null or blank.
     *
     * @param value the string to check
     * @param name  the name of the parameter for error messages
     * @throws InvalidRequestException if the string is blank
     */
    private static void requireNonBlank(String value, String name) {
        if (value == null || value.trim().isEmpty()) {
            throw new InvalidRequestException(name + " must not be blank");
        }
    }
}