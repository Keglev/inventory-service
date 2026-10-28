package com.smartsupplypro.inventory.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
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
import com.smartsupplypro.inventory.dto.StockUpdateFilterDTO;
import com.smartsupplypro.inventory.dto.StockUpdateResultDTO;
import com.smartsupplypro.inventory.security.DemoIdentityMasking;
import com.smartsupplypro.inventory.service.impl.analytics.StockAnalyticsService;

import lombok.RequiredArgsConstructor;

/**
 * REST controller for stock update query endpoints.
 *
 * <p>Both GET endpoints require authentication or demo-readonly access.</p>
 *
 * @see StockAnalyticsService
 */
@RestController
@RequestMapping(value = "/api/analytics", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
@Validated
public class StockUpdateAnalyticsController {

    /** Upper bound for a requested page size, as on the employee-changes endpoint. */
    private static final int MAX_PAGE_SIZE = 100;

    private final StockAnalyticsService stockAnalyticsService;
    private final AnalyticsControllerValidationHelper validationHelper;
    private final DemoIdentityMasking identityMasking;

    /**
     * Gets filtered stock updates via query parameters (defaults to last 30 days).
     *
     * @param startDate  optional inclusive start date-time (ISO yyyy-MM-dd'T'HH:mm:ss)
     * @param endDate    optional inclusive end date-time (ISO yyyy-MM-dd'T'HH:mm:ss)
     * @param itemName   optional item name filter
     * @param supplierId optional supplier filter
     * @param createdBy  optional creator username filter; for anonymous callers,
     *                   resolved by {@link DemoIdentityMasking#resolveFilter}
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

        StockUpdateFilterDTO filter = filterFromParams(
                startDate, endDate, itemName, supplierId, createdBy, minChange, maxChange);
        return ResponseEntity.ok(stockAnalyticsService.getFilteredStockUpdates(filter));
    }

    /**
     * Gets one page of filtered stock updates: the filters and defaults of
     * {@code GET /stock-updates}, newest first.
     *
     * @param startDate  optional inclusive start date-time (ISO yyyy-MM-dd'T'HH:mm:ss)
     * @param endDate    optional inclusive end date-time (ISO yyyy-MM-dd'T'HH:mm:ss)
     * @param itemName   optional item name filter
     * @param supplierId optional supplier filter
     * @param createdBy  optional creator username filter; for anonymous callers,
     *                   resolved by {@link DemoIdentityMasking#resolveFilter}
     * @param minChange  optional minimum quantity change filter
     * @param maxChange  optional maximum quantity change filter
     * @param page       zero-based page index (default 0)
     * @param size       page size (default 10, capped at {@value #MAX_PAGE_SIZE})
     * @return page of stock updates with the total count
     */
    @PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
    @GetMapping("/stock-updates/page")
    public ResponseEntity<Page<StockUpdateResultDTO>> getFilteredStockUpdatesPage(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) String itemName,
            @RequestParam(required = false) String supplierId,
            @RequestParam(required = false) String createdBy,
            @RequestParam(required = false) Integer minChange,
            @RequestParam(required = false) Integer maxChange,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        StockUpdateFilterDTO filter = filterFromParams(
                startDate, endDate, itemName, supplierId, createdBy, minChange, maxChange);
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE));
        return ResponseEntity.ok(stockAnalyticsService.getFilteredStockUpdatesPage(filter, pageable));
    }

    // The service defaults the window and rejects inverted ranges for every caller;
    // anonymous callers' creator filter is resolved here, at the HTTP boundary.
    private StockUpdateFilterDTO filterFromParams(
            LocalDateTime startDate, LocalDateTime endDate, String itemName, String supplierId,
            String createdBy, Integer minChange, Integer maxChange) {
        return validationHelper.buildFilter(startDate, endDate, itemName, supplierId,
                identityMasking.resolveFilter(createdBy), minChange, maxChange);
    }
}
