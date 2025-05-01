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

    @GetMapping
    public List<StockHistoryDTO> getAll() {
        return stockHistoryService.getAll();
    }

    @GetMapping("/item/{itemId}")
    public List<StockHistoryDTO> getByItemId(@PathVariable String itemId) {
        return stockHistoryService.getByItemId(itemId);
    }

    @GetMapping("/reason/{reason}")
    public List<StockHistoryDTO> getByReason(@PathVariable StockChangeReason reason) {
        return stockHistoryService.getByReason(reason);
    }
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
