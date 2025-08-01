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
 * REST controller responsible for exposing analytics and reporting endpoints.
 * 
 * <p>Endpoints provide aggregated insights over inventory data such as:
 * <ul>
 *     <li>Total stock values over time</li>
 *     <li>Supplier-based summaries</li>
 *     <li>Low stock warnings</li>
 *     <li>Historical item update activity</li>
 *     <li>Custom filtered stock movements</li>
 * </ul>
 *
 * <p>Designed for seamless frontend integration (charts, dashboards, exports).
 */
@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Validated
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /**
     * Returns the total stock value between two dates.
     * 
     * @param start      start date (inclusive)
     * @param end        end date (inclusive)
     * @param supplierId optional filter by supplier
     * @return list of time-series stock values
     */
    @GetMapping("/stock-value")
    public ResponseEntity<List<StockValueOverTimeDTO>> getStockValueOverTime(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            @RequestParam(required = false) String supplierId) {
        return ResponseEntity.ok(analyticsService.getTotalStockValueOverTime(start, end, supplierId));
    }

    /**
     * Returns the total current stock per supplier.
     * 
     * <p>Useful for pie/bar chart generation.
     * 
     * @return list of supplier names and their total stock quantities
     */
    @GetMapping("/stock-per-supplier")
    public ResponseEntity<List<StockPerSupplierDTO>> getStockPerSupplier() {
        return ResponseEntity.ok(analyticsService.getTotalStockPerSupplier());
    }

    /**
     * Returns item update frequency for a given supplier.
     * 
     * <p>Used to identify most/least updated items in dashboards.
     *
     * @param supplierId required supplier identifier
     * @return list of item names and update counts
     */
    @GetMapping("/item-update-frequency")
    public List<ItemUpdateFrequencyDTO> getItemUpdateFrequency(@RequestParam(name = "supplierId") String supplierId) {
        return analyticsService.getItemUpdateFrequency(supplierId);
    }

    /**
     * Returns all items below their configured minimum stock threshold.
     * 
     * @param supplierId supplier ID to filter results
     * @return list of items flagged as low in stock
     */
    @GetMapping("/low-stock-items")
    public List<LowStockItemDTO> getLowStockItems(@RequestParam(name = "supplierId") String supplierId) {
        return analyticsService.getItemsBelowMinimumStock(supplierId);
    }

    /**
     * Returns monthly net stock movement (additions and removals) in a given time window.
     * 
     * @param start      start date (inclusive)
     * @param end        end date (inclusive)
     * @param supplierId optional filter by supplier
     * @return list of monthly stock movement aggregates
     */
    @GetMapping("/monthly-stock-movement")
    public ResponseEntity<List<MonthlyStockMovementDTO>> getMonthlyStockMovement(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            @RequestParam(required = false) String supplierId) {
        return ResponseEntity.ok(analyticsService.getMonthlyStockMovement(start, end, supplierId));
    }

    /**
     * Flexible GET-based search endpoint for stock updates.
     * 
     * <p>Allows combination of time range, supplier, user, item name, and quantity delta filters.
     *
     * @param startDate  optional start datetime
     * @param endDate    optional end datetime
     * @param itemName   optional item filter
     * @param supplierId optional supplier filter
     * @param createdBy  optional creator filter
     * @param minChange  optional minimum quantity change
     * @param maxChange  optional maximum quantity change
     * @return list of filtered stock history entries
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
     * POST-based variant of the stock updates filter, accepting a full JSON body.
     * 
     * <p>Recommended for frontend dashboards or complex filter UIs.
     * 
     * @param filter filter DTO with multiple optional fields
     * @return list of matching stock updates
     */
    @PostMapping("/stock-updates/query")
    public ResponseEntity<List<StockUpdateResultDTO>> getFilteredStockUpdatesPost(
            @RequestBody @Valid StockUpdateFilterDTO filter) {
        return ResponseEntity.ok(analyticsService.getFilteredStockUpdates(filter));
    }

    /**
     * Returns a dashboard-ready summary for a given period and/or supplier.
     * 
     * <p>Includes:
     * <ul>
     *     <li>Stock per supplier</li>
     *     <li>Low stock warnings (up to 3 items)</li>
     *     <li>Monthly stock movement</li>
     *     <li>Top 5 frequently updated items</li>
     * </ul>
     *
     * @param supplierId optional supplier to focus analytics
     * @param startDate  optional start datetime (defaults to -30 days)
     * @param endDate    optional end datetime (defaults to now)
     * @return consolidated summary DTO for dashboard rendering
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
    /**
    * Returns historical price data for a specific inventory item.
    *
    * <p>Each entry represents the unit price recorded at the time of a stock change
    * (usually when stock is received or updated with a price).
    * 
    * <p>Useful for purchase trend charts, supplier negotiations, or cost forecasting.
    *
    * @param itemId the inventory item identifier
    * @param start  start date (inclusive)
    * @param end    end date (inclusive)
    * @return list of {@link PriceTrendDTO} records for charting price over time
    */
    @GetMapping("/price-trend")
    public ResponseEntity<List<PriceTrendDTO>> getPriceTrend(
            @RequestParam String itemId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(analyticsService.getPriceTrend(itemId, start, end));
    }
}
