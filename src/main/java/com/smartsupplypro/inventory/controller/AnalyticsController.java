package com.smartsupplypro.inventory.controller;

import com.smartsupplypro.inventory.dto.*;
import com.smartsupplypro.inventory.service.AnalyticsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Controller for exposing analytics-related endpoints such as reporting, summaries,
 * and filters across inventory and supplier stock movements.
 */
@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Validated
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /**
     * Returns total stock value over time between two dates.
     * Optional filtering by supplier.
     */
    @GetMapping("/stock-value")
    public ResponseEntity<List<StockValueOverTimeDTO>> getStockValueOverTime(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            @RequestParam(required = false) String supplierId) {
        return ResponseEntity.ok(analyticsService.getTotalStockValueOverTime(start, end, supplierId));
    }

    /**
     * Returns total stock quantity per supplier (useful for pie/bar charts).
     */
    @GetMapping("/stock-per-supplier")
    public ResponseEntity<List<StockPerSupplierDTO>> getStockPerSupplier() {
        return ResponseEntity.ok(analyticsService.getTotalStockPerSupplier());
    }

    /**
     * Returns how frequently each item was updated, for a given supplier.
     */
    @GetMapping("/item-update-frequency")
    public List<ItemUpdateFrequencyDTO> getItemUpdateFrequency(@RequestParam(name = "supplierId") String supplierId) {
        return analyticsService.getItemUpdateFrequency(supplierId);
    }

    /**
     * Returns a list of items currently below minimum stock threshold, for a supplier.
     */
    @GetMapping("/low-stock-items")
    public List<LowStockItemDTO> getLowStockItems(@RequestParam(name = "supplierId") String supplierId) {
        return analyticsService.getItemsBelowMinimumStock(supplierId);
    }

    /**
     * Returns monthly stock additions/removals between two dates.
     * Optionally filters by supplier.
     */
    @GetMapping("/monthly-stock-movement")
    public ResponseEntity<List<MonthlyStockMovementDTO>> getMonthlyStockMovement(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            @RequestParam(required = false) String supplierId) {
        return ResponseEntity.ok(analyticsService.getMonthlyStockMovement(start, end, supplierId));
    }

    /**
     * Flexible filter via GET with multiple optional parameters (used for reporting).
     * Allows filtering by time range, item, supplier, author, and stock change range.
     */
    @GetMapping("/stock-updates")
    public ResponseEntity<List<StockUpdateResultDTO>> getFilteredStockUpdatesFromParams(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) String itemName,
            @RequestParam(required = false) String supplierId,
            @RequestParam(required = false) String createdBy,
            @RequestParam(required = false) Integer minChange,
            @RequestParam(required = false) Integer maxChange) {

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
     * Same as GET above, but accepts a JSON body with all filters (more scalable).
     */
    @PostMapping("/stock-updates/query")
    public ResponseEntity<List<StockUpdateResultDTO>> getFilteredStockUpdatesPost(
            @RequestBody @Valid StockUpdateFilterDTO filter) {
        return ResponseEntity.ok(analyticsService.getFilteredStockUpdates(filter));
    }

    /**
     * Returns a combined dashboard summary:
     * - total stock per supplier
     * - low-stock warnings
     * - monthly movement
     * - top updated items
     */
    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryDTO> getDashboardSummary(
            @RequestParam(required = false) String supplierId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        if (startDate == null) startDate = LocalDateTime.now().minusDays(30);
        if (endDate == null) endDate = LocalDateTime.now();

        DashboardSummaryDTO summary = new DashboardSummaryDTO();

        summary.setStockPerSupplier(analyticsService.getTotalStockPerSupplier());

        summary.setLowStockItems(supplierId != null ?
                analyticsService.getItemsBelowMinimumStock(supplierId).stream().limit(3).toList() :
                List.of());

        summary.setMonthlyStockMovement(analyticsService.getMonthlyStockMovement(
                startDate.toLocalDate(), endDate.toLocalDate(), supplierId));

        summary.setTopUpdatedItems(supplierId != null ?
                analyticsService.getItemUpdateFrequency(supplierId).stream().limit(5).toList() :
                List.of());

        return ResponseEntity.ok(summary);
    }
}