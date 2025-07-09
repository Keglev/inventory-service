package com.smartsupplypro.inventory.service.impl;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.Timestamp;
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

/**
 * Implementation of the {@link AnalyticsService} interface.
 * <p>
 * Provides analytical operations such as stock value over time,
 * low stock detection, stock movement trends, and detailed filtering
 * for inventory monitoring and reporting purposes.
 * </p>
 *
 * <p>
 * This class serves as a critical backend service in the SmartSupplyPro platform
 * by transforming raw database query results into domain-specific DTOs
 * for API consumption and dashboard visualization.
 * </p>
 *
 * @author SmartSupply
 */
@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl implements AnalyticsService {

    private final StockHistoryRepository stockHistoryRepository;
    private final InventoryItemRepository inventoryItemRepository;

    /**
     * Calculates the total stock value grouped by date for a given time range and optional supplier.
     *
     * @param startDate  the start date (nullable; defaults to 30 days ago)
     * @param endDate    the end date (nullable; defaults to today)
     * @param supplierId optional supplier ID to filter the stock value
     * @return a list of {@link StockValueOverTimeDTO} representing the daily stock value
     */
    @Override
    public List<StockValueOverTimeDTO> getTotalStockValueOverTime(LocalDate startDate, LocalDate endDate, String supplierId) {
        if (startDate == null) {
            startDate = LocalDate.now().minusDays(30);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }

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

    /**
     * Retrieves the total current stock quantity grouped by supplier.
     *
     * @return a list of {@link StockPerSupplierDTO} representing the total stock quantity per supplier
     */
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

    /**
     * Returns the number of stock updates per item for a given supplier.
     *
     * @param supplierId the ID of the supplier (must not be null)
     * @return a list of {@link ItemUpdateFrequencyDTO} showing update counts per item
     * @throws IllegalArgumentException if supplierId is null
     */
    @Override
    public List<ItemUpdateFrequencyDTO> getItemUpdateFrequency(String supplierId) {
        if (supplierId == null) {
            throw new IllegalArgumentException("Supplier ID must not be null");
        }

        List<Object[]> results = stockHistoryRepository.getUpdateCountPerItemFiltered(supplierId);

        return results.stream()
                .map(row -> new ItemUpdateFrequencyDTO(
                        (String) row[0],
                        ((BigDecimal) row[1]).longValue()
                ))
                .collect(Collectors.toList());
    }

    /**
     * Retrieves items whose stock quantity is below the minimum threshold.
     *
     * @param supplierId the ID of the supplier (must not be null)
     * @return a list of {@link LowStockItemDTO} identifying low-stock items
     * @throws IllegalArgumentException if supplierId is null
     */
    @Override
    public List<LowStockItemDTO> getItemsBelowMinimumStock(String supplierId) {
        if (supplierId == null) {
            throw new IllegalArgumentException("Supplier ID must not be null");
        }

        List<Object[]> results = inventoryItemRepository.findItemsBelowMinimumStockFiltered(supplierId);

        return results.stream()
                .map(row -> new LowStockItemDTO(
                        (String) row[0],
                        ((BigDecimal) row[1]).intValue(),
                        ((BigDecimal) row[2]).intValue()
                ))
                .collect(Collectors.toList());
    }

    /**
     * Retrieves monthly aggregated stock movement (in and out) data for a given supplier and time range.
     *
     * @param startDate  the start date (nullable; defaults to 30 days ago)
     * @param endDate    the end date (nullable; defaults to today)
     * @param supplierId the optional supplier ID to filter the results
     * @return a list of {@link MonthlyStockMovementDTO} representing monthly stock movement
     */
    @Override
    public List<MonthlyStockMovementDTO> getMonthlyStockMovement(LocalDate startDate, LocalDate endDate, String supplierId) {
        if (startDate == null) {
            startDate = LocalDate.now().minusDays(30);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }

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

    /**
     * Applies advanced filtering on stock history to return custom stock update results.
     *
     * @param filter an instance of {@link StockUpdateFilterDTO} containing all filter parameters
     * @return a list of {@link StockUpdateResultDTO} matching the filter criteria
     */
    @Override
    public List<StockUpdateResultDTO> getFilteredStockUpdates(StockUpdateFilterDTO filter) {
        if (filter.getStartDate() == null) {
            filter.setStartDate(LocalDateTime.now().minusDays(30));
        }
        if (filter.getEndDate() == null) {
            filter.setEndDate(LocalDateTime.now());
        }

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
// This code provides the implementation of the AnalyticsService interface, handling various analytical operations
// such as stock value over time, low stock detection, and advanced filtering of stock updates.