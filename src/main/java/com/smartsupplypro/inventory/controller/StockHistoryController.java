package com.smartsupplypro.inventory.controller;

import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.exception.InvalidRequestException;
import com.smartsupplypro.inventory.service.StockHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Stock history audit trail controller providing comprehensive change tracking.
 * Supports filtering by item, reason, supplier with pagination and date ranges.
 * @see StockHistoryService
 * @see controller-patterns.md for audit pattern documentation
 */
@RestController
@RequestMapping("/api/stock-history")
@RequiredArgsConstructor
public class StockHistoryController {

    private static final int MAX_PAGE_SIZE = 200;

    private final StockHistoryService stockHistoryService;

    /**
     * Retrieves all stock history entries without pagination.
     * @return complete list of stock changes
     */
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    @GetMapping
    public List<StockHistoryDTO> getAll() {
        return stockHistoryService.getAll();
    }

    /**
     * Gets stock history for specific inventory item.
     * @param itemId inventory item identifier
     * @return list of changes for the item
     */
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    @GetMapping("/item/{itemId}")
    public List<StockHistoryDTO> getByItemId(@PathVariable String itemId) {
        return stockHistoryService.getByItemId(itemId);
    }

    /**
     * Filters stock history by change reason type.
     * @param reason stock change reason enum
     * @return list of changes matching reason
     */
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    @GetMapping("/reason/{reason}")
    public List<StockHistoryDTO> getByReason(@PathVariable StockChangeReason reason) {
        return stockHistoryService.getByReason(reason);
    }

    /**
     * Advanced paginated search with multiple filter criteria and date bounds.
     * @param startDate inclusive start timestamp (ISO-8601)
     * @param endDate inclusive end timestamp (ISO-8601)
     * @param itemName partial item name filter
     * @param supplierId supplier identifier filter
     * @param pageable pagination config (max 200 per page, default timestamp DESC)
     * @return paginated stock history results
     */
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    @GetMapping("/search")
    public Page<StockHistoryDTO> search(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
        @RequestParam(required = false) String itemName,
        @RequestParam(required = false) String supplierId,
        @PageableDefault(size = 50, sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        // Enterprise Comment: Date range validation - prevent logical inconsistencies that could
        // cause confusion in audit reports and ensure temporal query validity
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new InvalidRequestException("endDate must be >= startDate");
        }
        // Enterprise Comment: Page size protection - cap large page requests to prevent memory issues
        // and maintain reasonable response times for audit queries over large datasets
        pageable = PageRequest.of(
            pageable.getPageNumber(),
            Math.min(pageable.getPageSize(), MAX_PAGE_SIZE),
            pageable.getSort()
        );
        return stockHistoryService.findFiltered(startDate, endDate, itemName, supplierId, pageable);
    }
}
