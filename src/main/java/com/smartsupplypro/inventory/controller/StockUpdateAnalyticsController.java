package com.smartsupplypro.inventory.controller;

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
import com.smartsupplypro.inventory.dto.StockUpdateFilterDTO;
import com.smartsupplypro.inventory.dto.StockUpdateResultDTO;
import com.smartsupplypro.inventory.service.impl.analytics.StockAnalyticsService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * REST controller for stock update query endpoints.
 *
 * <p>GET endpoint requires authentication or demo-readonly access.
 * POST query endpoint requires full authentication.</p>
 *
 * @see StockAnalyticsService
 */
@RestController
@RequestMapping(value = "/api/analytics", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
@Validated
public class StockUpdateAnalyticsController {

    private final StockAnalyticsService stockAnalyticsService;
    private final AnalyticsControllerValidationHelper validationHelper;

    /**
     * Gets filtered stock updates via query parameters (defaults to last 30 days).
     *
     * @param startDate  optional inclusive start date-time (ISO yyyy-MM-dd'T'HH:mm:ss)
     * @param endDate    optional inclusive end date-time (ISO yyyy-MM-dd'T'HH:mm:ss)
     * @param itemName   optional item name filter
     * @param supplierId optional supplier filter
     * @param createdBy  optional creator username filter
     * @param minChange  optional minimum quantity change filter
     * @param maxChange  optional maximum quantity change filter
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

        LocalDateTime[] dateWindow = validationHelper.applyDefaultDateWindow(startDate, endDate);
        validationHelper.validateDateTimeRange(dateWindow[0], dateWindow[1], "startDate", "endDate");
        validationHelper.validateNumericRange(minChange, maxChange, "minChange", "maxChange");
        StockUpdateFilterDTO filter = validationHelper.buildFilter(
                dateWindow[0], dateWindow[1], itemName, supplierId, createdBy, minChange, maxChange);
        return ResponseEntity.ok(stockAnalyticsService.getFilteredStockUpdates(filter));
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

        validationHelper.validateStockUpdateFilter(filter);
        return ResponseEntity.ok(stockAnalyticsService.getFilteredStockUpdates(filter));
    }
}
