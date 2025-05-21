package com.smartsupplypro.inventory.service.impl;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.Timestamp; // ✅ FIX: Import Timestamp
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.smartsupplypro.inventory.dto.*;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;
import com.smartsupplypro.inventory.service.AnalyticsService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl implements AnalyticsService {

    private final StockHistoryRepository stockHistoryRepository;
    private final InventoryItemRepository inventoryItemRepository;

    @Override
    public List<StockValueOverTimeDTO> getTotalStockValueOverTime(LocalDate startDate, LocalDate endDate, String supplierId) {
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.plusDays(1).atStartOfDay().minusNanos(1);

        List<Object[]> results = stockHistoryRepository.getStockValueGroupedByDateFiltered(startDateTime, endDateTime, supplierId);

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
    public List<ItemUpdateFrequencyDTO> getItemUpdateFrequency(String supplierId) {
        List<Object[]> results = stockHistoryRepository.getUpdateCountPerItemFiltered(supplierId);

        return results.stream()
                .map(row -> new ItemUpdateFrequencyDTO(
                        (String) row[0],
                        ((BigDecimal) row[1]).longValue()
                ))
                .collect(Collectors.toList());
    }

    @Override
    public List<LowStockItemDTO> getItemsBelowMinimumStock(String supplierId) {
        List<Object[]> results = inventoryItemRepository.findItemsBelowMinimumStockFiltered(supplierId); // ✅ FIX: make sure this method is in the correct repo

        return results.stream()
                .map(row -> new LowStockItemDTO(
                        (String) row[0],
                        ((BigDecimal) row[1]).intValue(),
                        ((BigDecimal) row[2]).intValue()
                ))
                .collect(Collectors.toList());
    }

    @Override
    public List<MonthlyStockMovementDTO> getMonthlyStockMovement(LocalDate startDate, LocalDate endDate, String supplierId) {
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.plusDays(1).atStartOfDay().minusNanos(1);

        List<Object[]> results = stockHistoryRepository.getMonthlyStockMovementFiltered(startDateTime, endDateTime, supplierId);

        return results.stream()
                .map(row -> new MonthlyStockMovementDTO(
                        (String) row[0],
                        ((BigDecimal) row[1]).longValue(),
                        ((BigDecimal) row[2]).longValue()
                ))
                .collect(Collectors.toList());
    }

    @Override
    public List<StockUpdateResultDTO> getFilteredStockUpdates(StockUpdateFilterDTO filter) {
        List<Object[]> results = stockHistoryRepository.findFilteredStockUpdates(
                filter.getStartDate(),
                filter.getEndDate(),
                filter.getItemName(),
                filter.getSupplierId(),
                filter.getCreatedBy(),
                filter.getMinChange(),
                filter.getMaxChange()
        );

        return results.stream()
                .map(row -> new StockUpdateResultDTO(
                        (String) row[0],
                        (String) row[1],
                        ((BigDecimal) row[2]).intValue(),
                        (String) row[3],
                        (String) row[4],
                        ((Timestamp) row[5]).toLocalDateTime()
                ))
                .collect(Collectors.toList());
    }
}
