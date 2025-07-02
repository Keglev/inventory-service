package com.smartsupplypro.inventory.controller;

import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.service.StockHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;

import java.util.List;

@RestController
@RequestMapping("/api/stock-history")
@RequiredArgsConstructor
public class StockHistoryController {

    private final StockHistoryService stockHistoryService;

    /**
     * Returns a full list of all stock history entries.
     * This is typically only used for debugging or internal views — not paginated.
     */
    @GetMapping
    public List<StockHistoryDTO> getAll() {
        return stockHistoryService.getAll();
    }

    /**
     * Returns stock history events for a specific inventory item by its ID.
     * Useful for viewing changes over time per item.
     *
     * @param itemId Inventory item ID
     */
    @GetMapping("/item/{itemId}")
    public List<StockHistoryDTO> getByItemId(@PathVariable String itemId) {
        return stockHistoryService.getByItemId(itemId);
    }

    /**
     * Returns stock history entries filtered by reason type.
     * For example: RECEIVED, SOLD, SCRAPPED, etc.
     *
     * @param reason Enum representing the stock change reason
     */
    @GetMapping("/reason/{reason}")
    public List<StockHistoryDTO> getByReason(@PathVariable StockChangeReason reason) {
        return stockHistoryService.getByReason(reason);
    }

    /**
     * Performs advanced filtering of stock history records.
     * - Supports filtering by date range, item name, and supplier ID
     * - Pagination is supported via `Pageable`
     * - All parameters are optional; if none provided, it returns the full history
     *
     * Example query:
     *   /api/stock-history/search?startDate=2024-01-01T00:00:00&endDate=2024-06-30T23:59:59&itemName=Monitor
     *
     * @param startDate ISO-formatted start date-time
     * @param endDate ISO-formatted end date-time
     * @param itemName optional item name for partial matches
     * @param supplierId optional supplier ID
     * @param pageable Spring's pagination object
     */
    @GetMapping("/search")
    public Page<StockHistoryDTO> getStockHistory(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime startDate,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime endDate,

            @RequestParam(required = false) String itemName,

            @RequestParam(required = false) String supplierId,

            Pageable pageable
    ) {
        return stockHistoryService.findFiltered(startDate, endDate, itemName, supplierId, pageable);
    }
}