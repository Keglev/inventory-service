package com.smartsupplypro.inventory.controller;

import com.smartsupplypro.inventory.dto.*;
import com.smartsupplypro.inventory.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    // 📈 Stock value over time (for line charts)
    @GetMapping("/stock-value")
    public ResponseEntity<List<StockValueOverTimeDTO>> getStockValueOverTime(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            @RequestParam(required = false) String supplierId) {

        return ResponseEntity.ok(analyticsService.getTotalStockValueOverTime(start, end, supplierId));
    }

    // 📊 Total stock quantity per supplier (for pie/bar charts)
    @GetMapping("/stock-per-supplier")
    public ResponseEntity<List<StockPerSupplierDTO>> getStockPerSupplier() {
        return ResponseEntity.ok(analyticsService.getTotalStockPerSupplier());
    }

    // 📊 Update frequency per item (for activity analysis)
    @GetMapping("/item-update-frequency")
    public ResponseEntity<List<ItemUpdateFrequencyDTO>> getItemUpdateFrequency(
            @RequestParam(required = false) String supplierId) {

        return ResponseEntity.ok(analyticsService.getItemUpdateFrequency(supplierId));
    }

    // ⚠️ Low-stock items (threshold warning list)
    @GetMapping("/low-stock-items")
    public ResponseEntity<List<LowStockItemDTO>> getLowStockItems(
            @RequestParam(required = false) String supplierId) {

        return ResponseEntity.ok(analyticsService.getItemsBelowMinimumStock(supplierId));
    }

    // 📆 Monthly stock movement (for stacked bar charts)
    @GetMapping("/monthly-stock-movement")
    public ResponseEntity<List<MonthlyStockMovementDTO>> getMonthlyStockMovement(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            @RequestParam(required = false) String supplierId) {

        return ResponseEntity.ok(analyticsService.getMonthlyStockMovement(start, end, supplierId));
    }

    // 🔍 Advanced multi-filtered analytics query (for custom reports)
    @GetMapping("/stock-updates")
    public ResponseEntity<List<StockUpdateResultDTO>> getFilteredStockUpdates(
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
}
