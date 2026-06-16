package com.smartsupplypro.inventory.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.exception.InvalidRequestException;
import com.smartsupplypro.inventory.service.StockHistoryService;

import lombok.RequiredArgsConstructor;

/**
 * REST controller for stock history audit trail operations.
 *
 * <p>All endpoints require {@code ROLE_ADMIN} or {@code ROLE_USER} authentication.</p>
 *
 * @see StockHistoryService
 */
@RestController
@RequestMapping("/api/stock-history")
@RequiredArgsConstructor
public class StockHistoryController {

    private static final int MAX_PAGE_SIZE = 200;

    private final StockHistoryService stockHistoryService;

    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    @GetMapping
    public List<StockHistoryDTO> getAll() {
        return stockHistoryService.getAll();
    }

    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    @GetMapping("/item/{itemId}")
    public List<StockHistoryDTO> getByItemId(@PathVariable String itemId) {
        return stockHistoryService.getByItemId(itemId);
    }

    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    @GetMapping("/reason/{reason}")
    public List<StockHistoryDTO> getByReason(@PathVariable StockChangeReason reason) {
        return stockHistoryService.getByReason(reason);
    }

    /**
     * Advanced paginated search with multiple filter criteria and date bounds.
     *
     * @param startDate optional inclusive start timestamp (ISO-8601)
     * @param endDate   optional inclusive end timestamp (ISO-8601)
     * @param itemName  optional partial item name filter
     * @param supplierId optional supplier identifier filter
     * @param pageable  pagination config (max 200 per page, default timestamp DESC)
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
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            // audit date queries must be temporally consistent
            throw new InvalidRequestException("endDate must be >= startDate");
        }
        // cap to prevent memory exhaustion on large audit datasets
        pageable = PageRequest.of(pageable.getPageNumber(), Math.min(pageable.getPageSize(), MAX_PAGE_SIZE), pageable.getSort());
        return stockHistoryService.findFiltered(startDate, endDate, itemName, supplierId, pageable);
    }
}
