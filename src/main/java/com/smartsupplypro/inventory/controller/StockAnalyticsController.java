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

import com.smartsupplypro.inventory.controller.analytics.AnalyticsControllerValidationHelper;
import com.smartsupplypro.inventory.dto.ItemUpdateFrequencyDTO;
import com.smartsupplypro.inventory.dto.LowStockItemDTO;
import com.smartsupplypro.inventory.dto.MonthlyStockMovementDTO;
import com.smartsupplypro.inventory.dto.PriceTrendDTO;
import com.smartsupplypro.inventory.dto.StockPerSupplierDTO;
import com.smartsupplypro.inventory.dto.StockValueOverTimeDTO;
import com.smartsupplypro.inventory.service.impl.analytics.StockAnalyticsService;

import lombok.RequiredArgsConstructor;

/**
 * REST controller for stock analytics endpoints.
 *
 * <p>All endpoints require authentication or demo-readonly access.
 * Read-only — no write operations on this resource.</p>
 *
 * @see StockAnalyticsService
 */
@RestController
@RequestMapping(value = "/api/analytics", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
@Validated
public class StockAnalyticsController {

    private final StockAnalyticsService stockAnalyticsService;
    private final AnalyticsControllerValidationHelper validationHelper;

    /**
     * Gets time series of total stock value between dates.
     *
     * @param start      inclusive start date (ISO yyyy-MM-dd)
     * @param end        inclusive end date (ISO yyyy-MM-dd)
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

    @PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
    @GetMapping("/stock-per-supplier")
    public ResponseEntity<List<StockPerSupplierDTO>> getStockPerSupplier() {
        return ResponseEntity.ok(stockAnalyticsService.getTotalStockPerSupplier());
    }

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
            @RequestParam String supplierId) {

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
            @RequestParam String supplierId) {

        validationHelper.requireNonBlank(supplierId, "supplierId");
        return ResponseEntity.ok(stockAnalyticsService.getItemsBelowMinimumStock(supplierId));
    }

    /**
     * Gets monthly stock movement within a date range.
     *
     * @param start      inclusive start date (ISO yyyy-MM-dd)
     * @param end        inclusive end date (ISO yyyy-MM-dd)
     * @param supplierId optional supplier filter
     * @return list of monthly movement DTOs
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
     * Gets historical price changes for an item.
     *
     * @param itemId     required item identifier
     * @param supplierId optional supplier filter
     * @param start      inclusive start date (ISO yyyy-MM-dd)
     * @param end        inclusive end date (ISO yyyy-MM-dd)
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
}
