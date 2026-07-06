package com.smartsupplypro.inventory.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.smartsupplypro.inventory.dto.ReasonBreakdownDTO;
import com.smartsupplypro.inventory.service.impl.analytics.StockAnalyticsService;

import lombok.RequiredArgsConstructor;

/**
 * REST endpoint for per-reason stock movement analytics.
 *
 * <p>Returns increase/decrease totals per stock-change reason so the client can
 * render inbound and outbound movement side by side. Date defaulting and
 * validation are handled in the service layer.</p>
 */
@RestController
@RequestMapping(value = "/api/analytics", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
@Validated
public class StockReasonAnalyticsController {

    private final StockAnalyticsService stockAnalyticsService;

    /**
     * Gets sign-split stock movement totals grouped by reason.
     *
     * @param startDate  optional inclusive start date (ISO yyyy-MM-dd)
     * @param endDate    optional inclusive end date (ISO yyyy-MM-dd)
     * @param supplierId optional supplier filter
     * @param itemName   optional partial item name filter (case-insensitive)
     * @return list of per-reason breakdown DTOs ordered by reason
     */
    @PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
    @GetMapping("/reason-breakdown")
    public ResponseEntity<List<ReasonBreakdownDTO>> getReasonBreakdown(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String supplierId,
            @RequestParam(required = false) String itemName) {

        return ResponseEntity.ok(
                stockAnalyticsService.getReasonBreakdown(startDate, endDate, supplierId, itemName));
    }
}
