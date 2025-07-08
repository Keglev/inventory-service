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

/**
 * REST controller for querying historical inventory stock changes.
 *
 * <p>This controller enables fine-grained visibility over stock movements across time,
 * items, suppliers, and change reasons. It supports filtering, pagination,
 * and is optimized for both dashboards and audit logs.
 */
@RestController
@RequestMapping("/api/stock-history")
@RequiredArgsConstructor
public class StockHistoryController {

    private final StockHistoryService stockHistoryService;

    /**
     * Returns all available stock history entries without filtering or pagination.
     * 
     * <p>Typically used for internal analysis, admin views, or debugging only.
     * 
     * @return full list of stock history entries
     */
    @GetMapping
    public List<StockHistoryDTO> getAll() {
        return stockHistoryService.getAll();
    }

    /**
     * Returns all stock history records associated with a specific inventory item.
     * 
     * <p>This is useful for displaying item-level history in detailed product views.
     *
     * @param itemId the inventory item's unique identifier
     * @return list of stock change events for the item
     */
    @GetMapping("/item/{itemId}")
    public List<StockHistoryDTO> getByItemId(@PathVariable String itemId) {
        return stockHistoryService.getByItemId(itemId);
    }

    /**
     * Returns stock history entries filtered by change reason.
     * 
     * <p>Examples include: RECEIVED, SOLD, RETURNED_TO_SUPPLIER, SCRAPPED.
     *
     * @param reason enum representing the reason for stock change
     * @return list of entries matching the specified reason
     */
    @GetMapping("/reason/{reason}")
    public List<StockHistoryDTO> getByReason(@PathVariable StockChangeReason reason) {
        return stockHistoryService.getByReason(reason);
    }

    /**
     * Advanced search endpoint for filtered stock history queries.
     *
     * <p>Supports:
     * <ul>
     *     <li>Date/time range filtering</li>
     *     <li>Partial item name matching</li>
     *     <li>Supplier-specific filtering</li>
     *     <li>Pagination using Spring Data's {@link Pageable}</li>
     * </ul>
     *
     * <p>Any combination of filters is allowed. All parameters are optional.
     * If no parameters are provided, the entire stock history is returned paginated.
     *
     * <p>Example usage:
     * <pre>
     * /api/stock-history/search?startDate=2024-01-01T00:00:00&endDate=2024-06-30T23:59:59&itemName=Monitor
     * </pre>
     *
     * @param startDate optional start datetime (inclusive)
     * @param endDate optional end datetime (inclusive)
     * @param itemName optional partial name match for inventory item
     * @param supplierId optional filter by supplier ID
     * @param pageable Spring pagination and sorting object
     * @return paginated list of matching stock history entries
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
