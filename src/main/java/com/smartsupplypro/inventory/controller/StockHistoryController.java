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
 * REST controller for querying historical inventory stock changes.
 *
 * <p>Supports filtering by item, reason, supplier, and date range with pagination.
 * Bounds are <strong>inclusive</strong>. Default sort is {@code timestamp DESC}.</p>
 */
@RestController
@RequestMapping("/api/stock-history")
@RequiredArgsConstructor
public class StockHistoryController {

    private static final int MAX_PAGE_SIZE = 200;

    private final StockHistoryService stockHistoryService;

    /** Returns all stock history entries (non-paged). */
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    @GetMapping
    public List<StockHistoryDTO> getAll() {
        return stockHistoryService.getAll();
    }

    /** Returns stock history for a specific item (non-paged). */
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    @GetMapping("/item/{itemId}")
    public List<StockHistoryDTO> getByItemId(@PathVariable String itemId) {
        return stockHistoryService.getByItemId(itemId);
    }

    /** Returns stock history filtered by change reason (non-paged). */
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    @GetMapping("/reason/{reason}")
    public List<StockHistoryDTO> getByReason(@PathVariable StockChangeReason reason) {
        return stockHistoryService.getByReason(reason);
    }

    /**
     * Advanced, paged search across stock history.
     *
     * @param startDate ISO-8601 datetime (inclusive)
     * @param endDate   ISO-8601 datetime (inclusive)
     * @param itemName  optional partial item name
     * @param supplierId optional supplier id
     * @param pageable  defaults: size=50, sort=timestamp DESC; size capped to 200
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
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new InvalidRequestException("endDate must be >= startDate");
        }
        pageable = PageRequest.of(
            pageable.getPageNumber(),
            Math.min(pageable.getPageSize(), MAX_PAGE_SIZE),
            pageable.getSort()
        );
        return stockHistoryService.findFiltered(startDate, endDate, itemName, supplierId, pageable);
    }
}
