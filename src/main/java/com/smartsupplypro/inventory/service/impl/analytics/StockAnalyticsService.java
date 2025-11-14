package com.smartsupplypro.inventory.service.impl.analytics;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartsupplypro.inventory.dto.ItemUpdateFrequencyDTO;
import com.smartsupplypro.inventory.dto.LowStockItemDTO;
import com.smartsupplypro.inventory.dto.MonthlyStockMovementDTO;
import com.smartsupplypro.inventory.dto.PriceTrendDTO;
import com.smartsupplypro.inventory.dto.StockPerSupplierDTO;
import com.smartsupplypro.inventory.dto.StockUpdateFilterDTO;
import com.smartsupplypro.inventory.dto.StockUpdateResultDTO;
import com.smartsupplypro.inventory.dto.StockValueOverTimeDTO;
import com.smartsupplypro.inventory.exception.InvalidRequestException;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;

import lombok.RequiredArgsConstructor;

import static com.smartsupplypro.inventory.service.impl.analytics.AnalyticsConverterHelper.*;

/**
 * Stock analytics service for inventory metrics and reporting.
 *
 * <p>Provides read-only analytics operations including:
 * <ul>
 *   <li>Stock valuation trends (daily inventory value)</li>
 *   <li>Supplier performance metrics (stock distribution, activity)</li>
 *   <li>Low stock alerts (threshold-based warnings)</li>
 *   <li>Movement trends (monthly stock-in/stock-out)</li>
 *   <li>Price history (item price trends over time)</li>
 *   <li>Advanced filtering (multi-criteria stock update queries)</li>
 * </ul>
 *
 * <p><strong>Design Notes</strong>:
 * <ul>
 *   <li>All operations are read-only ({@code @Transactional(readOnly = true)})</li>
 *   <li>Date windows default to last 30 days when not specified</li>
 *   <li>Handles H2 (test) and Oracle (prod) type differences via converter helpers</li>
 * </ul>
 *
 * @author Smart Supply Pro Development Team
 * @version 1.0.0
 * @since 2.0.0
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StockAnalyticsService {

    private final StockHistoryRepository stockHistoryRepository;
    private final InventoryItemRepository inventoryItemRepository;

    /**
     * Retrieves daily inventory value (quantity × price) over a date range.
     *
     * <p>Defaults to last 30 days if bounds are {@code null}.
     *
     * @param startDate inclusive start date (nullable)
     * @param endDate inclusive end date (nullable)
     * @param supplierId optional supplier filter ({@code null/blank} = all suppliers)
     * @return ordered list of daily stock values (ascending by date)
     * @throws InvalidRequestException if {@code startDate > endDate}
     */
    public List<StockValueOverTimeDTO> getTotalStockValueOverTime(LocalDate startDate,
                                                                   LocalDate endDate,
                                                                   String supplierId) {
        LocalDate[] window = defaultAndValidateDateWindow(startDate, endDate);
        LocalDateTime from = startOfDay(window[0]);
        LocalDateTime to   = endOfDay(window[1]);

        List<Object[]> rows = stockHistoryRepository.getDailyStockValuation(from, to, blankToNull(supplierId));

        return rows.stream()
                .map(r -> new StockValueOverTimeDTO(
                        asLocalDate(r[0]),
                        asNumber(r[1]).doubleValue()
                ))
                .toList();
    }

    /**
     * Retrieves current stock quantities grouped by supplier.
     *
     * @return list of suppliers with total quantities (ordered by quantity desc)
     */
    public List<StockPerSupplierDTO> getTotalStockPerSupplier() {
        List<Object[]> rows = stockHistoryRepository.getTotalStockBySupplier();

        return rows.stream()
                .map(r -> new StockPerSupplierDTO(
                        (String) r[0],
                        asNumber(r[1]).longValue()
                ))
                .toList();
    }

    /**
     * Retrieves stock update frequency per item for a supplier.
     *
     * <p>Counts stock history entries per item (higher count = more active product).
     *
     * @param supplierId supplier identifier (required)
     * @return list of items with update counts (ordered by count desc)
     * @throws InvalidRequestException if {@code supplierId} is blank
     */
    public List<ItemUpdateFrequencyDTO> getItemUpdateFrequency(String supplierId) {
        String sid = requireNonBlank(supplierId, "supplierId");

        List<Object[]> rows = stockHistoryRepository.getUpdateCountByItem(sid);

        return rows.stream()
                .map(r -> new ItemUpdateFrequencyDTO(
                        (String) r[0],
                        asNumber(r[1]).longValue()
                ))
                .toList();
    }

    /**
     * Identifies items below minimum stock threshold for a supplier.
     *
     * <p><strong>Business Rule</strong>: Low stock when {@code currentQuantity < minimumQuantity}.
     *
     * @param supplierId supplier identifier (required)
     * @return list of low-stock items (ordered by quantity asc, most critical first)
     * @throws InvalidRequestException if {@code supplierId} is blank
     */
    public List<LowStockItemDTO> getItemsBelowMinimumStock(String supplierId) {
        String sid = requireNonBlank(supplierId, "supplierId");

        List<Object[]> rows = inventoryItemRepository.findItemsBelowMinimumStockFiltered(sid);

        return rows.stream()
                .map(r -> new LowStockItemDTO(
                        (String) r[0],
                        asNumber(r[1]).intValue(),
                        asNumber(r[2]).intValue()
                ))
                .toList();
    }

    /**
     * Aggregates stock movements into monthly buckets (stock-in vs stock-out).
     *
     * <p>Defaults to last 30 days if bounds are {@code null}.
     *
     * @param startDate inclusive start date (nullable)
     * @param endDate inclusive end date (nullable)
     * @param supplierId optional supplier filter ({@code null/blank} = all suppliers)
     * @return list of monthly movements (YYYY-MM format, ordered by month asc)
     * @throws InvalidRequestException if {@code startDate > endDate}
     */
    public List<MonthlyStockMovementDTO> getMonthlyStockMovement(LocalDate startDate,
                                                                  LocalDate endDate,
                                                                  String supplierId) {
        LocalDate[] window = defaultAndValidateDateWindow(startDate, endDate);
        LocalDateTime from = startOfDay(window[0]);
        LocalDateTime to   = endOfDay(window[1]);

        List<Object[]> rows = stockHistoryRepository.getMonthlyStockMovementBySupplier(from, to, blankToNull(supplierId));

        return rows.stream()
                .map(r -> new MonthlyStockMovementDTO(
                        (String) r[0],
                        asNumber(r[1]).longValue(),
                        asNumber(r[2]).longValue()
                ))
                .toList();
    }

    /**
     * Total number of items currently below minimum stock threshold.
     *
     * @return count of low-stock items (global KPI, no supplier filter)
     */
    public long lowStockCount() {
        return inventoryItemRepository.countWithQuantityBelow(5);
    }

    /**
     * Applies flexible filter over stock updates (multi-criteria query).
     *
     * <p>Defaults to last 30 days if date bounds are {@code null}.
     *
     * @param filter filter object with optional criteria (required, must not be {@code null})
     * @return list of stock updates (ordered by createdAt DESC)
     * @throws InvalidRequestException if filter is {@code null} or validation fails
     */
    public List<StockUpdateResultDTO> getFilteredStockUpdates(StockUpdateFilterDTO filter) {
        if (filter == null) {
            throw new InvalidRequestException("filter must not be null");
        }

        LocalDateTime start = filter.getStartDate();
        LocalDateTime end   = filter.getEndDate();

        // Apply 30-day default window
        if (start == null && end == null) {
            end = LocalDateTime.now();
            start = end.minusDays(30);
        }
        if (start != null && end != null && start.isAfter(end)) {
            throw new InvalidRequestException("startDate must be on or before endDate");
        }

        // Validate quantity range
        Integer min = filter.getMinChange();
        Integer max = filter.getMaxChange();
        if (min != null && max != null && min > max) {
            throw new InvalidRequestException("minChange must be <= maxChange");
        }

        String itemName   = blankToNull(filter.getItemName());
        String supplierId = blankToNull(filter.getSupplierId());
        String createdBy  = blankToNull(filter.getCreatedBy());

        List<Object[]> rows = stockHistoryRepository.searchStockUpdates(
                start, end, itemName, supplierId, createdBy, min, max
        );

        return rows.stream()
                .map(r -> new StockUpdateResultDTO(
                        (String) r[0],
                        (String) r[1],
                        asNumber(r[2]).intValue(),
                        (String) r[3],
                        (String) r[4],
                        asLocalDateTime(r[5])
                ))
                .toList();
    }

    /**
     * Returns average unit price per day for an item within a date window.
     *
     * @param itemId required inventory item identifier
     * @param supplierId optional supplier filter ({@code null/blank} = all suppliers)
     * @param start inclusive start date (required)
     * @param end inclusive end date (required)
     * @return ordered list of day/price pairs (ascending by date)
     * @throws InvalidRequestException if {@code itemId} is blank or {@code start > end}
     */
    public List<PriceTrendDTO> getPriceTrend(String itemId, String supplierId, LocalDate start, LocalDate end) {
        String iid = requireNonBlank(itemId, "itemId");
        LocalDate s = requireNonNull(start, "start");
        LocalDate e = requireNonNull(end, "end");
        if (s.isAfter(e)) {
            throw new InvalidRequestException("start must be on or before end");
        }

        LocalDateTime from = startOfDay(s);
        LocalDateTime to   = endOfDay(e);

        return stockHistoryRepository.getItemPriceTrend(iid, supplierId, from, to);
    }
}
