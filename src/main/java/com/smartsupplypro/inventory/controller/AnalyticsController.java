package com.smartsupplypro.inventory.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.smartsupplypro.inventory.controller.analytics.AnalyticsControllerValidationHelper;
import com.smartsupplypro.inventory.controller.analytics.AnalyticsDashboardHelper;
import com.smartsupplypro.inventory.dto.DashboardSummaryDTO;
import com.smartsupplypro.inventory.dto.FinancialSummaryDTO;
import com.smartsupplypro.inventory.service.impl.analytics.FinancialAnalyticsService;

import lombok.RequiredArgsConstructor;

/**
 * REST controller for analytics dashboard and financial summary endpoints.
 *
 * <p>All endpoints require authentication or demo-readonly access.</p>
 *
 * @see FinancialAnalyticsService
 * @see AnalyticsDashboardHelper
 */
@RestController
@RequestMapping(value = "/api/analytics", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
@Validated
public class AnalyticsController {

    private final FinancialAnalyticsService financialAnalyticsService;
    private final AnalyticsControllerValidationHelper validationHelper;
    private final AnalyticsDashboardHelper dashboardHelper;

    /**
     * Gets dashboard summary with multiple analytics (defaults to last 30 days).
     *
     * @param supplierId optional supplier filter
     * @param startDate  optional inclusive start date-time (ISO yyyy-MM-dd'T'HH:mm:ss)
     * @param endDate    optional inclusive end date-time (ISO yyyy-MM-dd'T'HH:mm:ss)
     * @return dashboard summary DTO
     */
    @PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryDTO> getDashboardSummary(
            @RequestParam(required = false) String supplierId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        LocalDateTime[] dateWindow = validationHelper.applyDefaultDateWindow(startDate, endDate);
        validationHelper.validateDateTimeRange(dateWindow[0], dateWindow[1], "startDate", "endDate");
        return ResponseEntity.ok(dashboardHelper.buildDashboardSummary(supplierId, dateWindow[0], dateWindow[1]));
    }

    /**
     * Gets financial summary with WAC calculations.
     *
     * @param from       inclusive start date (ISO yyyy-MM-dd)
     * @param to         inclusive end date (ISO yyyy-MM-dd)
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
