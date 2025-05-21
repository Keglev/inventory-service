package com.smartsupplypro.inventory.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.sql.Date;

import org.springframework.stereotype.Service;

import com.smartsupplypro.inventory.dto.ItemUpdateFrequencyDTO;
import com.smartsupplypro.inventory.dto.LowStockItemDTO;
import com.smartsupplypro.inventory.dto.StockPerSupplierDTO;
import com.smartsupplypro.inventory.dto.StockValueOverTimeDTO;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;
import com.smartsupplypro.inventory.service.AnalyticsService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl implements AnalyticsService{

    private final StockHistoryRepository stockHistoryRepository;
    private final InventoryItemRepository inventoryItemRepository;

    @Override
    public List<StockValueOverTimeDTO> getTotalStockValueOverTime(LocalDate startDate, LocalDate endDate) {

         LocalDateTime startDateTime = startDate.atStartOfDay(); // e.g., 2024-01-01T00:00
        LocalDateTime endDateTime = endDate.plusDays(1).atStartOfDay().minusNanos(1); // 2024-01-31T23:59:59.999999999

        List<Object[]> results = stockHistoryRepository.getStockValueGroupedByDate(startDateTime, endDateTime);

        return results.stream()
            .map(row -> new StockValueOverTimeDTO(
                ((Date) row[0]).toLocalDate(),
                ((BigDecimal) row[1]).doubleValue()
            ))
            .collect(Collectors.toList());
    }

    @Override
    public List<StockPerSupplierDTO> getTotalStockPerSupplier() {
        List<Object[]> results = stockHistoryRepository.getTotalStockPerSupplier();

        return results.stream()
                .map(row -> new StockPerSupplierDTO(
                        (String) row[0],
                        ((BigDecimal) row[1]).longValue()
                ))
                .collect(Collectors.toList());
    }

    @Override
    public List<ItemUpdateFrequencyDTO> getItemUpdateFrequency() {
        List<Object[]> results = stockHistoryRepository.getUpdateCountPerItem();

        return results.stream()
                .map(row -> new ItemUpdateFrequencyDTO(
                        (String) row[0],
                        ((BigDecimal) row[1]).longValue()
                ))
                .collect(Collectors.toList());
    }

    @Override
    public List<LowStockItemDTO> getItemsBelowMinimumStock() {
        List<Object[]> results = inventoryItemRepository.findItemsBelowMinimumStock();

        return results.stream()
                .map(row -> new LowStockItemDTO(
                        (String) row[0],
                        ((BigDecimal) row[1]).intValue(),
                        ((BigDecimal) row[2]).intValue()
                ))
                .collect(Collectors.toList());
    }

}
